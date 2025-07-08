# Sistema de Inventario - ChiosBurger

## 🚀 Instalación Rápida

### Windows
1. Descomprime el archivo
2. Doble clic en `install.bat`
3. Doble clic en `start.bat`

### Linux/Mac
1. Descomprime el archivo
2. Ejecuta: `bash install.sh`
3. Ejecuta: `bash start.sh`

## 📋 Requisitos Previos

- Node.js 18 o superior
- npm (incluido con Node.js)
- Conexión a Internet (para la base de datos)

## 🛠️ Instalación Manual

Si los scripts automáticos no funcionan:

1. **Instalar dependencias del frontend:**
   ```bash
   npm install
   ```

2. **Instalar dependencias del servidor:**
   ```bash
   cd server
   npm install
   cd ..
   ```

3. **Configurar variables de entorno:**

   Crear archivo `.env` en la raíz:
   ```
   VITE_API_URL=http://localhost:3001/api
   ```

   Crear archivo `server/.env`:
   ```
   DB_HOST=chiosburguer.postgres.database.azure.com
   DB_USER=adminChios
   DB_PASSWORD=Burger2023
   DB_NAME=InventariosLocales
   DB_PORT=5432
   PORT=3001
   ```

4. **Ejecutar el proyecto:**

   Terminal 1:
   ```bash
   cd server
   npm start
   ```

   Terminal 2:
   ```bash
   npm run dev
   ```

## 👤 Usuarios de Prueba

| Usuario | PIN | Acceso |
|---------|-----|--------|
| gerencia@chiosburger.com | 9999 | Todas las bodegas |
| bodegaprincipal@chiosburger.com | 4321 | Bodega Principal y Bodega Pulmon |

## 🏢 Bodegas Disponibles

1. Bodega Principal
2. Bodega Materia Prima
3. Planta De Producción
4. Chios Real Audiencia
5. Chios Floreana
6. Chios Portugal
7. Simón Bolón
8. Santo Cachón
9. Bodega Pulmon

## ❓ Problemas Comunes

### Error de conexión a la base de datos
- Verifica tu conexión a Internet
- Asegúrate que las credenciales en `server/.env` sean correctas

### Puerto ocupado
- Si el puerto 3001 o 5173 están ocupados, cierra las aplicaciones que los usen
- O modifica los puertos en los archivos `.env`

### No se cargan los productos
- Verifica estar logueado con un usuario válido
- Asegúrate de tener permisos para la bodega seleccionada

## 📞 Soporte

Para soporte adicional, contacta al equipo de desarrollo.

---

## 🔧 RUTAS Y COMANDOS DE DESARROLLO

### **Acceso desde Windows (WSL)**

#### **Opción A - PowerShell/CMD:**
```powershell
# Entrar a WSL
wsl

# Navegar al proyecto
cd /home/tiago/inventario-chiosburger

# Ejecutar
bash start.sh
```

#### **Opción B - Comando directo:**
```powershell
wsl -d Ubuntu -e bash -c "cd /home/tiago/inventario-chiosburger && bash start.sh"
```

#### **Opción C - Windows Terminal:**
1. Abrir Windows Terminal
2. Seleccionar perfil Ubuntu
3. Ejecutar:
```bash
cd /home/tiago/inventario-chiosburger
bash start.sh
```

### **Ruta en Explorador de Windows**
```
\\wsl.localhost\Ubuntu\home\tiago\inventario-chiosburger
```

### **Comandos para Desarrollo**

#### **Iniciar proyecto (desarrollo):**
```bash
# Terminal 1 - Backend
cd /home/tiago/inventario-chiosburger/server
npm start

# Terminal 2 - Frontend
cd /home/tiago/inventario-chiosburger
npm run dev
```

#### **URLs de acceso:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001/api`

### **Comandos para Producción**

#### **Generar build:**
```bash
cd /home/tiago/inventario-chiosburger
npm run build
```

#### **Archivos generados:**
- Frontend compilado: `/home/tiago/inventario-chiosburger/dist/`
- Backend: `/home/tiago/inventario-chiosburger/server/`

### **Estructura de Archivos Clave**
```
inventario-chiosburger/
├── src/                    # Código fuente frontend
│   ├── components/         # Componentes React
│   ├── services/          # Servicios (API, BD)
│   └── types/             # Tipos TypeScript
├── server/                # Backend Node.js
│   ├── index.js          # Servidor principal
│   └── .env              # Variables de entorno
├── dist/                  # Build de producción
├── start.sh              # Script inicio Linux
└── package.json          # Dependencias
```

### **Detener el Sistema**
```bash
# En cada terminal
Ctrl + C
```