const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Xeno Shopify Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// API info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Xeno Multi-Tenant Shopify API',
    endpoints: {
      tenants: '/api/tenants',
      sync: '/api/sync',
      analytics: '/api/analytics'
    },
    documentation: 'Check README.md for complete API documentation',
    nextjsIntegration: {
      baseUrl: `${req.protocol}://${req.get('host')}`,
      cors: 'Enabled for Next.js frontend',
      headers: {
        required: 'x-tenant-id for tenant-specific endpoints'
      }
    }
  });
});

module.exports = router;