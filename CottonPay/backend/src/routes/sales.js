/**
 * Sales Routes
 * Gestion des ventes de coton et émission de credentials
 */

const express = require('express');
const router = express.Router();
const salesService = require('../services/salesService');

/**
 * POST /sales/create
 * Créer une vente de coton et émettre un credential
 */
router.post('/create', async (req, res, next) => {
  try {
    console.log('📝 Creating cotton sale...');

    // Vérifier l'authentification
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { weight_kg, unit_price_fcfa, collection_point } = req.body;

    // Validation
    if (!weight_kg || !unit_price_fcfa || !collection_point) {
      return res.status(400).json({
        error: 'Missing required fields: weight_kg, unit_price_fcfa, collection_point'
      });
    }

    // Récupérer les infos de l'agriculteur depuis la session
    const farmerInfo = req.session.user;

    // Créer la vente
    const saleData = {
      farmer_npi: farmerInfo.sub, // Le sub d'eSignet contient l'identifiant unique
      farmer_name: farmerInfo.name,
      farmer_phone: farmerInfo.phone_number,
      weight_kg: parseFloat(weight_kg),
      unit_price_fcfa: parseFloat(unit_price_fcfa),
      collection_point: collection_point
    };

    console.log('📊 Sale data:', saleData);

    // Appeler le service pour créer la vente et émettre le credential
    const result = await salesService.createSaleAndIssueCredential(saleData);

    console.log('✅ Sale created and credential issued');

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Sale creation error:', error);
    next(error);
  }
});

/**
 * GET /sales/credential-status/:credentialExchangeId
 * Vérifier l'état d'un credential
 */
router.get('/credential-status/:credentialExchangeId', async (req, res, next) => {
  try {
    const { credentialExchangeId } = req.params;

    if (!credentialExchangeId) {
      return res.status(400).json({ error: 'Missing credentialExchangeId' });
    }

    const status = await salesService.getCredentialStatus(credentialExchangeId);

    res.json({
      success: true,
      data: { status }
    });

  } catch (error) {
    console.error('❌ Credential status error:', error);
    next(error);
  }
});

module.exports = router;
