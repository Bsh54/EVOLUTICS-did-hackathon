# CottonPay - Système d'Identité Numérique et de Paiement pour Producteurs de Coton

CottonPay est une plateforme complète d'identité numérique et de paiement destinée aux producteurs de coton au Bénin. Le système combine l'authentification biométrique via eSignet (MOSIP) et l'émission de credentials vérifiables via eidStack-CMU (Self-Sovereign Identity).

## Vue d'ensemble du système

CottonPay permet aux agriculteurs de :
1. **S'authentifier** avec leur identité biométrique (NPI + empreinte digitale ou OTP)
2. **Enregistrer des ventes** de coton avec paiement instantané via Mobile Money
3. **Recevoir des credentials vérifiables** (reçus de vente) dans leur wallet mobile
4. **Accéder au crédit bancaire** grâce à l'historique vérifiable de leurs transactions

## Architecture du système

Le système est composé de trois modules principaux :

```
CottonPay/
├── CottonPay/              # Application principale (Frontend + Backend Node.js)
│   ├── frontend/           # Interface utilisateur (HTML/CSS/JS)
│   ├── backend/            # API REST Node.js + Express
│   └── scripts/            # Scripts d'enregistrement OIDC et création utilisateurs
│
├── esignet-master/         # Infrastructure d'authentification (Docker)
│   └── docker-compose/     # PostgreSQL, Redis, eSignet, Mock Identity System
│
└── eidStack-CMU/           # Service d'émission de credentials (NestJS + Credo-TS)
    ├── src/                # API REST pour émission de Verifiable Credentials
    └── prisma/             # Base de données PostgreSQL
```

### Flux de données

1. **Authentification** : L'utilisateur s'authentifie via eSignet (OIDC) avec son NPI et OTP/empreinte
2. **Enregistrement vente** : Le backend CottonPay enregistre la vente et déclenche le paiement Mobile Money
3. **Émission credential** : eidStack-CMU émet un credential vérifiable (reçu de vente)
4. **Réception** : L'agriculteur reçoit le credential dans son wallet mobile (QR code)

## Prérequis

### Environnement Windows + WSL Ubuntu

- **Windows 10/11** avec WSL 2 activé
- **Docker Desktop** pour Windows (avec intégration WSL 2)
- **WSL Ubuntu 24.04 LTS** ou supérieur
- **Node.js v18.17.1** (installé via nvm dans WSL)
- **PostgreSQL 14+** (dans WSL pour eidStack-CMU)
- **Git Bash** ou terminal compatible bash

### Vérification des prérequis

```bash
# Dans WSL Ubuntu
node -v          # v18.17.1
npm -v           # 9.6.7+
psql --version   # PostgreSQL 14+
docker --version # Docker 20.10+
```

## Installation complète

### Étape 1 : Installer eidStack-CMU (WSL Ubuntu)

```bash
cd eidStack-CMU

# Installation automatique (Node.js, PostgreSQL, dépendances)
chmod +x install.sh
./install.sh
```

Ce script installe :
- Node.js v18.17.1 via nvm
- PostgreSQL et création de la base de données `ids-db`
- Dépendances npm avec `--legacy-peer-deps`
- Configuration du fichier `.env`
- Migrations Prisma

**Durée : 5-10 minutes**

### Étape 2 : Démarrer eidStack-CMU

```bash
# Terminal 1 : Démarrer le serveur eidStack-CMU
cd eidStack-CMU
npm run start:dev
```

Le serveur démarre sur :
- API REST : http://localhost:4000
- Documentation : http://localhost:4000/api/docs
- Agent Credo : http://localhost:3021

### Étape 3 : Initialiser l'agent SSI

```bash
# Terminal 2 : Initialiser l'agent et créer les schémas
cd eidStack-CMU
chmod +x init-agent.sh
./init-agent.sh
```

Ce script :
- Enregistre un DID sur BCovrin testnet
- Crée le schéma `FarmerIdentityCredential`
- Crée le schéma `CottonSaleReceiptCredential`
- Crée les credential definitions

**Durée : 1-2 minutes**

**Note importante** : Si vous obtenez l'erreur `UnauthorizedClientRequest`, vous devez promouvoir le DID manuellement :
1. Allez sur https://test.bcovrin.vonx.io/
2. Entrez le seed : `00000000000000000000000CottonPay`
3. Sélectionnez le rôle : **ENDORSER**
4. Cliquez sur "Register DID"
5. Relancez `./init-agent.sh`

### Étape 4 : Démarrer eSignet (Docker)

```bash
# Dans un terminal
cd esignet-master/docker-compose
docker compose up -d
```

Services démarrés :
- PostgreSQL : localhost:5455
- Redis : localhost:6379
- Mock Identity System : localhost:8082
- eSignet Backend : localhost:8088
- eSignet UI : localhost:3000

**Attendre 60 secondes** pour que tous les services soient prêts.

### Étape 5 : Installer CottonPay

```bash
# À la racine du projet
chmod +x install.sh
./install.sh
```

