# eidStack-CMU

Service backend construit avec :

- Node.js v18.17.1
- NestJS v10.4.20
- Prisma ORM v5.15.0
- Credo-TS v0.5.17 (SSI / Aries / AnonCreds)
- PostgreSQL 14+
- Swagger/OpenAPI

Ce service gère :

- Création et enregistrement de DID
- Gestion des schémas de credentials
- Création de définitions de credentials
- Émission de credentials (Out-of-Band)
- Vérification de preuves
- Gestion du cycle de vie de l'agent SSI

---

---

# Scripts d'Installation et d'Initialisation

Deux scripts sont fournis pour simplifier l'installation et la configuration :

## install.sh - Installation Complète

Installe toutes les dépendances et configure le système :

```bash
chmod +x install.sh
./install.sh
```

**Ce script effectue :**
- Installation de Node.js v18.17.1 via nvm
- Installation des outils de compilation (build-essential, python3)
- Installation et configuration de PostgreSQL
- Création de la base de données ids-db
- Installation des dépendances npm avec --legacy-peer-deps
- Création du fichier .env avec les valeurs par défaut
- Génération du client Prisma
- Exécution des migrations de base de données
- Correction automatique de l'erreur EmailModule

**Durée estimée :** 5-10 minutes

## setup-agent.sh - Initialisation de l'Agent SSI

Initialise l'agent SSI et crée les schémas (à exécuter après le démarrage du serveur) :

```bash
chmod +x setup-agent.sh
./setup-agent.sh
```

**Ce script effectue :**
- Initialisation de l'agent SSI avec DID sur BCovrin
- Création du schéma FarmerIdentityCredential (8 attributs)
- Création du schéma CottonSaleReceiptCredential (11 attributs)
- Création des credential definitions pour les deux schémas
- Affichage d'un résumé complet avec tous les IDs générés

**Durée estimée :** 1-2 minutes

**Note :** Le serveur doit être démarré (npm run start:dev) avant d'exécuter ce script.

---

# Démarrage Rapide

Pour une installation complète en quelques commandes :

```bash
# 1. Installation (si pas encore fait)
./install.sh

# 2. Démarrer le serveur (dans WSL Ubuntu)
npm run start:dev

# 3. Dans un AUTRE terminal WSL, initialiser l'agent
chmod +x init-agent.sh
./init-agent.sh
```

Après ces étapes, le système est prêt à émettre des credentials.

**Note importante**: Le serveur doit rester actif dans le premier terminal. Vous verrez les logs en temps réel. Pour arrêter le serveur, utilisez `Ctrl+C`.

---

# Prérequis

Assurez-vous que les éléments suivants sont installés :

| Outil | Version Requise |
|------|------------------|
| Node.js | v18.17.1 |
| npm | v9.6.7+ |
| PostgreSQL | 14+ |
| Git | Dernière version |

Pour les utilisateurs WSL Ubuntu :
- Ubuntu 24.04 LTS ou ultérieur
- Package build-essential
- python3

Vérifier les versions :

```bash
node -v
npm -v
git --version
psql --version
```

---

# Guide d'Installation (WSL Ubuntu)

## Installation Automatique (Recommandé)

Un script d'installation automatique est fourni pour simplifier le processus :

```bash
# Rendre le script exécutable
chmod +x install.sh

# Exécuter l'installation
./install.sh
```

Ce script va :
1. Installer Node.js v18.17.1 via nvm
2. Installer les outils de compilation (build-essential, python3)
3. Installer et configurer PostgreSQL
4. Créer la base de données ids-db
5. Installer les dépendances npm
6. Créer le fichier .env
7. Générer le client Prisma et exécuter les migrations
8. Corriger l'erreur EmailModule

Après l'installation automatique, passez directement à la section "Démarrer le Serveur".

## Installation Manuelle

Si vous préférez installer manuellement, suivez les étapes ci-dessous.

## Étape 1 : Installer Node.js v18.17.1

```bash
# Installer nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recharger la configuration du shell
source ~/.bashrc

# Installer Node.js v18.17.1
nvm install 18.17.1
nvm use 18.17.1
nvm alias default 18.17.1

# Vérifier l'installation
node -v  # Devrait afficher : v18.17.1
npm -v   # Devrait afficher : 9.6.7 ou supérieur
```

