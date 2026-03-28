#!/bin/bash

# Script d'arrêt de tous les services CottonPay + IDS

set -e

echo "=========================================="
echo "Arrêt de CottonPay + IDS"
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

# Arrêter CottonPay Backend
if [ -f /tmp/cottonpay-backend.pid ]; then
    COTTONPAY_PID=$(cat /tmp/cottonpay-backend.pid)
    print_info "Arrêt de CottonPay Backend (PID: $COTTONPAY_PID)..."
    kill $COTTONPAY_PID 2>/dev/null || true
    rm /tmp/cottonpay-backend.pid
    print_success "CottonPay Backend arrêté"
else
    print_info "CottonPay Backend n'est pas en cours d'exécution"
fi

# Arrêter eidStack-CMU
if [ -f /tmp/eidstack.pid ]; then
    EIDSTACK_PID=$(cat /tmp/eidstack.pid)
    print_info "Arrêt de eidStack-CMU (PID: $EIDSTACK_PID)..."
    kill $EIDSTACK_PID 2>/dev/null || true
    rm /tmp/eidstack.pid
    print_success "eidStack-CMU arrêté"
else
    print_info "eidStack-CMU n'est pas en cours d'exécution"
fi

# Arrêter les services Docker eSignet
print_info "Arrêt des services Docker eSignet..."
cd /mnt/c/Users/shadr/Downloads/CottonPay/esignet-master/docker-compose
docker compose down
print_success "Services Docker eSignet arrêtés"

echo ""
echo "=========================================="
echo "Tous les services sont arrêtés !"
echo "=========================================="
echo ""
