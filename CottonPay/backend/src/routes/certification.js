const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration OIDC
const OIDC_CONFIG = {
    issuer: process.env.OIDC_ISSUER || 'http://localhost:8088/v1/esignet',
    clientId: process.env.OIDC_CLIENT_ID || 'cottonpay-client',
    redirectUri: process.env.OIDC_REDIRECT_URI || 'http://localhost:3002/callback',
    scopes: process.env.OIDC_SCOPES || 'openid profile phone',
    authorizationEndpoint: 'http://localhost:3000/authorize',
    tokenEndpoint: 'http://localhost:8088/v1/esignet/oauth/v2/token',
    userinfoEndpoint: 'http://localhost:8088/v1/esignet/oidc/userinfo'
};

const EIDSTACK_URL = process.env.EIDSTACK_URL || 'http://localhost:4000';

// Fonction pour générer le code_verifier et code_challenge (PKCE)
function generatePKCE() {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');

    return { codeVerifier, codeChallenge };
}

// Route 1: Initier l'authentification eSignet
router.get('/auth/login', (req, res) => {
    try {
        // Générer PKCE
        const { codeVerifier, codeChallenge } = generatePKCE();

        // Générer state et nonce
        const state = crypto.randomBytes(16).toString('hex');
        const nonce = crypto.randomBytes(16).toString('hex');

        // Stocker en session
        req.session.codeVerifier = codeVerifier;
        req.session.state = state;
        req.session.nonce = nonce;

        // Construire l'URL d'autorisation
        const authUrl = new URL(OIDC_CONFIG.authorizationEndpoint);
        authUrl.searchParams.append('client_id', OIDC_CONFIG.clientId);
        authUrl.searchParams.append('redirect_uri', OIDC_CONFIG.redirectUri);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('scope', OIDC_CONFIG.scopes);
        authUrl.searchParams.append('state', state);
        authUrl.searchParams.append('nonce', nonce);
        authUrl.searchParams.append('acr_values', 'mosip:idp:acr:generated-code');
        authUrl.searchParams.append('code_challenge', codeChallenge);
        authUrl.searchParams.append('code_challenge_method', 'S256');
        authUrl.searchParams.append('claims_locales', 'en');
        authUrl.searchParams.append('ui_locales', 'en-IN');

        console.log('Redirecting to eSignet:', authUrl.toString());

        // Rediriger vers eSignet
        res.redirect(authUrl.toString());
    } catch (error) {
        console.error('Error initiating auth:', error);
        res.status(500).json({ error: 'Failed to initiate authentication' });
    }
});

// Route 2: Callback après authentification eSignet
router.get('/callback', async (req, res) => {
    try {
        const { code, state } = req.query;

        // Vérifier le state
        if (!state || state !== req.session.state) {
            return res.status(400).json({ error: 'Invalid state parameter' });
        }

        if (!code) {
            return res.status(400).json({ error: 'Authorization code not received' });
        }

        const codeVerifier = req.session.codeVerifier;
        if (!codeVerifier) {
            return res.status(400).json({ error: 'Code verifier not found in session' });
        }

        console.log('Exchanging code for tokens...');

        // Échanger le code contre les tokens
        const tokenResponse = await axios.post(
            OIDC_CONFIG.tokenEndpoint,
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: OIDC_CONFIG.redirectUri,
                client_id: OIDC_CONFIG.clientId,
                code_verifier: codeVerifier
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const { access_token, id_token } = tokenResponse.data;

        if (!id_token) {
            return res.status(400).json({ error: 'ID token not received' });
        }

        console.log('Tokens received successfully');

        // Décoder l'ID token (sans vérification de signature pour simplifier)
        const idTokenPayload = jwt.decode(id_token);

        // Vérifier le nonce
        if (idTokenPayload.nonce !== req.session.nonce) {
            return res.status(400).json({ error: 'Invalid nonce in ID token' });
        }

        console.log('ID Token payload:', idTokenPayload);

        // Extraire les informations utilisateur
        const userInfo = {
            npi: idTokenPayload.sub,
            name: idTokenPayload.name || 'Utilisateur',
            phone: idTokenPayload.phone_number || '',
            email: idTokenPayload.email || ''
        };

        // Stocker en session
        req.session.user = userInfo;
        req.session.accessToken = access_token;

        // Nettoyer les données temporaires
        delete req.session.codeVerifier;
        delete req.session.state;
        delete req.session.nonce;

        console.log('User authenticated:', userInfo);

        // Rediriger vers certification.html avec succès
        res.redirect(`/certification.html?auth=success&name=${encodeURIComponent(userInfo.name)}`);

    } catch (error) {
        console.error('Error in callback:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Authentication failed',
            details: error.response?.data || error.message
        });
    }
});

// Route 3: Émettre le credential FarmerIdentityCredential
router.post('/issue-credential', async (req, res) => {
    try {
        // Vérifier que l'utilisateur est authentifié
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }

        const user = req.session.user;

        console.log('Issuing credential for user:', user);

        // Préparer les attributs du credential
        const credentialAttributes = {
            farmerId: user.npi,
            farmerName: user.name,
            phoneNumber: user.phone,
            certificationDate: new Date().toISOString().split('T')[0],
            certifiedBy: 'CottonPay'
        };

        // Appeler eidStack-CMU pour émettre le credential
        const response = await axios.post(
            `${EIDSTACK_URL}/credentials/offer-oob`,
            {
                credentialDefinitionId: 'FarmerIdentityCredential',
                attributes: credentialAttributes
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Credential issued successfully:', response.data);

        // Retourner le QR code
        res.json({
            success: true,
            invitationUrl: response.data.invitationUrl,
            qrCodeDataUrl: response.data.qrCodeDataUrl
        });

    } catch (error) {
        console.error('Error issuing credential:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to issue credential',
            details: error.response?.data || error.message
        });
    }
});

module.exports = router;
