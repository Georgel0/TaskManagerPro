const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Only enable SSL if is NOT connecting to localhost
  ssl: process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')
    ? false 
    : { rejectUnauthorized: false }
};

const pool = new Pool(poolConfig);

pool.query('SELECT current_database()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Successfully connected to database:', res.rows[0].current_database);
  }
});

module.exports = pool;