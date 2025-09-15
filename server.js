require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Fix: Remove .default - use regular CommonJS import
const db = require('./models');
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration for Next.js frontend
app.use(cors({
  origin: [
    'http://localhost:3000', // Next.js dev server
    'http://localhost:3001', // Alternative port
    process.env.FRONTEND_URL,
    /\.vercel\.app$/, // Vercel deployments
    /\.netlify\.app$/, // Netlify deployments
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});
const tenantMiddleware = require('./middleware/tenantMiddleware');

app.use('/', require('./routes'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/sync', require('./routes/sync'));

// Multi-tenant protected analytics routes
app.use('/api/analytics', tenantMiddleware, require('./routes/analytics'));

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: {
      health: '/health',
      tenants: '/api/tenants',
      sync: '/api/sync',
      analytics: '/api/analytics'
    }
  });
});

const PORT = process.env.PORT || 3000;

// Database connection and server start
async function startServer() {
  try {
    console.log('🔄 Starting Xeno Shopify Backend...');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Sync database (create tables)
    await db.sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');

    // Start cron jobs in production
    if (process.env.NODE_ENV === 'production') {
      require('./scripts/cronJobs');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Xeno Shopify Backend running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API docs: http://localhost:${PORT}/`);
      console.log(`🔗 Frontend CORS enabled for Next.js`);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n💡 Development Tips:');
        console.log('   - Run `npm run seed` to create demo data');
        console.log('   - Run `npm run sync` to manually sync Shopify data');
        console.log('   - Frontend can connect to http://localhost:3000');
        console.log('   - Check /health endpoint to verify everything is working');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('💡 Common fixes:');
    console.error('   - Make sure PostgreSQL is running');
    console.error('   - Check your DATABASE_URL in .env');
    console.error('   - Verify all files are in the correct directories');
    process.exit(1);
  }
}

startServer();

module.exports = app;