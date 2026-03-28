#!/bin/bash

# Script de démarrage complet de CottonPay
# Lance tous les services nécessaires : eSignet (Docker), eidStack-CMU (WSL), CottonPay Backend (WSL)

set -e

echo "=========================================="
echo "Démarrage de CottonPay"
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
# Étape 1: Démarrer eSignet (Docker)
# ========================================
print_info "Démarrage de eSignet (Docker)..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/esignet-master/docker-compose"

# Vérifier si les conteneurs sont déjà démarrés
if docker compose ps | grep -q "Up"; then
    print_info "Certains conteneurs eSignet sont déjà démarrés"
    docker compose ps
else
    docker compose up -d
fi

print_success "Services Docker eSignet démarrés"
echo "  - PostgreSQL : localhost:5455"
echo "  - Redis : localhost:6379"
echo "  - Mock Identity System : localhost:8082"
echo "  - eSignet Backend : localhost:8088"
echo "  - eSignet UI : localhost:3000"
echo ""

# Attendre que eSignet soit prêt
print_info "Attente du démarrage complet de eSignet..."
RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8088/v1/esignet/csrf/token > /dev/null 2>&1; then
        print_success "eSignet est prêt"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "eSignet n'a pas démarré dans le délai imparti"
    print_error "Vérifiez les logs: docker logs docker-compose-esignet-1"
    exit 1
fi
echo ""

# ========================================
# Étape 2: Démarrer eidStack-CMU (WSL)
# ========================================
print_info "Démarrage de eidStack-CMU..."

cd "$SCRIPT_DIR/eidStack-CMU"

# Vérifier si PostgreSQL est démarré
if ! sudo service postgresql status > /dev/null 2>&1; then
    print_info "Démarrage de PostgreSQL..."
    sudo service postgresql start
    sleep 3
fi
print_success "PostgreSQL actif"

# Vérifier si eidStack-CMU est déjà démarré
if [ -f /tmp/eidstack.pid ]; then
    EIDSTACK_PID=$(cat /tmp/eidstack.pid)
    if ps -p $EIDSTACK_PID > /dev/null 2>&1; then
        print_info "eidStack-CMU est déjà démarré (PID: $EIDSTACK_PID)"
    else
        print_info "Ancien PID trouvé mais processus non actif, redémarrage..."
        rm /tmp/eidstack.pid
        nohup npm run start:dev > /tmp/eidstack.log 2>&1 &
        EIDSTACK_PID=$!
        echo $EIDSTACK_PID > /tmp/eidstack.pid
        print_success "eidStack-CMU démarré (PID: $EIDSTACK_PID)"
    fi
else
    print_info "Lancement du serveur eidStack-CMU en arrière-plan..."
    nohup npm run start:dev > /tmp/eidstack.log 2>&1 &
    EIDSTACK_PID=$!
    echo $EIDSTACK_PID > /tmp/eidstack.pid
    print_success "eidStack-CMU démarré (PID: $EIDSTACK_PID)"
fi

echo "  - API REST : localhost:4000"
echo "  - Documentation : localhost:4000/api/docs"
echo "  - Agent Credo : localhost:3021"
echo "  - Logs : /tmp/eidstack.log"
echo ""

# Attendre que eidStack-CMU soit prêt
print_info "Attente du démarrage complet de eidStack-CMU..."
RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:4000 > /dev/null 2>&1; then
        print_success "eidStack-CMU est prêt"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "eidStack-CMU n'a pas démarré dans le délai imparti"
    print_error "Vérifiez les logs: tail -f /tmp/eidstack.log"
    exit 1
fi
echo ""

# Vérifier si l'agent SSI est initialisé
print_info "Vérification de l'agent SSI..."
ISSUER_DID_CHECK=$(curl -s http://localhost:4000/credo-agent/getIssuerDid 2>/dev/null || echo "")

if echo "$ISSUER_DID_CHECK" | grep -q "did:indy"; then
    ISSUER_DID=$(echo "$ISSUER_DID_CHECK" | grep -o '"issuerDid":"[^"]*"' | cut -d'"' -f4)
    print_success "Agent SSI initialisé"
    print_success "DID: $ISSUER_DID"
else
    print_info "Agent SSI non initialisé"
    print_info "Exécutez: cd eidStack-CMU && ./init-agent.sh"
fi
echo ""

# ========================================
# Étape 3: Démarrer CottonPay Backend
# ========================================
print_info "Démarrage de CottonPay Backend..."

cd "$SCRIPT_DIR/CottonPay"

# Vérifier si CottonPay Backend est déjà démarré
if [ -f /tmp/cottonpay-backend.pid ]; then
    COTTONPAY_PID=$(cat /tmp/cottonpay-backend.pid)
    if ps -p $COTTONPAY_PID > /dev/null 2>&1; then
        print_info "CottonPay Backend est déjà démarré (PID: $COTTONPAY_PID)"
    else
        print_info "Ancien PID trouvé mais processus non actif, redémarrage..."
        rm /tmp/cottonpay-backend.pid
        nohup npm run start:backend > /tmp/cottonpay-backend.log 2>&1 &
        COTTONPAY_PID=$!
        echo $COTTONPAY_PID > /tmp/cottonpay-backend.pid
        print_success "CottonPay Backend démarré (PID: $COTTONPAY_PID)"
    fi
else
    print_info "Lancement du serveur CottonPay Backend en arrière-plan..."
    nohup npm run start:backend > /tmp/cottonpay-backend.log 2>&1 &
    COTTONPAY_PID=$!
    echo $COTTONPAY_PID > /tmp/cottonpay-backend.pid
    print_success "CottonPay Backend démarré (PID: $COTTONPAY_PID)"
fi

echo "  - Application : localhost:3002"
echo "  - Logs : /tmp/cottonpay-backend.log"
echo ""

# Attendre que CottonPay soit prêt
print_info "Attente du démarrage complet de CottonPay..."
RETRY_COUNT=0
MAX_RETRIES=15

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3002 > /dev/null 2>&1; then
        print_success "CottonPay est prêt"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "CottonPay n'a pas démarré dans le délai imparti"
    print_error "Vérifiez les logs: tail -f /tmp/cottonpay-backend.log"
    exit 1
fi
echo ""

# ========================================
# Résumé
# ========================================
echo "=========================================="
echo "Tous les services sont démarrés !"
echo "=========================================="
echo ""
echo "Services actifs :"
echo "  1. eSignet UI : http://localhost:3000"
echo "  2. eSignet Backend : http://localhost:8088"
echo "  3. Mock Identity : http://localhost:8082"
echo "  4. eidStack-CMU : http://localhost:4000"
echo "  5. CottonPay : http://localhost:3002"
echo ""
echo "Identifiants de test :"
echo "  NPI : 1234567890123456"
echo "  OTP : 111111"
echo ""
echo "Pour arrêter tous les services :"
echo "  ./stop-all.sh"
echo ""
echo "Logs en temps réel :"
echo "  tail -f /tmp/eidstack.log"
echo "  tail -f /tmp/cottonpay-backend.log"
echo "  docker logs -f docker-compose-esignet-1"
echo ""
