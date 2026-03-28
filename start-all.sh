#!/bin/bash

# Script de démarrage complet de CottonPay + IDS
# Lance tous les services nécessaires

set -e

echo "=========================================="
echo "Démarrage de CottonPay + IDS"
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

# Étape 1: Démarrer eSignet (Docker)
print_info "Démarrage de eSignet (Docker)..."
cd /mnt/c/Users/shadr/Downloads/CottonPay/esignet-master/docker-compose
docker compose up -d

print_success "Services Docker eSignet démarrés"
echo "  - PostgreSQL : localhost:5455"
echo "  - Redis : localhost:6379"
echo "  - Mock Identity System : localhost:8082"
echo "  - eSignet Backend : localhost:8088"
echo "  - eSignet UI : localhost:3000"
echo ""

# Étape 2: Attendre que eSignet soit prêt
print_info "Attente du démarrage complet de eSignet (60 secondes)..."
sleep 60
print_success "eSignet devrait être prêt"
echo ""

# Étape 3: Démarrer eidStack-CMU (WSL)
print_info "Démarrage de eidStack-CMU..."
cd /mnt/c/Users/shadr/Downloads/CottonPay/eidStack-CMU

# Vérifier PostgreSQL
if ! sudo service postgresql status > /dev/null 2>&1; then
    print_info "Démarrage de PostgreSQL..."
    sudo service postgresql start
    sleep 3
fi

print_success "PostgreSQL actif"

# Démarrer eidStack-CMU en arrière-plan
print_info "Lancement du serveur eidStack-CMU en arrière-plan..."
nohup npm run start:dev > /tmp/eidstack.log 2>&1 &
EIDSTACK_PID=$!
echo $EIDSTACK_PID > /tmp/eidstack.pid

print_success "eidStack-CMU démarré (PID: $EIDSTACK_PID)"
echo "  - API REST : localhost:4000"
echo "  - Documentation : localhost:4000/api/docs"
echo "  - Agent Credo : localhost:3021"
echo "  - Logs : /tmp/eidstack.log"
echo ""

# Étape 4: Démarrer CottonPay Backend
print_info "Démarrage de CottonPay Backend..."
cd /mnt/c/Users/shadr/Downloads/CottonPay/CottonPay

# Démarrer le backend en arrière-plan
print_info "Lancement du serveur CottonPay Backend en arrière-plan..."
nohup npm run start:backend > /tmp/cottonpay-backend.log 2>&1 &
COTTONPAY_PID=$!
echo $COTTONPAY_PID > /tmp/cottonpay-backend.pid

print_success "CottonPay Backend démarré (PID: $COTTONPAY_PID)"
echo "  - API Backend : localhost:3002"
echo "  - Logs : /tmp/cottonpay-backend.log"
echo ""

# Étape 5: Servir le Frontend (optionnel)
print_info "Frontend CottonPay disponible dans : /mnt/c/Users/shadr/Downloads/CottonPay/CottonPay/frontend"
echo "  Ouvrir : file:///C:/Users/shadr/Downloads/CottonPay/CottonPay/frontend/index.html"
echo ""

echo "=========================================="
echo "Tous les services sont démarrés !"
echo "=========================================="
echo ""
echo "Services actifs :"
echo "  1. eSignet UI : http://localhost:3000"
echo "  2. eSignet Backend : http://localhost:8088"
echo "  3. Mock Identity : http://localhost:8082"
echo "  4. eidStack-CMU : http://localhost:4000"
echo "  5. CottonPay Backend : http://localhost:3002"
echo "  6. CottonPay Frontend : file:///C:/Users/shadr/Downloads/CottonPay/CottonPay/frontend/index.html"
echo ""
echo "Pour arrêter tous les services :"
echo "  ./stop-all.sh"
echo ""
echo "Logs en temps réel :"
echo "  tail -f /tmp/eidstack.log"
echo "  tail -f /tmp/cottonpay-backend.log"
echo "  docker logs -f docker-compose-esignet-1"
echo ""
