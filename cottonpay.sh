#!/bin/bash
# ============================================================
# CottonPay - Script de Gestion Complet
# Installation, Démarrage et Surveillance Continue
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/cottonpay-manager.log"
PID_FILE="$SCRIPT_DIR/.cottonpay.pid"
EIDSTACK_PID_FILE="$SCRIPT_DIR/.eidstack.pid"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================
# Fonctions utilitaires
# ============================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERREUR]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1" | tee -a "$LOG_FILE"
}

# ============================================================
# Vérification des prérequis
# ============================================================

check_prerequisites() {
    log_info "Vérification des prérequis..."

    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        log_error "Installez Node.js depuis https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18+ requis (version actuelle: $(node -v))"
        exit 1
    fi
    log_success "Node.js $(node -v) détecté"

    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé"
        exit 1
    fi
    log_success "npm $(npm -v) détecté"

    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        log_error "Installez Docker Desktop depuis https://www.docker.com/products/docker-desktop"
        exit 1
    fi

    if ! docker ps &> /dev/null; then
        log_error "Docker n'est pas en cours d'exécution"
        log_error "Démarrez Docker Desktop et relancez ce script"
        exit 1
    fi
    log_success "Docker est actif"

    # Vérifier Git
    if ! command -v git &> /dev/null; then
        log_warning "Git n'est pas installé (optionnel)"
    else
        log_success "Git $(git --version | cut -d' ' -f3) détecté"
    fi
}

# ============================================================
# Installation
# ============================================================

install_cottonpay() {
    log_info "=========================================="
    log_info "  Installation de CottonPay"
    log_info "=========================================="
    echo ""

    # Vérifier si déjà installé
    if [ -f "$SCRIPT_DIR/CottonPay/.env" ] && [ -d "$SCRIPT_DIR/CottonPay/node_modules" ]; then
        log_info "CottonPay est déjà installé"
        read -p "Voulez-vous réinstaller ? (o/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Oo]$ ]]; then
            return 0
        fi
    fi

    # Installation des dépendances CottonPay
    log_info "Installation des dépendances CottonPay..."
    cd "$SCRIPT_DIR/CottonPay"

    if [ ! -d "node_modules" ]; then
        npm install
        log_success "Dépendances CottonPay installées"
    else
        log_info "Dépendances déjà installées"
    fi

    # Créer les répertoires nécessaires
    mkdir -p logs
    mkdir -p keys

    # Copier .env si nécessaire
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_success "Fichier .env créé"
        else
            log_warning "Pas de fichier .env.example trouvé"
        fi
    fi

    cd "$SCRIPT_DIR"

    # Installation eidStack-CMU
    if [ -d "$SCRIPT_DIR/eidStack-CMU" ]; then
        log_info "Installation des dépendances eidStack-CMU..."
        cd "$SCRIPT_DIR/eidStack-CMU"

        if [ ! -d "node_modules" ]; then
            npm install
            log_success "Dépendances eidStack-CMU installées"
        else
            log_info "Dépendances eidStack-CMU déjà installées"
        fi

        cd "$SCRIPT_DIR"
    else
        log_warning "Dossier eidStack-CMU non trouvé"
    fi

    log_success "Installation terminée"
    echo ""
}

# ============================================================
# Démarrage des services Docker (eSignet)
# ============================================================

start_esignet() {
    log_info "Démarrage d'eSignet..."

    cd "$SCRIPT_DIR/esignet-master/docker-compose"

    # Vérifier si les conteneurs eSignet sont déjà démarrés
    if docker ps --format '{{.Names}}' | grep -q "docker-compose-esignet-1"; then
        log_info "Conteneurs eSignet déjà démarrés"
    else
        docker compose up -d
        log_success "Conteneurs eSignet démarrés"
    fi

    cd "$SCRIPT_DIR"

    # Attendre que eSignet soit prêt
    log_info "Attente du démarrage d'eSignet (peut prendre 5-10 minutes)..."

    MAX_ATTEMPTS=200
    ATTEMPT=0

    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if curl -sf http://localhost:8088/v1/esignet/csrf/token &> /dev/null; then
            log_success "eSignet API est prêt"
            break
        fi

        sleep 3
        ATTEMPT=$((ATTEMPT + 1))

        if [ $((ATTEMPT % 20)) -eq 0 ]; then
            log_info "Toujours en attente... ($ATTEMPT/$MAX_ATTEMPTS)"
        fi
    done

    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        log_error "eSignet n'a pas démarré dans le délai imparti"
        log_error "Vérifiez les logs: docker compose -f esignet-master/docker-compose/docker-compose.yml logs"
        return 1
    fi

    # Attendre Mock Identity System
    log_info "Vérification du Mock Identity System..."
    ATTEMPT=0

    while [ $ATTEMPT -lt 30 ]; do
        if curl -sf http://localhost:8082/v1/mock-identity-system/actuator/health &> /dev/null; then
            log_success "Mock Identity System est prêt"
            break
        fi

        sleep 3
        ATTEMPT=$((ATTEMPT + 1))
    done

    # Vérifier tous les conteneurs
    REQUIRED_CONTAINERS=("redis-server" "docker-compose-database-1" "docker-compose-mock-identity-system-1" "docker-compose-esignet-1" "docker-compose-esignet-ui-1")

    for container in "${REQUIRED_CONTAINERS[@]}"; do
        if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            log_warning "Le conteneur $container n'est pas démarré"
            return 1
        fi
    done

    log_success "Tous les conteneurs eSignet sont opérationnels"
}

