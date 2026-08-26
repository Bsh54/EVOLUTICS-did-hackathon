# stop.ps1
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$PidFile = Join-Path $ScriptDir '.cottonpay.pid'

function Write-Info([string]$Message) { Write-Host $Message -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host $Message -ForegroundColor Green }
function Write-WarningMsg([string]$Message) { Write-Host $Message -ForegroundColor Yellow }

Write-Host ""
Write-Host "============================================================"
Write-Host "  Arrêt de CottonPay"
Write-Host "============================================================"
Write-Host ""

Write-Info "[1/2] Arrêt du backend CottonPay..."
if (Test-Path $PidFile) {
    $existingPid = Get-Content $PidFile | ForEach-Object { $_.Trim() } | Select-Object -First 1
    if ($existingPid -and (Get-Process -Id $existingPid -ErrorAction SilentlyContinue)) {
        Stop-Process -Id $existingPid -Force
        Write-Ok "[OK] Backend CottonPay arrêté (PID: $existingPid)"
    } else {
        Write-WarningMsg "[INFO] Aucun processus actif pour ce PID"
    }
    Remove-Item $PidFile -ErrorAction SilentlyContinue
} else {
    Write-WarningMsg "[INFO] Backend CottonPay déjà arrêté"
}
Write-Host ""

Write-Info "[2/2] Arrêt d'eidStack-CMU..."
if (-not (Test-Path "$ScriptDir\eidStack-CMU\docker-compose.yml")) {
    Write-WarningMsg "[INFO] eidStack-CMU introuvable, étape ignorée"
} else {
    Set-Location "$ScriptDir\eidStack-CMU"
    & docker compose down
    Set-Location $ScriptDir
    Write-Ok "[OK] eidStack-CMU arrêté"
}
Write-Host ""

Write-Host "============================================================"
Write-Host "  CottonPay est arrêté"
Write-Host "============================================================"
Write-Host ""
