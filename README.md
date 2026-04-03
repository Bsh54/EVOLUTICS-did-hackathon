# CottonPay - Système d'Identité Numérique et de Paiement pour Producteurs de Coton

<p align="center">
  <img src="logo.png" alt="CottonPay Logo" width="200"/>
</p>

CottonPay est une plateforme complète d'identité numérique et de paiement destinée aux producteurs de coton au Bénin. Le système combine l'authentification par OTP via eSignet (MOSIP) et l'émission de credentials vérifiables via eidStack-CMU.

## 📊 Présentation du Projet

**<a href="https://docs.google.com/presentation/d/17TTFGQCAaX6_SbGGxSC2g9J1N__kM9gY/edit?usp=sharing&ouid=101533659653011151923&rtpof=true&sd=true" target="_blank">Télécharger la présentation PowerPoint</a>**




## Prérequis

### Pour Windows

- **Windows 10/11** avec WSL 2 activé
- **Docker Desktop** (version 20.10+)
- **Git Bash** ou terminal compatible bash

### Installation de WSL 2

Si WSL n'est pas encore installé, ouvrez PowerShell en tant qu'administrateur et tapez :

```powershell
wsl --install
```

Redémarrez votre PC, puis installez Ubuntu :

```powershell
wsl --install -d Ubuntu-24.04
```

Créez un nom d'utilisateur et mot de passe pour Ubuntu.

## Installation et Démarrage

**NB :** Tous les chemins relatifs supposent que vous êtes à la racine du projet EVOLUTICS-did-hackathon.

### PARTIE 1 

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

Dans Git Bash ou terminal Windows :

```bash
./start.sh
```

**Ce script effectue :**
- Démarrage des conteneurs Docker eSignet
- Attente du démarrage complet d'eSignet (2-4 minutes)
- Enregistrement du client OIDC avec génération des clés RSA
- Création de l'utilisateur de test
- Démarrage du backend CottonPay



#### Étape 4 : Accéder à l'application

Ouvrez votre navigateur : **http://localhost:3002**

**Identifiants de test :**
- **NPI** : `1234567890123456`
- **OTP** : `111111`

**Flux d'authentification :**
1. Cliquez sur **"Accéder"** sur la page d'accueil
2. Cliquez sur **"Se connecter avec eSignet"**
3. Entrez les identifiants de test
4. Vous êtes redirigé vers le dashboard

---

### PARTIE 2 : eidStack-CMU (WSL Ubuntu)

**NB :** Si vous avez cloné le projet dans Windows (par exemple `C:\Users\EVOLUTICS-did-hackathon`), le chemin depuis WSL sera `/mnt/c/Users/EVOLUTICS-did-hackathon`

#### Étape 1 : Installation 

Ouvrez un terminal WSL :

```bash
wsl
cd /mnt/c/Users/EVOLUTICS-did-hackathon
./install-eidstack.sh
```

**Ce script effectue :**
- Installation automatique de Node.js v18.17.1 via nvm
- Installation de PostgreSQL et création de la base de données
- Installation des outils de compilation
- Installation des dépendances npm avec --legacy-peer-deps
- Configuration de Prisma et migrations


#### Étape 2 : Démarrage

Dans un terminal WSL :

```bash
wsl
cd /mnt/c/Users/EVOLUTICS-did-hackathon/eidStack-CMU

# Démarrer PostgreSQL si nécessaire
sudo service postgresql start

# Démarrer le serveur
npm run start:dev
```

Le serveur démarre sur **http://localhost:4000**

#### Étape 2b : Configuration de ngrok (obligatoire)

**ngrok est nécessaire pour exposer l'agent DIDComm (port 3021) sur internet afin de recevoir les credentials.**

1. **Démarrer ngrok** (dans Windows ou WSL) :
```bash
ngrok http 3021
```

2. **Copier l'URL publique** générée (exemple : `https://xxxx-xxxx.ngrok-free.app`)

3. **Mettre à jour le fichier .env** dans `eidStack-CMU` :
```bash
AGENT_PUBLIC_URL="https://votre-url-ngrok.ngrok-free.app"
```

4. **Redémarrer le serveur eidStack** pour prendre en compte la nouvelle URL

**Note :** Si vous avez un compte ngrok avec domaine fixe, l'URL ne changera pas à chaque démarrage.

#### Étape 3 : Initialisation de l'agent SSI 

**IMPORTANT : Avant d'exécuter ce script, vous devez enregistrer manuellement le DID sur BCovrin.**

**Étape 3a : Enregistrement du DID sur BCovrin**

1. Allez sur : **http://test.bcovrin.vonx.io/**
2. Remplissez le formulaire d'enregistrement :
   - **Seed** : `CottonPayBenin2024Issuer00000000`
   - **Alias** : `CottonPay-Issuer`
   - **Role** : Sélectionnez **ENDORSER** (obligatoire pour créer des schémas)
3. Cliquez sur **"Register DID"**
4. Notez le DID retourné (exemple : `NqLAnmLCKE1VSMA2JphDj6`)

**Étape 3b : Initialisation de l'agent**

Dans un **autre terminal WSL** :

```bash
wsl
cd /mnt/c/Users/EVOLUTICS-did-hackathon
./setup-agent.sh
```

Le script vous demandera confirmation que vous avez bien enregistré le DID sur BCovrin.

**Ce script effectue :**
- Initialisation de l'agent SSI avec le DID enregistré
- Création des schémas (FarmerIdentityCredential, CottonSaleReceiptCredential)
- Création des Credential Definitions



---

## PARTIE 3 : e-IDapp_CMU (Portefeuille Mobile)

**e-IDapp_CMU** est l'application mobile qui permet aux producteurs de recevoir et stocker leurs credentials vérifiables sur leur smartphone.

