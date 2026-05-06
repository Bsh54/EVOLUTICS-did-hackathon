/**
 * Farmers Routes
 * Manage farmer registration and data
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

// Get all farmers for the authenticated cooperative
router.get('/', requireAuth, async (req, res) => {
  try {
    const cooperativeId = req.session.user.sub;

    const result = await db.query(`
      SELECT
        f.id,
        f.name,
        f.phone_number,
        f.email,
        f.esignet_sub,
        f.created_at,
        COUNT(DISTINCT s.id) as delivery_count,
        COALESCE(SUM(s.weight_kg), 0) as total_weight
      FROM farmers f
      LEFT JOIN sales s ON f.id = s.farmer_id
      WHERE f.cooperative_id = $1 OR f.esignet_sub = $1
      GROUP BY f.id, f.name, f.phone_number, f.email, f.esignet_sub, f.created_at
      ORDER BY f.created_at DESC
    `, [cooperativeId]);

    res.json({
      farmers: result.rows
    });

  } catch (error) {
    console.error('Error fetching farmers:', error);
    res.status(500).json({ error: 'Failed to fetch farmers' });
  }
});

// Get single farmer details
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const cooperativeId = req.session.user.sub;
    const farmerId = req.params.id;

    const result = await db.query(`
      SELECT
        f.id,
        f.name,
        f.phone_number,
        f.email,
        f.esignet_sub,
        f.created_at,
        COUNT(DISTINCT s.id) as delivery_count,
        COALESCE(SUM(s.weight_kg), 0) as total_weight,
        COALESCE(SUM(s.total_amount), 0) as total_amount
      FROM farmers f
      LEFT JOIN sales s ON f.id = s.farmer_id
      WHERE f.id = $1 AND (f.cooperative_id = $2 OR f.esignet_sub = $2)
      GROUP BY f.id, f.name, f.phone_number, f.email, f.esignet_sub, f.created_at
    `, [farmerId, cooperativeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    res.json({
      farmer: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching farmer:', error);
    res.status(500).json({ error: 'Failed to fetch farmer' });
  }
});

// Add new farmer (called after eSignet authentication)
router.post('/', requireAuth, async (req, res) => {
  try {
    const cooperativeId = req.session.user.sub;
    const { name, phone_number, email, esignet_sub } = req.body;

    if (!name || !esignet_sub) {
      return res.status(400).json({ error: 'Name and esignet_sub are required' });
    }

    // Check if farmer already exists
    const existingFarmer = await db.query(
      'SELECT id FROM farmers WHERE esignet_sub = $1 AND cooperative_id = $2',
      [esignet_sub, cooperativeId]
    );

    if (existingFarmer.rows.length > 0) {
      return res.status(409).json({
        error: 'Farmer already registered',
        farmer_id: existingFarmer.rows[0].id
      });
    }

    const result = await db.query(`
      INSERT INTO farmers (cooperative_id, name, phone_number, email, esignet_sub)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, phone_number, email, esignet_sub, created_at
    `, [cooperativeId, name, phone_number, email, esignet_sub]);

    res.status(201).json({
      message: 'Farmer registered successfully',
      farmer: result.rows[0]
    });

  } catch (error) {
    console.error('Error registering farmer:', error);
    res.status(500).json({ error: 'Failed to register farmer' });
  }
});

// Get farmer's sales history
router.get('/:id/sales', requireAuth, async (req, res) => {
  try {
    const cooperativeId = req.session.user.sub;
    const farmerId = req.params.id;

    // Verify farmer belongs to this cooperative
    const farmerCheck = await db.query(
      'SELECT id FROM farmers WHERE id = $1 AND (cooperative_id = $2 OR esignet_sub = $2)',
      [farmerId, cooperativeId]
    );

    if (farmerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    const result = await db.query(`
      SELECT
        id,
        weight_kg,
        price_per_kg,
        total_amount,
        created_at
      FROM sales
      WHERE farmer_id = $1
      ORDER BY created_at DESC
    `, [farmerId]);

    res.json({
      sales: result.rows
    });

  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

module.exports = router;
