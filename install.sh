#!/bin/bash

# Script d'installation initiale de CottonPay
# À exécuter UNE SEULE FOIS après l'installation de eSignet et eidStack-CMU

set -e

echo "=========================================="
echo "Installation de CottonPay"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "CottonPay" ]; then
    print_error "Ce script doit être exécuté depuis la racine du projet CottonPay"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Étape 1: Vérifier que eSignet est démarré
print_info "Vérification que eSignet est accessible..."
if ! curl -s http://localhost:8088/v1/esignet/csrf/token > /dev/null 2>&1; then
    print_error "eSignet n'est pas accessible sur http://localhost:8088"
    print_error "Démarrez d'abord eSignet avec: cd esignet-master/docker-compose && docker compose up -d"
    exit 1
fi
print_success "eSignet est accessible"
echo ""

# Étape 2: Installer les dépendances npm de CottonPay
print_info "Installation des dépendances npm de CottonPay..."
cd "$SCRIPT_DIR/CottonPay"
npm install
print_success "Dépendances npm installées"
echo ""

# Étape 3: Vérifier que le fichier .env existe
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    print_error "Le fichier .env n'existe pas à la racine du projet"
    exit 1
fi
print_success "Fichier .env trouvé"
echo ""

# Étape 4: Enregistrer le client OIDC auprès d'eSignet
print_info "Enregistrement du client OIDC auprès d'eSignet..."
print_info "Génération des clés RSA et enregistrement du client..."

# Vérifier si les clés existent déjà
if [ -f "backend/keys/private-key.pem" ] && [ -f "backend/keys/public-key.pem" ]; then
    print_info "Les clés RSA existent déjà"
    read -p "Voulez-vous les régénérer ? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Conservation des clés existantes"
    else
        print_info "Régénération des clés..."
        npm run register-client
        print_success "Client OIDC réenregistré"
    fi
else
    npm run register-client
    print_success "Client OIDC enregistré"
fi
echo ""

# Étape 5: Créer l'utilisateur de test dans Mock Identity System
print_info "Création de l'utilisateur de test..."
print_info "NPI: 1234567890123456, OTP: 111111"

# Vérifier si Mock Identity System est accessible
if ! curl -s http://localhost:8082/health > /dev/null 2>&1; then
    print_error "Mock Identity System n'est pas accessible sur http://localhost:8082"
    print_error "Vérifiez que le conteneur docker-compose-mock-identity-system-1 est démarré"
    exit 1
fi

npm run create-test-user
print_success "Utilisateur de test créé"
echo ""

# Étape 6: Vérifier que eidStack-CMU est accessible
print_info "Vérification que eidStack-CMU est accessible..."
if curl -s http://localhost:4000/credo-agent/getIssuerDid > /dev/null 2>&1; then
    ISSUER_DID=$(curl -s http://localhost:4000/credo-agent/getIssuerDid | grep -o '"issuerDid":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$ISSUER_DID" ]; then
        print_success "eidStack-CMU est initialisé"
        print_success "DID de l'émetteur: $ISSUER_DID"
    else
        print_info "eidStack-CMU est accessible mais l'agent n'est pas initialisé"
        print_info "Exécutez: cd eidStack-CMU && ./init-agent.sh"
    fi
else
    print_info "eidStack-CMU n'est pas accessible sur http://localhost:4000"
    print_info "Démarrez-le avec: cd eidStack-CMU && npm run start:dev"
fi
echo ""

echo "=========================================="
echo "Installation terminée avec succès!"
echo "=========================================="
echo ""
echo "Prochaines étapes:"
echo ""
echo "1. Si eidStack-CMU n'est pas encore initialisé:"
echo "   cd eidStack-CMU"
echo "   npm run start:dev    # Terminal 1"
echo "   ./init-agent.sh      # Terminal 2 (après démarrage du serveur)"
echo ""
echo "2. Démarrer CottonPay:"
echo "   ./start-all.sh"
echo ""
echo "3. Accéder à l'application:"
echo "   http://localhost:3002"
echo ""
echo "4. Se connecter avec les identifiants de test:"
echo "   NPI: 1234567890123456"
echo "   OTP: 111111"
echo ""
echo "Pour les prochains démarrages, utilisez simplement:"
echo "   ./start-all.sh"
echo ""
