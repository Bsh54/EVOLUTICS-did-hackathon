#!/bin/bash
# ============================================================
# eidStack-CMU - Initialisation de l'Agent SSI
# A executer APRES le demarrage du serveur (npm run start:dev)
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_URL="http://localhost:4000"

echo ""
echo "============================================================"
echo "  Initialisation de l'Agent SSI"
echo "============================================================"
echo ""

# ============================================================
# Verification que le serveur est demarre
# ============================================================
echo "[1/5] Verification du serveur..."
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
echo "[2/5] Initialisation de l'agent SSI..."
echo ""

INIT_RESPONSE=$(curl -s -X POST "$API_URL/credo-agent/initAgent" \
  -H "Content-Type: application/json" \
  -d '{
    "walletId": "cottonpay-issuer-wallet",
    "walletKey": "cottonpay-secure-key-2024",
    "endpoint": "http://localhost:3021",
    "label": "CottonPay-Issuer",
    "seed": "00000000000000000000000CottonPay"
  }')

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
echo "[3/5] Creation du schema FarmerIdentityCredential..."
echo ""

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

echo ""

# ============================================================
# Creation du schema CottonSaleReceiptCredential
# ============================================================
echo "[4/5] Creation du schema CottonSaleReceiptCredential..."
echo ""

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

echo ""

# ============================================================
# Creation des Credential Definitions
# ============================================================
echo "[5/5] Creation des Credential Definitions..."
echo ""

# Credential Definition pour FarmerIdentityCredential
echo "Creation de la CredDef pour FarmerIdentityCredential..."
FARMER_CREDDEF=$(curl -s -X POST "$API_URL/issuance/credential-definitions" \
  -H "Content-Type: application/json" \
  -d "{
    \"schemaId\": \"$FARMER_SCHEMA_ID\",
    \"tag\": \"farmer-identity-v1\",
    \"supportRevocation\": false
  }")

if echo "$FARMER_CREDDEF" | grep -q "credDefId"; then
    FARMER_CREDDEF_ID=$(echo "$FARMER_CREDDEF" | grep -o '"credDefId":"[^"]*"' | cut -d'"' -f4)
    echo "[OK] CredDef FarmerIdentityCredential creee"
    echo "     CredDef ID: $FARMER_CREDDEF_ID"
else
    echo "[ERREUR] Echec de creation de la CredDef FarmerIdentityCredential"
    echo "$FARMER_CREDDEF"
    exit 1
fi

echo ""

# Credential Definition pour CottonSaleReceiptCredential
echo "Creation de la CredDef pour CottonSaleReceiptCredential..."
SALE_CREDDEF=$(curl -s -X POST "$API_URL/issuance/credential-definitions" \
  -H "Content-Type: application/json" \
  -d "{
    \"schemaId\": \"$SALE_SCHEMA_ID\",
    \"tag\": \"cotton-sale-receipt-v1\",
    \"supportRevocation\": false
  }")

if echo "$SALE_CREDDEF" | grep -q "credDefId"; then
    SALE_CREDDEF_ID=$(echo "$SALE_CREDDEF" | grep -o '"credDefId":"[^"]*"' | cut -d'"' -f4)
    echo "[OK] CredDef CottonSaleReceiptCredential creee"
    echo "     CredDef ID: $SALE_CREDDEF_ID"
else
    echo "[ERREUR] Echec de creation de la CredDef CottonSaleReceiptCredential"
    echo "$SALE_CREDDEF"
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
echo "     CredDef ID: $FARMER_CREDDEF_ID"
echo ""
echo "  2. CottonSaleReceiptCredential"
echo "     Schema ID: $SALE_SCHEMA_ID"
echo "     CredDef ID: $SALE_CREDDEF_ID"
echo ""
echo "Le systeme est pret a emettre des credentials !"
echo ""
