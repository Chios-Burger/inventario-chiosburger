# GUÍA DE DESPLIEGUE - 2 de Julio 2025

## RESUMEN DE CAMBIOS PRINCIPALES

### 1. **Filtrado de Productos Tipo A,B,C**
   - Se comentó el filtrado por tipo de producto
   - Ahora se muestran TODOS los productos sin importar su tipo
   - El contador de progreso muestra el total de productos

### 2. **Persistencia de Estados**
   - Se corrigió la persistencia de "Producto en 0" y estados guardados
   - Los estados se mantienen después de recargar la página (F5)
   - Se eliminó el problema del doble clic en botones

### 3. **Simplificación de Estados de Sincronización**
   - Se unificaron "Base de datos" y "Sincronizado" en un solo estado
   - Los registros pendientes se eliminan automáticamente después de sincronizar
   - Solo quedan 2 estados: "Base de datos" y "Pendiente"

### 4. **Corrección de Filtro de Fecha**
   - Se arregló el filtro que mostraba registros del día anterior
   - Ahora usa formato ISO (YYYY-MM-DD) consistentemente

### 5. **Código de Productos en Históricos**
   - Se agregó el código de producto en listados históricos
   - Se incluye en todas las exportaciones (CSV, PDF, Excel)

### 6. **Campos Categoría y Tipo A,B,C**
   - Se muestran en exportaciones SIN guardar en base de datos
   - Registros nuevos: muestran valores reales
   - Registros antiguos: muestran "Sin categoría" y "Sin tipo"

## ARCHIVOS MODIFICADOS

### Frontend
- `src/components/Historico.tsx` - Simplificación de estados, corrección fecha, mostrar tipo
- `src/components/ListaProductos.tsx` - Comentado filtro tipo A,B,C, contador total
- `src/components/ProductoConteo.tsx` - Corrección doble clic, persistencia estados
- `src/services/airtable.ts` - Obtener todos los campos de Airtable
- `src/services/historico.ts` - Manejo flexible de campos tipo y categoría
- `src/services/syncService.ts` - Auto-eliminación registros sincronizados
- `src/types/index.ts` - Agregado campo tipo en interfaces
- `src/utils/exportUtils.ts` - Incluir código y tipo en exportaciones

### Backend
- `server/index.js` - REMOVIDO categoria y tipo de operaciones SQL

## PASOS DE DESPLIEGUE

### 1. FRONTEND (Vercel/Netlify)

1. **Build ya está listo** en la carpeta `dist/`

2. **Variables de entorno** necesarias:
   ```
   VITE_AIRTABLE_API_KEY=tu_api_key
   VITE_AIRTABLE_BASE_ID=tu_base_id
   VITE_AIRTABLE_TABLE_ID=tu_table_id
   VITE_AIRTABLE_VIEW_ID=tu_view_id
   VITE_API_URL=https://tu-backend-url.com/api
   ```

3. **Subir archivos**:
   - Si usas Git: `git add .` y `git commit -m "Actualización 02/07/2025"`
   - Si subes manualmente: sube toda la carpeta `dist/`

### 2. BACKEND (Azure/Heroku/etc)

1. **Archivo modificado**: `server/index.js`

2. **Variables de entorno** necesarias:
   ```
   DB_HOST=tu_host_postgres
   DB_USER=tu_usuario
   DB_PASSWORD=tu_password
   DB_NAME=tu_base_datos
   DB_PORT=5432
   PORT=3001
   FRONTEND_URL=https://tu-frontend-url.com
   ```

3. **IMPORTANTE**: NO se requieren cambios en la base de datos

### 3. VERIFICACIÓN POST-DESPLIEGUE

1. **Probar guardado de inventario**
   - Verificar que no hay errores 500
   - Confirmar que se guardan correctamente

2. **Verificar sincronización**
   - Los registros pendientes deben sincronizarse
   - Deben desaparecer después de sincronizar

3. **Probar exportaciones**
   - CSV debe incluir código y tipo
   - PDF debe mostrar todos los campos
   - Excel debe funcionar correctamente

4. **Verificar persistencia**
   - Guardar productos con "Producto en 0"
   - Recargar página (F5)
   - Estados deben mantenerse

## NOTAS IMPORTANTES

1. **Categoría y Tipo**: Solo se muestran en exportaciones, NO se guardan en BD
2. **Registros antiguos**: Mostrarán "Sin categoría" y "Sin tipo"
3. **Sin cambios en BD**: No se requiere ejecutar ningún SQL
4. **Compatibilidad**: Todo es retrocompatible con datos existentes

## PROBLEMAS CONOCIDOS Y SOLUCIONES

- **Error 500 al guardar**: Verificar que el backend actualizado esté desplegado
- **No se ven categoría/tipo**: Normal para registros antiguos
- **Sincronización no funciona**: Verificar URL del API en variables de entorno

## ROLLBACK (Si es necesario)

1. Frontend: Restaurar versión anterior en Vercel/Netlify
2. Backend: Desplegar versión anterior del server/index.js
3. No se requieren cambios en la base de datos