## Étape 2 : Installer les Outils de Compilation

```bash
sudo apt update
sudo apt install build-essential python3 -y
```

## Étape 3 : Installer PostgreSQL

```bash
# Installer PostgreSQL 16
sudo apt install postgresql postgresql-contrib -y

# Démarrer le service PostgreSQL
sudo service postgresql start

# Passer à l'utilisateur postgres
sudo -i -u postgres

# Créer la base de données et l'utilisateur
psql
CREATE DATABASE "ids-db";
CREATE USER postgres WITH PASSWORD 'postgres18';
GRANT ALL PRIVILEGES ON DATABASE "ids-db" TO postgres;
\q

# Quitter l'utilisateur postgres
exit
```

## Étape 4 : Cloner le Dépôt

```bash
cd /mnt/c/Users/shadr/Downloads/CottonPay
# Ou naviguez vers votre répertoire préféré
```

## Étape 5 : Installer les Dépendances

```bash
cd eidStack-CMU
npm install --legacy-peer-deps
```

Note : Utilisez le flag `--legacy-peer-deps` pour contourner les conflits de dépendances.

## Étape 6 : Configurer l'Environnement

Créer un fichier `.env` à la racine du projet :

```env
# Base de données
DATABASE_URL="postgresql://postgres:postgres18@localhost:5432/ids-db?schema=public"

# URLs de l'application
API_BASE_URL="http://localhost:4000"
AGENT_PUBLIC_URL="http://localhost:3021"

# Agent SSI / Credo
AGENT_PORT=3021
BCOVRIN_TESTNET_URL="http://test.bcovrin.vonx.io/register"
INDY_NETWORK_NAMESPACE="bcovrin:test"

# Émission et Vérification
ISSUER_LABEL="e-ID_Issuer"
VERIFIER_LABEL="e-ID_Verifier"
CREDENTIAL_PROTOCOL_VERSION="v2"
```

## Étape 7 : Configurer la Base de Données

```bash
# Générer le client Prisma
npx prisma generate

# Exécuter les migrations
npx prisma migrate deploy
```

## Étape 8 : Corriger l'Erreur EmailModule (Requis)

Le module EmailModule a un problème de compatibilité avec l'adaptateur handlebars. Commentez-le dans `src/app.module.ts` :

```typescript
@Module({
  imports: [
    CredoAgentModule,
    ConnectionModule,
    IssuanceModule,
    VerificationModule,
    ShortUrlModule,
    PrismaModule,
    CleanupModule,
    // EmailModule  // COMMENTÉ - erreur adaptateur handlebars
  ],
})
export class AppModule { }
```

## Étape 9 : Démarrer le Serveur

```bash
npm run start:dev
```

Le serveur démarrera sur :
- API REST : http://localhost:4000
- Documentation Swagger : http://localhost:4000/api/docs
- Agent Credo : http://localhost:3021

---

# Initialiser l'Agent SSI

## Initialisation Automatique (Recommandé)

Un script d'initialisation automatique est fourni :

```bash
# Le serveur doit être démarré AVANT (npm run start:dev dans un autre terminal)

# Rendre le script exécutable
chmod +x init-agent.sh

# Exécuter l'initialisation
./init-agent.sh
```

Ce script va :
1. Vérifier que le serveur est accessible
2. Initialiser l'agent SSI avec un DID sur BCovrin
3. Créer le schéma FarmerIdentityCredential
4. Créer le schéma CottonSaleReceiptCredential
5. Créer les credential definitions pour les deux schémas
6. Afficher un résumé complet avec tous les IDs

Le processus prend environ 1-2 minutes.

## Initialisation Manuelle

Si vous préférez initialiser manuellement, suivez les étapes ci-dessous.

### Endpoint

```
POST http://localhost:4000/credo-agent/initAgent
```

## Corps de la Requête

```json
{
  "walletId": "cottonpay-issuer-wallet",
  "walletKey": "cottonpay-secure-key-2026",
  "endpoint": "http://localhost:3021",
  "label": "CottonPay-Issuer-Agent",
  "seed": "00000000000000000000000CottonPay"
}
```

