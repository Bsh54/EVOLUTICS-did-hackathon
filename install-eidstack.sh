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
# Installation de Node.js v18.17.1 via nvm
# ============================================================
echo "[1/8] Installation de Node.js..."
echo ""

if ! command -v node &> /dev/null || [ "$(node -v)" != "v18.17.1" ]; then
    echo "Installation de Node.js v18.17.1 via nvm..."

    # Installer nvm si pas present
    if [ ! -d "$HOME/.nvm" ]; then
        echo "Installation de nvm..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    else
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi

    # Installer Node.js 18.17.1
    nvm install 18.17.1
    nvm use 18.17.1
    nvm alias default 18.17.1

    echo "[OK] Node.js v18.17.1 installe"
else
    echo "[OK] Node.js $(node -v) deja installe"
fi

echo ""

# ============================================================
# Installation des outils de compilation
# ============================================================
echo "[2/8] Installation des outils de compilation..."
echo ""

if ! command -v gcc &> /dev/null; then
    echo "Installation de build-essential et python3..."
    sudo apt update
    sudo apt install -y build-essential python3 python3-pip
    echo "[OK] Outils de compilation installes"
else
    echo "[OK] Outils de compilation deja installes"
fi

echo ""

# ============================================================
# Installation de PostgreSQL
# ============================================================
echo "[3/8] Installation de PostgreSQL..."
echo ""

if ! command -v psql &> /dev/null; then
    echo "Installation de PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    echo "[OK] PostgreSQL installe"
else
    echo "[OK] PostgreSQL $(psql --version | awk '{print $3}') deja installe"
fi

echo ""

# ============================================================
# Demarrage de PostgreSQL
# ============================================================
echo "[4/8] Demarrage de PostgreSQL..."
echo ""

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
echo "[5/8] Configuration de la base de donnees..."
echo ""

# Verifier si la base existe deja
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw ids-db; then
    echo "[INFO] Base de donnees 'ids-db' deja existante"
else
    echo "Creation de la base de donnees 'ids-db'..."
    sudo -u postgres psql -c "CREATE DATABASE \"ids-db\";"
    echo "[OK] Base de donnees 'ids-db' creee"
fi

# Configurer l'utilisateur postgres avec mot de passe
echo "Configuration de l'utilisateur PostgreSQL..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres18';" 2>/dev/null || true
echo "[OK] Utilisateur PostgreSQL configure"

echo ""

# ============================================================
# Installation des dependances npm
# ============================================================
echo "[6/8] Installation des dependances npm..."
echo ""

cd "$SCRIPT_DIR/eidStack-CMU"

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
echo "[7/8] Configuration du fichier .env..."
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
echo "[8/8] Configuration de Prisma..."
echo ""

echo "Generation du client Prisma..."
npx --yes prisma@5.15.0 generate --schema=./prisma/schema.prisma

echo "Execution des migrations..."
npx --yes prisma@5.15.0 migrate deploy --schema=./prisma/schema.prisma

echo "[OK] Prisma configure"
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
echo "     cd eidStack-CMU"
echo "     npm run start:dev"
echo ""
echo "  2. Dans un autre terminal, initialiser l'agent :"
echo "     ./setup-agent.sh"
echo ""
echo "Note : Le serveur demarre sur le port 4000"
echo "       L'agent DIDComm ecoute sur le port 3021"
echo ""
