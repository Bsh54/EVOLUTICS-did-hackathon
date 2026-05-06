#!/bin/bash
# ============================================================
# eidStack-CMU - Initialisation de l'Agent SSI
# A executer APRES le demarrage du serveur (npm run start:dev)
#
# PREREQUIS : Enregistrement manuel du DID sur BCovrin
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_URL="http://localhost:4000"
SEED="CottonPaySecretSeedPourUriel2024"

# Charger les variables d'environnement depuis .env.development
# IMPORTANT: tr -d '\r' pour supprimer les retours chariot Windows
if [ -f "$SCRIPT_DIR/eidStack-CMU/.env.development" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/eidStack-CMU/.env.development" | tr -d '\r' | xargs)
fi

# Utiliser AGENT_PUBLIC_URL depuis .env ou fallback sur localhost
AGENT_ENDPOINT=$(echo "${AGENT_PUBLIC_URL:-http://localhost:3021}" | tr -d '\r')
SEED=$(echo "$SEED" | tr -d '\r')

echo ""
echo "============================================================"
echo "  Initialisation de l'Agent SSI"
echo "============================================================"
echo ""

# ============================================================
# Verification de l'enregistrement BCovrin
# ============================================================
echo "[IMPORTANT] Prerequis : Enregistrement du DID sur BCovrin"
echo ""
echo "Avant de continuer, assurez-vous d'avoir enregistre le DID sur :"
echo "  http://test.bcovrin.vonx.io/"
echo ""
echo "Parametres d'enregistrement :"
echo "  - Seed : $SEED"
echo "  - Alias : CottonPay-Issuer"
echo "  - Role : ENDORSER (obligatoire)"
echo ""
read -p "Avez-vous deja enregistre le DID avec le role ENDORSER ? (o/n) " -n 1
echo ""
if [[ ! $REPLY =~ ^[OoYy]$ ]]; then
    echo ""
    echo "Veuillez d'abord enregistrer le DID sur BCovrin, puis relancez ce script."
    exit 1
fi

echo ""

# ============================================================
# Suppression de l'ancien wallet (si existe)
# ============================================================
echo "[1/6] Nettoyage de l'ancien wallet (si existe)..."
echo ""

WALLET_CLEANED=false

if [ -d "$HOME/.askar" ]; then
    rm -rf "$HOME/.askar"
    echo "[OK] Ancien wallet Askar supprime"
    WALLET_CLEANED=true
fi

if [ -d "$HOME/.local/share/askar" ]; then
    rm -rf "$HOME/.local/share/askar"
    echo "[OK] Ancien wallet Askar (local) supprime"
    WALLET_CLEANED=true
fi

if [ -d "$HOME/.indy_client" ]; then
    rm -rf "$HOME/.indy_client"
    echo "[OK] Ancien wallet Indy supprime"
    WALLET_CLEANED=true
fi

if [ "$WALLET_CLEANED" = false ]; then
    echo "[OK] Aucun ancien wallet trouve (premiere installation)"
fi

echo ""

# ============================================================
# Verification que le serveur est demarre
# ============================================================
echo "[2/6] Verification du serveur..."
echo ""

if ! curl -sf "$API_URL/api/docs" &> /dev/null; then
    echo "[ERREUR] Le serveur n'est pas demarre"
    echo "         Demarrez le serveur avec: npm run start:dev"
    echo "         Puis relancez ce script"
    exit 1
fi

echo "[OK] Serveur actif sur $API_URL"
echo ""

# ============================================================
# Initialisation de l'agent
# ============================================================
echo "[3/6] Initialisation de l'agent SSI..."
echo ""

# Nettoyer toutes les variables de \r residuels (Windows/WSL)
API_URL=$(printf '%s' "$API_URL" | tr -d '\r')
SEED=$(printf '%s' "$SEED" | tr -d '\r')
AGENT_ENDPOINT=$(printf '%s' "$AGENT_ENDPOINT" | tr -d '\r')

# Construire le JSON
INIT_JSON=$(printf '{"walletId":"cottonpay-issuer-wallet","walletKey":"cottonpay-secure-key-2024","endpoint":"%s","label":"CottonPay-Issuer","seed":"%s"}' "$AGENT_ENDPOINT" "$SEED")

# Debug
echo "[DEBUG] JSON: $INIT_JSON"
echo "[DEBUG] Verification \\r:"
echo "$INIT_JSON" | cat -v

INIT_RESPONSE=$(curl -s -X POST "$API_URL/credo-agent/initAgent" \
  -H "Content-Type: application/json" \
  -d "$INIT_JSON")

if echo "$INIT_RESPONSE" | grep -q "issuerDid"; then
    ISSUER_DID=$(echo "$INIT_RESPONSE" | grep -o '"issuerDid":"[^"]*"' | cut -d'"' -f4)
    echo "[OK] Agent initialise"
    echo "     DID: $ISSUER_DID"
else
    echo "[ERREUR] Echec de l'initialisation de l'agent"
    echo "$INIT_RESPONSE"
    exit 1
fi

echo ""

# ============================================================
# Creation du schema FarmerIdentityCredential
# ============================================================
echo "[4/6] Creation du schema FarmerIdentityCredential..."
echo ""

# Verifier si le schema existe deja
EXISTING_SCHEMAS=$(curl -s "$API_URL/issuance/schemas")
if echo "$EXISTING_SCHEMAS" | grep -q '"name":"FarmerIdentityCredential"'; then
    FARMER_SCHEMA_ID=$(echo "$EXISTING_SCHEMAS" | grep -o '"schema_id":"did:indy:bcovrin:test:[^"]*FarmerIdentityCredential[^"]*"' | head -1 | cut -d'"' -f4)
    echo "[OK] Schema FarmerIdentityCredential existe deja"
    echo "     Schema ID: $FARMER_SCHEMA_ID"
else
    FARMER_SCHEMA=$(curl -s -X POST "$API_URL/issuance/schemas" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "FarmerIdentityCredential",
        "version": "1.0",
        "attributes": [
          {"attributeName": "farmer_npi", "schemaDataType": "string", "displayName": "NPI Agriculteur"},
          {"attributeName": "farmer_name", "schemaDataType": "string", "displayName": "Nom Complet"},
          {"attributeName": "phone_number", "schemaDataType": "string", "displayName": "Telephone"},
          {"attributeName": "region", "schemaDataType": "string", "displayName": "Region"},
          {"attributeName": "commune", "schemaDataType": "string", "displayName": "Commune"},
          {"attributeName": "verified_by", "schemaDataType": "string", "displayName": "Verifie Par"},
          {"attributeName": "verification_date", "schemaDataType": "string", "displayName": "Date Verification"},
          {"attributeName": "verification_method", "schemaDataType": "string", "displayName": "Methode Verification"}
        ]
      }')

    if echo "$FARMER_SCHEMA" | grep -q "schemaId"; then
        FARMER_SCHEMA_ID=$(echo "$FARMER_SCHEMA" | grep -o '"schemaId":"[^"]*"' | cut -d'"' -f4)
        echo "[OK] Schema FarmerIdentityCredential cree"
        echo "     Schema ID: $FARMER_SCHEMA_ID"
    else
        echo "[ERREUR] Echec de creation du schema FarmerIdentityCredential"
        echo "$FARMER_SCHEMA"
        exit 1
    fi
fi

echo ""

# ============================================================
# Creation du schema CottonSaleReceiptCredential
# ============================================================
echo "[5/6] Creation du schema CottonSaleReceiptCredential..."
echo ""

# Verifier si le schema existe deja
if echo "$EXISTING_SCHEMAS" | grep -q '"name":"CottonSaleReceiptCredential"'; then
    SALE_SCHEMA_ID=$(echo "$EXISTING_SCHEMAS" | grep -o '"schema_id":"did:indy:bcovrin:test:[^"]*CottonSaleReceiptCredential[^"]*"' | head -1 | cut -d'"' -f4)
    echo "[OK] Schema CottonSaleReceiptCredential existe deja"
    echo "     Schema ID: $SALE_SCHEMA_ID"
else
    SALE_SCHEMA=$(curl -s -X POST "$API_URL/issuance/schemas" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "CottonSaleReceiptCredential",
        "version": "1.0",
        "attributes": [
          {"attributeName": "farmer_npi", "schemaDataType": "string", "displayName": "NPI Agriculteur"},
          {"attributeName": "sale_date", "schemaDataType": "string", "displayName": "Date Vente"},
          {"attributeName": "sale_time", "schemaDataType": "string", "displayName": "Heure Vente"},
          {"attributeName": "cotton_weight_kg", "schemaDataType": "string", "displayName": "Poids Coton (kg)"},
          {"attributeName": "unit_price_fcfa", "schemaDataType": "string", "displayName": "Prix Unitaire (FCFA)"},
          {"attributeName": "total_amount_fcfa", "schemaDataType": "string", "displayName": "Montant Total (FCFA)"},
          {"attributeName": "payment_reference", "schemaDataType": "string", "displayName": "Reference Paiement"},
          {"attributeName": "payment_status", "schemaDataType": "string", "displayName": "Statut Paiement"},
          {"attributeName": "payment_method", "schemaDataType": "string", "displayName": "Methode Paiement"},
          {"attributeName": "transaction_id", "schemaDataType": "string", "displayName": "ID Transaction"},
          {"attributeName": "collection_point", "schemaDataType": "string", "displayName": "Point Collecte"}
        ]
      }')

    if echo "$SALE_SCHEMA" | grep -q "schemaId"; then
        SALE_SCHEMA_ID=$(echo "$SALE_SCHEMA" | grep -o '"schemaId":"[^"]*"' | cut -d'"' -f4)
        echo "[OK] Schema CottonSaleReceiptCredential cree"
        echo "     Schema ID: $SALE_SCHEMA_ID"
    else
        echo "[ERREUR] Echec de creation du schema CottonSaleReceiptCredential"
        echo "$SALE_SCHEMA"
        exit 1
    fi
fi

echo ""

# ============================================================
# Creation des Credential Definitions
# ============================================================
echo "[6/6] Creation des Credential Definitions..."
echo ""

# Fonction de retry pour les operations sur le ledge
retry_creddef() {
    local schema_id=$1
    local tag=$2
    local name=$3
    local max_attempts=3
    local attempt=1

    # Verifier si la CredDef existe deja
    EXISTING_CREDDEFS=$(curl -s "$API_URL/issuance/credential-definitions")
    if echo "$EXISTING_CREDDEFS" | grep -q "\"name\":\"$tag\""; then
        CREDDEF_ID=$(echo "$EXISTING_CREDDEFS" | grep -B5 "\"name\":\"$tag\"" | grep -o '"cred_def_id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "[OK] CredDef $name existe deja"
        echo "     CredDef ID: $CREDDEF_ID"
        return 0
    fi

    while [ $attempt -le $max_attempts ]; do
        echo "Tentative $attempt/$max_attempts pour $name..."

        CREDDEF_RESPONSE=$(curl -s -X POST "$API_URL/issuance/credential-definitions" \
          -H "Content-Type: application/json" \
          -d "{
            \"schemaId\": \"$schema_id\",
            \"tag\": \"$tag\",
            \"supportRevocation\": false
          }")

        if echo "$CREDDEF_RESPONSE" | grep -q "credDefId"; then
            CREDDEF_ID=$(echo "$CREDDEF_RESPONSE" | grep -o '"credDefId":"[^"]*"' | cut -d'"' -f4)
            echo "[OK] CredDef $name creee"
            echo "     CredDef ID: $CREDDEF_ID"
            return 0
        else
            if [ $attempt -lt $max_attempts ]; then
                echo "[AVERTISSEMENT] Echec tentative $attempt, nouvelle tentative dans 10 secondes..."
                sleep 10
            fi
        fi

        attempt=$((attempt + 1))
    done

    echo "[ERREUR] Echec de creation de la CredDef $name apres $max_attempts tentatives"
    echo "$CREDDEF_RESPONSE"
    return 1
}

# Credential Definition pour FarmerIdentityCredential
echo "Creation de la CredDef pour FarmerIdentityCredential..."
if ! retry_creddef "$FARMER_SCHEMA_ID" "farmer-identity-v1" "FarmerIdentityCredential"; then
    exit 1
fi

echo ""

# Attendre 5 secondes avant la prochaine CredDef
echo "Attente de 5 secondes avant la prochaine CredDef..."
sleep 5

# Credential Definition pour CottonSaleReceiptCredential
echo "Creation de la CredDef pour CottonSaleReceiptCredential..."
if ! retry_creddef "$SALE_SCHEMA_ID" "cotton-sale-receipt-v1" "CottonSaleReceiptCredential"; then
    exit 1
fi

echo ""

# ============================================================
# Resume final
# ============================================================
echo "============================================================"
echo "  Agent SSI initialise avec succes !"
echo "============================================================"
echo ""
echo "Issuer DID:"
echo "  $ISSUER_DID"
echo ""
echo "Schemas crees:"
echo "  1. FarmerIdentityCredential"
echo "     Schema ID: $FARMER_SCHEMA_ID"
echo ""
echo "  2. CottonSaleReceiptCredential"
echo "     Schema ID: $SALE_SCHEMA_ID"
echo ""
echo "Credential Definitions creees avec succes !"
echo ""
echo "Le systeme est pret a emettre des credentials !"
echo ""
