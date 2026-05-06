/**
 * Script d'enregistrement du client OIDC dans eSignet
 * 
 * Ce script est IDEMPOTENT : il peut être relancé plusieurs fois sans problème.
 * - Si les clés RSA existent déjà, il les réutilise
 * - Si le client est déjà enregistré (duplicate_client_id), il continue sans erreur
 * - Il ne touche au .env que si un NOUVEAU client est effectivement créé
 */

require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { generateKeyPairSync } = require('crypto');

const ESIGNET_BASE_URL = process.env.ESIGNET_BASE_URL || 'http://localhost:8088/v1/esignet';
const CLIENT_NAME = 'CottonPay ID';
const REDIRECT_URI = process.env.CLIENT_REDIRECT_URI || 'http://localhost:3002/certification/auth/callback';

// Lire le CLIENT_ID actuel depuis le .env (pour ne pas le changer inutilement)
const CURRENT_CLIENT_ID = process.env.CLIENT_ID || process.env.OIDC_CLIENT_ID || 'cottonpay-client-v3';

async function generateRSAKeyPair() {
  // Créer le dossier keys s'il n'existe pas
  const keysDir = path.resolve(__dirname, '../backend/keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  const privateKeyPath = path.join(keysDir, 'private-key.pem');
  const publicKeyPath = path.join(keysDir, 'public-key.pem');

  // Si les clés existent déjà, on les lit au lieu d'en recréer
  if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
    console.log('  ✅ Clés RSA existantes trouvées, réutilisation...');
    return {
      publicKey: fs.readFileSync(publicKeyPath, 'utf8'),
      privateKey: fs.readFileSync(privateKeyPath, 'utf8')
    };
  }

  console.log('  🔐 Génération de la paire de clés RSA...');

  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Sauvegarder les clés
  fs.writeFileSync(privateKeyPath, privateKey);
  fs.writeFileSync(publicKeyPath, publicKey);
  console.log('  ✅ Clés RSA générées et sauvegardées');

  return { publicKey, privateKey };
}

function pemToJWK(publicKeyPem) {
  const publicKey = crypto.createPublicKey(publicKeyPem);
  const jwk = publicKey.export({ format: 'jwk' });

  return {
    kty: 'RSA',
    e: jwk.e,
    n: jwk.n,
    alg: 'RS256',
    use: 'sig'
  };
}

async function getCsrfToken() {
  try {
    const response = await axios.get(`${ESIGNET_BASE_URL}/csrf/token`);
    const csrfToken = response.data.token || response.data.response?.csrfToken;
    console.log('  ✅ Token CSRF obtenu');
    return csrfToken;
  } catch (error) {
    console.error('  ⚠️ Erreur CSRF (non bloquant):', error.message);
    return null; // CSRF peut ne pas être requis selon la config eSignet
  }
}

/**
 * Enregistre le client OIDC dans eSignet.
 * Retourne { clientId, isNew } :
 *  - isNew=true  → nouveau client créé, il faut mettre à jour le .env
 *  - isNew=false → client existant, ne PAS toucher au .env
 */
