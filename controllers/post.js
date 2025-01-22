const sharp = require('sharp');
const Post = require('../models/postModel');
const User = require('../models/userModel');
const Comment = require('../models/commentModel');
const { getRecieverSocketId, io} = require('../socket/socket');

const cloudinary = require('cloudinary').v2;



exports.addNewPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const image = req.file;
        const authorId = req.user.id;

        if(!image)
        {
            return res.status(400).json({
               message:"Image required"
           })
        }
        
        const optimizedImageBuffer = await sharp(image.buffer)
            .resize({ width: 800, height: 800, fit: 'inside' })
            .toFormat('jpeg', { quality: 80 })
            .toBuffer();
        
        const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
        const cloudResponse = await cloudinary.uploader.upload(fileUri);
        const post = await Post.create({
            caption,
            image: cloudResponse.secure_url,
            author: authorId
        });

        const user = await User.findById(authorId);

        if (user) {
            user.posts.push(post._id);
            await user.save();
        }
        await post.populate({ path: 'author', select: '-password' });

        return res.status(201).json({
            message: "New post added",
            post,
            success:true
        })
    }
    catch (error) {
       
        return res.status(500).json({
            message: 'Internal Server Error',
            success: false
        })
    }
}

exports.getAllPost = async (req, res) => {
    
    try {
        const posts = await Post.find({}).sort({ createdAt: -1 })
            .populate({ path: 'author', select: 'username profilePicture' })
            .populate({
                path: 'comments',
                sort: { createdAt: -1 },
                populate: {
                    path: 'author',
                    select: 'username profilePicture'
                }
            });
        
        return res.status(200).json({
            posts,
            success: true,
            message: "All posts fetched successfully"
        })
    }
    catch (error) {
        
        return res.status(500).json({
            message: 'Internal Server Error',
            success: false
        })
    }
}

exports.getUserPost = async (req, res) => {
    try {
        const authorId = req.user.id;
        const posts = await Post.find({ author: authorId }).sort({ createdAt: -1 }).populate({
            path: 'author', select: 'username , profilePicture'
        }).populate({
            path: 'comments',
            sort: { createdAt: -1 },
            populate: {
                path: 'author',
                select: 'username, profilePicture'
            }
        });

        return res.status(200).json({
            posts,
            success: true,
            message:"All Posts fetched successfully"
        })
    }
    catch (error) {
       
        return res.status(500).json({
            message: 'Internal Server Error',
            success: false
        })
    }
}

exports.likePost = async (req, res) => {
    try {
        const likeKrneWalaUserKiId = req.user.id;
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: "Post Not Found",
                success:false
            })
        };

        await post.updateOne({ $addToSet: { likes: likeKrneWalaUserKiId } });
        await post.save();

        const user = await User.findById(likeKrneWalaUserKiId).select('username profilePicture'); 
        const postOwnerId = post.author.toString();
      

        if (postOwnerId !== likeKrneWalaUserKiId)
        {
            //emit a notification event

            const notification = {
                type: 'like',
                userId: likeKrneWalaUserKiId,
                userDetails: user,
                postId,
                liked:true,
                message:"liked your post"
            }

            const postOwnerSocketId = getRecieverSocketId(postOwnerId);
            io.to(postOwnerSocketId).emit('notification', notification);
        }

        const postOwner = await User.findById(postOwnerId).select('-password').populate({
            path: "posts",
            createdAt: -1,
            populate: [
                {
                    path: 'author',
                    select: 'username profilePicture'
                },
                {
                    path: 'comments',
                    populate: {
                        path: 'author',
                        select: 'username profilePicture'
                    }
                }
            ]

        }).populate('bookmarks');



        return res.status(201).json({
            message: "post liked",
            success: true,
            postOwner

        })
    }
    catch (error) {
     
        return res.status(500).json({
            message: 'Internal Server Error',
            success: false
        })
    }
  
}

exports.dislikePost = async (req, res) => {
    try {
        const likeKrneWalaUserKiId = req.user.id;
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: "Post Not Found",
                success:false
            })
        }
        await post.updateOne({ $pull: { likes: likeKrneWalaUserKiId } });
        await post.save();

        const user = await User.findById(likeKrneWalaUserKiId).select('username profilePicture');
        const postOwnerId = post.author.toString();

        if (postOwnerId !== likeKrneWalaUserKiId) {
            //emit a notification cvenet
            const notification = {
                type: 'dislike',
                userId: likeKrneWalaUserKiId,
                userDetails: user,
                postId,
                liked: false,
                message: "disliked your post"
            }
            const postOwnerSocketId = getRecieverSocketId(postOwnerId);
            io.to(postOwnerSocketId).emit('notification', notification);
        }

        const postOwner = await User.findById(postOwnerId).select('-password').populate({
            path: "posts",
            createdAt: -1,
            populate: [
                {
                    path: 'author',
                    select: 'username profilePicture'
                },
                {
                    path: 'comments',
                    populate: {
                        path: 'author',
                        select: 'username profilePicture'
                    }
                }
            ]

        }).populate('bookmarks');
       
        

        return res.status(201).json({
            message: "Post Disliked",
            success: true,
            postOwner
        })
    }
    catch (error) {
      
        return res.status(500).json({
            message: 'Internal Server Error',
            success: false
        })
    }
}

