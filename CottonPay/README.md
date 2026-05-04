# CottonPay - Module Principal

Module d'application CottonPay pour l'enregistrement des ventes de coton et l'émission de credentials vérifiables.

## Architecture

```
CottonPay/
├── frontend/               # Interface utilisateur
│   ├── index.html         # Page d'accueil
│   ├── dashboard.html     # Dashboard agriculteur
│   ├── styles/            # Feuilles de style CSS
│   └── assets/            # Images et ressources
│
├── backend/               # API REST Node.js
│   ├── server.js          # Point d'entrée du serveur
│   ├── src/
│   │   ├── routes/        # Routes Express
│   │   │   ├── auth.js    # Authentification OIDC
│   │   │   ├── sales.js   # Gestion des ventes
│   │   │   ├── user.js    # Informations utilisateur
│   │   │   └── certification.js  # Émission de credentials
│   │   ├── services/      # Logique métier
│   │   │   ├── authService.js    # Service d'authentification
│   │   │   └── salesService.js   # Service de ventes
│   │   └── utils/         # Utilitaires
│   │       └── pkce.js    # Génération PKCE
│   └── keys/              # Clés RSA pour OIDC
│       ├── private-key.pem
│       └── public-key.pem
│
├── scripts/               # Scripts d'administration
│   ├── register-client.js # Enregistrement client OIDC
│   └── create-test-user.js # Création utilisateur test
│
├── data/                  # Données locales
│   └── sales.json         # Historique des ventes
│
├── package.json           # Dépendances npm
└── .env                   # Configuration (à la racine du projet)
```

## Configuration

### Fichier .env

Le fichier `.env` se trouve à la racine du projet :

```env
# Application
NODE_ENV=development
APP_PORT=3002
APP_URL=http://localhost:3002
FRONTEND_URL=http://localhost:3002

# eSignet Configuration
ESIGNET_BASE_URL=http://localhost:8088/v1/esignet
ESIGNET_AUTHORIZE_URL=http://localhost:3000/authorize
ESIGNET_TOKEN_URL=http://localhost:8088/v1/esignet/oauth/v2/token
ESIGNET_USERINFO_URL=http://localhost:8088/v1/esignet/oidc/userinfo
ESIGNET_JWKS_URL=http://localhost:8088/v1/esignet/oauth/.well-known/jwks.json

# OIDC Configuration
OIDC_ISSUER=http://localhost:8088/v1/esignet
OIDC_CLIENT_ID=cottonpay-client
OIDC_REDIRECT_URI=http://localhost:3002/auth/callback
OIDC_SCOPES=openid profile phone

# Client OIDC
CLIENT_ID=cottonpay-client
CLIENT_REDIRECT_URI=http://localhost:3002/auth/callback
CLIENT_PRIVATE_KEY_PATH=./backend/keys/private-key.pem
CLIENT_PUBLIC_KEY_PATH=./backend/keys/public-key.pem

# Session
SESSION_SECRET=change-this-to-a-random-secret-in-production

# ACR Values
ACR_VALUES=mosip:idp:acr:generated-code

# eidStack-CMU Configuration
EIDSTACK_URL=http://localhost:4000

# Mock Identity System
MOCK_IDENTITY_URL=http://localhost:8082

# Logging
LOG_LEVEL=debug
```

## Installation

### Prérequis

- Node.js v18.17.1 ou supérieur
- npm v9.6.7 ou supérieur
- eSignet démarré (Docker)
- eidStack-CMU démarré (WSL)

### Installation des dépendances

```bash
cd CottonPay
npm install
```

## Scripts disponibles

### npm run start:backend

Démarre le serveur backend sur le port 3002.

```bash
npm run start:backend
```

Le serveur sert automatiquement le frontend depuis le dossier `frontend/`.

### npm run register-client

Enregistre le client OIDC auprès d'eSignet. À exécuter une seule fois lors de l'installation initiale.

```bash
npm run register-client
```

