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
  origin: process.env.FRONTEND_URL?.replace(/\/$/, ""),
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

// Database connection (with retry) and server start
async function startServer() {
  try {
    console.log('🔄 Starting Xeno Shopify Backend...');
    
    // Wait for DB to be reachable (useful on Railway cold starts)
    const maxRetries = parseInt(process.env.DB_CONNECT_RETRIES || '10');
    const retryDelayMs = parseInt(process.env.DB_CONNECT_RETRY_DELAY_MS || '3000');
    let attempt = 0;
    while (true) {
      try {
        attempt++;
        console.log(`🔌 DB connect attempt ${attempt}/${maxRetries}...`);
        await db.sequelize.authenticate();
        break;
      } catch (err) {
        if (attempt >= maxRetries) throw err;
        console.warn(`⏳ DB not ready yet: ${err.message}. Retrying in ${retryDelayMs}ms...`);
        await new Promise(r => setTimeout(r, retryDelayMs));
      }
    }
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