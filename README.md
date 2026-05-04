# CottonPay - Système d'Identité Numérique et de Paiement pour Producteurs de Coton

<p align="center">
  <img src="logo.png" alt="CottonPay Logo" width="200"/>
</p>

CottonPay est une plateforme complète d'identité numérique et de paiement destinée aux producteurs de coton au Bénin. Le système combine l'authentification par OTP via eSignet (MOSIP) et l'émission de credentials vérifiables via eidStack-CMU.

## 📊 Présentation du Projet

**<a href="EVOLUTICS-presentation.pptx">Télécharger la présentation PowerPoint</a>**

## 🎥 Vidéo de Démonstration

**<a href="https://youtu.be/t82CBL8v7Ik" target="_blank">Voir la démo sur YouTube</a>**

## 🎬 Vidéo de Présentation

**<a href="https://youtu.be/TbJYOXCMzmM" target="_blank">Voir la présentation sur YouTube</a>**

## 📁 Ressources Vidéo

**<a href="https://drive.google.com/drive/folders/1BX5NdTjXHq6yUXGQthe9Kd3KibYA479C" target="_blank">Accéder au dossier Google Drive avec les vidéos</a>**

---

## Prérequis

Avant de lancer le script d'installation automatique, vous devez installer ces outils sur votre machine.

### 1. Windows 10/11 avec WSL 2

WSL 2 permet d'exécuter Linux (Ubuntu) directement dans Windows. C'est indispensable car l'agent SSI (eidStack-CMU) nécessite un environnement Linux.

```powershell
# Ouvrir PowerShell en tant qu'administrateur
wsl --install
```

Redémarrez votre PC, puis installez Ubuntu :

```powershell
wsl --install -d Ubuntu-24.04
```

Créez un nom d'utilisateur et mot de passe pour Ubuntu.

### 2. Docker Desktop (version 20.10+)

Docker est utilisé pour exécuter le système d'authentification eSignet (MOSIP) avec ses services : PostgreSQL, Redis, Mock Identity System.

Téléchargez et installez depuis : https://www.docker.com/products/docker-desktop/

### 3. Node.js v18+ et npm v9+

Node.js est le moteur d'exécution de tous les serveurs du projet (CottonPay, eidStack-CMU).

**Sur Windows** (via le site officiel) : https://nodejs.org/

**Sur WSL/Ubuntu** (sera installé automatiquement par le script si manquant) :

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 4. PostgreSQL (WSL)

PostgreSQL stocke les données de l'agent SSI (schemas, credentials, connexions DIDComm).

```bash
# Dans un terminal WSL
sudo apt install -y postgresql postgresql-contrib
sudo service postgresql start
```

### 5. ADB (Android Debug Bridge)

ADB permet d'installer l'APK pré-compilé sur le téléphone et de configurer la connexion USB.

```bash
# Vérifier qu'ADB est disponible
adb devices
```

### 6. Câble USB

Un câble USB est nécessaire pour connecter le téléphone Android au PC. Le téléphone doit avoir le **débogage USB activé** (Paramètres → Options développeur → Débogage USB).

---

## Architecture du Projet

```
EVOLUTICS_DIGITAL_ID/
├── setup.sh                # 🔧 Script de configuration (.env, seed, APK)
├── install.sh              # Installation CottonPay + eSignet (Windows)
├── start.sh                # Démarrage CottonPay + eSignet (Windows)
├── install-eidstack.sh     # Installation eidStack-CMU (WSL)
├── setup-agent.sh          # Initialisation agent SSI (WSL, une fois)
├── logo.png                # Logo CottonPay
│
├── CottonPay/              # Application Web principale
│   ├── frontend/           # Interface utilisateur (HTML/CSS/JS)
│   │   ├── index.html      # Page d'accueil
│   │   └── dashboard.html  # Dashboard agriculteur + QR Code
│   ├── backend/            # API REST Node.js + Express
│   │   ├── server.js       # Point d'entrée du serveur
│   │   └── src/            # Routes et services
│   └── scripts/            # Scripts d'enregistrement OIDC
│
├── esignet-master/         # Infrastructure d'authentification (Docker)
│   └── docker-compose/     # PostgreSQL, Redis, eSignet, Mock Identity
│
├── eidStack-CMU/           # Service d'émission de credentials (WSL)
│   ├── src/                # API REST NestJS
│   │   ├── credo-agent/    # Agent SSI (Credo/Aries)
│   │   ├── issuance/       # Service d'émission de credentials
│   │   ├── short-url/      # Service de Short URLs pour QR codes
│   │   └── connection/     # Gestion des connexions DIDComm
│   └── prisma/             # Schéma et migrations PostgreSQL
│
└── e-IDapp_CMU/            # Application Mobile (idsWallet)
    ├── src/                # Code source React Native TypeScript
    │   ├── screens/        # Écrans (ScanQR, Credentials, etc.)
    │   ├── services/       # Services (CredoAgent, Connection, etc.)
    │   └── store/          # Redux (gestion d'état)
    ├── android/            # Projet Android natif
    └── ios/                # Projet iOS natif
```

