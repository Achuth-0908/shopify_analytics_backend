require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// Map of tenants to DB URLs or connection info
const tenants = {
  tenant1: {
    database: process.env.DB_NAME_1,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
  },
  tenant2: {
    database: process.env.DB_NAME_2,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
  },
};

// Function to create Sequelize instance for a tenant
const createSequelize = ({ database, username, password, host, port }) => {
  return new Sequelize(database, username, password, {
    host,
    port,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
};

// Initialize Sequelize instances for all tenants
const sequelizeMap = {};
for (const key in tenants) {
  sequelizeMap[key] = createSequelize(tenants[key]);
}

// Function to get models for a given tenant
const getModels = (tenantKey) => {
  const sequelize = sequelizeMap[tenantKey];
  const Tenant = require('./tenant')(sequelize, DataTypes);
  const Customer = require('./customer')(sequelize, DataTypes);
  const Order = require('./order')(sequelize, DataTypes);
  const Product = require('./product')(sequelize, DataTypes);

  // Define associations
  Tenant.hasMany(Customer, { foreignKey: 'tenantId', onDelete: 'CASCADE' });
  Tenant.hasMany(Order, { foreignKey: 'tenantId', onDelete: 'CASCADE' });
  Tenant.hasMany(Product, { foreignKey: 'tenantId', onDelete: 'CASCADE' });

  Customer.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Customer.hasMany(Order, { foreignKey: 'customerId', onDelete: 'CASCADE' });

  Order.belongsTo(Tenant, { foreignKey: 'tenantId' });
  Order.belongsTo(Customer, { foreignKey: 'customerId' });

  Product.belongsTo(Tenant, { foreignKey: 'tenantId' });

  return { sequelize, Tenant, Customer, Order, Product };
};

// Export the map and helper
module.exports = { sequelizeMap, getModels };
