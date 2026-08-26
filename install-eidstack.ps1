# install-eidstack.ps1
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

function Write-Info([string]$Message) { Write-Host $Message -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host $Message -ForegroundColor Green }
function Write-ErrorExit([string]$Message) { Write-Host $Message -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "============================================================"
Write-Host "  Installation eidStack-CMU"
Write-Host "============================================================"
Write-Host ""

if ($IsWindows) {
    Write-Info "Exécution native Windows."

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        if (Get-Command nvm -ErrorAction SilentlyContinue) {
            Write-Info "Activation de Node 18.17.1 via nvm..."
            & nvm install 18.17.1 | Out-Null
            & nvm use 18.17.1 | Out-Null
        } else {
            Write-ErrorExit "Node.js 18.17.1 est requis. Installez Node.js 18.17.1 ou nvm-windows, puis relancez ce script."
        }
    } else {
        $nodeVersion = (& node -v).Trim()
        if ($nodeVersion -ne 'v18.17.1') {
            if (Get-Command nvm -ErrorAction SilentlyContinue) {
                Write-Info "Changement de version de Node vers 18.17.1 via nvm..."
                & nvm install 18.17.1 | Out-Null
                & nvm use 18.17.1 | Out-Null
            } else {
                Write-ErrorExit "Node.js 18.17.1 est requis (version actuelle : $nodeVersion). Installez nvm-windows ou Node.js 18.17.1."
            }
        }
    }

    if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
        if (Get-Command winget -ErrorAction SilentlyContinue) {
            Write-Info "PostgreSQL non trouvé. Tentative d'installation via winget..."
            & winget install --id PostgreSQL.PostgreSQL -e --silent
        }
    }

    if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
        Write-ErrorExit "PostgreSQL n'est pas installé ou n'est pas dans le PATH. Installez PostgreSQL 14+ pour Windows et relancez."
    }

    $pgService = Get-Service -Name 'postgresql*' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pgService) {
        if ($pgService.Status -ne 'Running') {
            Write-Info "Démarrage du service PostgreSQL ($($pgService.Name))..."
            Start-Service -Name $pgService.Name
            Start-Sleep -Seconds 5
        }
    } else {
        Write-Warning "Aucun service PostgreSQL détecté. Vérifiez que PostgreSQL est installé et que le service est configuré."
    }

    Set-Location "$ScriptDir\eidStack-CMU"

    Write-Info "Création de la base de données ids-db si nécessaire..."
    try {
        & psql -U postgres -c "CREATE DATABASE \"ids-db\";" 2>$null | Out-Null
    } catch {
        Write-Host "[INFO] La base de données ids-db existe peut-être déjà ou la création a échoué." -ForegroundColor Yellow
    }

    try {
        & psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres18';" 2>$null | Out-Null
    } catch {
        Write-Host "[WARN] Impossible de modifier le mot de passe de l'utilisateur postgres. Vérifiez la configuration PostgreSQL." -ForegroundColor Yellow
    }

    Write-Info "Installation des dépendances eidStack-CMU..."
    npm install --legacy-peer-deps

    if (Test-Path ".env.development") {
        Copy-Item ".env.development" ".env" -Force
    } elseif (-not (Test-Path ".env")) {
        @"
DATABASE_URL="postgresql://postgres:postgres18@localhost:5432/ids-db?schema=public"
AGENT_PUBLIC_URL="http://localhost:3021"
AGENT_PORT=3021
BCOVRIN_TESTNET_URL="http://test.bcovrin.vonx.io/register"
INDY_NETWORK_NAMESPACE="bcovrin:test"
ISSUER_LABEL="CottonPay-Issuer"
CREDENTIAL_PROTOCOL_VERSION="v2"
PORT=4000
"@ | Set-Content -Path .env -NoNewline
    }

    npx prisma generate
    npx prisma migrate deploy
    Write-Ok "[OK] eidStack-CMU installation terminee"
    return
}

if ($IsLinux) {
    Write-Info "Exécution en Linux natif."
    # Ce script est conçu pour Ubuntu WSL ou Linux.
    # Les commandes apt et npm sont exécutées directement.
    if (-not (Get-Command node -ErrorAction SilentlyContinue) -or (& node -v).Trim() -ne 'v18.17.1') {
        if (-not (Test-Path "$HOME/.nvm")) {
            Invoke-Expression "$(curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash)"
        }
        $env:NVM_DIR = "$HOME/.nvm"
        . "$HOME/.nvm/nvm.sh"
        nvm install 18.17.1
        nvm use 18.17.1
        nvm alias default 18.17.1
    }

    if (-not (Get-Command gcc -ErrorAction SilentlyContinue)) {
        sudo apt update
        sudo apt install -y build-essential python3 python3-pip
    }

    if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
        sudo apt update
        sudo apt install -y postgresql postgresql-contrib
    }

    if (-not (sudo service postgresql status > $null 2>&1)) {
        sudo service postgresql start
        Start-Sleep -Seconds 2
    }

    if (-not (sudo -u postgres psql -lqt | cut -d '|' -f 1 | grep -qw ids-db)) {
        sudo -u postgres psql -c "CREATE DATABASE \"ids-db\";"
    }
    sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres18';" 2>$null | Out-Null

    Set-Location "$ScriptDir\eidStack-CMU"
    npm install --legacy-peer-deps

    if (Test-Path ".env.development") {
        Copy-Item ".env.development" ".env" -Force
    } elseif (-not (Test-Path ".env")) {
        @"
DATABASE_URL="postgresql://postgres:postgres18@localhost:5432/ids-db?schema=public"
AGENT_PUBLIC_URL="http://localhost:3021"
AGENT_PORT=3021
BCOVRIN_TESTNET_URL="http://test.bcovrin.vonx.io/register"
INDY_NETWORK_NAMESPACE="bcovrin:test"
ISSUER_LABEL="CottonPay-Issuer"
CREDENTIAL_PROTOCOL_VERSION="v2"
PORT=4000
"@ | Set-Content -Path .env -NoNewline
    }

    npx prisma generate
    npx prisma migrate deploy
    Write-Ok "[OK] eidStack-CMU installation terminee"
    return
}

Write-ErrorExit "Ce script doit être exécuté dans WSL Ubuntu ou Linux natif."
