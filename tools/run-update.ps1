$Root = Split-Path -Parent $PSScriptRoot
$LogDir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$Stamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$Log = Join-Path $LogDir "$Stamp-update.log"
$StdoutLog = Join-Path $LogDir "$Stamp-update.stdout.log"
$StderrLog = Join-Path $LogDir "$Stamp-update.stderr.log"
$LockDir = Join-Path $Root '.update.lock'

if (Test-Path $LockDir) {
  $LockAge = ((Get-Date) - (Get-Item $LockDir).LastWriteTime).TotalMinutes
  if ($LockAge -lt 120) {
    $Text = "Skipped: another portal update is already running. Lock age: $([math]::Round($LockAge, 1)) minutes."
    Set-Content -Path $Log -Value "$Text`nExitCode: 0" -Encoding UTF8
    Write-Output $Text
    exit 0
  }
  Remove-Item -LiteralPath $LockDir -Recurse -Force -ErrorAction SilentlyContinue
}

New-Item -ItemType Directory -Path $LockDir -ErrorAction Stop | Out-Null

Set-Location $Root
$Script = Join-Path $Root 'tools\update-portal.mjs'

try {
  $Node = (Get-Command node -ErrorAction Stop).Source
  $Process = Start-Process `
    -FilePath $Node `
    -ArgumentList @($Script) `
    -WorkingDirectory $Root `
    -RedirectStandardOutput $StdoutLog `
    -RedirectStandardError $StderrLog `
    -WindowStyle Hidden `
    -Wait `
    -PassThru

  $Parts = @()
  if (Test-Path $StdoutLog) {
    $Stdout = Get-Content -Path $StdoutLog -Raw -ErrorAction SilentlyContinue
    if ($Stdout) { $Parts += $Stdout.TrimEnd() }
  }
  if (Test-Path $StderrLog) {
    $Stderr = Get-Content -Path $StderrLog -Raw -ErrorAction SilentlyContinue
    if ($Stderr) { $Parts += $Stderr.TrimEnd() }
  }
  $Parts += "ExitCode: $($Process.ExitCode)"
  $Text = $Parts -join [Environment]::NewLine
  Set-Content -Path $Log -Value $Text -Encoding UTF8
  Write-Output $Text

  $ExitCode = $Process.ExitCode

  if ($ExitCode -ne 0) {
    throw "Portal update failed with exit code $ExitCode. See $Log"
  }
} finally {
  Remove-Item -LiteralPath $LockDir -Recurse -Force -ErrorAction SilentlyContinue
}
