#!/bin/bash

echo "======================================"
echo "   INSTALADOR - Sistema de Inventario"
echo "======================================"
echo ""

# Verificar Node.js
echo "🔍 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js versión 18 o superior"
    echo "   Descarga desde: https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo "✅ Node.js encontrado: $NODE_VERSION"
fi

# Verificar npm
echo "🔍 Verificando npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
else
    NPM_VERSION=$(npm -v)
    echo "✅ npm encontrado: $NPM_VERSION"
fi

echo ""
echo "📦 Instalando dependencias del frontend..."
npm install

echo ""
echo "📦 Instalando dependencias del servidor..."
cd server
npm install
cd ..

echo ""
echo "⚙️  Configurando variables de entorno..."

# Crear .env del frontend si no existe
if [ ! -f .env ]; then
    echo "VITE_API_URL=http://localhost:3001/api" > .env
    echo "✅ Archivo .env del frontend creado"
else
    echo "ℹ️  Archivo .env del frontend ya existe"
fi

# Crear .env del servidor si no existe
if [ ! -f server/.env ]; then
    cat > server/.env << EOL
DB_HOST=chiosburguer.postgres.database.azure.com
DB_USER=adminChios
DB_PASSWORD=Burger2023
DB_NAME=InventariosLocales
DB_PORT=5432
PORT=3001
EOL
    echo "✅ Archivo server/.env creado"
else
    echo "ℹ️  Archivo server/.env ya existe"
fi

echo ""
echo "🎉 ¡Instalación completada!"
echo ""
echo "Para ejecutar el proyecto:"
echo ""
echo "1. En una terminal, ejecuta el servidor:"
echo "   cd server && npm start"
echo ""
echo "2. En otra terminal, ejecuta el frontend:"
echo "   npm run dev"
echo ""
echo "3. Abre tu navegador en http://localhost:5173"
echo ""
echo "======================================"