## Services et Ports

| Port | Service               | Description                        | Environnement     |
| ---- | --------------------- | ---------------------------------- | ----------------- |
| 3000 | eSignet UI            | Interface d'authentification MOSIP | Docker (Windows)  |
| 3002 | CottonPay             | Application web principale         | Node.js (Windows) |
| 3021 | Agent DIDComm         | Transport des credentials SSI      | WSL Ubuntu        |
| 4000 | eidStack-CMU          | API d'émission de credentials      | WSL Ubuntu        |
| 5432 | PostgreSQL (eidStack) | Base de données agent SSI          | WSL Ubuntu        |
| 5455 | PostgreSQL (eSignet)  | Base de données eSignet            | Docker (Windows)  |
| 6379 | Redis                 | Cache de sessions eSignet          | Docker (Windows)  |
| 8082 | Mock Identity         | Système d'identité de test         | Docker (Windows)  |
| 8088 | eSignet Backend       | API OIDC/OAuth2                    | Docker (Windows)  |

---

## 🚀 Installation et Démarrage

**NB :** Tous les chemins relatifs supposent que vous êtes à la racine du projet EVOLUTICS-did-hackathon.

### PARTIE 1 : CottonPay + eSignet (Windows)

#### Étape 1 : Cloner le projet

```bash
git clone https://github.com/Bsh54/EVOLUTICS-did-hackathon.git
cd EVOLUTICS-did-hackathon
```

#### Étape 2 : Installation

Dans Git Bash ou terminal Windows :

```bash
./install.sh
```

**Ce script effectue :**

- Vérification des prérequis (Docker, Node.js, npm, curl)
- Création du réseau Docker `mosip_network`
- Installation des dépendances npm de CottonPay
- Création du fichier `.env` depuis `.env.example`
- Création des dossiers `keys/` et `logs/`

#### Étape 3 : Démarrage

```bash
./start.sh
```

**Ce script effectue :**

- Démarrage des conteneurs Docker eSignet (authentification MOSIP)
- Attente du démarrage complet d'eSignet (2-4 minutes)
- Enregistrement du client OIDC avec génération des clés RSA
- Création de l'utilisateur de test
- Démarrage du backend CottonPay sur le port 3002

---

### PARTIE 2 : eidStack-CMU (WSL Ubuntu)

**NB :** Si vous avez cloné le projet dans Windows (par exemple `C:\Users\EVOLUTICS-did-hackathon`), le chemin depuis WSL sera `/mnt/c/Users/EVOLUTICS-did-hackathon`

#### Étape 0 : Correction des fins de ligne (obligatoire)

Les scripts bash clonés depuis Windows/GitHub peuvent avoir des fins de ligne Windows (CRLF `\r\n`). Linux attend des fins de ligne Unix (LF `\n`). Si ce n'est pas corrigé, vous obtiendrez des erreurs `\r: command not found`.

```bash
wsl
cd /mnt/c/Users/<votre-nom>/EVOLUTICS-did-hackathon
sed -i 's/\r$//' install-eidstack.sh setup-agent.sh setup.sh
chmod +x install-eidstack.sh setup-agent.sh setup.sh
```

#### Étape 1 : Installation

```bash
./install-eidstack.sh
```

**Ce script effectue :**

- Installation automatique de Node.js v18.17.1 via nvm
- Installation de PostgreSQL et création de la base de données
- Installation des outils de compilation (build-essential)
- Installation des dépendances npm avec --legacy-peer-deps
- Configuration de Prisma et migrations

---

### PARTIE 3 : Configuration de l'environnement (WSL)

