/**
 * Verify Routes
 * Vérification publique des livraisons (banques / institutions)
 * 
 * Flux en 3 étapes :
 *  1. Saisie du NPI du producteur → on vérifie qu'il existe
 *  2. Envoi d'un OTP au producteur via eSignet → consentement
 *  3. Consultation de l'historique des livraisons (données publiques uniquement)
 * 
 * IMPORTANT : 
 *  - Pas d'affichage du statut de paiement (réservé à l'espace producteur)
 *  - Pas d'affichage du statut credential (réservé à l'espace producteur)
 *  - Session éphémère — détruite à la fermeture de l'onglet
 */

const express = require('express');
const router = express.Router();
const identityService = require('../services/identityService');
const coopService = require('../services/coopService');
const deliveryService = require('../services/deliveryService');
const { requireVerifySession } = require('../middleware/auth');

/**
 * POST /api/verify/lookup
 * Étape 1 : Rechercher un producteur par NPI
 * Body: { npi: string }
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

    // Stocker le NPI en session pour l'étape OTP
    req.session.pendingVerifyNpi = cleanNpi;

    res.json({
      found: true,
      producer: {
        // On ne montre que des infos partiellement masquées
        name_initial: producer.firstname.charAt(0) + '. ' + producer.name,
        commune: producer.commune,
        cooperative: coop ? coop.name : 'Inconnue',
        phone_masked: identityService.maskPhone(producer.phone)
      },
      message: 'Producteur trouvé. Un code de validation sera envoyé à son téléphone.'
    });
  } catch (error) {
    console.error('❌ Verify lookup error:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
});

/**
 * POST /api/verify/otp/send
 * Étape 2a : Envoyer un OTP au producteur via eSignet
 * Body: { npi: string }
 */
router.post('/otp/send', async (req, res) => {
  try {
    const npi = req.body.npi || req.session.pendingVerifyNpi;

    if (!npi) {
      return res.status(400).json({ error: 'Le NPI est requis' });
    }

    // Vérifier que le producteur existe
    const producer = coopService.getProducerByNpi(npi);
    if (!producer) {
      return res.status(404).json({ error: 'Producteur non trouvé' });
    }

    // Envoyer l'OTP via eSignet
    const result = await identityService.sendOtp(npi);

    // Stocker la transaction en session
    req.session.pendingVerifyNpi = npi;
    req.session.otpTransactionId = result.transactionId;
    req.session.otpSentAt = Date.now();

    res.json({
      success: true,
      message: 'Code de validation envoyé au producteur',
      phone_masked: identityService.maskPhone(producer.phone),
      transaction_id: result.transactionId
    });
  } catch (error) {
    console.error('❌ OTP send error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du code' });
  }
});

/**
 * POST /api/verify/otp/validate
 * Étape 2b : Valider l'OTP saisi
 * Body: { otp: string }
 */
router.post('/otp/validate', async (req, res) => {
  try {
    const { otp } = req.body;
    const npi = req.session.pendingVerifyNpi;
    const transactionId = req.session.otpTransactionId;

    if (!npi || !transactionId) {
      return res.status(400).json({
        error: 'Session expirée',
        message: 'Veuillez recommencer depuis l\'étape 1'
      });
    }

    if (!otp || otp.trim().length === 0) {
      return res.status(400).json({ error: 'Le code OTP est requis' });
    }

    // Vérifier l'OTP via eSignet
    const result = await identityService.verifyOtp(npi, otp.trim(), transactionId);

    if (!result.valid) {
      return res.status(401).json({
        valid: false,
        message: 'Code de validation incorrect. Veuillez réessayer.'
      });
    }

    // OTP valide → créer la session éphémère de vérification
    req.session.verifiedNpi = npi;
    req.session.verifiedAt = Date.now();
    // Nettoyer les données OTP
    delete req.session.pendingVerifyNpi;
    delete req.session.otpTransactionId;
    delete req.session.otpSentAt;

    console.log(`🏦 Public verification granted for NPI: ${npi}`);

    res.json({
      valid: true,
      message: 'Code validé. Accès à l\'historique autorisé.',
      npi
    });
  } catch (error) {
    console.error('❌ OTP validate error:', error);
    res.status(500).json({ error: 'Erreur lors de la validation' });
  }
});

/**
 * GET /api/verify/deliveries
 * Étape 3 : Historique des livraisons (après OTP validé)
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
      // Le producteur a été supprimé entre la validation OTP et la consultation
      delete req.session.verifiedNpi;
      delete req.session.verifiedAt;
      return res.status(404).json({
        error: 'Producteur introuvable',
        message: 'Ce producteur n\'est plus enregistré dans le système. Veuillez recommencer la vérification.'
      });
    }

    const coop = coopService.getCoopById(producer.cooperative_id);

    // Utiliser la version publique (sans payment_status ni credential_status)
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
 * POST /api/verify/reset
 * Réinitialise la session de vérification (nouvelle vérification)
 */
router.post('/reset', (req, res) => {
  delete req.session.verifiedNpi;
  delete req.session.verifiedAt;
  delete req.session.pendingVerifyNpi;
  delete req.session.otpTransactionId;
  res.json({ success: true, message: 'Session réinitialisée' });
});

module.exports = router;
