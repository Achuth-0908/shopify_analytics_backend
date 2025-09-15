require('dotenv').config();

export const development = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  dialect: 'postgres'
};
export const test = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: `${process.env.DB_NAME}_test`,
  host: process.env.DB_HOST,
  dialect: 'postgres'
};
export const production = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: `${process.env.DB_NAME}_prod`,
  host: process.env.DB_HOST,
  dialect: 'postgres'
};
