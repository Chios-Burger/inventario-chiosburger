@echo off
echo ======================================
echo    INSTALADOR - Sistema de Inventario
echo ======================================
echo.

REM Verificar Node.js
echo Verificando Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado. Por favor instala Node.js version 18 o superior
    echo        Descarga desde: https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo OK Node.js encontrado: %NODE_VERSION%
)

REM Verificar npm
echo Verificando npm...
npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm no esta instalado
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo OK npm encontrado: %NPM_VERSION%
)

echo.
echo Instalando dependencias del frontend...
call npm install

echo.
echo Instalando dependencias del servidor...
cd server
call npm install
cd ..

echo.
echo Configurando variables de entorno...

REM Crear .env del frontend si no existe
if not exist .env (
    echo VITE_API_URL=http://localhost:3001/api > .env
    echo OK Archivo .env del frontend creado
) else (
    echo INFO Archivo .env del frontend ya existe
)

REM Crear .env del servidor si no existe
if not exist server\.env (
    (
        echo DB_HOST=chiosburguer.postgres.database.azure.com
        echo DB_USER=adminChios
        echo DB_PASSWORD=Burger2023
        echo DB_NAME=InventariosLocales
        echo DB_PORT=5432
        echo PORT=3001
    ) > server\.env
    echo OK Archivo server\.env creado
) else (
    echo INFO Archivo server\.env ya existe
)

echo.
echo ======================================
echo    INSTALACION COMPLETADA!
echo ======================================
echo.
echo Para ejecutar el proyecto:
echo.
echo 1. En una terminal, ejecuta el servidor:
echo    cd server
echo    npm start
echo.
echo 2. En otra terminal, ejecuta el frontend:
echo    npm run dev
echo.
echo 3. Abre tu navegador en http://localhost:5173
echo.
echo ======================================
pause