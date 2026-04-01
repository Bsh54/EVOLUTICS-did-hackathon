# CottonPay - Système d'Identité Numérique et de Paiement pour Producteurs de Coton

CottonPay est une plateforme complète d'identité numérique et de paiement destinée aux producteurs de coton au Bénin. Le système combine l'authentification biométrique via eSignet (MOSIP) et l'émission de credentials vérifiables.

## Installation

### Prérequis

- **Docker Desktop** (version 20.10+)
- **Node.js** (version 18+)
- **npm** (version 9+)
- **curl**
- **Git Bash** ou terminal compatible bash

### Étape 1 : Cloner le projet

```bash
git clone <url-du-projet>
cd CottonPay
```

### Étape 2 : Installation (première fois uniquement)

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

### Étape 3 : Démarrage

```bash
./start.sh
```

**Ce script effectue :**
- Vérification de l'installation
- Démarrage des conteneurs Docker eSignet (PostgreSQL, Redis, Mock Identity, eSignet Backend, eSignet UI)
- Attente du démarrage complet d'eSignet (2-4 minutes)
- Enregistrement du client OIDC avec génération des clés RSA
- Création de l'utilisateur de test
- Démarrage du backend CottonPay

**Durée : 4-6 minutes**

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

## Architecture du système

```
CottonPay/
├── install.sh              # Script d'installation (1ère fois)
├── start.sh                # Script de démarrage
├── logo.png                # Logo CottonPay
├── CottonPay/              # Application principale
│   ├── frontend/           # Interface utilisateur (HTML/CSS/JS)
│   ├── backend/            # API REST Node.js + Express
│   └── scripts/            # Scripts d'enregistrement OIDC
└── esignet-master/         # Infrastructure d'authentification (Docker)
    └── docker-compose/     # PostgreSQL, Redis, eSignet, Mock Identity
```

## Services disponibles

| Port | Service | Description |
|------|---------|-------------|
| 3000 | eSignet UI | Interface d'authentification |
| 3002 | CottonPay | Application principale |
| 5455 | PostgreSQL | Base de données eSignet |
| 6379 | Redis | Cache eSignet |
| 8082 | Mock Identity | Système d'identité de test |
| 8088 | eSignet Backend | API OIDC |

## Logs

```bash
# Backend CottonPay
tail -f CottonPay/logs/backend.log

# eSignet
docker compose -f esignet-master/docker-compose/docker-compose.yml logs -f
```

## Arrêt des services

```bash
# Arrêter le backend CottonPay
kill $(cat .cottonpay.pid)
rm .cottonpay.pid

# Arrêter eSignet
cd esignet-master/docker-compose
docker compose down
```

## Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript
- **Backend** : Node.js 18, Express.js, Jose (JWT)
- **Authentification** : eSignet (MOSIP), OIDC with PKCE, private_key_jwt
- **Base de données** : PostgreSQL
- **Infrastructure** : Docker, Docker Compose

## Équipe

**Team EVOLUTICS - Université d'Abomey-Calavi (UAC)**

## Licence

MIT License
