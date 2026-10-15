param([Parameter(Mandatory=$true)][string]$ProjectPath)
$ErrorActionPreference = 'Stop'
$source = $PSScriptRoot
$target = (Resolve-Path -LiteralPath $ProjectPath).Path
if ($source.TrimEnd('\') -eq $target.TrimEnd('\')) { throw 'Extract the update to a separate folder before applying it.' }
if (-not (Test-Path -LiteralPath (Join-Path $target 'package.json'))) { throw 'Target must be your existing project folder containing package.json.' }
$files = Get-Content -LiteralPath (Join-Path $source 'upgrade-files.json') -Raw | ConvertFrom-Json
$backup = Join-Path $target ('upgrade-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
foreach ($relative in $files) {
  if ($relative -match '(^|[\\/])\.\.([\\/]|$)' -or $relative -eq '.env' -or $relative -eq 'server/db.mjs' -or $relative -like 'data/*') { throw 'Protected path in update manifest.' }
  $from = Join-Path $source $relative
  $to = Join-Path $target $relative
  if (-not (Test-Path -LiteralPath $from -PathType Leaf)) { throw "Missing update file: $relative" }
}
foreach ($relative in $files) {
  $from = Join-Path $source $relative
  $to = Join-Path $target $relative
  if (Test-Path -LiteralPath $to) {
    $saved = Join-Path $backup $relative
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $saved) | Out-Null
    Copy-Item -LiteralPath $to -Destination $saved -Force
  }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $to) | Out-Null
  Copy-Item -LiteralPath $from -Destination $to -Force
}
Write-Host "Source updated. Backup: $backup"
Write-Host 'Existing .env, Supabase database and server/db.mjs were preserved.'
Push-Location $target
try {
  & npm.cmd ci
  if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. Source backup is available above.' }
} finally { Pop-Location }
Write-Host 'Ready. Run npm run dev from your existing project folder.'
