@echo off
echo Iniciando Sistema de Inventario...
echo.

REM Verificar si las dependencias están instaladas
if not exist "node_modules\" (
    echo Las dependencias no estan instaladas. Ejecutando instalador...
    call install.bat
)
if not exist "server\node_modules\" (
    echo Las dependencias del servidor no estan instaladas. Ejecutando instalador...
    call install.bat
)

echo.
echo Iniciando servidor backend...
start "Backend - Inventario" cmd /k "cd server && npm start"

REM Esperar 3 segundos para que el servidor inicie
timeout /t 3 /nobreak >nul

echo.
echo Iniciando frontend...
start "Frontend - Inventario" cmd /k "npm run dev"

echo.
echo ======================================
echo    Sistema iniciado!
echo ======================================
echo.
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:3001/api
echo.
echo Para detener los servicios, cierra las ventanas de comandos
echo.
pause