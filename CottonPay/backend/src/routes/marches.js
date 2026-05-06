/**
 * Marchés Routes
 * Gestion des marchés avec les usines d'égrenage
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Créer un nouveau marché
router.post('/create', requireAuth, async (req, res) => {
  try {
    const cooperativeId = req.session.user.sub;
    const { usine_id, usine_nom, kilos, date_fin_offre, montant_total } = req.body;

    // Créer le marché en attente
    const result = await db.query(`
      INSERT INTO marches (cooperative_id, usine_id, usine_nom, kilos, date_fin_offre, montant_total, statut, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'en_attente', NOW())
      RETURNING id
    `, [cooperativeId, usine_id, usine_nom, kilos, date_fin_offre, montant_total]);

    const marcheId = result.rows[0].id;

    // Suppression de l'ancienne logique de timeout qui mettait à jour automatiquement la base de données.
    // L'état de la base ne changera que lorsque l'utilisateur cliquera sur "OK" dans le frontend.

    res.json({
      success: true,
      marche_id: marcheId,
      message: 'Marché créé avec succès (En attente)'
    });

  } catch (error) {
    console.error('Error creating marché:', error);
    res.status(500).json({ error: 'Failed to create marché' });
  }
});

// Nouvelle route pour confirmer manuellement le marché après le clic sur "OK"
router.post('/confirm', requireAuth, async (req, res) => {
  try {
    const { marche_id } = req.body;

    if (!marche_id) {
      return res.status(400).json({ error: 'marche_id is required' });
    }

    await db.query(`
      UPDATE marches
      SET statut = 'confirme', confirmed_at = NOW()
      WHERE id = $1
    `, [marche_id]);

    console.log(`✅ Marché ${marche_id} confirmé manuellement`);

    res.json({ success: true, message: 'Marché confirmé' });

  } catch (error) {
    console.error('Erreur lors de la confirmation manuelle:', error);
    res.status(500).json({ error: 'Failed to confirm marché' });
  }
});

// Récupérer les marchés de la coopérative
router.get('/list', requireAuth, async (req, res) => {
  try {
    const cooperativeId = req.session.user.sub;

    const result = await db.query(`
      SELECT id, usine_id, usine_nom, kilos, date_fin_offre, montant_total, statut, created_at, confirmed_at
      FROM marches
      WHERE cooperative_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [cooperativeId]);

    res.json({
      marches: result.rows
    });

  } catch (error) {
    console.error('Error fetching marchés:', error);
    res.status(500).json({ error: 'Failed to fetch marchés' });
  }
});

// Récupérer le total des paiements confirmés
router.get('/total-paye', requireAuth, async (req, res) => {
  try {
    const cooperativeId = req.session.user.sub;

    const result = await db.query(`
      SELECT COALESCE(SUM(montant_total), 0) as total_paye
      FROM marches
      WHERE cooperative_id = $1 AND statut = 'confirme'
    `, [cooperativeId]);

    res.json({
      total_paye: parseFloat(result.rows[0].total_paye)
    });

  } catch (error) {
    console.error('Error fetching total payé:', error);
    res.status(500).json({ error: 'Failed to fetch total payé' });
  }
});

module.exports = router;
