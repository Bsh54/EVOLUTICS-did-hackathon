/**
 * Dashboard Routes
 * Statistics and overview data
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

// Get dashboard statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.sub;

    const farmersResult = await db.query(`
      SELECT COUNT(DISTINCT s.farmer_id) as count
      FROM sales s
      INNER JOIN farmers f ON s.farmer_id = f.id
      WHERE f.cooperative_id = $1 OR f.esignet_sub = $1
    `, [userId]);

    const salesResult = await db.query(`
      SELECT
        COUNT(*) as total_deliveries,
        COALESCE(SUM(weight_kg), 0) as total_weight,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM sales s
      INNER JOIN farmers f ON s.farmer_id = f.id
      WHERE f.cooperative_id = $1 OR f.esignet_sub = $1
    `, [userId]);

    const marchesResult = await db.query(`
      SELECT
        COALESCE(SUM(kilos), 0) as kilos_vendus,
        COALESCE(SUM(montant_total), 0) as total_paye
      FROM marches
      WHERE cooperative_id = $1
    `, [userId]);

    const totalWeight = parseFloat(salesResult.rows[0].total_weight);
    const totalAmount = parseFloat(salesResult.rows[0].total_amount);
    const kilosVendus = parseFloat(marchesResult.rows[0].kilos_vendus);
    const totalPaye = parseFloat(marchesResult.rows[0].total_paye);

    const kilosDisponibles = totalWeight - kilosVendus;
    const montantDu = totalAmount - totalPaye;

    res.json({
      totalFarmers: parseInt(farmersResult.rows[0].count),
      totalDeliveries: parseInt(salesResult.rows[0].total_deliveries),
      totalWeight: totalWeight,
      totalAmount: totalAmount,
      kilosVendus: kilosVendus,
      kilosDisponibles: kilosDisponibles > 0 ? kilosDisponibles : 0,
      totalPaid: totalPaye,
      montantDu: montantDu > 0 ? montantDu : 0
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get payments distribution per farmer
router.get('/payments', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.sub;

    const marchesResult = await db.query(`
      SELECT COALESCE(SUM(montant_total), 0) as total_paye
      FROM marches
      WHERE cooperative_id = $1 AND statut = 'confirme'
    `, [userId]);

    let totalPool = parseFloat(marchesResult.rows[0].total_paye);
    let totalAmountToPay = 0;

    const farmersResult = await db.query(`
      SELECT
        f.id,
        f.name,
        f.esignet_sub,
        COALESCE(SUM(s.weight_kg), 0) as total_weight,
        COALESCE(SUM(s.total_amount), 0) as amount_due,
        MIN(s.created_at) as first_sale_date,
        MAX(s.created_at) as last_sale_date
      FROM farmers f
      INNER JOIN sales s ON f.id = s.farmer_id
      WHERE f.cooperative_id = $1 OR f.esignet_sub = $1
      GROUP BY f.id, f.name, f.esignet_sub
      ORDER BY first_sale_date ASC
    `, [userId]);

    const payments = farmersResult.rows.map(farmer => {
      const amountDue = parseFloat(farmer.amount_due);
      totalAmountToPay += amountDue;

      let amountPaid = 0;
      let status = 'attente';

      if (totalPool >= amountDue) {
        amountPaid = amountDue;
        status = 'paye';
        totalPool -= amountDue;
      } else if (totalPool > 0) {
        amountPaid = totalPool;
        status = 'partiel';
        totalPool = 0;
      }

      return {
        farmer_name: farmer.name,
        farmer_npi: farmer.esignet_sub,
        total_weight: parseFloat(farmer.total_weight),
        amount_due: amountDue,
        amount_paid: amountPaid,
        remaining_due: amountDue - amountPaid,
        status: status,
        last_sale_date: farmer.last_sale_date
      };
    });

    const stats = {
      total_paid: parseFloat(marchesResult.rows[0].total_paye),
      total_pending: (totalAmountToPay - parseFloat(marchesResult.rows[0].total_paye)),
      count_pending: payments.filter(p => p.status === 'attente').length,
      count_paid: payments.filter(p => p.status === 'paye').length,
      count_partial: payments.filter(p => p.status === 'partiel').length
    };

    res.json({
      stats: {
        total_paid: stats.total_paid,
        total_pending: stats.total_pending > 0 ? stats.total_pending : 0,
        count_pending: stats.count_pending,
        count_paid: stats.count_paid,
        count_partial: stats.count_partial
      },
      payments
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

module.exports = router;