Ce script :
- Installe les dépendances npm de CottonPay
- Génère les clés RSA pour l'authentification OIDC
- Enregistre le client OIDC auprès d'eSignet
- Crée un utilisateur de test (NPI: 1234567890123456, OTP: 111111)

**Durée : 1-2 minutes**

## Démarrage quotidien

Après la première installation, utilisez les scripts de démarrage simplifiés :

```bash
# À la racine du projet
./start-all.sh
```

Ce script démarre automatiquement :
1. eSignet (Docker)
2. eidStack-CMU (WSL)
3. CottonPay Backend (WSL)

```bash
# Arrêter tous les services
./stop-all.sh
```

## Utilisation

### Accéder à l'application

Ouvrez votre navigateur : http://localhost:3002

### Flux d'authentification

1. Cliquez sur **"Accéder"** sur la page d'accueil
2. Cliquez sur **"Se connecter avec eSignet"**
3. Entrez les identifiants de test :
   - **NPI** : `1234567890123456`
   - **OTP** : `111111`
4. Vous êtes redirigé vers le dashboard

### Enregistrer une vente

1. Sur le dashboard, remplissez le formulaire :
   - Poids de coton (kg)
   - Prix unitaire (FCFA/kg)
2. Cliquez sur **"Enregistrer la vente"**
3. Le système :
   - Calcule le montant total
   - Simule le paiement Mobile Money
   - Émet un credential vérifiable
   - Affiche le QR code du credential

### Scanner le credential

L'agriculteur peut scanner le QR code avec un wallet compatible (ex: e-IDapp_CMU) pour recevoir le credential vérifiable dans son téléphone.

## Ports utilisés

| Port | Service | Description |
|------|---------|-------------|
| 3000 | eSignet UI | Interface d'authentification |
| 3002 | CottonPay | Application principale (frontend + backend) |
| 3021 | Agent Credo | Transport DIDComm pour credentials |
| 4000 | eidStack-CMU | API d'émission de credentials |
| 5432 | PostgreSQL (WSL) | Base de données eidStack-CMU |
| 5455 | PostgreSQL (Docker) | Base de données eSignet |
| 6379 | Redis | Cache eSignet |
| 8082 | Mock Identity | Système d'identité de test |
| 8088 | eSignet Backend | API OIDC |

## Structure des credentials

### FarmerIdentityCredential

Credential d'identité de l'agriculteur émis après authentification eSignet :

- `farmer_npi` : Numéro Personnel d'Identification
- `farmer_name` : Nom complet
- `phone_number` : Numéro de téléphone
- `region` : Région
- `commune` : Commune
- `verified_by` : Méthode de vérification (eSignet)
- `verification_date` : Date de vérification
- `verification_method` : fingerprint ou OTP

### CottonSaleReceiptCredential

Credential de reçu de vente émis après chaque transaction :

- `farmer_npi` : NPI de l'agriculteur
- `sale_date` : Date de vente
- `sale_time` : Heure de vente
- `cotton_weight_kg` : Poids de coton (kg)
- `unit_price_fcfa` : Prix unitaire (FCFA/kg)
- `total_amount_fcfa` : Montant total (FCFA)
- `payment_reference` : Référence de paiement Mobile Money
- `payment_status` : Statut du paiement
- `payment_method` : Méthode de paiement (MTN Mobile Money)
- `transaction_id` : ID de transaction
- `collection_point` : Point de collecte

## Documentation détaillée

- **CottonPay** : Voir `CottonPay/README.md`
- **eidStack-CMU** : Voir `eidStack-CMU/README.md`
- **eSignet** : Voir `esignet-master/docker-compose/README.md`

## Dépannage

### eSignet ne démarre pas

```bash
# Vérifier les logs
docker logs docker-compose-esignet-1

# Redémarrer les conteneurs
cd esignet-master/docker-compose
docker compose down
docker compose up -d
```

### eidStack-CMU : Erreur "Agent not initialized"

```bash
# Réinitialiser l'agent
cd eidStack-CMU
./init-agent.sh
```

### CottonPay : Erreur "invalid_client"

```bash
# Réenregistrer le client OIDC
cd CottonPay
npm run register-client
```

### Voir les logs en temps réel

```bash
# eidStack-CMU
tail -f /tmp/eidstack.log

# CottonPay Backend
tail -f /tmp/cottonpay-backend.log

# eSignet
docker logs -f docker-compose-esignet-1
```

## Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Backend CottonPay** : Node.js 18, Express.js, Jose (JWT)
- **Backend eidStack-CMU** : NestJS 10, Credo-TS 0.5, Prisma ORM
- **Authentification** : eSignet (MOSIP), OIDC with PKCE, private_key_jwt
- **SSI** : Hyperledger Aries, AnonCreds, Indy VDR
- **Base de données** : PostgreSQL 14+
- **Infrastructure** : Docker, Docker Compose

## Équipe

**Team EVOLUTICS - Université d'Abomey-Calavi (UAC)**

## Licence

MIT License

---

**Pour plus d'informations, consultez le document** : `COTTONPAY_USER_STORY.md`
