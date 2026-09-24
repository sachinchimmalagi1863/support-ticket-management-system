const mysql = require('mysql2/promise');
require('dotenv').config();

// Central connection pool used by every model/controller.
// Using a pool (rather than a single connection) lets the API
// handle concurrent requests safely.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'support_ticket_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

// Quick sanity check on boot so a bad DB config fails fast and loud.
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ Unable to connect to MySQL:', err.message);
  }
}

module.exports = { pool, testConnection };