## Exigences des Champs

| Champ | Description | Exigences |
|-------|-------------|-----------|
| `walletId` | Identifiant unique du wallet | N'importe quelle chaîne |
| `walletKey` | Clé de chiffrement du wallet | N'importe quelle chaîne |
| `endpoint` | URL publique de l'agent | Doit correspondre à AGENT_PUBLIC_URL |
| `label` | Nom d'affichage de l'émetteur | N'importe quelle chaîne |
| `seed` | Seed d'enregistrement du DID | Exactement 32 caractères |

## Réponse de Succès

```json
{
  "message": "Agent initialized",
  "issuerDid": "did:indy:bcovrin:test:5oP3ZwuuLbXEcKUFc5yArG",
  "debug": {
    "created": true,
    "hasIssuerDid": true
  }
}
```

L'agent va :
1. Créer un wallet Askar
2. Enregistrer le DID sur le réseau de test BCovrin
3. Se connecter au médiateur (polyid-mediator.onrender.com)
4. Initialiser tous les modules SSI

---

# Créer des Schémas

Les schémas définissent la structure des credentials.

## Endpoint

```
POST http://localhost:4000/issuance/schemas
```

## Exemple 1 : Credential d'Identité Agriculteur

```json
{
  "name": "FarmerIdentityCredential",
  "version": "1.0",
  "attributes": [
    {
      "attributeName": "farmer_npi",
      "schemaDataType": "string",
      "displayName": "NPI de l'agriculteur"
    },
    {
      "attributeName": "farmer_name",
      "schemaDataType": "string",
      "displayName": "Nom complet"
    },
    {
      "attributeName": "phone_number",
      "schemaDataType": "string",
      "displayName": "Numéro de téléphone"
    },
    {
      "attributeName": "region",
      "schemaDataType": "string",
      "displayName": "Région"
    },
    {
      "attributeName": "commune",
      "schemaDataType": "string",
      "displayName": "Commune"
    },
    {
      "attributeName": "verified_by",
      "schemaDataType": "string",
      "displayName": "Vérifié par"
    },
    {
      "attributeName": "verification_date",
      "schemaDataType": "string",
      "displayName": "Date de vérification"
    },
    {
      "attributeName": "verification_method",
      "schemaDataType": "string",
      "displayName": "Méthode de vérification"
    }
  ]
}
```

## Exemple 2 : Credential de Reçu de Vente de Coton

```json
{
  "name": "CottonSaleReceiptCredential",
  "version": "1.0",
  "attributes": [
    {
      "attributeName": "farmer_npi",
      "schemaDataType": "string",
      "displayName": "NPI de l'agriculteur"
    },
    {
      "attributeName": "sale_date",
      "schemaDataType": "string",
      "displayName": "Date de vente"
    },
    {
      "attributeName": "sale_time",
      "schemaDataType": "string",
      "displayName": "Heure de vente"
    },
    {
      "attributeName": "cotton_weight_kg",
      "schemaDataType": "string",
      "displayName": "Poids de coton (kg)"
    },
    {
      "attributeName": "unit_price_fcfa",
      "schemaDataType": "string",
      "displayName": "Prix unitaire (FCFA/kg)"
    },
    {
      "attributeName": "total_amount_fcfa",
      "schemaDataType": "string",
      "displayName": "Montant total (FCFA)"
    },
    {
      "attributeName": "payment_reference",
      "schemaDataType": "string",
      "displayName": "Référence de paiement"
    },
    {
      "attributeName": "payment_status",
      "schemaDataType": "string",
      "displayName": "Statut du paiement"
    },
    {
      "attributeName": "payment_method",
      "schemaDataType": "string",
      "displayName": "Méthode de paiement"
    },
    {
      "attributeName": "transaction_id",
      "schemaDataType": "string",
      "displayName": "ID de transaction"
    },
    {
      "attributeName": "collection_point",
      "schemaDataType": "string",
      "displayName": "Point de collecte"
    }
  ]
}
```

## Réponse de Succès