# ============================================================
# Nettoyage de la base de données
# ============================================================

clean_database() {
    log_info "Nettoyage de la base de données..."

    # Nettoyer les ventes et agriculteurs (schéma esignet)
    docker exec docker-compose-database-1 psql -U postgres -d mosip_esignet -c "DELETE FROM esignet.sales; DELETE FROM esignet.farmers;" >> "$LOG_FILE" 2>&1

    if [ $? -eq 0 ]; then
        log_success "Base de données nettoyée"
    else
        log_warning "Tables non trouvées (seront créées au premier démarrage)"
    fi

    # Ne pas faire échouer le script si les tables n'existent pas
    return 0
}

# ============================================================
# Configuration OIDC
# ============================================================

configure_oidc() {
    log_info "Configuration OIDC..."

    cd "$SCRIPT_DIR/CottonPay"

    # Enregistrer le client OIDC
    log_info "Enregistrement du client OIDC..."
    npm run register-client >> "$LOG_FILE" 2>&1
    log_success "Client OIDC enregistré"

    # Créer les utilisateurs de test
    log_info "Création des utilisateurs de test..."
    npm run create-test-user >> "$LOG_FILE" 2>&1
    log_success "Utilisateurs de test créés"

    cd "$SCRIPT_DIR"
}

# ============================================================
# Démarrage eidStack-CMU
# ============================================================