Le script `setup.sh` configure automatiquement les fichiers `.env`, le seed BCovrin, et installe l'APK mobile. **À exécuter après les deux scripts d'installation ci-dessus.**

```bash
./setup.sh
```

**Ce script effectue automatiquement :**

1. ✅ Vérifie les prérequis (Node.js, PostgreSQL, ADB, curl)
2. ✅ Configure la connexion USB (localhost + adb reverse)
3. ✅ Détecte la configuration PostgreSQL et crée la base de données `ids-db`
4. ✅ Génère tous les fichiers `.env` (eidStack-CMU, CottonPay)
5. ✅ Génère un seed unique pour BCovrin et vous guide pour l'enregistrement
6. ✅ Met à jour `setup-agent.sh` avec le seed
7. ✅ Télécharge l'APK pré-compilé depuis GitHub Releases
8. ✅ Installe l'APK sur votre téléphone et configure `adb reverse`

#### Enregistrement du DID sur BCovrin (seule action manuelle)

Pendant l'exécution de `setup.sh`, il vous sera demandé d'enregistrer votre DID sur le réseau BCovrin Testnet. C'est un registre blockchain public où votre agent SSI enregistre son identité.

1. Accédez à : **http://test.bcovrin.vonx.io/**
2. Remplissez le formulaire avec les valeurs affichées par le script :
   - **Seed** : Le seed généré (32 caractères)
   - **Alias** : `CottonPay-Issuer`
   - **Role** : Sélectionnez **ENDORSER** (obligatoire pour émettre des credentials)
3. Cliquez sur **"Register DID"**
4. Revenez dans le terminal et confirmez

### Étape 5 : Démarrage des services

Après l'installation, 3 services doivent tourner simultanément. Ouvrez 3 terminaux :

**Terminal 1 (Windows/Git Bash) - CottonPay + eSignet :**

```bash
./start.sh
```

**Ce script effectue :**

- Démarrage des conteneurs Docker eSignet (authentification MOSIP)
- Attente du démarrage complet d'eSignet (2-4 minutes)
- Enregistrement du client OIDC avec génération des clés RSA
- Création de l'utilisateur de test
- Démarrage du backend CottonPay sur le port 3002

**Terminal 2 (WSL) - eidStack-CMU :**

```bash
wsl
cd /mnt/c/Users/<votre-nom>/EVOLUTICS-did-hackathon/eidStack-CMU
sudo service postgresql start
npm run start:dev
```

Le serveur NestJS démarre sur **http://localhost:4000**. Il fournit l'API d'émission de credentials et l'agent DIDComm sur le port 3021.

> **Note :** Si eidStack-CMU était déjà en cours d'exécution avant le lancement de `setup.sh` (qui modifie le seed et les `.env`), vous devez le redémarrer : `Ctrl+C` puis `npm run start:dev`.

**Terminal 3 (WSL) - Initialisation de l'agent SSI (une seule fois) :**

> **Important :** Attendez que le Terminal 2 affiche `Server listening on 0.0.0.0:4000` avant de lancer ce script.

```bash
wsl
cd /mnt/c/Users/<votre-nom>/EVOLUTICS-did-hackathon
./setup-agent.sh
```

**Ce script effectue :**

- Nettoyage de l'ancien wallet (si existe)
- Initialisation de l'agent SSI avec le DID enregistré sur BCovrin
- Création des schémas (FarmerIdentityCredential, CottonSaleReceiptCredential)
- Création des Credential Definitions (nécessaires pour émettre des credentials signés)

> **Note :** Ce script ne s'exécute qu'une seule fois. Les schémas et CredDefs sont persistés sur le ledger BCovrin.

### Étape 6 : Configurer la connexion USB (à chaque reconnexion)

```powershell
# Dans PowerShell (Windows)
adb reverse tcp:4000 tcp:4000
adb reverse tcp:3021 tcp:3021
```

**Pourquoi ?** `adb reverse` redirige le `localhost` du téléphone vers le `localhost` du PC. Sans ça, l'application mobile ne peut pas atteindre le serveur.

> **Important :** Cette commande doit être relancée à chaque fois que le téléphone est débranché/rebranché.

### Étape 7 : Accéder à l'application

Ouvrez votre navigateur : **http://localhost:3002**

**Identifiants de test :**

