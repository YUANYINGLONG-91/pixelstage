@echo off
rem PixelStage launcher — serves the built app and opens it as a standalone
rem app window (no browser chrome) via Edge/Chrome --app mode.
cd /d "%~dp0"

if not exist node_modules (
  echo [PixelStage] Installing dependencies...
  call npm install || goto :fail
)
if not exist dist (
  echo [PixelStage] Building...
  call npm run build || goto :fail
)

set "URL=http://localhost:4173/editor"
set "EDGE86=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "CHROME86=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

if exist "%EDGE86%" (
  start "" "%EDGE86%" --app=%URL%
) else if exist "%EDGE%" (
  start "" "%EDGE%" --app=%URL%
) else if exist "%CHROME%" (
  start "" "%CHROME%" --app=%URL%
) else if exist "%CHROME86%" (
  start "" "%CHROME86%" --app=%URL%
) else (
  start "" %URL%
)

npx vite preview --port 4173 --strictPort
exit /b 0

:fail
echo [PixelStage] Startup failed. See messages above.
pause
exit /b 1
