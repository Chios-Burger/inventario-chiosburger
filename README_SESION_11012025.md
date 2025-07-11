# 📋 SESIÓN DE DESARROLLO - 11 DE ENERO 2025

## 🏠 CÓMO CLONAR Y CONFIGURAR EN CASA

### 1. Clonar el repositorio
```bash
git clone https://github.com/Chios-Burger/inventario-chiosburger.git
cd inventario-chiosburger
```

### 2. Instalar dependencias
```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 3. Configurar variables de entorno

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

#### Backend (server/.env)
```env
DB_HOST=chiosburguer.postgres.database.azure.com
DB_USER=adminChios
DB_PASSWORD=Burger2023
DB_NAME=InventariosLocales
DB_PORT=5432
PORT=3001
```

### 4. Ejecutar la aplicación
```bash
# Desarrollo (frontend + backend)
npm run dev:all

# O por separado:
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server:dev
```

---

## 🎯 TRABAJO REALIZADO HOY (11 ENERO 2025)

### 1. ✅ BOTÓN "TODO EN 0" PARA PLANTA DE PRODUCCIÓN
- **Ubicación**: Solo visible para bodega ID 3 (Planta de Producción)
- **Funcionalidad**: Pone todos los productos no guardados en cero con un clic
- **Visual**: Botón naranja con icono Package2, modal de progreso
- **Archivos modificados**: 
  - `src/components/ListaProductos.tsx`
  - `src/components/Toast.tsx` (nuevo tipo 'warning')

### 2. ✅ SISTEMA DE MEDICIÓN DE TIEMPOS (Base de datos lista)

#### Tablas creadas en PostgreSQL:
```sql
-- 1. sesiones_tiempo: Información general de cada sesión
-- 2. tiempos_producto: Detalles por cada producto (32 columnas!)
-- 3. eventos_producto: Eventos individuales de interacción
```

#### Vistas creadas:
- `resumen_tiempos_categoria`: Promedios por categoría
- `evolucion_usuario`: Progreso de usuarios
- `productos_problematicos`: Productos que toman más tiempo

**Script para crear tablas**: `sql/crear_tablas_tiempos.sql`

### 3. ✅ CORRECCIÓN DE ERRORES CORS EN PRODUCCIÓN
- Mejorada configuración CORS en `server/index.js`
- Agregado `server/start.js` con mejor manejo de errores
- Creado `render.yaml` para configuración de Render
- Health check mejorado en `/api/health`

### 4. ✅ DOCUMENTACIÓN DE DISEÑO VISUAL
- **Archivo**: `texto_front.md`
- Contiene TODA la guía de estilos, colores, componentes, animaciones
- Útil para replicar el diseño en otras aplicaciones

---

## 🚧 TRABAJO PENDIENTE - SISTEMA DE MEDICIÓN DE TIEMPOS

### ESTADO ACTUAL:
- ✅ Tablas creadas en BD
- ✅ Estructura definida
- ❌ **FALTA**: Implementación en React
- ❌ **FALTA**: Endpoints en el servidor
- ❌ **FALTA**: Pestaña "Pruebas de Tiempo"

### LO QUE FALTA IMPLEMENTAR:

#### 1. NUEVA PESTAÑA "PRUEBAS DE TIEMPO"
```jsx
// En App.tsx agregar:
- Nueva ruta/pestaña
- Componente PruebasTiempo
- Navegación en el header
```

#### 2. COMPONENTE PRODUCTO CON 4 FILAS
```
🟦 SECCIÓN 1: CONTEO ACTUAL
  Fila 1: C1 | C2 | C3 | Total con unidad
  Fila 2: [Producto Inactivo] [Producto en 0] [Guardar]
  
🟦 SECCIÓN 2: CANTIDAD A PEDIR  
  Fila 3: [Input cantidad] [Unidad]
  Fila 4: [Pedir en 0] [Guardar pedir]
