# start.ps1
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$PidFile = Join-Path $ScriptDir '.cottonpay.pid'

function Write-Info([string]$Message) { Write-Host $Message -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host $Message -ForegroundColor Green }
function Write-ErrorExit([string]$Message) { Write-Host $Message -ForegroundColor Red; exit 1 }

function Test-Url([string]$Url) {
    try {
        Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

Write-Host ""
Write-Host "============================================================"
Write-Host "  Démarrage de CottonPay"
Write-Host "============================================================"
Write-Host ""

if (-not (Test-Path "$ScriptDir\CottonPay\.env")) {
    Write-ErrorExit "[ERREUR] Installation non détectée. Exécutez d'abord : .\install.ps1"
}

if (-not (Test-Path "$ScriptDir\CottonPay\node_modules")) {
    Write-ErrorExit "[ERREUR] Dépendances npm non installées. Exécutez d'abord : .\install.ps1"
}

Write-Info "[1/3] Vérification de Docker..."
try {
    & docker ps > $null 2>&1
    Write-Ok "[OK] Docker est actif"
} catch {
    Write-ErrorExit "[ERREUR] Docker n'est pas en cours d'exécution ou ne répond pas. Démarrez Docker Desktop et relancez ce script"
}
Write-Host ""

Write-Info "[2/3] Démarrage d'eidStack-CMU..."
if (-not (Test-Path "$ScriptDir\eidStack-CMU\docker-compose.yml")) {
    Write-Host "[AVERTISSEMENT] eidStack-CMU introuvable, étape ignorée" -ForegroundColor Yellow
} elseif (Test-Url 'http://localhost:4000/api/docs') {
    Write-Ok "[OK] eidStack-CMU déjà démarré"
} else {
    Set-Location "$ScriptDir\eidStack-CMU"
    & docker compose up -d
    Set-Location $ScriptDir

    Write-Host "Vérification de l'API eidStack..."
    $attempt = 0
    while ($attempt -lt 30) {
        if (Test-Url 'http://localhost:4000/api/docs') {
            Write-Host
            Write-Ok "[OK] eidStack-CMU API est prête"
            break
        }
        Write-Host -NoNewline '.'
        Start-Sleep -Seconds 2
        $attempt++
    }
    if ($attempt -eq 30) {
        Write-Host
        Write-Host "[AVERTISSEMENT] eidStack-CMU ne répond pas encore. Vérifiez : docker logs eidstack-cmu-app" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Info "[3/3] Démarrage de CottonPay..."
if (Test-Path $PidFile) {
    try {
        $existingPid = Get-Content $PidFile | ForEach-Object { $_.Trim() } | Select-Object -First 1
        if ($existingPid -and (Get-Process -Id $existingPid -ErrorAction SilentlyContinue)) {
            Write-Ok "[INFO] CottonPay Backend déjà démarré (PID: $existingPid)"
            Write-Host ""
            Write-Host "============================================================"
            Write-Host "  CottonPay est opérationnel !"
            Write-Host "============================================================"
            Write-Host ""
            Write-Host "Application CottonPay : http://localhost:3002"
            Write-Host ""
            exit 0
        } else {
            Remove-Item $PidFile -ErrorAction SilentlyContinue
        }
    } catch {
        Remove-Item $PidFile -ErrorAction SilentlyContinue
    }
}

Set-Location "$ScriptDir\CottonPay"
if (-not (Test-Path "$ScriptDir\CottonPay\logs")) { New-Item -ItemType Directory -Force -Path "$ScriptDir\CottonPay\logs" | Out-Null }
Write-Host "Démarrage du serveur CottonPay Backend..."
$backendLog = "$ScriptDir\CottonPay\logs\backend.log"
$backendErrorLog = "$ScriptDir\CottonPay\logs\backend.err.log"
$process = Start-Process -FilePath "$env:ComSpec" -ArgumentList '/c', 'npm run start:backend' -WorkingDirectory "$ScriptDir\CottonPay" -RedirectStandardOutput $backendLog -RedirectStandardError $backendErrorLog -NoNewWindow -PassThru
$processId = $process.Id
$processId | Out-File -FilePath $PidFile -Encoding ascii

Write-Info "[2/2] Vérification du backend CottonPay..."
$attempt = 0
while ($attempt -lt 20) {
    if (Test-Url 'http://localhost:3002/health') {
        Write-Host
        Write-Ok "[OK] CottonPay Backend démarré (PID: $processId)"
        break
    }
    Write-Host -NoNewline '.'
    Start-Sleep -Seconds 2
    $attempt++
}

if ($attempt -eq 20) {
    Write-Host
    Write-ErrorExit "[ERREUR] Le backend ne répond pas. Vérifiez les logs : Get-Content -Path \"$backendLog\" -Wait"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "  CottonPay est opérationnel !"
Write-Host "============================================================"
Write-Host ""
Write-Host "Application CottonPay : http://localhost:3002"
Write-Host ""
Write-Host "Login coopérative : wallet e-ID (Verifiable Presentation) via eidStack."
Write-Host "Démarrez eidStack-CMU séparément si ce n'est pas déjà fait."
Write-Host ""
Write-Host "Logs :"
Write-Host "  Backend CottonPay : Get-Content -Path \"$backendLog\" -Wait"
