.#!/bin/bash
# ============================================================
# CottonPay - Installation Initiale
# A executer UNE SEULE FOIS apres le clonage du projet
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "============================================================"
echo "  Installation de CottonPay"
echo "============================================================"
echo ""

# ============================================================
# Verification des prerequis
# ============================================================
echo "[1/5] Verification des prerequis..."
echo ""

ERRORS=0

# Docke
if ! command -v docker &> /dev/null; then
    echo "[ERREUR] Docker n'est pas installe"
    echo "         Installez Docker Desktop: https://www.docker.com/products/docker-desktop"
    ERRORS=$((ERRORS + 1))
else
    echo "[OK] Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"
fi

# Docker Compose v2
if ! docker compose version &> /dev/null; then
    echo "[ERREUR] Docker Compose v2 n'est pas disponible"
    ERRORS=$((ERRORS + 1))
else
    echo "[OK] Docker Compose $(docker compose version --short 2>/dev/null || echo 'v2')"
fi

# Node.js >= 18
if ! command -v node &> /dev/null; then
    echo "[ERREUR] Node.js n'est pas installe"
    echo "         Installez Node.js 18+: https://nodejs.org"
    ERRORS=$((ERRORS + 1))
else
    NODE_VERSION=$(node -v | tr -d 'v' | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "[ERREUR] Node.js 18+ requis (version actuelle: $(node -v))"
        ERRORS=$((ERRORS + 1))
    else
        echo "[OK] Node.js $(node -v)"
    fi
fi

# npm
if ! command -v npm &> /dev/null; then
    echo "[ERREUR] npm n'est pas installe"
    ERRORS=$((ERRORS + 1))
else
    echo "[OK] npm $(npm -v)"
fi

# curl
if ! command -v curl &> /dev/null; then
    echo "[ERREUR] curl n'est pas installe"
    ERRORS=$((ERRORS + 1))
else
    echo "[OK] curl installe"
fi

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo "[ERREUR] $ERRORS prerequis manquant(s)"
    echo "         Installez les prerequis manquants et relancez ce script"
    exit 1
fi

echo ""

# ============================================================
# Verification que Docker est demarre
# ============================================================
echo "[2/5] Verification de Docker..."
echo ""

if ! docker info &> /dev/null; then
    echo "[ERREUR] Docker n'est pas en cours d'execution"
    echo "         Demarrez Docker Desktop et relancez ce script"
    exit 1
fi

echo "[OK] Docker est actif"
echo ""

# ============================================================
# Creation du reseau Docke
# ============================================================
echo "[3/5] Configuration du reseau Docker..."
echo ""

if docker network inspect mosip_network &> /dev/null; then
    echo "[INFO] Reseau 'mosip_network' deja existant"
else
    docker network create mosip_network
    echo "[OK] Reseau 'mosip_network' cree"
fi

echo ""

# ============================================================
# Installation des dependances CottonPay
# ============================================================
echo "[4/5] Installation de CottonPay..."
echo ""

if [ ! -d "$SCRIPT_DIR/CottonPay" ]; then
    echo "[ERREUR] Le dossier CottonPay est introuvable"
    exit 1
fi

cd "$SCRIPT_DIR/CottonPay"

# Installation des dependances npm
echo "Installation des dependances npm..."
npm install
echo "[OK] Dependances npm installees"
echo ""

# Creation du fichier .env
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "[OK] Fichier .env cree depuis .env.example"
    else
        echo "[ERREUR] Fichier .env.example introuvable"
        exit 1
    fi
else
    echo "[INFO] Fichier .env deja existant"
fi

# Creation des dossiers necessaires
mkdir -p backend/keys
mkdir -p logs
echo "[OK] Dossiers keys/ et logs/ crees"

cd "$SCRIPT_DIR"
echo ""

# ============================================================
# Resume final
# ============================================================
echo "[5/5] Installation terminee"
echo ""
echo "============================================================"
echo "  Installation terminee avec succes !"
echo "============================================================"
echo ""
echo "Prochaine etape :"
echo "  Lancez le script de demarrage :"
echo ""
echo "  ./start.sh"
echo ""
