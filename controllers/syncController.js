const syncService = require('../services/syncService');

const syncController = {
  // Trigger sync for specific tenant
  async syncTenant(req, res) {
    try {
      const tenantId = req.tenantId;
      
      console.log(`Manual sync triggered for tenant: ${tenantId}`);
      
      const results = await syncService.syncTenantData(tenantId);

      res.json({
        success: true,
        message: 'Sync completed successfully',
        data: results
      });
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get sync status
  async getSyncStatus(req, res) {
    try {
      const tenant = req.tenant;

      res.json({
        success: true,
        data: {
          tenantId: tenant.id,
          storeName: tenant.storeName,
          lastSyncAt: tenant.lastSyncAt,
          isActive: tenant.isActive
        }
      });
    } catch (error) {
      console.error('Get sync status error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = syncController;