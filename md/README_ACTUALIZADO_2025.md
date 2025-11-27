# Sistema de Inventario ChiosBurger

## 📋 Descripción General

Sistema integral de gestión de inventarios para ChiosBurger, diseñado para control de stock en múltiples bodegas con capacidades offline/online, sincronización automática y auditoría completa.

## 🚀 Características Principales

### 1. **Gestión de Inventarios**
- **Conteo Triple**: Sistema de 3 conteos independientes (c1, c2, c3) para mayor precisión
- **Cálculo Automático**: Promedio automático de los conteos y cálculo de totales
- **Categorización**: Productos clasificados por tipos (A, B, C) con colores distintivos
- **Búsqueda Inteligente**: Por nombre, código o categoría
- **Ordenamiento**: Por categoría y código de producto

### 2. **Sistema Offline-First**
- **Guardado Local**: Almacenamiento en localStorage para trabajo sin conexión
- **Sincronización Automática**: Cada 10 minutos o manual
- **Estados Visuales**: 
  - 🟡 Local: Guardado solo en dispositivo
  - 🔵 Base de datos: Sincronizado con servidor
- **Cola de Sincronización**: Registros pendientes se sincronizan cuando hay conexión

### 3. **Control de Acceso y Permisos**
- **Autenticación**: Sistema de login con email y PIN
- **Roles Diferenciados**:
  - **Usuarios normales**: Solo ven y editan sus propios registros del día
  - **analisis@chiosburger.com**: Ve todos los registros, edita/elimina solo del día
  - **gerencia@chiosburger.com**: Ve todos los registros de todas las bodegas, edita/elimina solo del día
- **Permisos por Bodega**: Usuarios asignados a bodegas específicas

### 4. **Auditoría y Trazabilidad**
- **Registro de Cambios**: Toda edición queda registrada con usuario, fecha y motivo
- **Historial Completo**: Consulta de inventarios anteriores con filtros avanzados
- **Exportación**: Generación de PDFs con detalles del inventario

### 5. **Integración con Airtable**
- **Catálogo Centralizado**: Productos sincronizados desde Airtable
- **Campos Dinámicos**: Unidades específicas por bodega
- **Caché Inteligente**: Mejora de rendimiento con caché de 5 minutos

### 6. **Optimización Móvil**
- **Diseño Responsivo**: Interfaz adaptada para tablets y móviles
- **Sin Zoom**: Deshabilitado zoom accidental en dispositivos táctiles
- **Botones Accesibles**: Ubicación optimizada para uso con una mano

### 7. **Métricas y Productividad**
- **Tiempo de Conteo**: Registro del tiempo total empleado
- **Productos por Minuto**: Cálculo de velocidad de conteo
- **Barra de Progreso**: Visualización por tipos de productos
- **Contadores en Tiempo Real**: Actualización instantánea de avances

## 🛠️ Arquitectura Técnica

### Frontend
- **Framework**: React 19.1 con TypeScript
- **Bundler**: Vite
- **Estilos**: Tailwind CSS 4.1
- **Estado**: React Hooks y Context API
- **HTTP Client**: Axios

### Backend
- **Servidor**: Node.js con Express
- **Base de Datos**: PostgreSQL en Azure
- **API Externa**: Airtable API

### Infraestructura
- **Hosting Frontend**: Vercel
- **Base de Datos**: Azure Database for PostgreSQL
- **Variables de Entorno**: Configuración segura con .env

## 📁 Estructura del Proyecto

```
inventario_foodix/
├── src/
│   ├── components/         # Componentes React
│   │   ├── ListaProductos.tsx      # Componente principal de conteo
│   │   ├── Historico.tsx           # Visualización de históricos
│   │   ├── ProductoConteo.tsx      # Conteo individual
│   │   ├── SelectorBodega.tsx      # Selección de bodega
│   │   ├── EditarProductoModal.tsx # Modal de edición
│   │   └── AuditoriaEdiciones.tsx  # Registro de cambios
│   ├── services/          # Lógica de negocio
│   │   ├── airtable.ts    # Integración con Airtable
│   │   ├── auth.ts        # Autenticación y permisos
│   │   ├── database.ts    # Preparación de datos
│   │   ├── historico.ts   # Gestión de históricos
│   │   └── syncService.ts # Sincronización offline/online
│   ├── utils/            # Utilidades
│   │   ├── exportUtils.ts # Exportación a PDF
│   │   └── dateUtils.ts   # Manejo de fechas
│   └── config.ts         # Configuración global
├── server/               # Backend Node.js
│   └── index.js          # API REST
└── public/              # Archivos estáticos
```