Ce script :
1. Génère une paire de clés RSA (2048 bits)
2. Sauvegarde les clés dans `backend/keys/`
3. Convertit la clé publique en format JWK
4. Enregistre le client auprès d'eSignet avec la méthode d'authentification `private_key_jwt`
5. Met à jour le fichier `.env` avec le `CLIENT_ID`

### npm run create-test-user

Crée un utilisateur de test dans le Mock Identity System.

```bash
npm run create-test-user
```

Utilisateur créé :
- **NPI** : 1234567890123456
- **Nom** : Koffi Mensah
- **Téléphone** : +22997123456
- **OTP** : 111111

## API Routes

### Authentification

#### GET /auth/login

Initie le flux de connexion OIDC avec eSignet.

**Réponse** : Redirection vers eSignet UI

#### GET /auth/callback

Callback après authentification eSignet. Échange le code d'autorisation contre des tokens.

**Query Parameters** :
- `code` : Code d'autorisation
- `state` : État de la session

**Réponse** : Redirection vers `/dashboard.html`

#### GET /auth/logout

Déconnecte l'utilisateur et détruit la session.

**Réponse** : Redirection vers `/`

### Utilisateur

#### GET /user/profile

Récupère les informations du profil utilisateur.

**Réponse** :
```json
{
  "sub": "1234567890123456",
  "name": "Koffi Mensah",
  "phone_number": "+22997123456",
  "email": "koffi.mensah@example.com"
}
```

### Ventes

#### POST /sales/create

Crée une vente de coton et émet un credential vérifiable.

**Body** :
```json
{
  "weight_kg": 150,
  "unit_price_fcfa": 500,
  "collection_point": "Banikoara Centre"
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "sale": {
      "id": "uuid",
      "farmer_npi": "1234567890123456",
      "weight_kg": 150,
      "unit_price_fcfa": 500,
      "total_amount_fcfa": 75000,
      "sale_date": "2026-03-28",
      "sale_time": "17:30:00",
      "payment_reference": "MTN-REF-123456",
      "payment_status": "completed",
      "transaction_id": "TXN-123456"
    },
    "credential": {
      "invitationUrl": "http://localhost:3021?oob=...",
      "shortUrl": "http://localhost:4000/short-url/s/abc123",
      "invitationQr": "data:image/png;base64,...",
      "credentialExchangeId": "uuid",
      "state": "offer-sent"
    }
  }
}
```

#### GET /sales/credential-status/:credentialExchangeId

Vérifie l'état d'un credential.

**Réponse** :
```json
{
  "success": true,
  "data": {
    "state": "done"
  }
}
```

## Flux d'authentification OIDC

### 1. Initiation du flux

```
User → GET /auth/login
  ↓
Backend génère PKCE (code_verifier, code_challenge)
  ↓
Backend stocke code_verifier en session
  ↓
Backend redirige vers eSignet avec :
  - client_id
  - redirect_uri
  - response_type=code
  - scope=openid profile phone
  - state
  - nonce
  - code_challenge
  - code_challenge_method=S256
```

### 2. Authentification eSignet

```
User → eSignet UI (localhost:3000)
  ↓
User entre NPI + OTP/empreinte
  ↓
eSignet valide avec Mock Identity System
  ↓
eSignet redirige vers redirect_uri avec code
```

### 3. Échange de tokens

```
Backend → GET /auth/callback?code=...&state=...
  ↓
Backend génère client_assertion JWT signé avec clé privée RSA
  ↓
Backend → POST /oauth/v2/token avec :
  - grant_type=authorization_code
  - code
  - redirect_uri
  - client_id
  - client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
  - client_assertion (JWT signé)
  - code_verifier
  ↓
eSignet valide client_assertion avec clé publique
  ↓
eSignet retourne :
  - access_token
  - id_token
  - refresh_token
```

### 4. Récupération des informations utilisateur

