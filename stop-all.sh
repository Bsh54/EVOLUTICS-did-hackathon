#!/bin/bash

# Script d'arrêt de tous les services CottonPay

set -e

echo "=========================================="
echo "Arrêt de CottonPay"
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

# ========================================
# Étape 1: Arrêter CottonPay Backend
# ========================================
if [ -f /tmp/cottonpay-backend.pid ]; then
    COTTONPAY_PID=$(cat /tmp/cottonpay-backend.pid)
    print_info "Arrêt de CottonPay Backend (PID: $COTTONPAY_PID)..."
    kill $COTTONPAY_PID 2>/dev/null || true
    rm /tmp/cottonpay-backend.pid
    print_success "CottonPay Backend arrêté"
else
    print_info "CottonPay Backend n'est pas en cours d'exécution"
fi
echo ""

# ========================================
# Étape 2: Arrêter eidStack-CMU
# ========================================
if [ -f /tmp/eidstack.pid ]; then
    EIDSTACK_PID=$(cat /tmp/eidstack.pid)
    print_info "Arrêt de eidStack-CMU (PID: $EIDSTACK_PID)..."
    kill $EIDSTACK_PID 2>/dev/null || true
    rm /tmp/eidstack.pid
    print_success "eidStack-CMU arrêté"
else
    print_info "eidStack-CMU n'est pas en cours d'exécution"
fi
echo ""

# ========================================
# Étape 3: Arrêter les services Docker eSignet
# ========================================
print_info "Arrêt des services Docker eSignet..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/esignet-master/docker-compose"

if docker compose ps | grep -q "Up"; then
    docker compose down
    print_success "Services Docker eSignet arrêtés"
else
    print_info "Les services Docker eSignet ne sont pas en cours d'exécution"
fi
echo ""

echo "=========================================="
echo "Tous les services sont arrêtés !"
echo "=========================================="
echo ""
echo "Pour redémarrer les services :"
echo "  ./start-all.sh"
echo ""
