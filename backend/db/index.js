const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'admc',
  user:     process.env.DB_USER     || 'admc_user',
  password: process.env.DB_PASSWORD || '',
});

pool.on('error', (err) => {
  console.error('Unexpected DB error:', err);
});

module.exports = { pool, query: (text, params) => pool.query(text, params) };
