# install.ps1
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

function Write-Info([string]$Message) { Write-Host $Message -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host $Message -ForegroundColor Green }
function Write-ErrorExit([string]$Message) { Write-Host $Message -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "============================================================"
Write-Host "  Installation de CottonPay"
Write-Host "============================================================"
Write-Host ""

$Errors = @()

function Test-Command([string]$Name, [scriptblock]$TestAction, [string]$ErrorMessage) {
    try {
        if (-not (& $TestAction)) {
            $Errors += $ErrorMessage
        }
    } catch {
        $Errors += $ErrorMessage
    }
}

Test-Command 'docker' { Get-Command docker -ErrorAction SilentlyContinue } "[ERREUR] Docker n'est pas installé"
if ($Errors.Count -eq 0) {
    try {
        & docker compose version > $null 2>&1
    } catch {
        $Errors += "[ERREUR] Docker Compose v2 n'est pas disponible"
    }
}

try {
    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) {
        $Errors += "[ERREUR] Node.js n'est pas installé"
    } else {
        $nodeVersion = (& node -v).Trim()
        if ($nodeVersion -match '^v?(\d+)') {
            $major = [int]$Matches[1]
            if ($major -lt 18) {
                $Errors += "[ERREUR] Node.js 18+ requis (version actuelle: $nodeVersion)"
            }
        } else {
            $Errors += "[ERREUR] Impossible de déterminer la version de Node.js"
        }
    }
} catch {
    $Errors += "[ERREUR] Node.js n'est pas installé"
}

try {
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        $Errors += "[ERREUR] npm n'est pas installé"
    }
} catch {
    $Errors += "[ERREUR] npm n'est pas installé"
}

try {
    if (-not (Get-Command curl -ErrorAction SilentlyContinue)) {
        $Errors += "[ERREUR] curl n'est pas installé"
    }
} catch {
    $Errors += "[ERREUR] curl n'est pas installé"
}

if ($Errors.Count -gt 0) {
    Write-Host ""
    foreach ($error in $Errors) { Write-Host $error -ForegroundColor Red }
    Write-Host ""
    Write-Host "[ERREUR] $($Errors.Count) prerequis manquant(s)"
    Write-Host "         Installez les prerequis manquants et relancez ce script"
    exit 1
}

Write-Ok "[OK] Prérequis validés"
Write-Host ""

Write-Info "[1/5] Vérification de Docker..."
try {
    & docker info > $null 2>&1
    Write-Ok "[OK] Docker est actif"
} catch {
    Write-ErrorExit "[ERREUR] Docker n'est pas en cours d'exécution. Démarrez Docker Desktop et relancez ce script"
}
Write-Host ""

Write-Info "[2/5] Configuration du réseau Docker..."
try {
    & docker network inspect mosip_network > $null 2>&1
    Write-Host "[INFO] Réseau 'mosip_network' déjà existant"
} catch {
    & docker network create mosip_network
    Write-Ok "[OK] Réseau 'mosip_network' créé"
}
Write-Host ""

Write-Info "[3/5] Installation de CottonPay..."
if (-not (Test-Path "$ScriptDir\CottonPay")) {
    Write-ErrorExit "[ERREUR] Le dossier CottonPay est introuvable"
}

Set-Location "$ScriptDir\CottonPay"
Write-Host "Installation des dépendances npm..."
& npm install
Write-Ok "[OK] Dépendances npm installées"
Write-Host ""

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Ok "[OK] Fichier .env créé depuis .env.example"
    } else {
        Write-ErrorExit "[ERREUR] Fichier .env.example introuvable"
    }
} else {
    Write-Host "[INFO] Fichier .env déjà existant"
}

New-Item -ItemType Directory -Force -Path "$ScriptDir\CottonPay\backend\keys" | Out-Null
New-Item -ItemType Directory -Force -Path "$ScriptDir\CottonPay\logs" | Out-Null
Write-Ok "[OK] Dossiers keys/ et logs/ créés"

Set-Location $ScriptDir
Write-Host ""
Write-Info "[5/5] Installation terminée"
Write-Host ""
Write-Host "============================================================"
Write-Host "  Installation terminée avec succès !"
Write-Host "============================================================"
Write-Host ""
Write-Host "Prochaine étape :"
Write-Host "  Lancez le script de démarrage :"
Write-Host ""
Write-Host "  .\start.ps1"
Write-Host ""
