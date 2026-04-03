#!/bin/bash
# ============================================================
# CottonPay - Demarrage et Configuration
# A executer a chaque fois que vous voulez demarrer CottonPay
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "============================================================"
echo "  Demarrage de CottonPay"
echo "============================================================"
echo ""

# ============================================================
# Verifications prealables
# ============================================================
echo "[1/5] Verifications prealables..."
echo ""

# Verifier que install.sh a ete execute
if [ ! -f "$SCRIPT_DIR/CottonPay/.env" ]; then
    echo "[ERREUR] Installation non detectee"
    echo "         Executez d'abord: ./install.sh"
    exit 1
fi

if [ ! -d "$SCRIPT_DIR/CottonPay/node_modules" ]; then
    echo "[ERREUR] Dependances npm non installees"
    echo "         Executez d'abord: ./install.sh"
    exit 1
fi

echo "[OK] Installation detectee"

# Verifier que Docker est actif
echo "Verification de Docker..."
if ! docker ps &> /dev/null; then
    echo "[ERREUR] Docker n'est pas en cours d'execution ou ne repond pas"
    echo "         Demarrez Docker Desktop et relancez ce script"
    exit 1
fi

echo "[OK] Docker est actif"
echo ""

# ============================================================
# Demarrage d'eSignet
# ============================================================
echo "[2/5] Demarrage d'eSignet..."
echo ""

cd "$SCRIPT_DIR/esignet-master/docker-compose"

echo "Demarrage des conteneurs Docker..."
docker compose up -d
echo "[OK] Conteneurs eSignet demarres"

echo ""
echo "Services eSignet:"
echo "  - PostgreSQL      : localhost:5455"
echo "  - Redis           : localhost:6379"
echo "  - Mock Identity   : localhost:8082"
echo "  - eSignet Backend : localhost:8088"
echo "  - eSignet UI      : localhost:3000"
echo ""

cd "$SCRIPT_DIR"

# ============================================================
# Attente qu'eSignet soit pret
# ============================================================
echo "[3/5] Attente du demarrage d'eSignet..."
echo ""

echo "Verification de l'API eSignet (peut prendre 5-10 minutes)..."

MAX_ATTEMPTS=200
ATTEMPT=0

printf "  "

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -sf http://localhost:8088/v1/esignet/csrf/token &> /dev/null; then
        echo ""
        echo "[OK] eSignet API est pret"
        break
    fi

    printf "."
    sleep 3
    ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo ""
    echo "[ERREUR] eSignet n'a pas demarre dans le delai imparti"
    echo "         Verifiez les logs: docker compose -f esignet-master/docker-compose/docker-compose.yml logs"
    exit 1
fi

# Attendre Mock Identity System
echo "Verification du Mock Identity System..."
ATTEMPT=0
printf "  "

while [ $ATTEMPT -lt 30 ]; do
    if curl -sf http://localhost:8082/v1/mock-identity-system/actuator/health &> /dev/null; then
        echo ""
        echo "[OK] Mock Identity System est pret"
        break
    fi

    printf "."
    sleep 3
    ATTEMPT=$((ATTEMPT + 1))
done

echo ""

# Verification finale de tous les conteneurs
echo "Verification finale de tous les conteneurs..."
CONTAINERS_OK=true

REQUIRED_CONTAINERS=("redis-server" "docker-compose-database-1" "docker-compose-mock-identity-system-1" "docker-compose-esignet-1" "docker-compose-esignet-ui-1")

for container in "${REQUIRED_CONTAINERS[@]}"; do
    if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        echo "[ERREUR] Le conteneur $container n'est pas demarre"
        CONTAINERS_OK=false
    fi
done

if [ "$CONTAINERS_OK" = true ]; then
    echo "[OK] Tous les conteneurs sont demarres"
else
    echo "[ERREUR] Certains conteneurs ne sont pas demarres"
    echo "         Verifiez avec: docker ps"
    exit 1
fi

echo ""

# ============================================================
# Configuration OIDC
# ============================================================
echo "[4/5] Configuration OIDC..."
echo ""

cd "$SCRIPT_DIR/CottonPay"

echo "Enregistrement du client OIDC..."
npm run register-client
echo "[OK] Client OIDC enregistre"

echo "Creation/verification de l'utilisateur de test..."
npm run create-test-user
echo "[OK] Utilisateur de test pret"

cd "$SCRIPT_DIR"
echo ""

# ============================================================
# Demarrage de CottonPay Backend
# ============================================================
echo "[5/5] Demarrage de CottonPay..."
echo ""

cd "$SCRIPT_DIR/CottonPay"

# Verifier si le backend est deja demarre
if [ -f "$SCRIPT_DIR/.cottonpay.pid" ]; then
    PID=$(cat "$SCRIPT_DIR/.cottonpay.pid")
    if ps -p $PID > /dev/null 2>&1; then
        echo "[INFO] CottonPay Backend deja demarre (PID: $PID)"
        cd "$SCRIPT_DIR"

        echo ""
        echo "============================================================"
        echo "  CottonPay est operationnel !"
        echo "============================================================"
        echo ""
        echo "Application CottonPay : http://localhost:3002"
        echo ""
        echo "Identifiants de test :"
        echo "  NPI : 1234567890123456"
        echo "  OTP : 111111"
        echo ""

        exit 0
    else
        rm -f "$SCRIPT_DIR/.cottonpay.pid"
    fi
fi

echo "Demarrage du serveur CottonPay Backend..."

# Demarrer le backend en arriere-plan
nohup npm run start:backend > logs/backend.log 2>&1 &
PID=$!
echo $PID > "$SCRIPT_DIR/.cottonpay.pid"

# Attendre que le backend soit pret
echo "Verification du backend CottonPay..."
ATTEMPT=0
printf "  "

while [ $ATTEMPT -lt 20 ]; do
    if curl -sf http://localhost:3002/health &> /dev/null; then
        echo ""
        echo "[OK] CottonPay Backend demarre (PID: $PID)"
        break
    fi

    printf "."
    sleep 2
    ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -eq 20 ]; then
    echo ""
    echo "[ERREUR] Le backend ne repond pas"
    echo "         Verifiez les logs: tail -f CottonPay/logs/backend.log"
    kill $PID 2>/dev/null || true
    rm -f "$SCRIPT_DIR/.cottonpay.pid"
    exit 1
fi

cd "$SCRIPT_DIR"
echo ""

# ============================================================
# Resume final
# ============================================================
echo "============================================================"
echo "  CottonPay est operationnel !"
echo "============================================================"
echo ""
echo "Application CottonPay : http://localhost:3002"
echo ""
echo "Services eSignet :"
echo "  - eSignet UI      : http://localhost:3000"
echo "  - eSignet Backend : http://localhost:8088"
echo "  - Mock Identity   : http://localhost:8082"
echo ""
echo "Identifiants de test :"
echo "  NPI : 1234567890123456"
echo "  OTP : 111111"
echo ""
echo "Logs :"
echo "  Backend CottonPay : tail -f CottonPay/logs/backend.log"
echo "  eSignet           : docker compose -f esignet-master/docker-compose/docker-compose.yml logs -f"
echo ""
