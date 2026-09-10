@echo off
title RefinAir System
cd /d "%~dp0"
if exist "RefinAir.exe" (
    start "" "RefinAir.exe"
) else (
    python app.py
)
