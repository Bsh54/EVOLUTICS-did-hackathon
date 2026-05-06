/**
 * Script pour créer la table marches
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5455,
  database: process.env.DB_NAME || 'mosip_esignet',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function createMarchesTable() {
  const client = await pool.connect();

  try {
    console.log('🔄 Création de la table marches...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS marches (
        id SERIAL PRIMARY KEY,
        cooperative_id VARCHAR(255) NOT NULL,
        usine_id INTEGER NOT NULL,
        usine_nom VARCHAR(255) NOT NULL,
        kilos DECIMAL(10, 2) NOT NULL,
        delai_jours INTEGER NOT NULL,
        montant_total DECIMAL(12, 2) NOT NULL,
        statut VARCHAR(50) DEFAULT 'en_attente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        confirmed_at TIMESTAMP
      )
    `);

    console.log('✅ Table marches créée avec succès');

  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createMarchesTable();