```

#### 3. LÓGICA DE CAPTURA DE TIEMPOS
```javascript
// Eventos a capturar:
- Abrir aplicación → inicio sesión
- Seleccionar producto → hora_inicio
- Primer input → hora_primer_input
- Cada cambio → contador++
- Guardar → hora_fin + calcular duraciones
```

#### 4. ENDPOINTS NECESARIOS EN SERVER
```javascript
// server/index.js agregar:
POST /api/sesiones-tiempo/iniciar
POST /api/tiempos-producto/guardar
GET /api/tiempos-producto/estadisticas/:sesionId
GET /api/tiempos-producto/resumen/:bodegaId
```

#### 5. VISUALIZACIÓN DE MÉTRICAS
```jsx
// Panel flotante con:
- Timer en vivo del producto actual
- Productos completados
- Tiempo promedio
- Comparación con promedio de categoría
- Mini gráfico de últimos 10 productos
```

### FLUJO DE IMPLEMENTACIÓN:

1. **Crear componente PruebasTiempo.tsx**
   - Copia de ListaProductos pero con prefijo "prueba-"
   - Agregar lógica de captura de tiempos
   - Panel de métricas visible

2. **Modificar ProductoConteo.tsx**
   - Implementar diseño de 4 filas
   - Agregar eventos de tiempo
   - Emitir eventos al padre

3. **Crear servicio tiemposService.ts**
   ```typescript
   - iniciarSesion()
   - guardarTiempoProducto()
   - obtenerEstadisticas()
   ```

4. **Actualizar server/index.js**
   - Agregar endpoints
   - Queries a las nuevas tablas

5. **Agregar navegación**
   - Botón/tab "Pruebas de Tiempo"
   - Solo visible para ciertos usuarios?

---

## 📁 ARCHIVOS CLAVE DEL PROYECTO

### Frontend (React + TypeScript)
```
src/
├── components/
│   ├── ListaProductos.tsx    # Lista principal con "Todo en 0"
│   ├── ProductoConteo.tsx    # Componente individual de producto
│   ├── Historico.tsx         # Vista de históricos
│   ├── Timer.tsx             # Componente de timer
│   └── Toast.tsx             # Notificaciones
├── services/
│   ├── historico.ts          # Servicio de históricos
│   ├── airtable.ts           # Integración con Airtable
│   └── database.ts           # Servicio de BD (no usado aún)
└── App.tsx                   # Componente principal
```

### Backend (Node.js + Express)
```
server/
├── index.js                  # Servidor principal
├── start.js                  # Script de inicio con manejo de errores
├── package.json              # Dependencias del servidor
└── .env                      # Variables de entorno
```

### Configuración
```
├── render.yaml               # Config para Render.com
├── netlify.toml             # Config para Netlify (si existe)
└── vite.config.ts           # Config de Vite
```

### Base de datos
```
sql/
└── crear_tablas_tiempos.sql # Script para crear tablas de tiempos

scripts/
└── ejecutar_sql_tiempos.js  # Script para ejecutar SQL
```

---

## 🔐 USUARIOS DEL SISTEMA

| Email | PIN | Rol | Bodegas | Notas |
|-------|-----|-----|---------|-------|
| gerencia@chiosburger.com | 9999 | Admin | Todas | Puede ver/editar todo |
| analisis@chiosburger.com | 8888 | Super Admin | Todas | Puede eliminar |
| bodegaprincipal@chiosburger.com | 4321 | Usuario | 1, 9 | - |
| produccion@chiosburger.com | 3456 | Usuario | 3 | Ve botón "Todo en 0" |
| realaudiencia@chiosburger.com | 4567 | Usuario | 4 | - |
| floreana@chiosburger.com | 5678 | Usuario | 5 | - |
| portugal@chiosburger.com | 6789 | Usuario | 6 | - |

---

## 🚀 URLS DE PRODUCCIÓN

- **Frontend**: https://inventario-chiosburger.netlify.app
- **Backend**: https://inventario-chiosburger-api.onrender.com
- **Health Check**: https://inventario-chiosburger-api.onrender.com/api/health

**NOTA**: El backend en Render se duerme tras 15 min de inactividad. Primera petición puede tardar 30-60 segundos.

---

## 💡 TIPS PARA CONTINUAR

1. **Si vas a implementar la pestaña de tiempos**:
   - Empieza copiando ListaProductos.tsx
   - Modifica para agregar prefijo "prueba-" a los IDs
   - Agrega la lógica de captura de tiempos gradualmente

2. **Para probar las tablas de tiempos**:
   - Usa el script `scripts/ejecutar_sql_tiempos.js`
   - Puedes hacer queries directas a PostgreSQL

3. **Si hay problemas con CORS**:
   - Verifica que el backend esté corriendo
   - Revisa logs en Render.com
   - El CORS está temporalmente abierto a todos los orígenes

4. **Para el diseño visual**:
   - Consulta `texto_front.md` para todos los estilos
   - Mantén consistencia con los colores purple/blue

---

## 📝 NOTAS IMPORTANTES

1. **Las credenciales de BD están en el código** (temporal, mover a variables de entorno seguras)

2. **El botón "Todo en 0" solo aparece para Planta de Producción** (bodega ID 3)

3. **Las tablas de tiempos están creadas pero no se usan aún**

4. **El sistema funciona completamente sin las métricas de tiempo**

5. **Todos los cambios están en GitHub** - Al clonar tendrás todo actualizado

---

## 🤔 DECISIONES PENDIENTES

1. ¿La pestaña "Pruebas de Tiempo" será visible para todos o solo algunos usuarios?

2. ¿Los datos de prueba se mezclan con los reales o van a tablas separadas?

3. ¿Se implementa presión visual (timer visible) o se captura silenciosamente?

4. ¿Qué métricas son las más importantes para mostrar?

---

## 📞 CONTACTO

Si tienes dudas al configurar en casa:
- Revisa los logs de la consola
- Verifica las variables de entorno
- Asegúrate de que el backend esté corriendo
- El frontend debe estar en http://localhost:5173
- El backend debe estar en http://localhost:3001

¡Éxito con el desarrollo en casa! 🏠