@echo off
title Funkin-Tools Dev
cd /d "%~dp0"
echo Starting tauri dev...
npm run tauri dev
echo.
echo Dev exited. Press any key to close...
pause >nul