- **NPI** : `1234567890123456`
- **OTP** : `111111`

**Flux d'authentification :**

1. Cliquez sur **"Accéder"** sur la page d'accueil (carte "Espace collecteurs & coopératives")
2. Cliquez sur **"Se connecter avec eSignet"**
3. Entrez le NPI puis l'OTP de test
4. Vous êtes redirigé vers le dashboard agriculteur

> **Note :** La page d'accueil propose aussi le téléchargement de l'application mobile idsWallet (carte "Télécharger IDS Wallet").

---

## Utilisation

### Enregistrer une vente et émettre un credential

1. Sur le dashboard CottonPay, remplissez le formulaire :
   - **Poids de coton** (kg)
   - **Prix unitaire** (FCFA/kg)
2. Cliquez sur **"Enregistrer la vente"**
3. Le système :
   - Calcule le montant total
   - Simule le paiement Mobile Money
   - Émet un credential vérifiable via eidStack-CMU
   - Génère un QR code contenant l'invitation DIDComm
4. Un QR code s'affiche sur l'écran

### Recevoir le credential sur le téléphone

1. Ouvrez l'application **idsWallet** sur votre téléphone Android
2. Appuyez sur **"Scan QR"**
3. Scannez le QR code affiché sur l'écran du PC
4. L'application affiche les détails du credential (type, émetteur, attributs)
5. Appuyez sur **"Accept"** pour stocker le credential dans votre wallet
6. Le credential est maintenant stocké de manière sécurisée dans l'application

### Partager via WhatsApp

Sur la page du QR code, cliquez sur **"Envoyer par WhatsApp"**. Le système :

- Génère une image PNG du QR code avec le titre CottonPay
- Utilise le Web Share API du navigateur pour envoyer l'image directement via WhatsApp
- En fallback (PC), télécharge l'image et ouvre WhatsApp avec le message texte

---

## Flux Technique

### Flux d'authentification OIDC

```
Utilisateur → CottonPay (localhost:3002)
    ↓ GET /auth/login
Génération PKCE (code_verifier, code_challenge)
    ↓ Redirection
eSignet UI (localhost:3000)
    ↓ NPI + OTP
Mock Identity System (localhost:8082) valide l'identité
    ↓ Code d'autorisation
CottonPay ← callback avec code
    ↓ POST /oauth/v2/token (avec client_assertion JWT signé)
eSignet retourne access_token + id_token
    ↓ GET /oidc/userinfo
Récupération des claims utilisateur → Session → Dashboard
```

### Flux d'émission de credential

```
CottonPay → POST http://localhost:4000/issuance/offer
    ↓ Création invitation Out-of-Band (OOB)
eidStack-CMU → Génère invitation + Short URL + QR code
    ↓ Réponse avec shortUrl et invitationQr

Téléphone scanne le QR code
    ↓ Contient : http://localhost:4000/short-url/s/<code>
idsWallet → fetch(shortUrl) avec redirect:follow
    ↓ Résolution du Short URL → URL complète avec ?oob=<base64>
idsWallet → agent.oob.receiveInvitationFromUrl(fullUrl)
    ↓ Connexion DIDComm établie
Agent (port 3021) ↔ idsWallet
    ↓ OfferReceived → acceptOffer → CredentialReceived → acceptCredential → Done
Credential stocké dans le wallet avec tous ses attributs
```

### Flux de vérification (Proof Request)

```
Vérificateur → POST http://localhost:4000/verification/request
    ↓ Création proof request
idsWallet reçoit la requête
    ↓ Sélection du credential approprié
idsWallet → Présentation cryptographique (Zero-Knowledge Proof)
    ↓ Vérification par l'agent
Résultat : Vérifié ✅ ou Rejeté ❌
```

---

## Configuration des fichiers d'environnement

> **Note :** Le script `setup.sh` génère automatiquement ces fichiers. Cette section est fournie à titre de référence pour une configuration manuelle.

### eidStack-CMU/.env

```env
DATABASE_URL="postgresql://postgres:<mot_de_passe>@localhost:5432/ids-db?schema=public"
AGENT_PUBLIC_URL="http://localhost:3021"
AGENT_PORT=3021
BCOVRIN_TESTNET_URL="http://test.bcovrin.vonx.io/register"
INDY_NETWORK_NAMESPACE="bcovrin:test"
ISSUER_LABEL="CottonPay-Issuer"
CREDENTIAL_PROTOCOL_VERSION="v2"
API_BASE_URL="http://localhost:4000"
```

