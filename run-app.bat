@echo off
title Cert Vault - Gestor de Certificados Digitales
color 0B

echo ====================================================
echo   Cert Vault - Gestor de Certificados Digitales
echo   Desarrollado por Christian Herencia
echo ====================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado en este equipo.
    echo.
    echo Descarga e instala Node.js desde:
    echo https://nodejs.org/
    echo.
    echo Reinicia esta aplicacion despues de instalar Node.js.
    pause
    exit /b 1
)

echo [OK] Node.js detectado.
echo.

if not exist "node_modules" (
    echo [INFO] Instalando dependencias por primera vez...
    echo Esto puede tardar unos minutos.
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Error al instalar dependencias.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencias instaladas correctamente.
    echo.
)

echo [INFO] Iniciando Cert Vault...
echo.
call npm start
