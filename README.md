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