| Variable                      | Description                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `DATABASE_URL`                | URL de connexion PostgreSQL. Le mot de passe est celui de votre utilisateur PostgreSQL |
| `AGENT_PUBLIC_URL`            | URL publique de l'agent DIDComm (localhost via USB)                                    |
| `AGENT_PORT`                  | Port de l'agent DIDComm (par défaut 3021)                                              |
| `BCOVRIN_TESTNET_URL`         | URL de l'API BCovrin Testnet pour l'enregistrement des DIDs                            |
| `INDY_NETWORK_NAMESPACE`      | Espace de noms du réseau Indy (bcovrin:test pour le testnet)                           |
| `ISSUER_LABEL`                | Nom de l'émetteur affiché dans les credentials                                         |
| `CREDENTIAL_PROTOCOL_VERSION` | Version du protocole (v2 recommandé)                                                   |
| `API_BASE_URL`                | URL de l'API eidStack. Utilisée pour générer les Short URLs dans les QR codes          |

### eidStack-CMU/.env.development

Même contenu que `.env`. Les deux fichiers doivent être synchronisés car NestJS charge `.env` via `dotenv.config()` et `setup-agent.sh` charge `.env.development`.

### CottonPay/.env

```env
NODE_ENV=development
APP_PORT=3002
APP_URL=http://localhost:3002
FRONTEND_URL=http://localhost:3002
ESIGNET_BASE_URL=http://localhost:8088/v1/esignet
ESIGNET_AUTHORIZE_URL=http://localhost:3000/authorize
ESIGNET_TOKEN_URL=http://localhost:8088/v1/esignet/oauth/v2/token
ESIGNET_USERINFO_URL=http://localhost:8088/v1/esignet/oidc/userinfo
ESIGNET_JWKS_URL=http://localhost:8088/v1/esignet/oauth/.well-known/jwks.json
OIDC_ISSUER=http://localhost:8088/v1/esignet
OIDC_CLIENT_ID=cottonpay-client
OIDC_REDIRECT_URI=http://localhost:3002/auth/callback
OIDC_SCOPES=openid profile phone
CLIENT_ID=cottonpay-client
CLIENT_REDIRECT_URI=http://localhost:3002/auth/callback
CLIENT_PRIVATE_KEY_PATH=./backend/keys/private-key.pem
CLIENT_PUBLIC_KEY_PATH=./backend/keys/public-key.pem
SESSION_SECRET=change-this-to-a-random-secret-in-production
ACR_VALUES=mosip:idp:acr:generated-code
EIDSTACK_URL=http://localhost:4000
MOCK_IDENTITY_URL=http://localhost:8082
LOG_LEVEL=debug
```

### e-IDapp_CMU/.env

```env
MEDIATOR_URL=https://polyid-mediator.onrender.com/createMediatorInvitation
GENESIS_URL=https://test.bcovrin.vonx.io/genesis
```

| Variable       | Description                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------- |
| `MEDIATOR_URL` | URL du service de médiation DIDComm. Permet la communication entre l'agent mobile et le serveur |
| `GENESIS_URL`  | URL du fichier genesis du réseau BCovrin. Nécessaire pour se connecter au ledger Indy           |

---

## Troubleshooting

### Erreur : "Failed to accept invitation" / "Network request failed"

**Cause :** L'application mobile ne peut pas atteindre le serveur. Cela peut être dû à :

- `adb reverse` non configuré ou expiré (téléphone débranché/rebranché)
- Le trafic HTTP est bloqué par Android (`usesCleartextTraffic` non activé)

**Solution :**

```bash
# Vérifier la connexion USB
adb devices

# Configurer les ports
adb reverse tcp:4000 tcp:4000
adb reverse tcp:3021 tcp:3021

# Vérifier les ports actifs
adb reverse --list
```

### Erreur : "InvitationUrl is invalid. It needs to contain oob, c_i or d_m"

**Cause :** Le Short URL dans le QR code n'a pas pu être résolu vers l'URL complète contenant le paramètre `?oob=`.

**Solution :**

