#!/bin/bash
# ============================================================
# CottonPay - Setup
# Script de configuration de l'environnement
#
# Ce script configure les fichiers .env, le seed BCovrin,
# la base de données PostgreSQL et installe l'APK mobile.
# À exécuter APRÈS install.sh et install-eidstack.sh.
#
# Usage : ./setup.sh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ============================================================
# Fonctions utilitaires
# ============================================================

print_header() {
    echo ""
    echo -e "${CYAN}============================================================${NC}"
    echo -e "${BOLD}  $1${NC}"
    echo -e "${CYAN}============================================================${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[i]${NC} $1"
}

# ============================================================
# ÉTAPE 0 : Vérification des prérequis
# ============================================================

print_header "Vérification des prérequis"

PREREQS_OK=true

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_step "Node.js installé : $NODE_VERSION"
else
    print_error "Node.js non trouvé"
    echo "         Installez-le : curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs"
    PREREQS_OK=false
fi

# npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_step "npm installé : v$NPM_VERSION"
else
    print_error "npm non trouvé"
    PREREQS_OK=false
fi

# PostgreSQL
if command -v psql &> /dev/null; then
    print_step "PostgreSQL installé"
else
    print_error "PostgreSQL non trouvé"
    echo "         Installez-le : sudo apt install -y postgresql postgresql-contrib"
    PREREQS_OK=false
fi

# curl
if command -v curl &> /dev/null; then
    print_step "curl installé"
else
    print_error "curl non trouvé"
    echo "         Installez-le : sudo apt install -y curl"
    PREREQS_OK=false
fi

# ADB (optionnel)
if command -v adb &> /dev/null; then
    print_step "ADB installé"
    ADB_AVAILABLE=true
else
    print_warn "ADB non trouvé (optionnel - nécessaire pour installer l'APK sur le téléphone)"
    ADB_AVAILABLE=false
fi

if [ "$PREREQS_OK" = false ]; then
    echo ""
    print_error "Des prérequis sont manquants. Installez-les et relancez ce script."
    exit 1
fi

echo ""
print_step "Tous les prérequis sont satisfaits !"

# ============================================================
# ÉTAPE 1 : Configuration connexion USB
# ============================================================

print_header "Connexion téléphone (USB)"

HOST_URL="localhost"

print_info "Le système utilise une connexion USB (câble) entre le téléphone et le PC."
print_info "Le téléphone communique avec le serveur via 'adb reverse' (localhost)."
echo ""
print_warn "Assurez-vous que :"
echo "  1. Le téléphone est branché au PC via câble USB"
echo "  2. Le débogage USB est activé sur le téléphone"
echo "     (Paramètres → Options développeur → Débogage USB)"
echo ""

if [ "$ADB_AVAILABLE" = true ]; then
    DEVICE_COUNT=$(adb devices 2>/dev/null | grep -c "device$" || echo "0")
    if [ "$DEVICE_COUNT" -gt 0 ]; then
        print_step "Téléphone détecté via USB"
    else
        print_warn "Aucun téléphone détecté - branchez-le avant l'étape de l'APK"
    fi
else
    print_warn "ADB non installé - vous devrez installer l'APK manuellement"
fi

echo ""

# ============================================================
# ÉTAPE 2 : Configuration PostgreSQL
# ============================================================

print_header "Configuration PostgreSQL"

# Démarrer PostgreSQL si nécessaire
if ! sudo service postgresql status &> /dev/null; then
    print_info "Démarrage de PostgreSQL..."
    sudo service postgresql start
fi

print_step "PostgreSQL est actif"

# Demander le mot de passe PostgreSQL
echo ""
print_info "Le mot de passe de l'utilisateur 'postgres' est nécessaire pour la base de données."
read -sp "Mot de passe PostgreSQL (utilisateur postgres) : " PG_PASSWORD
echo ""

# Tester la connexion
if PGPASSWORD="$PG_PASSWORD" psql -U postgres -c "SELECT 1;" &> /dev/null; then
    print_step "Connexion PostgreSQL réussie"
else
    print_error "Impossible de se connecter à PostgreSQL avec ce mot de passe"
    echo "         Vérifiez le mot de passe ou configurez pg_hba.conf"
    exit 1
fi

# Créer la base de données si elle n'existe pas
if PGPASSWORD="$PG_PASSWORD" psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "ids-db"; then
    print_step "Base de données 'ids-db' existe déjà"
else
    PGPASSWORD="$PG_PASSWORD" psql -U postgres -c "CREATE DATABASE \"ids-db\";" &> /dev/null
    print_step "Base de données 'ids-db' créée"
fi

