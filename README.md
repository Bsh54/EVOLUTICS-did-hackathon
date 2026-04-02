# CottonPay - Système d'Identité Numérique et de Paiement pour Producteurs de Coton

CottonPay est une plateforme complète d'identité numérique et de paiement destinée aux producteurs de coton au Bénin. Le système combine l'authentification biométrique via eSignet (MOSIP) et l'émission de credentials vérifiables via eidStack-CMU.

## Architecture du système

Le système est composé de trois modules :

1. **CottonPay** - Application web (frontend + backend Node.js)
2. **eSignet** - Authentification OIDC avec biométrie (Docker)
3. **eidStack-CMU** - Émission de Verifiable Credentials (WSL Ubuntu)

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

**NB :** Tous les chemins relatifs supposent que vous êtes à la racine du projet CottonPay.

### PARTIE 1 : CottonPay + eSignet (Windows)

#### Étape 1 : Cloner le projet

```bash
git clone <url-du-projet>
cd CottonPay
```

#### Étape 2 : Installation (une seule fois)

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

**Durée : 2-3 minutes**

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

**Durée : 4-6 minutes**

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

**NB :** Si vous avez cloné le projet dans Windows (par exemple `C:\Users\shadr\Downloads\CottonPay`), le chemin depuis WSL sera `/mnt/c/Users/shadr/Downloads/CottonPay`

#### Étape 1 : Installation (une seule fois)

Ouvrez un terminal WSL :

```bash
wsl
cd /mnt/c/Users/<votre-nom-utilisateur>/Downloads/CottonPay
./install-eidstack.sh
```

**Ce script effectue :**
- Installation automatique de Node.js v18.17.1 via nvm
- Installation de PostgreSQL et création de la base de données
- Installation des outils de compilation
- Installation des dépendances npm avec --legacy-peer-deps
- Configuration de Prisma et migrations

**Durée : 5-10 minutes**

#### Étape 2 : Démarrage

Dans un terminal WSL :

```bash
wsl
cd /mnt/c/Users/<votre-nom-utilisateur>/Downloads/CottonPay/eidStack-CMU

# Démarrer PostgreSQL si nécessaire
sudo service postgresql start

# Démarrer le serveur
npm run start:dev
```

Le serveur démarre sur **http://localhost:4000**

#### Étape 3 : Initialisation de l'agent SSI (une seule fois)

Dans un **autre terminal WSL** :

```bash
wsl
cd /mnt/c/Users/<votre-nom-utilisateur>/Downloads/CottonPay
./setup-agent.sh
```

**Ce script effectue :**
- Initialisation de l'agent SSI avec DID sur BCovrin
- Création des schémas (FarmerIdentityCredential, CottonSaleReceiptCredential)
- Création des Credential Definitions

**Durée : 1-2 minutes**

**Note :** Ce script ne s'exécute qu'une seule fois après l'installation. L'agent se reconnecte automatiquement aux démarrages suivants.

---

## Utilisation

### Enregistrer une vente

1. Sur le dashboard, remplissez le formulaire :
   - Poids de coton (kg)
   - Prix unitaire (FCFA/kg)
2. Cliquez sur **"Enregistrer la vente"**
3. Le système calcule le montant, simule le paiement Mobile Money et émet un credential vérifiable

## Structure du projet

```
CottonPay/
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
└── eidStack-CMU/           # Service d'émission de credentials (WSL)
    ├── src/                # API REST NestJS
    └── prisma/             # Base de données PostgreSQL
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

## Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript
- **Backend CottonPay** : Node.js 18, Express.js, Jose (JWT)
- **Backend eidStack-CMU** : NestJS 10, Credo-TS 0.5, Prisma ORM
- **Authentification** : eSignet (MOSIP), OIDC with PKCE, private_key_jwt
- **SSI** : Hyperledger Aries, AnonCreds, Indy VDR
- **Base de données** : PostgreSQL
- **Infrastructure** : Docker, Docker Compose, WSL 2

## Équipe

**Team EVOLUTICS - Université d'Abomey-Calavi (UAC)**

## Licence

MIT License

## Utilisation

### Accéder à l'application

Ouvrez votre navigateur : **http://localhost:3002**

### Identifiants de test

- **NPI** : `1234567890123456`
- **OTP** : `111111`

### Flux d'authentification

1. Cliquez sur **"Accéder"** sur la page d'accueil
2. Cliquez sur **"Se connecter avec eSignet"**
3. Entrez les identifiants de test
4. Vous êtes redirigé vers le dashboard

### Enregistrer une vente

1. Sur le dashboard, remplissez le formulaire :
   - Poids de coton (kg)
   - Prix unitaire (FCFA/kg)
2. Cliquez sur **"Enregistrer la vente"**
3. Le système calcule le montant, simule le paiement Mobile Money et émet un credential vérifiable

## Structure du projet

```
CottonPay/
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
└── eidStack-CMU/           # Service d'émission de credentials (WSL)
    ├── src/                # API REST NestJS
    └── prisma/             # Base de données PostgreSQL
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

## Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript
- **Backend CottonPay** : Node.js 18, Express.js, Jose (JWT)
- **Backend eidStack-CMU** : NestJS 10, Credo-TS 0.5, Prisma ORM
- **Authentification** : eSignet (MOSIP), OIDC with PKCE, private_key_jwt
- **SSI** : Hyperledger Aries, AnonCreds, Indy VDR
- **Base de données** : PostgreSQL
- **Infrastructure** : Docker, Docker Compose, WSL 2

## Équipe

**Team EVOLUTICS - Université d'Abomey-Calavi (UAC)**

## Licence

MIT License
