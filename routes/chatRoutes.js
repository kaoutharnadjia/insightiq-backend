const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/message', chatController.handleChat);
router.post('/index', chatController.indexData);

module.exports = router;
