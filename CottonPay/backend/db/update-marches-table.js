/**
 * Script pour modifier la table marches
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

async function updateMarchesTable() {
  const client = await pool.connect();

  try {
    console.log('🔄 Modification de la table marches...');

    // Supprimer la colonne delai_jours si elle existe
    await client.query(`
      ALTER TABLE marches DROP COLUMN IF EXISTS delai_jours
    `);

    // Ajouter la colonne date_fin_offre si elle n'existe pas
    await client.query(`
      ALTER TABLE marches ADD COLUMN IF NOT EXISTS date_fin_offre TIMESTAMP
    `);

    console.log('✅ Table marches modifiée avec succès');

  } catch (error) {
    console.error('❌ Erreur lors de la modification de la table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateMarchesTable();
