const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: isProduction
    ? process.env.DATABASE_URL
    : undefined,
  host: isProduction ? undefined : process.env.DB_HOST,
  user: isProduction ? undefined : process.env.DB_USER,
  password: isProduction ? undefined : process.env.DB_PASSWORD,
  database: isProduction ? undefined : process.env.DB_NAME,
  port: isProduction ? undefined : process.env.DB_PORT,
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false
});

module.exports = pool;