exports.addComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const commentkrnawalakiId = req.user.id;

        const { text } = req.body;

        const post = await Post.findById(postId);
        const postOwnerId = post.author.toString();

        if (!text)
            return res.status(400).json({
                message: "Text is required",
                success: false
            });
        
        const comment = await Comment.create({
            text,
            author: commentkrnawalakiId,
            post: postId
        });
        
        await comment.populate({
            path: "author",
            select: "username profilePicture"
        })

        post.comments.push(comment._id);
        post.save();

        const user = await User.findById(commentkrnawalakiId).select('username profilePicture');
        
        if (postOwnerId !== commentkrnawalakiId) {
          
            const notification = {
                type: 'comment',
                userId: commentkrnawalakiId,
                userDetails: user,
             
                message: `commented on your post: ${text} `
            }
    
            let postOwnerSocketId = getRecieverSocketId(postOwnerId);
            io.to(postOwnerSocketId).emit('notification', notification);

        }
        // const postOwnerSocketId = getRecieverSocketId(postOwnerId);

        const posts = await Post.find({}).sort({ createdAt: -1 })
            .populate({ path: 'author', select: 'username profilePicture' })
            .populate({
                path: 'comments',
                sort: { createdAt: -1 },
                populate: {
                    path: 'author',
                    select: 'username profilePicture'
                }
            });
         
        io.emit('newComment', posts);





        return res.status(201).json({
            message: "Comment added",
            comment,
            success:true
        })
        
    }
    catch (error) {
       
        return res.status(500).json({
            message: 'Internal Server Error',
            success: false
        })
    }
}


exports.getPostComments = async (req, res) => {
    try {
        const postId = req.params.id;
        const comments = await Comment.find({ post: postId }).populate('author', 'username profilePicture');
        
        if (!comments) {
            return res.status(404).json({
                message: "No comments found for this post",
                success:false
            })
        };

        return res.status(200).json({
            success: true,
            comments
        })

    }
    catch (error) {
      
        return res.status(500).json({
            message: 'Internal Server Error',
            success: false
        })
    }
}

exports.deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.user.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: "Post Not Found",
                success:false
            })
        }

        if (post.author.toString() != authorId) {
            return res.status(403).json({
                message: "Unauthorized"
            }) 
        };
       
        //delete post
        await Post.findByIdAndDelete(postId);
         
        let user = await User.findById(authorId);
        await user.updateOne({ $pull: { posts: postId } });
        // user.posts = user.posts.filter(id => id.toString() !== postId);
        await user.save();

        await Comment.deleteMany({ post: postId });

        return res.status(200).json({
            success: true,
            message:"Post Deleted"
        })
    }
    catch (error) {
        
        return res.status(500).json({
            message: 'Internal Server Error',
            success: false
        })
    }
}

exports.bookmarkPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.user.id;
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Post not found",
                success:false
            })
        };

        const user = await User.findById(authorId);
        
        if (user.bookmarks.includes(post._id)) {
           
            await user.updateOne({ $pull: { bookmarks: post._id } });
            await user.save();
            return res.status(200).json({
                type: 'unsaved',
                message: 'Post removed from bookmark',
                success: true
            });
        }
        else
        {
            await user.updateOne({ $addToSet: { bookmarks: post._id } });
            await user.save();
            return res.status(200).json({
                type: 'saved',
                message: "Post bookmarked",
                success:true
            })
        }
    }
    catch (error) {
       
        return res.status(500).json({
            message: 'Internal Server Error',
            success:false
        })
    }
}


exports.getFollowers = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).populate({
            path: 'followers',
            select: 'username profilePicture'
        });
        const followers = user.followers
       
        return res.status(200).json({
            success: true,
            message: "followers are fetched",
            followers            

        })
    }
    catch (error) {
     
        return res.status(500).json({
            message: 'Internal Server Error',
            success: false
        })
    }
}
exports.getFollowing = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).populate({
            path: 'following',
            select: 'username profilePicture'
        });
        const following = user.following;
        
        return res.status(200).json({
            success: true,
            message: "followings are fetched",
            following

        })
    }
    catch (error) {
        
        return res.status(500).json({
            message: 'Internal Server Error',
            success: false
        })
    }
}



exports.getLikes = async (req, res) => {
    try {
        const postId = req.params.id;
        
        const post = await Post.findById(postId).populate({
            path: 'likes',
            select:'username profilePicture'
        })
        
        const likes = post.likes;
        
        return res.status(200).json({
            success: true,
            message: 'likes fetched',
            likes    
        })



    }
    catch (error) {
      
        return res.status(500).json({
            message: 'Internal Server Error',
            success: false
        })
    }
}
