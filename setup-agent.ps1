# setup-agent.ps1
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ApiUrl = 'http://localhost:4000'
$Seed = 'db7cf33aff55ce8e31266b5b23ed54e2'

function Write-Info([string]$Message) { Write-Host $Message -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host $Message -ForegroundColor Green }
function Write-Warn([string]$Message) { Write-Host $Message -ForegroundColor Yellow }
function Write-ErrorExit([string]$Message) { Write-Host $Message -ForegroundColor Red; exit 1 }

function Load-EnvFile([string]$Path) {
    if (Test-Path $Path) {
        Get-Content $Path | ForEach-Object {
            $line = $_.Trim()
            if (-not $line -or $line.StartsWith('#')) { return }
            $parts = $line -split '=', 2
            if ($parts.Count -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim().Trim("`"")
                [System.Environment]::SetEnvironmentVariable($key, $value)
            }
        }
    }
}

Load-EnvFile "$ScriptDir\eidStack-CMU\.env.development"

$AgentEndpoint = [System.Environment]::GetEnvironmentVariable('AGENT_PUBLIC_URL')
if (-not $AgentEndpoint) { $AgentEndpoint = 'http://localhost:3021' }

Write-Host ""
Write-Host "============================================================"
Write-Host "  Initialisation de l'Agent SSI"
Write-Host "============================================================"
Write-Host ""

Write-Host "[IMPORTANT] Prérequis : Enregistrement du DID sur BCovrin"
Write-Host ""
Write-Host "Avant de continuer, assurez-vous d'avoir enregistré le DID sur :"
Write-Host "  http://test.bcovrin.vonx.io/"
Write-Host ""
Write-Host "Paramètres d'enregistrement :"
Write-Host "  - Seed : $Seed"
Write-Host "  - Alias : CottonPay-Issuer"
Write-Host "  - Role : ENDORSER (obligatoire)"
Write-Host ""

$answer = Read-Host 'Avez-vous deja enregistre le DID avec le role ENDORSER ? (o/n)'
if ($answer -notmatch '^[oOyY]$') {
    Write-ErrorExit "Veuillez d'abord enregistrer le DID sur BCovrin, puis relancez ce script."
}

Write-Host ""
Write-Info "[1/6] Nettoyage de l'ancien wallet (si existe)..."
$walletPaths = @(
    "$HOME\.askar",
    "$HOME\.local\share\askar",
    "$HOME\.indy_client"
)
$walletCleaned = $false
foreach ($path in $walletPaths) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force
        Write-Ok "[OK] Ancien wallet supprime : $path"
        $walletCleaned = $true
    }
}
if (-not $walletCleaned) { Write-Ok "[OK] Aucun ancien wallet trouve (premiere installation)" }
Write-Host ""

Write-Info "[2/6] Verification du serveur..."
try {
    Invoke-WebRequest -Uri "$ApiUrl/api/docs" -UseBasicParsing -TimeoutSec 5 | Out-Null
    Write-Ok "[OK] Serveur actif sur $ApiUrl"
} catch {
    Write-ErrorExit "[ERREUR] Le serveur n'est pas demarre. Demarrez le serveur avec : npm run start:dev puis relancez ce script"
}
Write-Host ""

Write-Info "[3/6] Initialisation de l'agent SSI..."
$payload = [PSCustomObject]@{
    walletId = 'cottonpay-issuer-wallet'
    walletKey = 'cottonpay-secure-key-2024'
    endpoint = $AgentEndpoint
    label = 'CottonPay-Issuer'
    seed = $Seed
}
try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/credo-agent/initAgent" -Method Post -ContentType 'application/json' -Body ($payload | ConvertTo-Json -Depth 5)
} catch {
    Write-ErrorExit "[ERREUR] Echec de l'initialisation de l'agent : $_"
}

if ($response.issuerDid) {
    Write-Ok "[OK] Agent initialise"
    Write-Host "     DID: $($response.issuerDid)"
} else {
    Write-ErrorExit "[ERREUR] Echec de l'initialisation de l'agent"
}
Write-Host ""

function Get-SchemaId([string]$name) {
    try {
        $res = Invoke-RestMethod -Uri "$ApiUrl/issuance/schemas" -UseBasicParsing
        $items = $res.data.items
        foreach ($schema in $items) {
            if ($schema.name -eq $name) { return $schema.schema_id }
        }
    } catch {
        return $null
    }
    return $null
}

function Ensure-Schema([string]$name, [string]$schemaJson) {
    $existing = Get-SchemaId $name
    if ($existing) {
        Write-Ok "[OK] Schema $name existe deja"
        return $existing
    }
    try {
        $result = Invoke-RestMethod -Uri "$ApiUrl/issuance/schemas" -Method Post -ContentType 'application/json' -Body $schemaJson
        return $result.data.schemaId
    } catch {
        Write-ErrorExit "[ERREUR] Echec de creation du schema $name : $_"
    }
}

