    const express = require('express');
    const router = express.Router();
    const analyticsController = require('../controllers/analyticsController');
    const tenantMiddleware = require('../middleware/tenantMiddleware');

    // Apply tenant middleware to all routes
    router.use(tenantMiddleware);

    // Analytics routes
    router.get('/dashboard', analyticsController.getDashboardOverview);
    router.get('/orders-by-date', analyticsController.getOrdersByDate);
    router.get('/top-customers', analyticsController.getTopCustomers);
    router.get('/revenue-trends', analyticsController.getRevenueTrends);

    module.exports = router;