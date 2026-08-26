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
echo "[1/2] Verifications prealables..."
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
echo ""

# ============================================================
# Demarrage de CottonPay Backend
# ============================================================
echo "[2/2] Demarrage de CottonPay..."
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
echo "Login cooperative : wallet e-ID (Verifiable Presentation) via eidStack."
echo "Demarrez eidStack-CMU separement si ce n'est pas deja fait."
echo ""
echo "Logs :"
echo "  Backend CottonPay : tail -f CottonPay/logs/backend.log"
echo ""
