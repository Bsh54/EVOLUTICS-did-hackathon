/**
 * Database connection module
 * PostgreSQL client for CottonPay
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cottonpay',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Query helper
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Query error:', error);
    throw error;
  }
};

// Initialize database schema
const initializeSchema = async () => {
  try {
    console.log('🔧 Initializing database schema...');

    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'schema.sql');

    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
      console.log('✅ Database schema initialized');
    } else {
      console.log('⚠️  Schema file not found, skipping initialization');
    }
  } catch (error) {
    console.error('❌ Schema initialization error:', error);
    throw error;
  }
};

module.exports = {
  query,
  pool,
  initializeSchema
};
