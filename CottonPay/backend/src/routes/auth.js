/**
 * Authentication Routes
 * Gestion du flux OIDC avec eSignet
 * 
 * Flux unique : authentification coopérative
 * Le producteur accède à ses données via l'espace coopérative.
 */

const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { generatePKCE } = require('../utils/pkce');

/**
 * GET /auth/login?flow=coop|producer
 * Initie le flux de connexion OIDC vers eSignet
 */
router.get('/login', async (req, res, next) => {
  try {
    const flow = req.query.flow || 'coop'; // 'coop' ou 'producer'
    const npi = req.query.npi || null; // NPI pré-capturé (optionnel)
    console.log(`🔐 Initiating login flow: ${flow}${npi ? ` (NPI: ${npi})` : ''}`);

    // Générer PKCE
    const { codeVerifier, codeChallenge } = generatePKCE();

    // Générer state et nonce
    const crypto = require('crypto');
    const state = crypto.randomBytes(16).toString('hex');
    const nonce = crypto.randomBytes(16).toString('hex');

    // Stocker en session
    req.session.codeVerifier = codeVerifier;
    req.session.loginFlow = flow;
    req.session.oauthState = state;
    req.session.oauthNonce = nonce;
    // Stocker le NPI pré-capturé pour résolution après callback
    if (npi) {
      req.session.pendingNpi = npi;
    }

    // Construire l'URL d'autorisation eSignet
    const authUrl = authService.buildAuthorizationUrl({
      codeChallenge,
      state: state,
      nonce: nonce
    });

    console.log('✅ Redirecting to eSignet:', authUrl);
    res.redirect(authUrl);

  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/callback
 * Callback après authentification eSignet
 * Redirige vers l'espace approprié selon le flow
 */
router.get('/callback', async (req, res, next) => {
  try {
    const { code, state, error, error_description } = req.query;

    console.log('🔄 Auth callback received:', { code: !!code, state, error });

    // Vérifier les erreurs eSignet
    if (error) {
      console.error('❌ eSignet error:', error, error_description);
      // Nettoyer la session avant de rediriger
      req.session.destroy(() => {});
      return res.redirect(`/?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || '')}`);
    }

    // Vérifier le state (protection CSRF)
    if (!state || state !== req.session.oauthState) {
      console.error('❌ Invalid state parameter');
      req.session.destroy(() => {});
      return res.redirect('/?error=invalid_state');
    }

    // Vérifier le code d'autorisation
    if (!code) {
      console.error('❌ Missing authorization code');
      req.session.destroy(() => {});
      return res.redirect('/?error=missing_code');
    }

    // Récupérer le code_verifier
    const codeVerifier = req.session.codeVerifier;
    if (!codeVerifier) {
      console.error('❌ Missing code_verifier in session');
      req.session.destroy(() => {});
      return res.redirect('/?error=missing_verifier');
    }

    // Échanger le code contre des tokens
    console.log('🔄 Exchanging code for tokens...');
    let tokens;
    try {
      tokens = await authService.exchangeCodeForTokens(code, codeVerifier);
    } catch (tokenError) {
      console.error('❌ Token exchange failed:', tokenError.message);
      req.session.destroy(() => {});
      return res.redirect('/?error=token_exchange_failed');
    }

    // Décoder et valider l'ID token
    let idTokenPayload;
    try {
      idTokenPayload = await authService.validateAndDecodeIdToken(tokens.id_token);
      console.log('✅ User authenticated:', idTokenPayload.sub);
    } catch (idError) {
      console.error('❌ ID token validation failed:', idError.message);
      req.session.destroy(() => {});
      return res.redirect('/?error=token_validation_failed');
    }

    // Récupérer les informations utilisateur complètes
    const userDetails = await authService.getUserInfo(tokens.access_token);
    console.log('✅ User details:', JSON.stringify(userDetails, null, 2));

    // ============================================
    // RÉSOLUTION DU NPI — stratégies par priorité
    // ============================================
    // eSignet retourne un PPID hashé dans sub, PAS le NPI réel.
    const identityService = require('../services/identityService');
    let userNpi = null;

    // Priorité 1 : NPI pré-capturé avant redirection eSignet
    if (req.session.pendingNpi) {
      userNpi = req.session.pendingNpi;
      console.log(`🔑 NPI résolu via pendingNpi (pré-capturé): ${userNpi}`);
      delete req.session.pendingNpi;
    }

    // Priorité 2 : individual_id dans l'id_token (si eSignet le retourne)
    if (!userNpi && idTokenPayload.individual_id) {
      userNpi = idTokenPayload.individual_id;
      console.log(`🔑 NPI résolu via id_token.individual_id: ${userNpi}`);
    }

    // Priorité 3 : claims userInfo (phone, email, nom)
    if (!userNpi) {
      userNpi = identityService.resolveNpiFromUserDetails(userDetails);
    }

    // Dernier fallback : PPID (sera probablement rejeté)
    if (!userNpi) {
      console.warn('⚠️ Impossible de résoudre le NPI — fallback PPID');
      userNpi = idTokenPayload.sub;
    }

    console.log(`✅ Resolved NPI: ${userNpi}`);

    // Stocker les informations en session
    req.session.user = {
      sub: userNpi, // NPI résolu (ou PPID si fallback)
      ppid: idTokenPayload.sub, // PPID original pour référence
      name: userDetails.name || userDetails.given_name || 'Utilisateur',
      phone_number: userDetails.phone_number || userDetails.phone || '-',
      email: userDetails.email || '-'
    };
    req.session.accessToken = tokens.access_token;

    // Nettoyer les données temporaires
    const flow = req.session.loginFlow || 'coop';
    delete req.session.codeVerifier;
    delete req.session.oauthState;
    delete req.session.oauthNonce;

    // Rediriger vers l'espace approprié — avec vérification de rôle
    const coopService = require('../services/coopService');
    let redirectUrl;

    if (flow === 'coop') {
      // Vérifier que le NPI est bien un membre de coopérative
      const coop = coopService.getCoopByMemberNpi(userNpi);
      if (coop) {
        redirectUrl = '/coop/';
      } else {
        console.log(`❌ NPI ${userNpi} is not a coop member`);
        return req.session.destroy(() => {
          res.redirect('/?error=not_coop_member');
        });
      }
    } else if (flow === 'verify') {
      // Flux de vérification publique via eSignet
      // Le producteur s'est authentifié → on stocke son NPI vérifié
      req.session.verifiedNpi = userNpi;
      req.session.verifiedAt = Date.now();
      console.log(`🏦 Verify flow: NPI ${userNpi} authenticated via eSignet`);
      redirectUrl = '/verify?authenticated=1';
    } else {
      redirectUrl = '/coop/';
    }

    console.log(`✅ Redirecting to ${flow} space: ${redirectUrl}`);
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Callback error:', error);
    // IMPORTANT: Ne PAS envoyer next(error) qui afficherait du JSON brut.
    // Détruire la session et rediriger proprement vers la landing page.
    req.session.destroy(() => {});
    res.redirect('/?error=auth_failed');
  }
});

/**
 * GET /auth/logout
 * Déconnexion — détruit la session et redirige vers la landing page
 */
router.get('/logout', (req, res) => {
  const flow = req.session?.loginFlow || 'unknown';
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
    }
    console.log(`✅ User logged out (flow: ${flow})`);
    res.redirect('/');
  });
});

/**
 * POST /auth/logout (JSON API)
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

/**
 * GET /auth/status
 * Vérifie le statut d'authentification
 */
router.get('/status', (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      authenticated: true,
      user: req.session.user,
      flow: req.session.loginFlow
    });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;
