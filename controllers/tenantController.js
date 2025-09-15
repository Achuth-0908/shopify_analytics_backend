const { Tenant } = require('../models');
const ShopifyService = require('../services/shopifyService');

const tenantController = {
  // Create new tenant
  async createTenant(req, res) {
  try {
    const { shopDomain, accessToken, storeName } = req.body;
    if (!shopDomain || !accessToken) {
      return res.status(400).json({ success: false, error: 'shopDomain and accessToken are required' });
    }

    const shopify = new ShopifyService(shopDomain, accessToken);
    const shopInfo = await shopify.getShopInfo();

    // Upsert logic: create if not exists, otherwise update
    let tenant = await Tenant.findOne({ where: { shopDomain } });

    if (tenant) {
      await tenant.update({
        accessToken,
        storeName: storeName || shopInfo.name,
        metadata: {
          shopId: shopInfo.id,
          timezone: shopInfo.timezone,
          currency: shopInfo.currency
        },
        isActive: true
      });
    } else {
      tenant = await Tenant.create({
        shopDomain,
        accessToken,
        storeName: storeName || shopInfo.name,
        metadata: {
          shopId: shopInfo.id,
          timezone: shopInfo.timezone,
          currency: shopInfo.currency
        },
        isActive: true
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: tenant.id,
        shopDomain: tenant.shopDomain,
        storeName: tenant.storeName,
        isActive: tenant.isActive
      }
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get all tenants
  async getTenants(req, res) {
  try {
    const tenants = await Tenant.findAll({
      attributes: ['id', 'shopDomain', 'storeName', 'isActive', 'lastSyncAt', 'metadata', 'createdAt'],
      order: [['createdAt', 'ASC']] // oldest first
    });

    res.json({
      success: true,
      data: tenants
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({
      success: false,
      error: error.message});
    }
  },

  // Get single tenant
  async getTenant(req, res) {
    try {
      const { id } = req.params;
      const tenant = await Tenant.findByPk(id, {
        attributes: ['id', 'shopDomain', 'storeName', 'isActive', 'lastSyncAt', 'metadata', 'createdAt']
      });

      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found'
        });
      }

      res.json({
        success: true,
        data: tenant
      });
    } catch (error) {
      console.error('Get tenant error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Update tenant
  async updateTenant(req, res) {
    try {
      const { id } = req.params;
      const { storeName, isActive } = req.body;

      const tenant = await Tenant.findByPk(id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found'
        });
      }

      await tenant.update({
        storeName: storeName || tenant.storeName,
        isActive: isActive !== undefined ? isActive : tenant.isActive
      });

      res.json({
        success: true,
        data: {
          id: tenant.id,
          shopDomain: tenant.shopDomain,
          storeName: tenant.storeName,
          isActive: tenant.isActive
        }
      });
    } catch (error) {
      console.error('Update tenant error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Delete tenant
  async deleteTenant(req, res) {
    try {
      const { id } = req.params;
      const tenant = await Tenant.findByPk(id);

      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found'
        });
      }

      await tenant.destroy();

      res.json({
        success: true,
        message: 'Tenant deleted successfully'
      });
    } catch (error) {
      console.error('Delete tenant error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = tenantController;