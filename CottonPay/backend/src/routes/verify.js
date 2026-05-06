/**
 * Verify Routes
 * Vérification publique des livraisons (banques / institutions)
 * 
 * Flux en 2 étapes (via eSignet) :
 *  1. Saisie du NPI du producteur → on vérifie qu'il existe → redirection eSignet
 *  2. eSignet authentifie le producteur (NPI + OTP) → callback → affichage historique
 * 
 * IMPORTANT : 
 *  - Le producteur doit être physiquement présent pour saisir son OTP dans eSignet
 *  - Pas d'affichage du statut de paiement (réservé à l'espace coopérative)
 *  - Session éphémère — détruite à la fermeture de l'onglet
 */

const express = require('express');
const router = express.Router();
const coopService = require('../services/coopService');
const deliveryService = require('../services/deliveryService');
const { requireVerifySession } = require('../middleware/auth');

/**
 * POST /api/verify/lookup
 * Étape 1 : Rechercher un producteur par NPI
 * Body: { npi: string }
 * 
 * Si trouvé, retourne un aperçu masqué et l'URL d'authentification eSignet
 */
router.post('/lookup', async (req, res) => {
  try {
    const { npi } = req.body;

    if (!npi || npi.trim().length === 0) {
      return res.status(400).json({ error: 'Le NPI est requis' });
    }

    const cleanNpi = npi.trim();

    // Vérifier dans notre base de producteurs
    const producer = coopService.getProducerByNpi(cleanNpi);

    if (!producer) {
      return res.status(404).json({
        found: false,
        message: 'Aucun producteur trouvé avec ce NPI dans le système CottonPay'
      });
    }

    // Récupérer le nom de la coopérative
    const coop = coopService.getCoopById(producer.cooperative_id);

    // Stocker le NPI en session pour le flux verify
    req.session.pendingVerifyNpi = cleanNpi;

    res.json({
      found: true,
      producer: {
        name_initial: producer.firstname.charAt(0) + '. ' + producer.name,
        commune: producer.commune,
        cooperative: coop ? coop.name : 'Inconnue',
        phone_masked: maskPhone(producer.phone)
      },
      // URL d'authentification eSignet pour le flux verify
      auth_url: `/auth/login?flow=verify&npi=${cleanNpi}`,
      message: 'Producteur trouvé. Le producteur doit s\'authentifier via eSignet pour autoriser la consultation.'
    });
  } catch (error) {
    console.error('❌ Verify lookup error:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
});

/**
 * GET /api/verify/deliveries
 * Étape 2 : Historique des livraisons (après authentification eSignet)
 * 
 * Retourne UNIQUEMENT les données publiques :
 *  - Date, poids, qualité, prix, montant brut, lot
 *  - PAS de statut de paiement
 *  - PAS de statut credential
 */
router.get('/deliveries', requireVerifySession, (req, res) => {
  try {
    const npi = req.session.verifiedNpi;
    const producer = coopService.getProducerByNpi(npi);

    if (!producer) {
      delete req.session.verifiedNpi;
      delete req.session.verifiedAt;
      return res.status(404).json({
        error: 'Producteur introuvable',
        message: 'Ce producteur n\'est plus enregistré dans le système.'
      });
    }

    const coop = coopService.getCoopById(producer.cooperative_id);
    const deliveries = deliveryService.getPublicDeliveriesByNpi(npi);

    res.json({
      success: true,
      producer: {
        npi: producer.npi,
        name: `${producer.firstname} ${producer.name}`,
        commune: producer.commune,
        region: producer.region,
        cooperative: coop ? coop.name : 'Inconnue'
      },
      deliveries,
      summary: {
        total_deliveries: deliveries.length,
        total_weight_kg: deliveries.reduce((s, d) => s + d.weight_kg, 0),
        total_gross: deliveries.reduce((s, d) => s + d.total_gross, 0)
      }
    });
  } catch (error) {
    console.error('❌ Verify deliveries error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement de l\'historique' });
  }
});

/**
 * GET /api/verify/status
 * Vérifie si une session de vérification est active
 */
router.get('/status', (req, res) => {
  if (req.session && req.session.verifiedNpi) {
    res.json({
      authenticated: true,
      npi: req.session.verifiedNpi,
      verifiedAt: req.session.verifiedAt
    });
  } else {
    res.json({ authenticated: false });
  }
});

/**
 * POST /api/verify/reset
 * Réinitialise la session de vérification
 */
router.post('/reset', (req, res) => {
  delete req.session.verifiedNpi;
  delete req.session.verifiedAt;
  delete req.session.pendingVerifyNpi;
  res.json({ success: true, message: 'Session réinitialisée' });
});

// Utilitaire : masquer un numéro de téléphone
function maskPhone(phone) {
  if (!phone) return '***';
  const clean = phone.replace(/\s/g, '');
  if (clean.length < 6) return '***';
  return clean.substring(0, 4) + '****' + clean.substring(clean.length - 2);
}

module.exports = router;
