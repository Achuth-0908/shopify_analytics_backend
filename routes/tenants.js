const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');

// Tenant management routes
router.post('/', tenantController.createTenant);
router.get('/', tenantController.getTenants);
router.get('/:id', tenantController.getTenant);
router.put('/:id', tenantController.updateTenant);
router.delete('/:id', tenantController.deleteTenant);

module.exports = router;