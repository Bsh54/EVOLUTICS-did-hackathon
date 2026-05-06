/**
 * Sales History Routes
 * Get sales history grouped by date
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

// Get sales history for the cooperative
router.get('/history', requireAuth, async (req, res) => {
  try {
    const cooperativeId = req.session.user.sub;

    const result = await db.query(`
      SELECT
        s.id,
        s.farmer_id,
        s.weight_kg,
        s.price_per_kg,
        s.total_amount,
        s.created_at,
        s.credential_qr_code,
        f.name as farmer_name,
        f.phone_number as farmer_phone
      FROM sales s
      INNER JOIN farmers f ON s.farmer_id = f.id
      WHERE f.cooperative_id = $1 OR f.esignet_sub = $1
      ORDER BY s.created_at DESC
      LIMIT 100
    `, [cooperativeId]);

    res.json({
      sales: result.rows
    });

  } catch (error) {
    console.error('Error fetching sales history:', error);
    res.status(500).json({ error: 'Failed to fetch sales history' });
  }
});

module.exports = router;
