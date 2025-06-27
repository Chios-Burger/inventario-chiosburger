# Guía de Despliegue - Sistema de Inventario ChiosBurger

## Arquitectura

El sistema consta de dos partes:
1. **Frontend**: Aplicación React con Vite
2. **Backend**: API Express con PostgreSQL

## Requisitos Previos

- Node.js 18+
- Cuenta en Vercel (para frontend)
- Cuenta en Railway/Render (para backend)
- Base de datos PostgreSQL en Azure

## Configuración de Variables de Entorno

### Frontend (.env)
```env
VITE_API_URL=https://tu-backend-url.com/api
VITE_AIRTABLE_API_KEY=patTAcuJ2tPjECEQM.1a60d9818fadd363088d86e405f30bd0bf7ab0ae443490efe17957102b7c0b2b
VITE_AIRTABLE_BASE_ID=app5zYXr1GmF2bmVF
VITE_AIRTABLE_TABLE_ID=tbl8hyvwwfSnrspAt
VITE_AIRTABLE_VIEW_ID=viwTQXKzHMDwwCHwO
```

### Backend (.env)
```env
VITE_DB_HOST=chiosburguer.postgres.database.azure.com
VITE_DB_USER=adminChios
VITE_DB_PASSWORD=Burger2023
VITE_DB_NAME=InventariosLocales
VITE_DB_PORT=5432
PORT=3001
```

## Despliegue del Backend

### Opción 1: Railway

1. Instalar Railway CLI:
```bash
npm install -g @railway/cli
```

2. Iniciar sesión:
```bash
railway login
```

3. Crear nuevo proyecto:
```bash
cd server
railway init
```

4. Configurar variables de entorno en Railway Dashboard

5. Desplegar:
```bash
railway up
```

### Opción 2: Render

1. Crear cuenta en [render.com](https://render.com)

2. Conectar repositorio de GitHub

3. Crear nuevo Web Service:
   - Environment: Node
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`

4. Agregar variables de entorno en Dashboard

5. Deploy automático al hacer push

## Despliegue del Frontend

### Vercel (Recomendado)

1. Instalar Vercel CLI:
```bash
npm install -g vercel
```

2. En la carpeta del proyecto:
```bash
vercel
```

3. Seguir las instrucciones:
   - Link to existing project? No
   - What's your project's name? inventario-chiosburger
   - In which directory is your code located? ./
   - Override settings? No

4. Configurar variables de entorno en Vercel Dashboard:
   - Settings → Environment Variables
   - Agregar `VITE_API_URL` con la URL del backend

5. Para futuros despliegues:
```bash
vercel --prod
```

## Scripts de Despliegue

### package.json principal
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview",
    "deploy:frontend": "vercel --prod",
    "deploy:backend": "cd server && railway up"
  }
}
```

## Configuración de Base de Datos

### Conexión SSL con Azure PostgreSQL

El servidor ya está configurado para usar SSL:
```javascript
ssl: {
  rejectUnauthorized: false
}
```

### Verificar Conexión

1. Endpoint de salud:
```
GET https://tu-backend-url.com/api/health
```

2. Respuesta esperada:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-06-26T..."
}
```

## Monitoreo y Logs

### Frontend (Vercel)
- Dashboard → Functions → View Logs

### Backend (Railway/Render)
- Dashboard → Deployments → View Logs

## Solución de Problemas

### Error de CORS
Verificar configuración en backend:
```javascript
app.use(cors({
  origin: ['https://tu-frontend.vercel.app', 'http://localhost:5173']
}));
```

### Error de Conexión a BD
1. Verificar firewall de Azure permite conexiones
2. Verificar credenciales
3. Verificar SSL habilitado

### Variables de Entorno no Cargadas
1. Verificar nombres exactos (case sensitive)
2. Rebuild después de cambios
3. Verificar en dashboard del servicio

## Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Preview local de producción
npm run preview

# Verificar tipos TypeScript
npm run type-check

# Limpiar cache
rm -rf node_modules .vercel dist
npm install
```

## Seguridad

1. **Nunca commitear credenciales**
2. Usar variables de entorno para todos los secretos
3. Habilitar 2FA en todas las cuentas
4. Revisar permisos de base de datos
5. Implementar rate limiting en producción

## Backup y Recuperación

### Backup de Base de Datos
```sql
pg_dump -h chiosburguer.postgres.database.azure.com -U adminChios -d InventariosLocales > backup.sql
```

### Restaurar Base de Datos
```sql
psql -h chiosburguer.postgres.database.azure.com -U adminChios -d InventariosLocales < backup.sql
```

## Contacto y Soporte

Para problemas de despliegue o acceso a servicios, contactar al equipo de desarrollo.