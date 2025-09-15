const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Sync routes
router.post('/trigger', syncController.syncTenant);
router.get('/status', syncController.getSyncStatus);

module.exports = router;