DATABASE_URL="postgresql://postgres:${PG_PASSWORD}@localhost:5432/ids-db?schema=public"

echo ""

# ============================================================
# ÉTAPE 3 : Génération du Seed BCovrin
# ============================================================

print_header "Configuration du DID BCovrin"

# Générer un seed aléatoire de 32 caractères
SEED=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

echo "Un seed unique a été généré pour votre agent SSI."
echo ""
echo -e "${BOLD}Vous devez maintenant enregistrer votre DID sur BCovrin Testnet.${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  1. Ouvrez : http://test.bcovrin.vonx.io/"
echo ""
echo "  2. Remplissez le formulaire avec ces valeurs exactes :"
echo ""
echo -e "     ${BOLD}Seed :${NC}  $SEED"
echo -e "     ${BOLD}Alias :${NC} CottonPay-Issuer"
echo -e "     ${BOLD}Role :${NC}  ENDORSER  (sélectionnez dans la liste)"
echo ""
echo "  3. Cliquez sur 'Register DID'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Avez-vous enregistré le DID sur BCovrin avec le rôle ENDORSER ? (o/n) " -n 1
echo ""

if [[ ! $REPLY =~ ^[OoYy]$ ]]; then
    echo ""
    print_warn "Le seed généré est : $SEED"
    print_warn "Enregistrez-le sur BCovrin, puis relancez ce script."
    # Sauvegarder le seed pour réutilisation
    echo "$SEED" > "$SCRIPT_DIR/.generated-seed"
    exit 1
fi

print_step "DID BCovrin enregistré"

echo ""

# ============================================================
# ÉTAPE 4 : Génération des fichiers .env
# ============================================================

print_header "Génération des fichiers d'environnement"

# --- eidStack-CMU/.env ---
cat > "$SCRIPT_DIR/eidStack-CMU/.env" << EOF
DATABASE_URL="${DATABASE_URL}"
AGENT_PUBLIC_URL="http://${HOST_URL}:3021"
AGENT_PORT=3021
BCOVRIN_TESTNET_URL="http://test.bcovrin.vonx.io/register"
INDY_NETWORK_NAMESPACE="bcovrin:test"
ISSUER_LABEL="CottonPay-Issuer"
CREDENTIAL_PROTOCOL_VERSION="v2"
API_BASE_URL="http://${HOST_URL}:4000"
EOF
print_step "eidStack-CMU/.env créé"

# --- eidStack-CMU/.env.development (copie de .env) ---
cp "$SCRIPT_DIR/eidStack-CMU/.env" "$SCRIPT_DIR/eidStack-CMU/.env.development"
print_step "eidStack-CMU/.env.development créé (synchronisé avec .env)"

# --- Mise à jour du seed dans setup-agent.sh ---
sed -i "s/^SEED=.*/SEED=\"${SEED}\"/" "$SCRIPT_DIR/setup-agent.sh"
print_step "setup-agent.sh mis à jour avec le nouveau seed"

# --- CottonPay/.env (vérifier s'il existe) ---
if [ ! -f "$SCRIPT_DIR/CottonPay/.env" ]; then
    if [ -f "$SCRIPT_DIR/CottonPay/.env.example" ]; then
        cp "$SCRIPT_DIR/CottonPay/.env.example" "$SCRIPT_DIR/CottonPay/.env"
        print_step "CottonPay/.env créé depuis .env.example"
    else
        print_warn "CottonPay/.env non trouvé - sera créé par install.sh"
    fi
else
    print_step "CottonPay/.env existe déjà"
fi

# --- Mise à jour de EIDSTACK_URL dans CottonPay/.env ---
if [ -f "$SCRIPT_DIR/CottonPay/.env" ]; then
    sed -i "s|EIDSTACK_URL=.*|EIDSTACK_URL=http://${HOST_URL}:4000|" "$SCRIPT_DIR/CottonPay/.env"
    print_step "CottonPay/.env - EIDSTACK_URL mis à jour avec http://${HOST_URL}:4000"
fi

# --- e-IDapp_CMU/.env ---
if [ ! -f "$SCRIPT_DIR/e-IDapp_CMU/.env" ]; then
    cp "$SCRIPT_DIR/e-IDapp_CMU/.env.sample" "$SCRIPT_DIR/e-IDapp_CMU/.env"
    print_step "e-IDapp_CMU/.env créé depuis .env.sample"
else
    print_step "e-IDapp_CMU/.env existe déjà"
fi

echo ""

# ============================================================
# ÉTAPE 5 : Installation des dépendances
# ============================================================

print_header "Installation des dépendances npm"