```
Backend → GET /oidc/userinfo avec Authorization: Bearer {access_token}
  ↓
eSignet retourne les claims utilisateur
  ↓
Backend stocke les infos en session
  ↓
Backend redirige vers /dashboard.html
```

## Flux d'émission de credential

### 1. Création de la vente

```
User → POST /sales/create
  ↓
Backend calcule total_amount_fcfa
  ↓
Backend simule paiement Mobile Money
  ↓
Backend sauvegarde la vente dans data/sales.json
```

### 2. Émission du credential

```
Backend → POST http://localhost:4000/issuance/offer
  ↓
Body:
{
  "credentialDefinitionId": "did:indy:bcovrin:test:...",
  "attributes": [
    { "name": "farmer_npi", "value": "1234567890123456" },
    { "name": "sale_date", "value": "2026-03-28" },
    { "name": "cotton_weight_kg", "value": "150" },
    { "name": "total_amount_fcfa", "value": "75000" },
    ...
  ]
}
  ↓
eidStack-CMU crée une invitation Out-of-Band
  ↓
eidStack-CMU génère un QR code
  ↓
eidStack-CMU retourne :
  - invitationUrl
  - shortUrl
  - invitationQr (base64)
  - credentialExchangeId
```

### 3. Réception du credential

```
User scanne le QR code avec wallet mobile
  ↓
Wallet se connecte à l'agent via DIDComm
  ↓
Wallet accepte l'offre de credential
  ↓
Agent émet le credential signé
  ↓
Wallet stocke le credential localement
```

## Sécurité

### Authentification OIDC

- **PKCE (Proof Key for Code Exchange)** : Protection contre les attaques d'interception de code
- **private_key_jwt** : Authentification du client via JWT signé avec clé privée RSA
- **State parameter** : Protection contre les attaques CSRF
- **Nonce** : Protection contre les attaques de replay

### Clés RSA

Les clés RSA sont générées lors de l'enregistrement du client :
- **Algorithme** : RSA 2048 bits
- **Format** : PEM (PKCS#8 pour la clé privée, SPKI pour la clé publique)
- **Stockage** : `backend/keys/` (ne pas commiter dans Git)

### Sessions

- **Secret** : Défini dans `SESSION_SECRET` (à changer en production)
- **Cookie** : HttpOnly, Secure en production
- **Durée** : 24 heures

## Dépannage

### Erreur "invalid_client"

Le client OIDC n'est pas correctement enregistré ou les clés RSA ne correspondent pas.

**Solution** :
```bash
npm run register-client
```

### Erreur "Agent not initialized"

L'agent SSI de eidStack-CMU n'est pas initialisé.

**Solution** :
```bash
cd ../eidStack-CMU
./init-agent.sh
```

### Erreur "Failed to exchange code for tokens"

Le code d'autorisation est invalide ou expiré, ou le `code_verifier` ne correspond pas.

**Solution** : Réessayez le flux de connexion complet.

### Port 3002 déjà utilisé

Un autre processus utilise le port 3002.

**Solution** :
```bash
# Trouver le processus
lsof -i :3002

# Tuer le processus
kill -9 <PID>
```

## Développement

### Mode développement

```bash
npm run dev:backend
```

Utilise `nodemon` pour redémarrer automatiquement le serveur lors des modifications.

### Structure des logs

Le serveur affiche des logs détaillés avec des emojis pour faciliter le débogage :

- 🔄 : Opération en cours
- ✅ : Succès
- ❌ : Erreur
- 📝 : Création
- 📊 : Données

## Technologies utilisées

- **Express.js** : Framework web
- **express-session** : Gestion des sessions
- **axios** : Client HTTP
- **jose** : Bibliothèque JWT/JWK
- **crypto** : Génération de clés RSA
- **dotenv** : Gestion des variables d'environnement
- **cors** : Cross-Origin Resource Sharing
- **cookie-parser** : Parsing des cookies

## Licence

MIT License

---

**Maintenu par Team EVOLUTICS - UAC**
