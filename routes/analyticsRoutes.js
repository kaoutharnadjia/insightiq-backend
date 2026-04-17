const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/analytics', analyticsController.getAnalytics);
router.get('/connection', analyticsController.checkConnection);

module.exports = router;
