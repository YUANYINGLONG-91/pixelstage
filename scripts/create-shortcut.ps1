# Creates a Desktop shortcut for PixelStage (opens straight into the editor).
$project = Split-Path -Parent $PSScriptRoot
$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut("$env:USERPROFILE\Desktop\PixelStage.lnk")
$sc.TargetPath = Join-Path $project "start-pixelstage.bat"
$sc.WorkingDirectory = $project
$sc.IconLocation = Join-Path $project "assets\pixelstage.ico"
$sc.WindowStyle = 7  # minimized console window
$sc.Description = "PixelStage - 2.5D pixel parallax scene editor"
$sc.Save()
Write-Host "Shortcut created: $env:USERPROFILE\Desktop\PixelStage.lnk"
