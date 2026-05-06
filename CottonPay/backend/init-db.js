/**
 * Database Initialization Script
 * Run this to create tables and apply schema
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cottonpay',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function initDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔧 Starting database initialization...');

    // Read schema file
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Applying schema...');
    await client.query(schema);
    console.log('✅ Schema applied successfully');

    // Check if migration is needed
    const checkColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'sales' AND column_name = 'transaction_id'
    `);

    if (checkColumns.rows.length === 0) {
      console.log('📄 Applying migration...');
      const migrationPath = path.join(__dirname, 'db', 'migrate.sql');
      const migration = fs.readFileSync(migrationPath, 'utf8');
      await client.query(migration);
      console.log('✅ Migration applied successfully');
    } else {
      console.log('✅ Database already up to date');
    }

    // Show table info
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    console.log('\n📊 Database tables:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n✅ Database initialization complete!');

  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
