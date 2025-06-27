#!/bin/bash

echo "🚀 Iniciando Sistema de Inventario..."
echo ""

# Verificar si las dependencias están instaladas
if [ ! -d "node_modules" ] || [ ! -d "server/node_modules" ]; then
    echo "⚠️  Las dependencias no están instaladas. Ejecutando instalador..."
    bash install.sh
fi

# Función para matar procesos en los puertos
kill_port() {
    PORT=$1
    PID=$(lsof -ti:$PORT)
    if [ ! -z "$PID" ]; then
        echo "⚠️  Liberando puerto $PORT..."
        kill -9 $PID 2>/dev/null
    fi
}

# Liberar puertos si están en uso
kill_port 3001
kill_port 5173

echo ""
echo "🖥️  Iniciando servidor backend..."
cd server
npm start &
SERVER_PID=$!
cd ..

# Esperar a que el servidor esté listo
echo "⏳ Esperando a que el servidor esté listo..."
sleep 5

echo ""
echo "🌐 Iniciando frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Sistema iniciado!"
echo ""
echo "📌 Frontend: http://localhost:5173"
echo "📌 Backend API: http://localhost:3001/api"
echo ""
echo "🛑 Presiona Ctrl+C para detener ambos servicios"

# Función para limpiar al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    kill $SERVER_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Capturar Ctrl+C
trap cleanup INT

# Mantener el script ejecutándose
wait