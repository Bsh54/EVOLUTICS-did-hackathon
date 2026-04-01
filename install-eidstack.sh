#!/bin/bash
# ============================================================
# eidStack-CMU - Installation Initiale (WSL Ubuntu)
# A executer UNE SEULE FOIS apres le clonage du projet
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "============================================================"
echo "  Installation eidStack-CMU"
echo "============================================================"
echo ""

# ============================================================
# Verification des prerequis
# ============================================================
echo "[1/7] Verification des prerequis..."
echo ""

ERRORS=0

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

# PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "[ERREUR] PostgreSQL n'est pas installe"
    echo "         Installez PostgreSQL 14+: sudo apt install postgresql postgresql-contrib"
    ERRORS=$((ERRORS + 1))
else
    echo "[OK] PostgreSQL $(psql --version | awk '{print $3}')"
fi

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo "[ERREUR] $ERRORS prerequis manquant(s)"
    echo "         Installez les prerequis manquants et relancez ce script"
    exit 1
fi

echo ""

# ============================================================
# Verification de PostgreSQL
# ============================================================
echo "[2/7] Verification de PostgreSQL..."
echo ""

# Verifier si PostgreSQL est demarre
if ! sudo service postgresql status &> /dev/null; then
    echo "Demarrage de PostgreSQL..."
    sudo service postgresql start
    sleep 2
fi

echo "[OK] PostgreSQL est actif"
echo ""

# ============================================================
# Creation de la base de donnees
# ============================================================
echo "[3/7] Configuration de la base de donnees..."
echo ""

# Verifier si la base existe deja
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw ids-db; then
    echo "[INFO] Base de donnees 'ids-db' deja existante"
else
    echo "Creation de la base de donnees 'ids-db'..."
    sudo -u postgres psql -c "CREATE DATABASE \"ids-db\";"
    echo "[OK] Base de donnees 'ids-db' creee"
fi

# Verifier/creer l'utilisateur postgres avec mot de passe
echo "Configuration de l'utilisateur PostgreSQL..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres18';" 2>/dev/null || true
echo "[OK] Utilisateur PostgreSQL configure"

echo ""

# ============================================================
# Installation des dependances npm
# ============================================================
echo "[4/7] Installation des dependances npm..."
echo ""

cd "$SCRIPT_DIR"

if [ -d "node_modules" ]; then
    echo "[INFO] node_modules existe deja, reinstallation..."
    rm -rf node_modules package-lock.json
fi

npm install --legacy-peer-deps
echo "[OK] Dependances npm installees"
echo ""

# ============================================================
# Configuration du fichier .env
# ============================================================
echo "[5/7] Configuration du fichier .env..."
echo ""

if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:postgres18@localhost:5432/ids-db?schema=public"
AGENT_PUBLIC_URL="http://localhost:3021"
AGENT_PORT=3021
BCOVRIN_TESTNET_URL="http://test.bcovrin.vonx.io/register"
INDY_NETWORK_NAMESPACE="bcovrin:test"
ISSUER_LABEL="CottonPay-Issuer"
CREDENTIAL_PROTOCOL_VERSION="v2"
PORT=4000
EOF
    echo "[OK] Fichier .env cree"
else
    echo "[INFO] Fichier .env deja existant"
fi

echo ""

# ============================================================
# Generation du client Prisma et migrations
# ============================================================
echo "[6/7] Configuration de Prisma..."
echo ""

echo "Generation du client Prisma..."
cd "$SCRIPT_DIR/eidStack-CMU"
npx --yes prisma@5.15.0 generate

echo "Execution des migrations..."
npx --yes prisma@5.15.0 migrate deploy

echo "[OK] Prisma configure"
echo ""

# ============================================================
# Verification de la compilation
# ============================================================
echo "[7/7] Compilation du projet..."
echo ""

cd "$SCRIPT_DIR/eidStack-CMU"
npm run build
echo "[OK] Projet compile"
echo ""

# ============================================================
# Resume final
# ============================================================
echo "============================================================"
echo "  Installation terminee avec succes !"
echo "============================================================"
echo ""
echo "Prochaines etapes :"
echo ""
echo "  1. Demarrer le serveur :"
echo "     npm run start:dev"
echo ""
echo "  2. Dans un autre terminal, initialiser l'agent :"
echo "     ./setup-agent.sh"
echo ""
echo "Note : Le serveur demarre sur le port 4000"
echo "       L'agent DIDComm ecoute sur le port 3021"
echo ""