# --- eidStack-CMU ---
print_info "Installation des dépendances eidStack-CMU..."
cd "$SCRIPT_DIR/eidStack-CMU"
npm install --legacy-peer-deps 2>&1 | tail -1
print_step "eidStack-CMU - dépendances installées"

# --- Migrations Prisma ---
print_info "Exécution des migrations Prisma..."
npx prisma migrate dev --name init 2>&1 | tail -3
print_step "eidStack-CMU - migrations Prisma terminées"

# --- CottonPay ---
print_info "Installation des dépendances CottonPay..."
cd "$SCRIPT_DIR/CottonPay"
npm install 2>&1 | tail -1
print_step "CottonPay - dépendances installées"

# --- e-IDapp_CMU ---
print_info "Installation des dépendances e-IDapp_CMU..."
cd "$SCRIPT_DIR/e-IDapp_CMU"
npm install --legacy-peer-deps 2>&1 | tail -1
print_step "e-IDapp_CMU - dépendances installées"

cd "$SCRIPT_DIR"
echo ""

# ============================================================
# ÉTAPE 6 : Téléchargement et installation de l'APK
# ============================================================

print_header "Application mobile idsWallet"

APK_URL="https://github.com/Bsh54/EVOLUTICS-did-hackathon/releases/latest/download/idsWallet.apk"
APK_PATH="$SCRIPT_DIR/idsWallet.apk"

print_info "L'APK pré-compilé est disponible sur GitHub Releases."
print_info "Il n'est PAS nécessaire de recompiler - le même APK fonctionne"
print_info "pour tous les serveurs car l'URL est transmise via le QR code."
echo ""

# Télécharger l'APK si curl est disponible
if [ ! -f "$APK_PATH" ]; then
    print_info "Téléchargement de idsWallet.apk depuis GitHub Releases..."
    if curl -L -o "$APK_PATH" "$APK_URL" 2>/dev/null; then
        APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
        print_step "APK téléchargé ($APK_SIZE)"
    else
        print_warn "Impossible de télécharger l'APK automatiquement"
        print_warn "Téléchargez-le manuellement depuis :"
        echo "         $APK_URL"
    fi
else
    print_step "APK déjà présent : idsWallet.apk"
fi

# Installation sur le téléphone via ADB
if [ "$ADB_AVAILABLE" = true ]; then
    echo ""
    DEVICE_COUNT=$(adb devices 2>/dev/null | grep -c "device$" || echo "0")

    if [ "$DEVICE_COUNT" -gt 0 ]; then
        if [ -f "$APK_PATH" ]; then
            print_info "Installation de l'APK sur le téléphone..."
            adb install -r "$APK_PATH"
            print_step "APK installé sur le téléphone"

            # Configurer adb reverse
            adb reverse tcp:4000 tcp:4000
            adb reverse tcp:3021 tcp:3021
            print_step "Ports adb reverse configurés (4000, 3021)"
        fi
    else
        print_warn "Aucun téléphone détecté via USB"
        echo "         Branchez votre téléphone, activez le débogage USB, puis exécutez :"
        echo "         adb install -r idsWallet.apk"
        echo "         adb reverse tcp:4000 tcp:4000"
        echo "         adb reverse tcp:3021 tcp:3021"
    fi
fi

# ============================================================
# RÉSUMÉ FINAL
# ============================================================

print_header "Installation terminée !"

echo "Configuration appliquée :"
echo ""
echo "  Mode de connexion : USB (câble)"
echo "  Base de données   : $DATABASE_URL"
echo "  Agent URL         : http://localhost:3021"
echo "  API URL           : http://localhost:4000"
echo "  Seed BCovrin      : $SEED"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Prochaines étapes pour démarrer les services :"
echo ""
echo -e "  ${BOLD}Terminal 1 (Windows/Git Bash)${NC} - CottonPay + eSignet :"
echo "    ./start.sh"
echo ""
echo -e "  ${BOLD}Terminal 2 (WSL)${NC} - eidStack-CMU :"
echo "    cd eidStack-CMU"
echo "    sudo service postgresql start"
echo "    npm run start:dev"
echo ""
echo -e "  ${BOLD}Terminal 3 (WSL)${NC} - Agent SSI (une seule fois) :"
echo "    ./setup-agent.sh"
echo ""
echo -e "  ${BOLD}PowerShell (Windows)${NC} - Ports USB (à chaque reconnexion) :"
echo "    adb reverse tcp:4000 tcp:4000"
echo "    adb reverse tcp:3021 tcp:3021"
echo ""

echo "  Puis ouvrez : http://localhost:3002"
echo "  Identifiants de test : NPI = 1234567890123456 / OTP = 111111"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_step "Setup terminé avec succès !"
echo ""
