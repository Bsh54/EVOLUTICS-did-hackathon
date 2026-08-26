# cottonpay.ps1
param([string[]]$CliArgs)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$LogFile = Join-Path $ScriptDir 'cottonpay-manager.log'
$PidFile = Join-Path $ScriptDir '.cottonpay.pid'
$EidstackPidFile = Join-Path $ScriptDir '.eidstack.pid'

function Write-Info([string]$Message) { Write-Host $Message -ForegroundColor Cyan }
function Write-Success([string]$Message) { Write-Host $Message -ForegroundColor Green }
function Write-WarningMsg([string]$Message) { Write-Host $Message -ForegroundColor Yellow }
function Write-ErrorExit([string]$Message) { Write-Host $Message -ForegroundColor Red; exit 1 }

function Log([string]$Message) {
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    "$timestamp $Message" | Tee-Object -FilePath $LogFile -Append
}

function Test-Url([string]$Url) {
    try {
        Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Test-CottonPayPrerequisites {
    Log 'Vérification des prérequis...'

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-ErrorExit 'Node.js n''est pas installé. Installez Node.js depuis https://nodejs.org/'
    }
    $nodeVersion = (& node -v).TrimStart('v').Split('.')[0]
    if ([int]$nodeVersion -lt 18) {
        Write-ErrorExit "Node.js version 18+ requis (version actuelle: $(& node -v))"
    }
    Write-Success "Node.js $(& node -v) détecté"

    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-ErrorExit 'npm n''est pas installé.'
    }
    Write-Success "npm $(& npm -v) détecté"

    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-ErrorExit 'Docker n''est pas installé. Installez Docker Desktop depuis https://www.docker.com/products/docker-desktop'
    }
    try { & docker ps > $null 2>&1 } catch { Write-ErrorExit 'Docker n''est pas en cours d''exécution' }
    Write-Success 'Docker est actif'

    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-WarningMsg 'Git n''est pas installé (optionnel)'
    } else {
        Write-Success "Git $(& git --version | ForEach-Object { $_ -replace 'git version ', '' }) détecté"
    }
}

function Install-CottonPay {
    Log 'Installation de CottonPay...'
    Write-Info 'Installation de CottonPay...'

    if ((Test-Path "$ScriptDir\CottonPay\.env") -and (Test-Path "$ScriptDir\CottonPay\node_modules")) {
        $choice = Read-Host 'CottonPay est déjà installé. Voulez-vous réinstaller ? (o/N)'
        if ($choice -notmatch '^[oO]$') { return }
    }

    if (-not (Test-Path "$ScriptDir\CottonPay\node_modules")) {
        Set-Location "$ScriptDir\CottonPay"
        & npm install
        Write-Success 'Dépendances CottonPay installées'
    } else {
        Write-Info 'Dépendances CottonPay déjà installées'
    }

    New-Item -ItemType Directory -Force -Path "$ScriptDir\CottonPay\logs" | Out-Null
    New-Item -ItemType Directory -Force -Path "$ScriptDir\CottonPay\backend\keys" | Out-Null

    if (-not (Test-Path "$ScriptDir\CottonPay\.env")) {
        if (Test-Path "$ScriptDir\CottonPay\.env.example") {
            Copy-Item "$ScriptDir\CottonPay\.env.example" "$ScriptDir\CottonPay\.env"
            Write-Success 'Fichier .env créé'
        } else {
            Write-WarningMsg 'Pas de fichier .env.example trouvé'
        }
    }

    if (Test-Path "$ScriptDir\eidStack-CMU") {
        Set-Location "$ScriptDir\eidStack-CMU"
        if (-not (Test-Path "$ScriptDir\eidStack-CMU\node_modules")) {
            & npm install
            Write-Success 'Dépendances eidStack-CMU installées'
        } else {
            Write-Info 'Dépendances eidStack-CMU déjà installées'
        }
    } else {
        Write-WarningMsg 'Dossier eidStack-CMU non trouvé'
    }

    Write-Success 'Installation terminée'
}

