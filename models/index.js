require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;


sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
  }
);

// Import models
const Tenant = require('./tenant')(sequelize, DataTypes);
const Customer = require('./customer')(sequelize, DataTypes);
const Order = require('./order')(sequelize, DataTypes);
const Product = require('./product')(sequelize, DataTypes);

// Associations
Tenant.hasMany(Customer, { foreignKey: 'tenantId', onDelete: 'CASCADE' });
Tenant.hasMany(Order, { foreignKey: 'tenantId', onDelete: 'CASCADE' });
Tenant.hasMany(Product, { foreignKey: 'tenantId', onDelete: 'CASCADE' });

Customer.belongsTo(Tenant, { foreignKey: 'tenantId' });
Customer.hasMany(Order, { foreignKey: 'customerId', onDelete: 'CASCADE' });

Order.belongsTo(Tenant, { foreignKey: 'tenantId' });
Order.belongsTo(Customer, { foreignKey: 'customerId' });

Product.belongsTo(Tenant, { foreignKey: 'tenantId' });

// Export
module.exports = {
  sequelize,
  Sequelize,
  Tenant,
  Customer,
  Order,
  Product,
};