start_eidstack() {
    log_info "Démarrage d'eidStack-CMU..."

    if [ ! -d "$SCRIPT_DIR/eidStack-CMU" ]; then
        log_warning "Dossier eidStack-CMU non trouvé, ignoré"
        return 0
    fi

    # Vérifier si déjà démarré
    if [ -f "$EIDSTACK_PID_FILE" ]; then
        PID=$(cat "$EIDSTACK_PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            log_info "eidStack-CMU déjà démarré (PID: $PID)"
            return 0
        else
            rm -f "$EIDSTACK_PID_FILE"
        fi
    fi

    cd "$SCRIPT_DIR/eidStack-CMU"

    # Démarrer avec Docker Compose
    if [ -f "docker-compose.yml" ]; then
        docker compose up -d
        log_success "eidStack-CMU démarré via Docker"
    else
        log_warning "Pas de docker-compose.yml trouvé pour eidStack-CMU"
    fi

    # Attendre que l'API soit prête
    log_info "Vérification de l'API eidStack-CMU..."
    ATTEMPT=0

    while [ $ATTEMPT -lt 30 ]; do
        if curl -sf http://localhost:4000/health &> /dev/null; then
            log_success "eidStack-CMU API est prêt"
            break
        fi

        sleep 2
        ATTEMPT=$((ATTEMPT + 1))
    done

    cd "$SCRIPT_DIR"
}

# ============================================================
# Démarrage CottonPay Backend
# ============================================================

start_cottonpay_backend() {
    log_info "Démarrage du backend CottonPay..."

    # Vérifier si déjà démarré
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            log_info "Backend CottonPay déjà démarré (PID: $PID)"
            return 0
        else
            rm -f "$PID_FILE"
        fi
    fi

    cd "$SCRIPT_DIR/CottonPay/backend"

    # Démarrer le backend
    nohup node server.js > ../logs/backend.log 2>&1 &
    PID=$!
    echo $PID > "$PID_FILE"

    # Attendre que le backend soit prêt
    log_info "Vérification du backend CottonPay..."
    ATTEMPT=0

    while [ $ATTEMPT -lt 20 ]; do
        if curl -sf http://localhost:3002/health &> /dev/null; then
            log_success "Backend CottonPay démarré (PID: $PID)"
            cd "$SCRIPT_DIR"
            return 0
        fi

        sleep 2
        ATTEMPT=$((ATTEMPT + 1))
    done

    log_error "Le backend ne répond pas"
    log_error "Vérifiez les logs: tail -f CottonPay/logs/backend.log"
    kill $PID 2>/dev/null || true
    rm -f "$PID_FILE"
    cd "$SCRIPT_DIR"
    return 1
}

# ============================================================
# Arrêt des services
# ============================================================

stop_all() {
    log_info "Arrêt de tous les services..."

    # Arrêter CottonPay Backend
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            kill $PID
            log_success "Backend CottonPay arrêté"
        fi
        rm -f "$PID_FILE"
    fi

    # Arrêter eidStack-CMU
    if [ -d "$SCRIPT_DIR/eidStack-CMU" ] && [ -f "$SCRIPT_DIR/eidStack-CMU/docker-compose.yml" ]; then
        cd "$SCRIPT_DIR/eidStack-CMU"
        docker compose down
        log_success "eidStack-CMU arrêté"
        cd "$SCRIPT_DIR"
    fi

    # Arrêter eSignet
    cd "$SCRIPT_DIR/esignet-master/docker-compose"
    docker compose down
    log_success "eSignet arrêté"
    cd "$SCRIPT_DIR"

    log_success "Tous les services sont arrêtés"
}

# ============================================================
# Surveillance continue
# ============================================================

monitor_services() {
    log_info "=========================================="
    log_info "  Surveillance Continue Activée"
    log_info "=========================================="
    log_info "Appuyez sur Ctrl+C pour arrêter"
    echo ""

    # Trap pour gérer Ctrl+C
    trap 'log_info "Arrêt de la surveillance..."; exit 0' INT

    while true; do
        clear
        echo "=========================================="
        echo "  CottonPay - État des Services"
        echo "  $(date '+%Y-%m-%d %H:%M:%S')"
        echo "=========================================="
        echo ""

        # Vérifier eSignet
        echo "📦 Services Docker (eSignet):"
        ESIGNET_STATUS="❌ Arrêté"
        if curl -sf http://localhost:8088/v1/esignet/csrf/token &> /dev/null; then
            ESIGNET_STATUS="✅ Opérationnel"
        fi
        echo "   eSignet API: $ESIGNET_STATUS"

        MOCK_STATUS="❌ Arrêté"
        if curl -sf http://localhost:8082/v1/mock-identity-system/actuator/health &> /dev/null; then
            MOCK_STATUS="✅ Opérationnel"
        fi
        echo "   Mock Identity: $MOCK_STATUS"

        # Vérifier eidStack-CMU
        echo ""
        echo "🔗 eidStack-CMU:"
        EIDSTACK_STATUS="❌ Arrêté"
        if curl -sf http://localhost:4000/health &> /dev/null; then
            EIDSTACK_STATUS="✅ Opérationnel"
        fi
        echo "   API: $EIDSTACK_STATUS"

        # Vérifier CottonPay Backend
        echo ""
        echo "🌾 CottonPay Backend:"
        BACKEND_STATUS="❌ Arrêté"
        BACKEND_PID="N/A"

        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if ps -p $PID > /dev/null 2>&1; then
                BACKEND_PID=$PID
                if curl -sf http://localhost:3002/health &> /dev/null; then
                    BACKEND_STATUS="✅ Opérationnel"
                else
                    BACKEND_STATUS="⚠️  Processus actif mais API ne répond pas"
                fi
            else
                BACKEND_STATUS="❌ Processus mort (PID invalide)"
                rm -f "$PID_FILE"
            fi
        fi

        echo "   Status: $BACKEND_STATUS"
        echo "   PID: $BACKEND_PID"

        # Vérifier les conteneurs Docker
        echo ""
        echo "🐳 Conteneurs Docker:"
        CONTAINERS=("redis-server" "docker-compose-database-1" "docker-compose-mock-identity-system-1" "docker-compose-esignet-1" "docker-compose-esignet-ui-1")

        for container in "${CONTAINERS[@]}"; do
            if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
                echo "   ✅ $container"
            else
                echo "   ❌ $container"
            fi
        done

        # URLs d'accès
        echo ""
        echo "=========================================="
        echo "  URLs d'Accès"
        echo "=========================================="
        echo "  CottonPay: http://localhost:3002"
        echo "  eSignet UI: http://localhost:3000"
        echo "  eidStack-CMU: http://localhost:4000"
        echo ""
        echo "Prochaine vérification dans 10 secondes..."

        # Redémarrage automatique si nécessaire
        if [[ "$BACKEND_STATUS" == *"Arrêté"* ]] || [[ "$BACKEND_STATUS" == *"mort"* ]]; then
            log_warning "Backend CottonPay arrêté détecté, tentative de redémarrage..."
            start_cottonpay_backend
        fi

        if [[ "$ESIGNET_STATUS" == *"Arrêté"* ]]; then
            log_warning "eSignet arrêté détecté, tentative de redémarrage..."
            start_esignet
        fi

        sleep 10
    done
}

# ============================================================
# Affichage du statut
# ============================================================

show_status() {
    echo "=========================================="
    echo "  CottonPay - État des Services"
    echo "=========================================="
    echo ""

    # eSignet
    if curl -sf http://localhost:8088/v1/esignet/csrf/token &> /dev/null; then
        echo "✅ eSignet API: Opérationnel"
    else
        echo "❌ eSignet API: Arrêté"
    fi

    # Mock Identity
    if curl -sf http://localhost:8082/v1/mock-identity-system/actuator/health &> /dev/null; then
        echo "✅ Mock Identity: Opérationnel"
    else
        echo "❌ Mock Identity: Arrêté"
    fi

    # eidStack-CMU
    if curl -sf http://localhost:4000/health &> /dev/null; then
        echo "✅ eidStack-CMU: Opérationnel"
    else
        echo "❌ eidStack-CMU: Arrêté"
    fi

    # CottonPay Backend
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            if curl -sf http://localhost:3002/health &> /dev/null; then
                echo "✅ CottonPay Backend: Opérationnel (PID: $PID)"
            else
                echo "⚠️  CottonPay Backend: Processus actif mais API ne répond pas (PID: $PID)"
            fi
        else
            echo "❌ CottonPay Backend: Arrêté (PID invalide)"
        fi
    else
        echo "❌ CottonPay Backend: Arrêté"
    fi

    echo ""
    echo "URLs:"
    echo "  CottonPay: http://localhost:3002"
    echo "  eSignet UI: http://localhost:3000"
    echo "  eidStack-CMU: http://localhost:4000"
    echo ""
}

# ============================================================
# Menu principal
# ============================================================

show_menu() {
    echo ""
    echo "=========================================="
    echo "  CottonPay - Gestionnaire"
    echo "=========================================="
    echo ""
    echo "1) Installer CottonPay"
    echo "2) Démarrer tous les services"
    echo "3) Arrêter tous les services"
    echo "4) Redémarrer tous les services"
    echo "5) Afficher le statut"
    echo "6) Surveillance continue"
    echo "7) Voir les logs"
    echo "8) Quitter"
    echo ""
    read -p "Choisissez une option: " choice

    case $choice in
        1)
            check_prerequisites
            install_cottonpay
            ;;
        2)
            check_prerequisites
            start_esignet
            configure_oidc
            start_eidstack
            start_cottonpay_backend
            clean_database
            log_success "Tous les services sont démarrés"
            show_status
            ;;
        3)
            stop_all
            ;;
        4)
            stop_all
            sleep 2
            check_prerequisites
            start_esignet
            configure_oidc
            start_eidstack
            start_cottonpay_backend
            clean_database
            log_success "Tous les services ont été redémarrés"
            show_status
            ;;
        5)
            show_status
            ;;
        6)
            monitor_services
            ;;
        7)
            echo ""
            echo "Logs disponibles:"
            echo "1) Backend CottonPay"
            echo "2) eSignet"
            echo "3) eidStack-CMU"
            echo "4) Gestionnaire"
            read -p "Choisir: " log_choice

            case $log_choice in
                1) tail -f "$SCRIPT_DIR/CottonPay/logs/backend.log" ;;
                2) docker compose -f "$SCRIPT_DIR/esignet-master/docker-compose/docker-compose.yml" logs -f ;;
                3) docker logs -f eidstack-cmu-app 2>&1 ;;
                4) tail -f "$LOG_FILE" ;;
                *) log_error "Option invalide" ;;
            esac
            ;;
        8)
            log_info "Au revoir!"
            exit 0
            ;;
        *)
            log_error "Option invalide"
            ;;
    esac
}

# ============================================================
# Point d'entrée principal
# ============================================================

main() {
    # Créer le fichier de log s'il n'existe pas
    touch "$LOG_FILE"

    # Si des arguments sont passés
    if [ $# -gt 0 ]; then
        case $1 in
            install)
                check_prerequisites
                install_cottonpay
                ;;
            start)
                check_prerequisites
                start_esignet
                configure_oidc
                start_eidstack
                start_cottonpay_backend
                clean_database
                show_status
                ;;
            stop)
                stop_all
                ;;
            restart)
                stop_all
                sleep 2
                check_prerequisites
                start_esignet
                configure_oidc
                start_eidstack
                start_cottonpay_backend
                clean_database
                show_status
                ;;
            status)
                show_status
                ;;
            monitor)
                monitor_services
                ;;
            *)
                echo "Usage: $0 {install|start|stop|restart|status|monitor}"
                exit 1
                ;;
        esac
    else
        # Mode interactif
        while true; do
            show_menu
        done
    fi
}

# Lancer le script
main "$@"
