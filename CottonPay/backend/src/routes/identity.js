/**
 * Identity Routes
 * Vérification NPI via Mock Identity System (simulation ANIP)
 * 
 * Route publique utilisée par l'espace coopérative pour vérifier
 * un NPI avant d'enregistrer un producteur.
 */

const express = require('express');
const router = express.Router();
const identityService = require('../services/identityService');

/**
 * POST /api/identity/verify
 * Vérifie un NPI auprès du registre national (Mock Identity System)
 * Body: { npi: string }
 * 
 * Retourne les données d'identité si trouvées
 */
router.post('/verify', async (req, res) => {
  try {
    const { npi } = req.body;

    if (!npi || npi.trim().length === 0) {
      return res.status(400).json({
        found: false,
        error: 'Le NPI est requis'
      });
    }

    const identity = await identityService.verifyNpi(npi.trim());

    if (!identity) {
      return res.json({
        found: false,
        message: 'Ce NPI n\'existe pas dans le registre national '
      });
    }

    res.json({
      found: true,
      identity: {
        npi: identity.npi,
        name: identity.name,
        firstname: identity.firstname,
        lastname: identity.lastname,
        phone_masked: identityService.maskPhone(identity.phone),
        region: identity.region,
        commune: identity.commune,
        verified: identity.verified,
        source: identity.source
      }
    });
  } catch (error) {
    console.error('❌ Identity verify error:', error);
    res.status(500).json({
      found: false,
      error: 'Erreur de communication avec le registre national'
    });
  }
});

module.exports = router;