```json
{
  "success": true,
  "data": {
    "schemaId": "did:indy:bcovrin:test:5oP3ZwuuLbXEcKUFc5yArG/anoncreds/v0/SCHEMA/FarmerIdentityCredential/1.0",
    "unqualifiedSchemaId": "5oP3ZwuuLbXEcKUFc5yArG:2:FarmerIdentityCredential:1.0",
    "issuerDid": "did:indy:bcovrin:test:5oP3ZwuuLbXEcKUFc5yArG"
  },
  "statusCode": 201
}
```

---

# Créer des Définitions de Credentials

Les définitions de credentials lient les schémas au DID de l'émetteur et permettent l'émission de credentials.

## Endpoint

```
POST http://localhost:4000/issuance/credential-definitions
```

## Exemple 1 : Définition de Credential d'Identité Agriculteur

```json
{
  "schemaId": "did:indy:bcovrin:test:5oP3ZwuuLbXEcKUFc5yArG/anoncreds/v0/SCHEMA/FarmerIdentityCredential/1.0",
  "tag": "farmer-identity-v1",
  "supportRevocation": false
}
```

## Exemple 2 : Définition de Credential de Reçu de Vente de Coton

```json
{
  "schemaId": "did:indy:bcovrin:test:5oP3ZwuuLbXEcKUFc5yArG/anoncreds/v0/SCHEMA/CottonSaleReceiptCredential/1.0",
  "tag": "cotton-sale-receipt-v1",
  "supportRevocation": false
}
```

## Réponse de Succès

```json
{
  "success": true,
  "data": {
    "credDefId": "did:indy:bcovrin:test:5oP3ZwuuLbXEcKUFc5yArG/anoncreds/v0/CLAIM_DEF/3149685/farmer-identity-v1",
    "unqualifiedCredDefId": "5oP3ZwuuLbXEcKUFc5yArG:3:CL:3149685:farmer-identity-v1",
    "issuerDid": "did:indy:bcovrin:test:5oP3ZwuuLbXEcKUFc5yArG"
  },
  "statusCode": 201
}
```

Note : Ce processus prend 10-50 secondes car il enregistre la définition de credential sur le ledger BCovrin.

---

# Émettre des Credentials

Émettre des credentials vérifiables aux détenteurs via des invitations Out-of-Band.

## Endpoint

```
POST http://localhost:4000/issuance/offer
```

## Corps de la Requête

```json
{
  "credentialDefinitionId": "did:indy:bcovrin:test:5oP3ZwuuLbXEcKUFc5yArG/anoncreds/v0/CLAIM_DEF/3149685/farmer-identity-v1",
  "attributes": [
    {
      "name": "farmer_npi",
      "value": "1234567890123456"
    },
    {
      "name": "farmer_name",
      "value": "Koffi Mensah"
    },
    {
      "name": "phone_number",
      "value": "+22997123456"
    },
    {
      "name": "region",
      "value": "Alibori"
    },
    {
      "name": "commune",
      "value": "Banikoara"
    },
    {
      "name": "verified_by",
      "value": "eSignet"
    },
    {
      "name": "verification_date",
      "value": "2026-03-27"
    },
    {
      "name": "verification_method",
      "value": "fingerprint"
    }
  ]
}
```

## Réponse de Succès

```json
{
  "success": true,
  "data": {
    "invitationUrl": "http://localhost:3021?oob=eyJAdHlwZSI6Imh0dHBzOi8v...",
    "shortUrl": "http://localhost:4000/short-url/s/b712c9ab",
    "invitationQr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "outOfBandId": "b17ad5af-3e87-476d-ab57-2a71b6266bdc",
    "credentialExchangeId": "fbcb8894-d028-4abe-946f-f2636dce6b0b",
    "credentialAttributes": [...],
    "state": "offer-sent"
  },
  "statusCode": 201
}
```

La réponse inclut :
- `invitationUrl` : URL complète de l'invitation Out-of-Band
- `shortUrl` : URL raccourcie pour un partage plus facile
- `invitationQr` : Image QR code encodée en base64
- `credentialExchangeId` : Suivi de l'état de l'échange de credential
- `state` : État actuel de l'échange de credential

Le détenteur peut scanner le QR code avec un wallet compatible (ex : e-IDapp_CMU) pour accepter le credential.

