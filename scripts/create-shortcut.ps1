# Creates a Desktop shortcut for the PixelStage desktop app.
# Preference order: NSIS install (Start Menu) → portable exe in dist-electron.
$ErrorActionPreference = "Stop"

$startMenu = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\PixelStage.lnk"
$portable = Join-Path $PSScriptRoot "..\dist-electron\PixelStage-portable.exe"

if (Test-Path $startMenu) {
  $target = $startMenu
} elseif (Test-Path $portable) {
  $target = (Resolve-Path $portable).Path
} else {
  Write-Host "PixelStage app not found."
  Write-Host "Run 'npm run dist' first (or install via PixelStage-Setup-*.exe), then re-run this script."
  exit 1
}

$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut("$env:USERPROFILE\Desktop\PixelStage.lnk")
$sc.TargetPath = $target
$sc.IconLocation = (Resolve-Path (Join-Path $PSScriptRoot "..\assets\pixelstage.ico")).Path
$sc.Description = "PixelStage - HD-2D pixel parallax scene editor"
$sc.Save()

Write-Host "Desktop shortcut created -> $target"
