@echo off
title RefinAir Mobile Companion Launcher
cd /d "%~dp0"

echo ======================================================================
echo    RefinAir Mobile: Atmospheric & Indoor Environmental Intelligence
echo ======================================================================
echo.
echo Launching RefinAir Mobile application...
echo.

if exist "node_modules\.bin\serve.cmd" (
    start "" http://localhost:3000
    call npx serve www -l 3000
) else (
    start "" "www\index.html"
    echo Opened mobile interface in your default browser.
)

pause