---

# Lister les Ressources

## Lister les Schémas

```
GET http://localhost:4000/issuance/schemas?page=1&limit=10
```

## Lister les Définitions de Credentials

```
GET http://localhost:4000/issuance/credential-definitions?page=1&limit=10
```

## Obtenir le DID de l'Émetteur

```
GET http://localhost:4000/credo-agent/getIssuerDid
```

---

# Vue d'Ensemble des Ports

| Port | Service | Objectif |
|------|----------|----------|
| 3021 | Agent Credo | Transport entrant DIDComm (doit être accessible publiquement en production) |
| 4000 | API NestJS | Endpoints REST |
| 5432 | PostgreSQL | Base de données |

---

# Structure du Projet

```
eidStack-CMU/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── credo-agent/          # Initialisation et gestion de l'agent SSI
│   │   ├── credo-agent.service.ts
│   │   ├── credo-agent.controller.ts
│   │   └── credo-events.service.ts
│   ├── issuance/             # Schémas et émission de credentials
│   │   ├── issuance.service.ts
│   │   ├── issuance.controller.ts
│   │   └── dto/
│   ├── verification/         # Demandes de preuve et vérification
│   │   ├── verification.service.ts
│   │   ├── verification.controller.ts
│   │   └── dto/
│   ├── connection/           # Connexions DIDComm
│   ├── short-url/            # Service de raccourcissement d'URL
│   ├── prisma/               # ORM de base de données
│   └── cleanup/              # Tâches de nettoyage
├── prisma/
│   └── schema.prisma         # Schéma de base de données
├── .env                      # Configuration d'environnement
└── package.json
```

---

# Dépannage

## npm install échoue avec des erreurs de compilation

Installer les outils de compilation :
```bash
sudo apt install build-essential python3 -y
```

## npm install échoue avec un timeout ngrok

Utiliser le flag legacy peer deps :
```bash
npm install --legacy-peer-deps
```

## Le serveur ne démarre pas avec une erreur EmailModule

Commenter EmailModule dans `src/app.module.ts` :
```typescript
// EmailModule  // COMMENTÉ
```

## L'initialisation de l'agent échoue

Vérifier :
- PostgreSQL est en cours d'exécution : `sudo service postgresql status`
- La base de données existe : `psql -U postgres -d ids-db -c "\dt"`
- Le seed fait exactement 32 caractères
- AGENT_PUBLIC_URL est correct dans .env

## La création de définition de credential est lente

C'est normal. L'enregistrement sur le réseau de test BCovrin prend 10-50 secondes.

## Port déjà utilisé

```bash
# Trouver le processus utilisant le port
lsof -i :4000
lsof -i :3021

# Tuer le processus
kill -9 <PID>
```

---

# Déploiement en Production

Pour le déploiement en production :

1. Utiliser un ledger Indy de production (Sovrin, Indicio)
2. Configurer un reverse proxy (Nginx) avec SSL pour les ports 3021 et 4000
3. Mettre à jour les variables d'environnement :

```env
AGENT_PUBLIC_URL="https://agent.votredomaine.com"
API_BASE_URL="https://api.votredomaine.com"
INDY_NETWORK_NAMESPACE="sovrin:mainnet"
```

4. Compiler et démarrer :

```bash
npm run build
npm run start:prod
```

Ou utiliser Docker :

```bash
docker compose up -d --build
```

---

# Documentation de l'API

Accéder à la documentation interactive de l'API à :

```
http://localhost:4000/api/docs
```

L'interface Swagger fournit :
- Documentation complète des endpoints
- Schémas de requête/réponse
- Fonctionnalité d'essai directement dans le navigateur
- Détails d'authentification
- Exemples de requêtes pour chaque endpoint

Modules disponibles dans la documentation :
- **credo-agent** : Initialisation et gestion de l'agent SSI
- **issuance** : Création de schémas, définitions de credentials et émission
- **verification** : Demandes de preuve et vérification
- **connection** : Gestion des connexions DIDComm
- **short-url** : Service de raccourcissement d'URL pour les QR codes

---

# Licence

NestJS est sous licence MIT.

---

**Maintenu par l'équipe eidStack**
