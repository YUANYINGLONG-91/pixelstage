@echo off
rem PixelStage launcher — serves the built app and opens the editor directly.
cd /d "%~dp0"

if not exist node_modules (
  echo [PixelStage] Installing dependencies...
  call npm install || goto :fail
)
if not exist dist (
  echo [PixelStage] Building...
  call npm run build || goto :fail
)

start "" "http://localhost:4173/editor"
npx vite preview --port 4173 --strictPort
exit /b 0

:fail
echo [PixelStage] Startup failed. See messages above.
pause
exit /b 1