## 🔧 Instalación y Configuración

### Requisitos Previos
- Node.js 18+
- npm o yarn
- PostgreSQL (o acceso a la BD en Azure)

### Instalación

1. **Clonar el repositorio**
```bash
git clone [repositorio]
cd inventario_foodix
```

2. **Instalar dependencias**
```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

3. **Configurar variables de entorno**

Crear `.env` en la raíz:
```env
VITE_API_URL=http://localhost:3001/api
VITE_AIRTABLE_API_KEY=[tu-api-key]
VITE_AIRTABLE_BASE_ID=[tu-base-id]
```

Crear `server/.env`:
```env
DB_HOST=chiosburguer.postgres.database.azure.com
DB_USER=adminChios
DB_PASSWORD=[contraseña]
DB_NAME=InventariosLocales
DB_PORT=5432
PORT=3001
```

4. **Ejecutar en desarrollo**
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
npm run dev
```

## 👥 Usuarios y Bodegas

### Usuarios de Prueba
- **gerencia@chiosburger.com** (PIN: 9999) - Acceso total
- **bodegaprincipal@chiosburger.com** (PIN: 4321) - Bodega Principal y Pulmon

### Bodegas Disponibles
1. Bodega Principal
2. Bodega Materia Prima
3. Planta De Producción
4. Chios Real Audiencia
5. Chios Floreana
6. Chios Portugal
7. Simón Bolón
8. Santo Cachón
9. Bodega Pulmon

## 📊 Flujo de Trabajo

1. **Login**: Usuario ingresa con email y PIN
2. **Selección de Bodega**: Según permisos asignados
3. **Carga de Productos**: Desde Airtable con caché
4. **Conteo**: 
   - Búsqueda del producto
   - Ingreso de 3 conteos
   - Cálculo automático del total
   - Guardado progresivo en local
5. **Finalización**: 
   - Revisión de productos guardados
   - Validación de completitud
   - Guardado final en base de datos
6. **Sincronización**: Automática o manual de registros locales
7. **Consulta**: Históricos con filtros y exportación

## 🚀 Mejoras Futuras Recomendadas

1. **Dashboard Analítico**: Métricas y tendencias de inventarios
2. **Escáner de Códigos**: Integración con cámara para códigos de barras
3. **Notificaciones Push**: Recordatorios y alertas
4. **Predicción Inteligente**: Sugerencias basadas en históricos
5. **API Documentada**: Swagger/OpenAPI para integraciones
6. **Modo Oscuro**: Opción de tema para reducir fatiga visual
7. **Exportación Excel**: Además del PDF actual
8. **Web Workers**: Para operaciones pesadas sin bloquear UI

## 🐛 Solución de Problemas

### Error de Conexión a BD
- Verificar credenciales en `server/.env`
- Confirmar acceso a Azure PostgreSQL
- Revisar firewall y whitelist de IPs

### Productos No Cargan
- Verificar API Key de Airtable
- Confirmar permisos del usuario
- Limpiar caché del navegador

### Sincronización Fallida
- Verificar conexión a internet
- Revisar logs del servidor
- Comprobar espacio en localStorage

## 📝 Notas de Desarrollo

- **TypeScript**: Tipado estricto habilitado
- **ESLint**: Configurado para React/TypeScript
- **Prettier**: Formateo automático de código
- **Git Hooks**: Pre-commit para linting
- **Tests**: Pendiente implementación de suite de pruebas

## 📄 Licencia

Propiedad de ChiosBurger. Todos los derechos reservados.

---

*Última actualización: Enero 2025*