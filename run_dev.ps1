param(
  [switch]$Check
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($args.Count -gt 0) {
  throw "Unsupported argument(s): $($args -join ' '). Use only -Check or run without arguments."
}

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeModulesVite = Join-Path $projectRoot "node_modules\vite\bin\vite.js"
$packageJson = Join-Path $projectRoot "package.json"
$nodeCommand = "node"
$hostName = "127.0.0.1"
$port = "3000"

if (-not (Test-Path -LiteralPath $packageJson)) {
  throw "package.json not found. Run this script from the Farm_HTML project."
}

if (-not (Test-Path -LiteralPath $nodeModulesVite)) {
  throw "Local Vite is missing. Run npm install before starting dev server."
}

Write-Host "Farm_HTML dev server"
Write-Host "Host: http://$hostName`:$port"
Write-Host "Mode: Vite local dependency only"

if ($Check) {
  Write-Host "Check passed. No dev server started."
  exit 0
}

Set-Location -LiteralPath $projectRoot
& $nodeCommand $nodeModulesVite --host $hostName --port $port --strictPort
