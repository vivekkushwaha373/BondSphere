const express = require('express');
const { login, register, logout, getProfile, editProfile, getSuggestedUser, followOrUnfollow } = require('../controllers/user');
const { isAuthenticated } = require('../middlewares/auth');
const { upload } = require('../middlewares/multer');
const router = express.Router();

router.post('/register',register);
router.post('/login',login);
router.get('/logout',logout);
router.get('/:id/profile', isAuthenticated, getProfile);
router.post('/profile/edit', isAuthenticated, upload.single('profilePicture'), editProfile);
router.get('/suggested', isAuthenticated, getSuggestedUser);
router.post('/followorunfollow/:id', isAuthenticated, followOrUnfollow);

module.exports = router;