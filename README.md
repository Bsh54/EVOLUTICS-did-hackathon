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

#### Étape 0 : Correction des fins de ligne (obligatoire)

Avant l'installation, convertissez les fins de ligne des scripts bash :

Ouvrez un terminal WSL 

```bash
wsl
cd /mnt/c/Users/EVOLUTICS-did-hackathon
sed -i 's/\r$//' install-eidstack.sh
sed -i 's/\r$//' setup-agent.sh
```

**Note :** Cette étape est nécessaire car les scripts peuvent avoir des fins de ligne Windows (CRLF) qui causent des erreurs sur Linux/WSL.

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

#### Étape 3 : Initialisation de l'agent SSI 

**IMPORTANT : Avant d'exécuter ce script, vous devez enregistrer manuellement le DID sur BCovrin.**

**Étape 3a : Enregistrement du DID sur BCovrin**

1. Accédez à : **http://test.bcovrin.vonx.io/**
2. Remplissez le formulaire d'enregistrement :
   - **Seed** : Entrez un seed unique (exemple : `CottonPayBenin2024Issuer00000000`)
   - **Alias** : `CottonPay-Issuer`
   - **Role** : Sélectionnez **ENDORSER** (obligatoire)
3. Cliquez sur **"Register DID"**
4. Notez le **Seed** et le **DID** retournés

**Étape 3b : Mise à jour du script setup-agent.sh**

Modifiez la ligne 13 du fichier `setup-agent.sh` avec le seed obtenu :

```bash
SEED="<votre-seed-bcovrin>"
```

**Étape 3c : Redémarrage du serveur eidStack**

Le serveur eidStack doit être redémarré après chaque modification du seed :

```bash
# Dans le terminal WSL où tourne npm run start:dev
# Appuyez sur Ctrl+C pour arrêter le serveur

# Relancez le serveur
npm run start:dev
```

**Étape 3d : Initialisation de l'agent**

Dans un **autre terminal WSL** :

```bash
wsl
cd /mnt/c/Users/EVOLUTICS-did-hackathon
./setup-agent.sh
```

Le script vous demandera confirmation que vous avez bien enregistré le DID sur BCovrin avec le rôle ENDORSER.

**Ce script effectue :**
- Initialisation de l'agent SSI avec le DID enregistré
- Création des schémas (FarmerIdentityCredential, CottonSaleReceiptCredential)
- Création des Credential Definitions



---

## PARTIE 3 : e-IDapp_CMU (Portefeuille Mobile)

**e-IDapp_CMU** est l'application mobile qui permet aux producteurs de recevoir et stocker leurs credentials vérifiables sur leur smartphone.

### Étape 1 : Installation

```bash
cd e-IDapp_CMU
npm install
```

### Étape 2 : Configuration

```bash
cp .env.sample .env
```

### Étape 3 : Démarrage

```bash
npm start
```

Dans un autre terminal :

```bash
# Pour Android
npm run android

# Pour iOS
npm run ios
```

### Étape 4 : Réception des credentials

1. **Sur CottonPay Web** : Après l'enregistrement d'une vente, un QR code est généré
2. **Sur e-IDapp_CMU** : Cliquer sur **"Scan QR"** et scanner le code
3. L'app affiche un aperçu du credential et permet de l'accepter
4. Le credential est stocké de manière sécurisée dans l'application

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

---

## Troubleshooting

### Erreur : "Permission denied: DID lacks ENDORSER role"

**Cause :** Le DID n'a pas le rôle ENDORSER sur BCovrin, ou le serveur eidStack utilise un ancien DID en mémoire.

**Solution :**

1. Vérifiez que le DID est bien enregistré avec le rôle **ENDORSER** sur http://test.bcovrin.vonx.io/
2. Redémarrez le serveur eidStack :
   ```bash
   # Dans le terminal WSL où tourne npm run start:dev
   # Appuyez sur Ctrl+C
   npm run start:dev
   ```
3. Relancez le script d'initialisation :
   ```bash
   ./setup-agent.sh
   ```

### Erreur : "Unexpected token \r in JSON"

**Cause :** Les scripts bash ont des fins de ligne Windows (CRLF) au lieu de Unix (LF).

**Solution :**

```bash
sed -i 's/\r$//' setup-agent.sh install-eidstack.sh
```

Puis relancez le script.

---

## Équipe

**Team EVOLUTICS - Université d'Abomey-Calavi (UAC)**