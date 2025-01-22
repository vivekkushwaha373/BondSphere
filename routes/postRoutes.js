const express = require('express');
const { isAuthenticated } = require('../middlewares/auth');
const { upload } = require('../middlewares/multer');
const { addNewPost, getAllPost, getUserPost, likePost, dislikePost, addComment, getPostComments, deletePost, bookmarkPost, getFollowers, getFollowing, getLikes } = require('../controllers/post');
const router = express.Router();

router.post('/addpost', isAuthenticated, upload.single('image'), addNewPost);
router.get('/all', isAuthenticated, getAllPost);
router.get('/userpost/all', isAuthenticated, getUserPost);
router.get('/:id/like', isAuthenticated, likePost);
router.get('/:id/dislike', isAuthenticated, dislikePost);
router.post('/:id/comment', isAuthenticated, addComment);
router.post('/:id/comment/all', isAuthenticated, getPostComments);
router.delete('/delete/:id', isAuthenticated, deletePost);
router.get('/:id/bookmark', isAuthenticated, bookmarkPost);
router.get('/getfollowers/:id', isAuthenticated, getFollowers);
router.get('/getfollowings/:id', isAuthenticated, getFollowing);
router.get('/getlikes/:id', isAuthenticated, getLikes);

module.exports = router;