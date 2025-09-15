require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    database: process.env.DB_NAME_1 || 'xeno_shopify',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // Allow toggling SSL based on env for providers that don't require it
    dialectOptions: (() => {
      const sslFlag = process.env.DATABASE_SSL;
      const enableSsl = sslFlag ? sslFlag.toLowerCase() === 'true' : true; // default true
      return enableSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {};
    })()
  }
};