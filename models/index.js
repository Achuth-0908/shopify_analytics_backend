const { Sequelize } = require('sequelize');
const config = require('../config/database');

// Use the appropriate config for current environment
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;

if (dbConfig.use_env_variable) {
  // For production, use DATABASE_URL
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else {
  // For development, use separate connection parameters
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      pool: dbConfig.pool
    }
  );
}

const db = {
  sequelize,
  Sequelize,
  Tenant: require('./tenant')(sequelize, Sequelize),
  Customer: require('./customer')(sequelize, Sequelize),
  Order: require('./order')(sequelize, Sequelize),
  Product: require('./product')(sequelize, Sequelize)
};

// Define associations
db.Tenant.hasMany(db.Customer, { foreignKey: 'tenantId', onDelete: 'CASCADE' });
db.Tenant.hasMany(db.Order, { foreignKey: 'tenantId', onDelete: 'CASCADE' });
db.Tenant.hasMany(db.Product, { foreignKey: 'tenantId', onDelete: 'CASCADE' });

db.Customer.belongsTo(db.Tenant, { foreignKey: 'tenantId' });
db.Customer.hasMany(db.Order, { foreignKey: 'customerId', onDelete: 'CASCADE' });

db.Order.belongsTo(db.Tenant, { foreignKey: 'tenantId' });
db.Order.belongsTo(db.Customer, { foreignKey: 'customerId' });

db.Product.belongsTo(db.Tenant, { foreignKey: 'tenantId' });

module.exports = db;