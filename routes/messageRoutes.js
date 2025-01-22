const express = require('express');
const { isAuthenticated } = require('../middlewares/auth');
const { sendMessage, getMessage } = require('../controllers/message');
const router = express.Router();

router.post('/send/:id', isAuthenticated, sendMessage);
router.get('/all/:id', isAuthenticated, getMessage);

module.exports = router;