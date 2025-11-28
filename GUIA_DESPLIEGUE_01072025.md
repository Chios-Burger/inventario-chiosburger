# Guía de Despliegue - Cambios del 01/07/2025

## 📋 Checklist Pre-Despliegue

### ✅ Backend (Server)
- [ ] Reiniciar servidor local para probar cambios
- [ ] Verificar que no hay errores en consola
- [ ] Probar endpoint de edición: `PUT /api/inventario/:id/editar`
- [ ] Verificar tabla `auditoria_ediciones` creada automáticamente

### ✅ Frontend
- [ ] Probar funcionalidad de edición completa
- [ ] Verificar que el buscador mantiene valores
- [ ] Confirmar botón "Guardar Inventario" requiere todos los productos

## 🚀 Pasos de Despliegue

### 1. **Subir cambios a GitHub**

```bash
# Ya hicimos el commit, ahora push
git push origin main
```

Si pide credenciales, usar tu usuario y token de GitHub.

### 2. **Desplegar Backend**

#### Opción A: Si usas Railway
```bash
cd server
railway up
```

#### Opción B: Si usas Render
- Los cambios se despliegan automáticamente al hacer push a GitHub
- Verificar en dashboard: https://dashboard.render.com

#### Opción C: Si usas otro servicio
1. Conectar por SSH/FTP
2. Pull últimos cambios
3. Reiniciar servicio Node.js

### 3. **Desplegar Frontend en Vercel**

#### Método 1: CLI (Recomendado)
```bash
# En la raíz del proyecto
npm run build
vercel --prod
```

#### Método 2: Git Integration
Si tienes Vercel conectado a GitHub, se desplegará automáticamente.

#### Método 3: Manual
1. Ir a https://vercel.com/dashboard
2. Seleccionar tu proyecto
3. Click en "Redeploy"

### 4. **Verificar Variables de Entorno**

#### Frontend (Vercel)
Asegúrate de tener:
```
VITE_API_URL=https://tu-backend-url.com/api
VITE_AIRTABLE_API_KEY=patTAcuJ2tPjECEQM...
VITE_AIRTABLE_BASE_ID=app5zYXr1GmF2bmVF
VITE_AIRTABLE_TABLE_ID=tbl8hyvwwfSnrspAt
VITE_AIRTABLE_VIEW_ID=viwTQXKzHMDwwCHwO
```

#### Backend
Verificar en tu servicio de hosting:
```
DB_HOST=chiosburguer.postgres.database.azure.com
DB_USER=adminChios
DB_PASSWORD=Burger2023
DB_NAME=InventariosLocales
DB_PORT=5432
PORT=3001
```

## 📊 Verificación Post-Despliegue

### 1. **Test de Salud del Backend**
```bash
curl https://tu-backend-url.com/api/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "database": "connected"
}
```

### 2. **Verificar Tabla de Auditoría**
Conectar a la base de datos y ejecutar:
```sql
SELECT * FROM auditoria_ediciones LIMIT 1;
```

### 3. **Pruebas Funcionales**

#### A. Probar Edición
1. Entrar como `analisis@chiosburger.com`
2. Ir a Histórico
3. Editar un producto de hoy
4. Verificar que se actualiza en BD

#### B. Probar Buscador
1. Ingresar cantidades en varios productos
2. Usar buscador para filtrar
3. Borrar búsqueda
4. Verificar que las cantidades se mantienen

#### C. Verificar Restricciones
1. Intentar guardar sin completar todos los productos
2. Debe mostrar error: "Aún hay X productos sin guardar"

## 🚨 Troubleshooting

### Error: "current transaction is aborted"
- Reiniciar el servidor backend
- Verificar logs para el error original

### Error: Tabla no encontrada
```sql
-- Ejecutar en la base de datos
CREATE TABLE IF NOT EXISTS auditoria_ediciones (
    id SERIAL PRIMARY KEY,
    registro_id VARCHAR(50) NOT NULL,
    fecha_registro TIMESTAMP NOT NULL,
    usuario_email VARCHAR(100) NOT NULL,
    usuario_nombre VARCHAR(100),
    producto_codigo VARCHAR(20),
    producto_nombre VARCHAR(100),
    campo_modificado VARCHAR(20) DEFAULT 'total',
    valor_anterior DECIMAL(10,3),
    valor_nuevo DECIMAL(10,3),
    diferencia DECIMAL(10,3),
    motivo TEXT,
    bodega_id INTEGER,
    bodega_nombre VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Frontend no se actualiza
1. Limpiar caché del navegador
2. En Vercel: Redeploy con "Force new deployment"

## 📝 Rollback (Si es necesario)

### Revertir Frontend
```bash
# En Vercel Dashboard
# Deployments → Select previous deployment → Promote to Production
```

### Revertir Backend
```bash
git revert HEAD
git push origin main
# El servicio se actualizará automáticamente
```

## 📞 Contactos de Emergencia

- **Base de Datos Azure**: Portal Azure → Support
- **Vercel**: https://vercel.com/support
- **Railway/Render**: Dashboard → Support

## ✅ Confirmación Final

Una vez desplegado, confirmar:
- [ ] Backend responde correctamente
- [ ] Frontend carga sin errores
- [ ] Edición funciona correctamente
- [ ] Auditoría se registra en BD
- [ ] Buscador mantiene valores
- [ ] Validaciones funcionan

---

**Fecha de despliegue:** ___________
**Desplegado por:** ___________
**Versión:** 1.0.0 (01/07/2025)