Write-Info "[4/7] Creation du schema FarmerIdentityCredential..."
$farmerSchemaJson = @'
{
  "name": "FarmerIdentityCredential",
  "version": "1.0",
  "attributes": [
    {"attributeName": "farmer_npi", "schemaDataType": "string", "displayName": "NPI Agriculteur"},
    {"attributeName": "farmer_name", "schemaDataType": "string", "displayName": "Nom Complet"},
    {"attributeName": "phone_number", "schemaDataType": "string", "displayName": "Telephone"},
    {"attributeName": "region", "schemaDataType": "string", "displayName": "Region"},
    {"attributeName": "commune", "schemaDataType": "string", "displayName": "Commune"},
    {"attributeName": "verified_by", "schemaDataType": "string", "displayName": "Verifie Par"},
    {"attributeName": "verification_date", "schemaDataType": "string", "displayName": "Date Verification"},
    {"attributeName": "verification_method", "schemaDataType": "string", "displayName": "Methode Verification"}
  ]
}
'@
$farmSchemaId = Ensure-Schema 'FarmerIdentityCredential' $farmerSchemaJson
Write-Ok "[OK] Schema FarmerIdentityCredential OK : $farmSchemaId"
Write-Host ""

Write-Info "[5/7] Creation du schema CottonSaleReceiptCredential..."
$saleSchemaJson = @'
{
  "name": "CottonSaleReceiptCredential",
  "version": "1.0",
  "attributes": [
    {"attributeName": "farmer_npi", "schemaDataType": "string", "displayName": "NPI Agriculteur"},
    {"attributeName": "sale_date", "schemaDataType": "string", "displayName": "Date Vente"},
    {"attributeName": "sale_time", "schemaDataType": "string", "displayName": "Heure Vente"},
    {"attributeName": "cotton_weight_kg", "schemaDataType": "string", "displayName": "Poids Coton (kg)"},
    {"attributeName": "unit_price_fcfa", "schemaDataType": "string", "displayName": "Prix Unitaire (FCFA)"},
    {"attributeName": "total_amount_fcfa", "schemaDataType": "string", "displayName": "Montant Total (FCFA)"},
    {"attributeName": "payment_reference", "schemaDataType": "string", "displayName": "Reference Paiement"},
    {"attributeName": "payment_status", "schemaDataType": "string", "displayName": "Statut Paiement"},
    {"attributeName": "payment_method", "schemaDataType": "string", "displayName": "Methode Paiement"},
    {"attributeName": "transaction_id", "schemaDataType": "string", "displayName": "ID Transaction"},
    {"attributeName": "collection_point", "schemaDataType": "string", "displayName": "Point Collecte"}
  ]
}
'@
$saleSchemaId = Ensure-Schema 'CottonSaleReceiptCredential' $saleSchemaJson
Write-Ok "[OK] Schema CottonSaleReceiptCredential OK : $saleSchemaId"
Write-Host ""

Write-Info "[6/7] Creation du schema CooperativeMemberCredential..."
$memberSchemaJson = @'
{
  "name": "CooperativeMemberCredential",
  "version": "1.0",
  "attributes": [
    {"attributeName": "npi", "schemaDataType": "string", "displayName": "NPI"},
    {"attributeName": "name", "schemaDataType": "string", "displayName": "Nom"},
    {"attributeName": "cooperative_id", "schemaDataType": "string", "displayName": "Cooperative"},
    {"attributeName": "role", "schemaDataType": "string", "displayName": "Role"}
  ]
}
'@
$memberSchemaId = Ensure-Schema 'CooperativeMemberCredential' $memberSchemaJson
Write-Ok "[OK] Schema CooperativeMemberCredential OK : $memberSchemaId"
Write-Host ""

function Ensure-CredentialDefinition([string]$schemaId, [string]$tag, [string]$name) {
    try {
        $existing = Invoke-RestMethod -Uri "$ApiUrl/issuance/credential-definitions" -UseBasicParsing
        foreach ($item in $existing.data.items) {
            if ($item.name -eq $tag -or $item.tag -eq $tag) { return $item.cred_def_id }
        }
    } catch {
        # ignore
    }
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        Write-Host "Tentative $attempt/3 pour $name..."
        $body = [PSCustomObject]@{
            schemaId = $schemaId
            tag = $tag
            supportRevocation = $false
        }
        try {
            $result = Invoke-RestMethod -Uri "$ApiUrl/issuance/credential-definitions" -Method Post -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 5)
            if ($result.data.credDefId) { return $result.data.credDefId }
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    Write-ErrorExit "[ERREUR] Echec de creation de la Credential Definition pour $name"
}

Write-Info "[7/7] Creation des Credential Definitions..."
$farmerCredDefId = Ensure-CredentialDefinition $farmSchemaId 'FarmerIdentityCredential' 'FarmerIdentityCredential'
Write-Ok "[OK] CredDef FarmerIdentityCredential : $farmerCredDefId"
$saleCredDefId = Ensure-CredentialDefinition $saleSchemaId 'CottonSaleReceiptCredential' 'CottonSaleReceiptCredential'
Write-Ok "[OK] CredDef CottonSaleReceiptCredential : $saleCredDefId"
$memberCredDefId = Ensure-CredentialDefinition $memberSchemaId 'member-v1' 'CooperativeMemberCredential'
Write-Ok "[OK] CredDef CooperativeMemberCredential : $memberCredDefId"
Write-Host ""
Write-Host "============================================================"
Write-Host "  Initialisation terminee avec succes !"
Write-Host "============================================================"
Write-Host ""
