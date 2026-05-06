/**
 * Farmer Authentication Routes
 * Authentification eSignet pour les agriculteurs lors des ventes
 */

const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { generatePKCE } = require('../utils/pkce');
const db = require('../db');

/**
 * GET /farmer-auth/check
 * Vérifier si un agriculteur est authentifié en session
 */
router.get('/check', (req, res) => {
  if (!req.session.authenticatedFarmer) {
    return res.status(401).json({ error: 'No farmer authenticated' });
  }

  res.json({
    success: true,
    farmer: req.session.authenticatedFarmer
  });
});

/**
 * GET /farmer-auth/login
 * Initie l'authentification eSignet pour un agriculteur
 */
router.get('/login', async (req, res, next) => {
  try {
    console.log('🌾 Initiating farmer authentication...');

    // Vérifier que le chef de coopérative est connecté
    if (!req.session.user) {
      return res.redirect('/?error=cooperative_not_authenticated');
    }

    // Stocker l'info que c'est une auth agriculteur
    req.session.farmerAuthFlow = true;
    req.session.cooperativeId = req.session.user.sub;

    // Générer PKCE
    const { codeVerifier, codeChallenge } = generatePKCE();

    // Stocker code_verifier en session
    req.session.farmerCodeVerifier = codeVerifier;

    // Construire l'URL d'autorisation (utilise /auth/callback comme redirect_uri)
    const authUrl = authService.buildAuthorizationUrl({
      codeChallenge,
      state: req.session.id + '_farmer',
      nonce: Math.random().toString(36).substring(7)
    });

    console.log('✅ Redirecting farmer to eSignet:', authUrl);
    res.redirect(authUrl);

  } catch (error) {
    next(error);
  }
});

/**
 * GET /farmer-auth/callback
 * Callback après authentification eSignet de l'agriculteur
 */
router.get('/callback', async (req, res, next) => {
  try {
    const { code, state, error, error_description } = req.query;

    console.log('🔄 Farmer callback received:', { code: !!code, state, error });

    // Vérifier les erreurs
    if (error) {
      console.error('❌ Farmer authentication error:', error, error_description);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard.html?error=${error}`);
    }

    // Vérifier le state
    if (!state || !state.endsWith('_farmer')) {
      console.error('❌ Invalid state parameter for farmer auth');
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard.html?error=invalid_state`);
    }

    // Vérifier le code
    if (!code) {
      console.error('❌ Missing authorization code');
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard.html?error=missing_code`);
    }

    // Récupérer le code_verifier
    const codeVerifier = req.session.farmerCodeVerifier;
    if (!codeVerifier) {
      console.error('❌ Missing code_verifier in session');
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard.html?error=missing_verifier`);
    }

    // Échanger le code contre des tokens
    console.log('🔄 Exchanging code for tokens...');
    const tokens = await authService.exchangeCodeForTokens(code, codeVerifier);

    console.log('✅ Tokens received');

    // Décoder et valider l'ID token
    const farmerInfo = await authService.validateAndDecodeIdToken(tokens.id_token);

    console.log('✅ Farmer authenticated:', farmerInfo.sub);

    // Récupérer les informations complètes
    const farmerDetails = await authService.getUserInfo(tokens.access_token);

    console.log('✅ Farmer details:', farmerDetails);

    // Vérifier si l'agriculteur existe déjà
    const cooperativeId = req.session.cooperativeId;
    const existingFarmer = await db.query(
      'SELECT id, name, phone_number FROM farmers WHERE esignet_sub = $1 AND cooperative_id = $2',
      [farmerInfo.sub, cooperativeId]
    );

    let farmer;

    if (existingFarmer.rows.length > 0) {
      // Agriculteur existant
      farmer = existingFarmer.rows[0];
      console.log('✅ Existing farmer found:', farmer.id);
    } else {
      // Nouvel agriculteur - enregistrer automatiquement
      console.log('🆕 New farmer - registering...');

      const result = await db.query(`
        INSERT INTO farmers (cooperative_id, name, phone_number, email, esignet_sub)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, phone_number, email
      `, [
        cooperativeId,
        farmerDetails.name || farmerDetails.given_name || 'Agriculteur',
        farmerDetails.phone_number || farmerDetails.phone || '',
        farmerDetails.email || '',
        farmerInfo.sub
      ]);

      farmer = result.rows[0];
      console.log('✅ New farmer registered:', farmer.id);
    }

    // Stocker les infos de l'agriculteur en session temporaire
    req.session.authenticatedFarmer = {
      id: farmer.id,
      name: farmer.name,
      phone_number: farmer.phone_number,
      esignet_sub: farmerInfo.sub
    };

    // Nettoyer la session
    delete req.session.farmerCodeVerifier;
    delete req.session.farmerAuthFlow;

    // Rediriger vers le dashboard avec le modal de vente ouvert
    const redirectUrl = `${process.env.FRONTEND_URL}/dashboard.html?farmer_authenticated=true&farmer_id=${farmer.id}&farmer_name=${encodeURIComponent(farmer.name)}`;

    console.log('✅ Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Farmer callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard.html?error=authentication_failed`);
  }
});

/**
 * POST /farmer-auth/clear
 * Nettoyer les infos de l'agriculteur authentifié après la vente
 */
router.post('/clear', (req, res) => {
  if (req.session.authenticatedFarmer) {
    delete req.session.authenticatedFarmer;
    console.log('✅ Farmer session cleared');
  }
  res.json({ success: true });
});

module.exports = router;
