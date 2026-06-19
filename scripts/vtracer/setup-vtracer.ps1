[CmdletBinding()]
param(
  [string]$ReleaseZipUrl = "",
  [string]$InstallDir = "$PSScriptRoot\bin",
  [switch]$UseCargo
)

$ErrorActionPreference = "Stop"

function Test-VTracerCommand {
  param([string]$Command)

  try {
    $output = & $Command --help 2>&1
    if ($LASTEXITCODE -eq 0 -and ($output -join "`n") -match "--input" -and ($output -join "`n") -match "--output") {
      return $true
    }
  } catch {
    return $false
  }

  return $false
}

function Resolve-VTracerBinary {
  if ($env:VTRACER_BIN -and (Test-Path -LiteralPath $env:VTRACER_BIN)) {
    return (Resolve-Path -LiteralPath $env:VTRACER_BIN).Path
  }

  $pathCommand = Get-Command vtracer -ErrorAction SilentlyContinue
  if ($pathCommand) {
    return $pathCommand.Source
  }

  return ""
}

$existing = Resolve-VTracerBinary
if ($existing) {
  Write-Host "VTracer already available: $existing"
  & $existing --help | Select-Object -First 12
  exit 0
}

if ($UseCargo) {
  $cargo = Get-Command cargo -ErrorAction SilentlyContinue
  if (-not $cargo) {
    throw "Cargo was requested but was not found on PATH. Install Rust first or provide -ReleaseZipUrl from the official visioncortex/vtracer GitHub Releases page."
  }

  cargo install vtracer
  $installed = Resolve-VTracerBinary
  if (-not $installed) {
    throw "cargo install vtracer finished, but vtracer was not found on PATH."
  }

  Write-Host "VTracer installed via cargo: $installed"
  & $installed --help | Select-Object -First 12
  exit 0
}

if ($ReleaseZipUrl) {
  if ($ReleaseZipUrl -notmatch "^https://github\.com/visioncortex/vtracer/") {
    throw "ReleaseZipUrl must come from the official https://github.com/visioncortex/vtracer repository."
  }

  New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
  $zipPath = Join-Path $InstallDir "vtracer-release.zip"
  Invoke-WebRequest -Uri $ReleaseZipUrl -OutFile $zipPath
  Expand-Archive -LiteralPath $zipPath -DestinationPath $InstallDir -Force

  $binary = Get-ChildItem -LiteralPath $InstallDir -Recurse -Filter "vtracer.exe" | Select-Object -First 1
  if (-not $binary) {
    $binary = Get-ChildItem -LiteralPath $InstallDir -Recurse -Filter "vtracer" | Select-Object -First 1
  }
  if (-not $binary) {
    throw "Downloaded release did not contain a vtracer binary."
  }

  $env:VTRACER_BIN = $binary.FullName
  Write-Host "VTracer downloaded from official release: $($binary.FullName)"
  Write-Host "For this shell: `$env:VTRACER_BIN = `"$($binary.FullName)`""
  & $binary.FullName --help | Select-Object -First 12
  exit 0
}

throw "VTracer was not found. Run with -UseCargo, set VTRACER_BIN, put vtracer on PATH, or pass -ReleaseZipUrl from https://github.com/visioncortex/vtracer/releases."
