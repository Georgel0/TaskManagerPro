const { Pool } = require('pg');
require('dotenv').config();

// Use the connectionString if available (Production), 
// otherwise fall back to individual variables (Local)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

module.exports = pool;