
const User = require("../models/userModel");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDataUri } = require("../utils/datauri");
const cloudinary = require('cloudinary').v2;
const Post = require('../models/postModel');

require('dotenv').config();

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            
            return res.status(404).json({
                message: "Something is missing, Please check",
                success: false,
            });
        }

        const user = await User.findOne({ email });

        if (user) {
           
            return res.status(404).json({
                message: "Try Different email",
                success: false,
            });
        }


        const hashedpassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            email,
            password: hashedpassword
        });

        return res.status(201).json({
            message: "Account created successfully",
            success: true
        })

    }
    catch (error) {
        
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(404).json({
                message: "Something is missing, Please check",
                success: false,
            });
        }

        let user = await User.findOne({ email }).populate('posts');

        if (!user) {
            return res.status(401).json({
                message: "Incorrect email or password",
                success: false
            })
        }

        const ispasswordMatched = await bcrypt.compare(password, user.password);

        if (!ispasswordMatched) {
            return res.status(401).json({
                message: "Entered in correct password, please check",
                success: false,
            });
        }

        const token = await jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '3d' });

        // const populatedPosts = 

        user.token = token;
        user.password = undefined;

        const options = {
            httpOnly: true,
            sameSite: 'none',
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        }

        res.cookie('token', token, options);

        return res.status(200).json({
            success: true,
            message: "User is SuccessFully LoggedIn",
            user,
            token,
        })

    }
    catch (error) {
     
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
}


exports.logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: 'strict',
        });

        return res.status(200).json({
            success: true,
            message: 'You have been logged out, cookie cleared',
        });
    }
    catch (error) {
       
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        let user = await User.findById(userId).select('-password').populate({
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
        return res.status(200).json({
            message: "User is fetched",
            success: true,
            user
        })
    }
    catch (error) {
       
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
};

exports.editProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bio, gender } = req.body;
        const profilePicture = req.file;

        let cloudResponse;

        if (profilePicture) {
            const fileUrl = getDataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUrl);
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                message: "User Not found",
                success: false
            })
        }

        if (bio) {
            user.bio = bio;
        }
        if (gender) {
            user.gender = gender;
        }
        if (profilePicture) {
            user.profilePicture = cloudResponse.secure_url;
        }
        await user.save();

        return res.status(200).json({
            message: 'Profile updated',
            success: true,
            user
        })


    }
    catch (error) {
        
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
}


exports.getSuggestedUser = async (req, res) => {
    try {
        
        const suggestedUsers = await User.find({_id:{ $ne: req.user.id }}).select('-password');
        if (!suggestedUsers) {
            return res.status(400).json({
                message: "Currently do not have any users"
            })
        };
        return res.status(200).json({
            success: true,
            users: suggestedUsers
        })
    }
    catch (error) {
       
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
}

exports.followOrUnfollow = async (req, res) => {
    try {
        const follower = req.user.id;
        const following = req.params.id;
        
        if (follower == following) {
            return res.status(400).json({
                message: 'You cannot follow/unfollow yourself',
                success: false,
            });
        }
        let user = await User.findById(follower);
        const targetUser = await User.findById(following);

        if (!user || !targetUser) {
            return res.status(400).json({
                message: "User Not Found",
                success: false
            })
        }

        const isFollowing = user.following.includes(following);
        if (isFollowing) {
            //unfollow logic
            await Promise.all([
                User.updateOne({ _id: follower }, { $pull: { following } }),
                User.updateOne({ _id: following }, { $pull: { followers: follower } })

            ])
        }
        else {
            //follow logic
            await Promise.all([
                User.updateOne({ _id: follower }, { $push: { following } }),
                User.updateOne({ _id: following }, { $push: { followers: follower } })
            ])

        }

        user = await User.findById(follower).select('-password').populate({ path: "posts", createdAt: -1 }).populate('bookmarks');
        userProfile = await User.findById(following).select('-password').populate({
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

        return res.status(200).json({
            message: "Followed/UnFollowed Successfully",
            success: true,
            user,
            userProfile
        })

    }
    catch (error) {
       
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        })
    }
}