1. Vérifiez que le serveur eidStack-CMU tourne sur le port 4000
2. Vérifiez que `API_BASE_URL` dans `.env` pointe vers la bonne adresse
3. Redémarrez le serveur : `Ctrl+C` puis `npm run start:dev`

### Erreur : "Permission denied: DID lacks ENDORSER role"

**Cause :** Le DID n'a pas le rôle ENDORSER sur BCovrin, ou le serveur utilise un ancien DID en mémoire.

**Solution :**

1. Vérifiez que le DID est bien enregistré avec le rôle **ENDORSER** sur http://test.bcovrin.vonx.io/
2. Redémarrez le serveur eidStack (`Ctrl+C` puis `npm run start:dev`)
3. Relancez `./setup-agent.sh`

### Erreur : "Unexpected token \r in JSON"

**Cause :** Les scripts bash ont des fins de ligne Windows (CRLF) au lieu de Unix (LF).

**Solution :**

```bash
sed -i 's/\r$//' setup-agent.sh install-eidstack.sh setup.sh
```

### Erreur : "Agent initialized" mais "hasIssuerDid: false"

**Cause :** L'agent a été initialisé en mémoire lors d'un précédent appel mais le DID n'a pas été enregistré (erreur réseau, mediator indisponible, etc.).

**Solution :**

1. Arrêtez le serveur (`Ctrl+C`)
2. Relancez `npm run start:dev` (réinitialise la mémoire)
3. Relancez `./setup-agent.sh`

### Le credential reçu affiche "0 Attributes" ou "Processing"

**Cause :** Le cycle d'échange de credential n'est pas terminé. Cela peut être dû à une connexion réseau instable entre le téléphone et le serveur.

**Solution :**

1. Vérifiez que les ports `adb reverse` sont actifs
2. Supprimez les données de l'app : `adb shell pm clear com.idsWallet`
3. Rouvrez l'app, re-scannez le QR code

---

## Logs

```bash
# Backend CottonPay (Windows)
tail -f CottonPay/logs/backend.log

# eSignet (Windows)
docker compose -f esignet-master/docker-compose/docker-compose.yml logs -f

# eidStack-CMU (WSL)
# Les logs s'affichent directement dans le terminal npm run start:dev

# Application mobile (Android - via USB)
adb logcat -s ReactNativeJS:V
```

## Arrêt des services

### Arrêter CottonPay + eSignet (Windows)

```bash
# Arrêter le backend CottonPay
kill $(cat .cottonpay.pid)
rm .cottonpay.pid

# Arrêter eSignet
cd esignet-master/docker-compose
docker compose down
```

### Arrêter eidStack-CMU (WSL)

Dans le terminal WSL où tourne le serveur, tapez `Ctrl+C`

---

## Sécurité

### Authentification OIDC

- **PKCE (Proof Key for Code Exchange)** : Protection contre les attaques d'interception de code
- **private_key_jwt** : Authentification du client via JWT signé avec clé privée RSA
- **State parameter** : Protection contre les attaques CSRF
- **Nonce** : Protection contre les attaques de replay

### Credentials Vérifiables

- **AnonCreds** : Format de credential anonyme basé sur la cryptographie à connaissance zéro (ZKP)
- **DIDComm v2** : Protocole de communication sécurisé entre agents
- **BCovrin Testnet** : Registre blockchain public pour les DIDs et schémas

### Clés RSA

- **Algorithme** : RSA 2048 bits
- **Format** : PEM (PKCS#8 pour la clé privée, SPKI pour la clé publique)
- **Stockage** : `backend/keys/` (ne pas commiter dans Git)

---

## Technologies utilisées

| Composant          | Technologies                                           |
| ------------------ | ------------------------------------------------------ |
| CottonPay Frontend | HTML5, CSS3, JavaScript (Vanilla)                      |
| CottonPay Backend  | Node.js, Express.js, express-session, jose             |
| eidStack-CMU       | NestJS, Credo-ts (Aries Framework), Prisma, PostgreSQL |
| e-IDapp_CMU        | React Native, TypeScript, Credo-ts, Redux Toolkit      |
| Authentification   | eSignet (MOSIP), OIDC, PKCE, private_key_jwt           |
| Credentials        | AnonCreds, Indy VDR, BCovrin Testnet                   |
| Infrastructure     | Docker, WSL 2, ADB                                     |

---

## Équipe

**Team EVOLUTICS - Université d'Abomey-Calavi (UAC)**