function Start-Eidstack {
    Log 'Démarrage d''eidStack-CMU'
    if (-not (Test-Path "$ScriptDir\eidStack-CMU")) {
        Write-WarningMsg 'Dossier eidStack-CMU non trouvé, ignoré'
        return
    }
    if (Test-Path $EidstackPidFile) {
        $processId = Get-Content $EidstackPidFile | Select-Object -First 1
        if ($processId -and (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
            Write-Info "eidStack-CMU déjà démarré (PID : $processId)"
            return
        } else { Remove-Item $EidstackPidFile -ErrorAction SilentlyContinue }
    }
    Set-Location "$ScriptDir\eidStack-CMU"
    if (Test-Path "$ScriptDir\eidStack-CMU\docker-compose.yml") {
        & docker compose up -d
        Write-Success 'eidStack-CMU démarré via Docker'
    } else {
        Write-WarningMsg 'Pas de docker-compose.yml trouvé pour eidStack-CMU'
    }
    for ($i = 0; $i -lt 30; $i++) {
        if (Test-Url 'http://localhost:4000/api/docs') {
            Write-Success 'eidStack-CMU API est prêt'
            return
        }
        Start-Sleep -Seconds 2
    }
}

function Start-CottonPayBackend {
    Log 'Démarrage du backend CottonPay'
    if (Test-Path $PidFile) {
        $processId = Get-Content $PidFile | Select-Object -First 1
        if ($processId -and (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
            Write-Info "Backend CottonPay déjà démarré (PID : $processId)"
            return
        } else { Remove-Item $PidFile -ErrorAction SilentlyContinue }
    }
    Set-Location "$ScriptDir\CottonPay"
    if (-not (Test-Path "$ScriptDir\CottonPay\logs")) { New-Item -ItemType Directory -Force -Path "$ScriptDir\CottonPay\logs" | Out-Null }
    $logPath = "$ScriptDir\CottonPay\logs\backend.log"
    $errorLogPath = "$ScriptDir\CottonPay\logs\backend.err.log"
    $proc = Start-Process -FilePath "$env:ComSpec" -ArgumentList '/c', 'npm run start:backend' -WorkingDirectory "$ScriptDir\CottonPay" -RedirectStandardOutput $logPath -RedirectStandardError $errorLogPath -NoNewWindow -PassThru
    $proc.Id | Out-File -FilePath $PidFile -Encoding ascii

    for ($i = 0; $i -lt 20; $i++) {
        if (Test-Url 'http://localhost:3002/health') {
            Write-Success "Backend CottonPay démarré (PID : $($proc.Id))"
            return
        }
        Start-Sleep -Seconds 2
    }
    Write-ErrorExit 'Le backend ne répond pas. Vérifiez les logs : Get-Content -Path "$logPath" -Wait'
}

function Stop-All {
    Log 'Arrêt de tous les services'
    if (Test-Path $PidFile) {
        $existingPid = Get-Content $PidFile | Select-Object -First 1
        if ($existingPid -and (Get-Process -Id $existingPid -ErrorAction SilentlyContinue)) {
            Stop-Process -Id $existingPid -Force
            Write-Success 'Backend CottonPay arrêté'
        }
        Remove-Item $PidFile -ErrorAction SilentlyContinue
    }
    if (-not (Test-Path "$ScriptDir\eidStack-CMU\docker-compose.yml")) {
        Write-WarningMsg 'eidStack-CMU non trouvé ou docker-compose.yml manquant'
    } else {
        Set-Location "$ScriptDir\eidStack-CMU"
        & docker compose down
        Write-Success 'eidStack-CMU arrêté'
        Set-Location $ScriptDir
    }
}

function Show-Status {
    Write-Host '=========================================='
    Write-Host '  CottonPay - État des Services'
    Write-Host '=========================================='
    Write-Host ''
    Write-Host "eidStack-CMU : $(if (Test-Url 'http://localhost:4000/api/docs') { '✅ Opérationnel' } else { '❌ Arrêté' })"
    if (Test-Path $PidFile) {
        $processId = Get-Content $PidFile | Select-Object -First 1
        if ($processId -and (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
            $status = if (Test-Url 'http://localhost:3002/health') { '✅ Opérationnel' } else { '⚠️ Processus actif mais API ne répond pas' }
            Write-Host "CottonPay Backend : $status (PID : $processId)"
        } else {
            Write-Host 'CottonPay Backend : ❌ Arrêté (PID invalide)'
        }
    } else {
        Write-Host 'CottonPay Backend : ❌ Arrêté'
    }
    Write-Host ''
    Write-Host 'URLs:'
    Write-Host '  CottonPay: http://localhost:3002'
    Write-Host '  eidStack-CMU: http://localhost:4000'
    Write-Host ''
}

function Start-CottonPayMonitoring {
    Write-Host '=========================================='
    Write-Host '  Surveillance Continue Activée'
    Write-Host '=========================================='
    Write-Host 'Appuyez sur Ctrl+C pour arrêter'
    Write-Host ''
    while ($true) {
        Clear-Host
        Write-Host '=========================================='
        Write-Host '  CottonPay - État des Services'
        Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        Write-Host '=========================================='
        Write-Host ''
        Write-Host '🔗 eidStack-CMU:'
        Write-Host "   API: $(if (Test-Url 'http://localhost:4000/api/docs') { '✅ Opérationnel' } else { '❌ Arrêté' })"
        Write-Host ''
        Write-Host '🌾 CottonPay Backend:'
        if (Test-Path $PidFile) {
            $processId = Get-Content $PidFile | Select-Object -First 1
            if ($processId -and (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
                $status = if (Test-Url 'http://localhost:3002/health') { '✅ Opérationnel' } else { '⚠️ Processus actif mais API ne répond pas' }
                Write-Host "   Status: $status"
                Write-Host "   PID: $processId"
            } else {
                Write-Host '   Status: ❌ Processus mort (PID invalide)'
                Remove-Item $PidFile -ErrorAction SilentlyContinue
            }
        } else {
            Write-Host '   Status: ❌ Arrêté'
            Write-Host '   PID: N/A'
        }
        Write-Host ''
        Write-Host '🐳 Conteneurs Docker:'
        $containers = @('eidstack-cmu-app', 'eidstack-postgres')
        foreach ($c in $containers) {
            $running = (& docker ps --format '{{.Names}}' | Select-String "^$c$" -Quiet)
            Write-Host "   $(if ($running) { '✅' } else { '❌' }) $c"
        }
        Write-Host ''
        Write-Host '=========================================='
        Write-Host '  URLs d''Accès'
        Write-Host '=========================================='
        Write-Host '  CottonPay: http://localhost:3002'
        Write-Host '  eidStack-CMU: http://localhost:4000'
        Write-Host ''
        Write-Host 'Prochaine vérification dans 10 secondes...'
        Start-Sleep -Seconds 10
    }
}

function Show-Menu {
    Write-Host ''
    Write-Host '=========================================='
    Write-Host '  CottonPay - Gestionnaire'
    Write-Host '=========================================='
    Write-Host ''
    Write-Host '1) Installer CottonPay'
    Write-Host '2) Démarrer tous les services'
    Write-Host '3) Arrêter tous les services'
    Write-Host '4) Redémarrer tous les services'
    Write-Host '5) Afficher le statut'
    Write-Host '6) Surveillance continue'
    Write-Host '7) Voir les logs'
    Write-Host '8) Quitter'
    Write-Host ''
    $choice = Read-Host 'Choisissez une option'
    switch ($choice) {
        '1' { Test-CottonPayPrerequisites; Install-CottonPay }
        '2' { Test-CottonPayPrerequisites; Start-Eidstack; Start-CottonPayBackend; Show-Status }
        '3' { Stop-All }
        '4' { Stop-All; Start-Sleep -Seconds 2; Test-CottonPayPrerequisites; Start-Eidstack; Start-CottonPayBackend; Show-Status }
        '5' { Show-Status }
        '6' { Start-CottonPayMonitoring }
        '7' {
            Write-Host ''
            Write-Host 'Logs disponibles:'
            Write-Host '1) Backend CottonPay'
            Write-Host '2) eidStack-CMU'
            Write-Host '3) Gestionnaire'
            $logChoice = Read-Host 'Choisir'
            switch ($logChoice) {
                '1' { Get-Content -Path "$ScriptDir\CottonPay\logs\backend.log" -Wait }
                '2' { & docker logs -f eidstack-cmu-app }
                '3' { Get-Content -Path $LogFile -Wait }
                default { Write-WarningMsg 'Option invalide' }
            }
        }
        '8' { Write-Info 'Au revoir!'; exit 0 }
        default { Write-ErrorMsg 'Option invalide' }
    }
}

function Main {
    if (-not (Test-Path $LogFile)) { New-Item -ItemType File -Path $LogFile | Out-Null }
    if ($ScriptArgs.Count -gt 0) {
        switch ($ScriptArgs[0]) {
            'install' { Test-CottonPayPrerequisites; Install-CottonPay }
            'start' { Test-CottonPayPrerequisites; Start-Eidstack; Start-CottonPayBackend; Show-Status }
            'stop' { Stop-All }
            'restart' { Stop-All; Start-Sleep -Seconds 2; Test-CottonPayPrerequisites; Start-Eidstack; Start-CottonPayBackend; Show-Status }
            'status' { Show-Status }
            'monitor' { Start-CottonPayMonitoring }
            default { Write-Host "Usage: .\cottonpay.ps1 {install|start|stop|restart|status|monitor}"; exit 1 }
        }
    } else {
        while ($true) { Show-Menu }
    }
}

Main $CliArgs