### Prérequis

| Logiciel | Version minimale | Notes |
|----------|------------------|-------|
| **Node.js** | >= 20.x | Version LTS recommandée |
| **npm** ou **Yarn** | npm 9+ / Yarn 1.22+ | Gestionnaire de paquets |
| **React Native CLI** | Latest | `npm install -g @react-native-community/cli` |
| **Java JDK** | 17 | Requis pour les builds Android |
| **Android Studio** | Latest | Avec Android SDK, NDK, et émulateur |
| **Xcode** | 15+ | Builds iOS uniquement (macOS requis) |
| **CocoaPods** | Latest | Gestionnaire de dépendances iOS |
| **Ruby** | 2.7+ | Requis pour CocoaPods (Bundler) |

**Variables d'environnement importantes :**
- `ANDROID_HOME` : Chemin vers Android SDK
- `JAVA_HOME` : Chemin vers Java JDK 17

### Étape 1 : Installation

```bash
cd e-IDapp_CMU

# Installer les dépendances
npm install

# iOS uniquement - Installer CocoaPods
bundle install
cd ios && bundle exec pod install && cd ..
```

### Étape 2 : Configuration

Créer le fichier `.env` :

```bash
cp .env.sample .env
```

Éditer `.env` avec les valeurs suivantes :

```
GENESIS_URL=https://test.bcovrin.vonx.io/genesis
MEDIATOR_URL=https://your-mediator.example.com/createMediatorInvitation
```

### Étape 3 : Démarrage

**Démarrer Metro bundler :**

```bash
npm start
```

**Dans un autre terminal, lancer l'application :**

```bash
# Pour Android
npm run android

# Pour iOS
npm run ios
```

L'application démarre sur l'émulateur ou le device connecté.

### Étape 4 : Réception des credentials

**Flux complet de réception :**

1. **Sur CottonPay Web** : Après l'enregistrement d'une vente, un QR code est généré contenant l'invitation DIDComm
2. **Sur e-IDapp_CMU** : 
   - Ouvrir l'application mobile
   - Cliquer sur **"Scan QR"**
   - Scanner le QR code affiché sur CottonPay
3. **Traitement automatique** :
   - L'app décode l'invitation
   - Affiche un aperçu du credential (attributs, émetteur)
   - Deux options : **View Details** ou **Accept**
4. **Stockage sécurisé** :
   - Le credential est reçu via DIDComm
   - Stocké chiffré dans Hyperledger Aries Askar
   - Visible dans la liste des credentials

**Technologies utilisées :**
- **React Native 0.81.4** avec TypeScript
- **Credo-TS 0.5.17** (Hyperledger Aries)
- **Aries Askar** pour le stockage chiffré
- **AnonCreds** pour les credentials anonymes
- **Indy VDR** pour l'accès au ledger BCovrin

---

## Utilisation

### Enregistrer une vente

1. Sur le dashboard, remplissez le formulaire :
   - Poids de coton (kg)
   - Prix unitaire (FCFA/kg)
2. Cliquez sur **"Enregistrer la vente"**
3. Le système calcule le montant, simule le paiement Mobile Money et émet un credential vérifiable
4. Un QR code s'affiche contenant l'invitation DIDComm
5. Scannez ce QR code avec l'application mobile e-IDapp_CMU pour recevoir le credential

## Structure du projet

```
EVOLUTICS-did-hackathon/
├── install.sh              # Installation CottonPay + eSignet (Windows)
├── start.sh                # Démarrage CottonPay + eSignet (Windows)
├── install-eidstack.sh     # Installation eidStack-CMU (WSL)
├── setup-agent.sh          # Initialisation agent SSI (WSL, une fois)
├── logo.png                # Logo CottonPay
├── CottonPay/              # Application principale
│   ├── frontend/           # Interface utilisateur (HTML/CSS/JS)
│   ├── backend/            # API REST Node.js + Express
│   └── scripts/            # Scripts d'enregistrement OIDC
├── esignet-master/         # Infrastructure d'authentification (Docker)
│   └── docker-compose/     # PostgreSQL, Redis, eSignet, Mock Identity
├── eidStack-CMU/           # Service d'émission de credentials (WSL)
│   ├── src/                # API REST NestJS
│   └── prisma/             # Base de données PostgreSQL
└── e-IDapp_CMU/            # Application mobile portefeuille (Android/iOS)
    ├── src/                # Code source React Native
    ├── android/            # Projet Android natif
    └── ios/                # Projet iOS natif
```

## Services disponibles

| Port | Service | Description | Environnement |
|------|---------|-------------|---------------|
| 3000 | eSignet UI | Interface d'authentification | Docker (Windows) |
| 3002 | CottonPay | Application principale | Node.js (Windows) |
| 3021 | Agent DIDComm | Transport credentials | WSL Ubuntu |
| 4000 | eidStack-CMU | API émission credentials | WSL Ubuntu |
| 5432 | PostgreSQL (eidStack) | Base de données eidStack | WSL Ubuntu |
| 5455 | PostgreSQL (eSignet) | Base de données eSignet | Docker (Windows) |
| 6379 | Redis | Cache eSignet | Docker (Windows) |
| 8082 | Mock Identity | Système d'identité de test | Docker (Windows) |
| 8088 | eSignet Backend | API OIDC | Docker (Windows) |

## Logs

```bash
# Backend CottonPay (Windows)
tail -f CottonPay/logs/backend.log

# eSignet (Windows)
docker compose -f esignet-master/docker-compose/docker-compose.yml logs -f

# eidStack-CMU (WSL)
# Les logs s'affichent directement dans le terminal où tourne npm run start:dev
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


## Équipe

**Team EVOLUTICS - Université d'Abomey-Calavi (UAC)**