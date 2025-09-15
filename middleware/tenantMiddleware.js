const { Tenant } = require('../models');

const tenantMiddleware = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required. Please provide x-tenant-id header or tenantId query parameter.'
      });
    }

    const tenant = await Tenant.findOne({
      where: { 
        id: tenantId,
        isActive: true
      }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found or inactive'
      });
    }

    // Attach tenant info to request for use in controllers
    req.tenant = tenant;
    req.tenantId = tenant.id;
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = tenantMiddleware;