async function registerClient(publicKeyJWK, csrfToken) {
  const clientId = CURRENT_CLIENT_ID;
  console.log(`  📝 Enregistrement du client OIDC: ${clientId}`);

  const clientData = {
    requestTime: new Date().toISOString(),
    request: {
      clientId: clientId,
      clientName: CLIENT_NAME,
      relyingPartyId: 'cottonpay-rp',
      logoUri: 'http://localhost:3002/logo.jpeg',
      redirectUris: [REDIRECT_URI],
      grantTypes: ['authorization_code'],
      clientAuthMethods: ['private_key_jwt'],
      publicKey: publicKeyJWK,
      authContextRefs: ['mosip:idp:acr:generated-code', 'mosip:idp:acr:biometrics'],
      userClaims: ['name', 'phone_number', 'email', 'picture', 'individual_id', 'gender', 'birthdate', 'address']
    }
  };

  const headers = { 'Content-Type': 'application/json' };
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  try {
    const response = await axios.post(
      `${ESIGNET_BASE_URL}/client-mgmt/oidc-client`,
      clientData,
      { headers }
    );

    // Gérer le cas où l'API renvoie 200 OK mais avec une erreur métier
    if (response.data.errors && response.data.errors.length > 0) {
      const errorCode = response.data.errors[0]?.errorCode;
      if (errorCode === 'duplicate_client_id') {
        console.log(`  ✅ Client "${clientId}" déjà enregistré dans eSignet — rien à faire`);
        return { clientId, isNew: false };
      }
      // Autre erreur métier
      console.error('  ⚠️ Erreur eSignet:', JSON.stringify(response.data.errors));
      return { clientId, isNew: false };
    }

    const returnedId = response.data.response?.clientId || response.data.clientId || clientId;
    console.log(`  ✅ Client OIDC enregistré: ${returnedId}`);
    return { clientId: returnedId, isNew: true };

  } catch (error) {
    const errorCode = error.response?.data?.errors?.[0]?.errorCode;
    const errorMsg = error.response?.data?.errors?.[0]?.errorMessage || error.message;

    // Si le client existe déjà, c'est OK — on continue
    if (errorCode === 'duplicate_client_id') {
      console.log(`  ✅ Client "${clientId}" déjà enregistré dans eSignet — rien à faire`);
      return { clientId, isNew: false };
    }

    console.error(`  ❌ Erreur d'enregistrement: ${errorMsg}`);
    console.error('     Détails:', JSON.stringify(error.response?.data || error.message));
    throw error;
  }
}

function updateEnvFile(clientId) {
  const envPath = path.resolve(__dirname, '../.env');
  let envContent = '';

  // Lire le fichier .env.example si .env n'existe pas
  if (!fs.existsSync(envPath)) {
    const examplePath = path.resolve(__dirname, '../.env.example');
    envContent = fs.readFileSync(examplePath, 'utf8');
  } else {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Mettre à jour CLIENT_ID et OIDC_CLIENT_ID
  if (envContent.includes('CLIENT_ID=')) {
    envContent = envContent.replace(/^CLIENT_ID=.*/m, `CLIENT_ID=${clientId}`);
    envContent = envContent.replace(/^OIDC_CLIENT_ID=.*/m, `OIDC_CLIENT_ID=${clientId}`);
  } else {
    envContent += `\nCLIENT_ID=${clientId}\n`;
  }

  // Mettre à jour les chemins des clés
  envContent = envContent.replace(
    /CLIENT_PRIVATE_KEY_PATH=.*/,
    'CLIENT_PRIVATE_KEY_PATH=./backend/keys/private-key.pem'
  );
  envContent = envContent.replace(
    /CLIENT_PUBLIC_KEY_PATH=.*/,
    'CLIENT_PUBLIC_KEY_PATH=./backend/keys/public-key.pem'
  );

  fs.writeFileSync(envPath, envContent);
  console.log('  ✅ Fichier .env mis à jour');
}

async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   CottonPay — Enregistrement Client OIDC  ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Client ID actuel: ${CURRENT_CLIENT_ID}`);
  console.log(`  eSignet URL: ${ESIGNET_BASE_URL}`);
  console.log(`  Redirect URI: ${REDIRECT_URI}`);
  console.log('');

  try {
    // 1. Générer ou réutiliser la paire de clés RSA
    const { publicKey } = await generateRSAKeyPair();

    // 2. Convertir la clé publique en JWK
    const publicKeyJWK = pemToJWK(publicKey);

    // 3. Obtenir le token CSRF
    const csrfToken = await getCsrfToken();

    // 4. Enregistrer le client (ou vérifier qu'il existe déjà)
    const { clientId, isNew } = await registerClient(publicKeyJWK, csrfToken);

    // 5. Mettre à jour le .env UNIQUEMENT si c'est un nouveau client
    if (isNew) {
      updateEnvFile(clientId);
    } else {
      console.log(`  ℹ️ .env inchangé (client existant: ${clientId})`);
    }

    console.log('');
    console.log('  ✅ Configuration OIDC terminée !');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('  ❌ Erreur lors de l\'enregistrement:', error.message);
    console.error('');
    // NE PAS faire process.exit(1) pour ne pas bloquer start.sh
    // Le backend peut quand même démarrer si le client était déjà enregistré
    console.error('  ⚠️ Le backend va quand même tenter de démarrer...');
    console.error('');
  }
}

main();

