# 📚 Documentación Exhaustiva de Base de Datos - Sistema de Inventario ChiosBurger

## 📋 Tabla de Contenidos
1. [Información General](#información-general)
2. [Configuración de Conexión](#configuración-de-conexión)
3. [Esquema de Tablas Principales](#esquema-de-tablas-principales)
4. [Tablas de Auditoría](#tablas-de-auditoría)
5. [Tablas de Métricas de Tiempo](#tablas-de-métricas-de-tiempo)
6. [Relaciones entre Tablas](#relaciones-entre-tablas)
7. [Formatos de IDs y Códigos](#formatos-de-ids-y-códigos)
8. [Índices y Constraints](#índices-y-constraints)
9. [Diferencias entre Tablas de Bodegas](#diferencias-entre-tablas-de-bodegas)
10. [Procedimientos de Migración](#procedimientos-de-migración)
11. [Consideraciones PostgreSQL](#consideraciones-postgresql)
12. [Ejemplos de Datos](#ejemplos-de-datos)
13. [Queries Importantes](#queries-importantes)

## 1. Información General

### Base de Datos
- **Motor**: PostgreSQL (Azure Database for PostgreSQL)
- **Nombre**: `InventariosLocales`
- **Versión**: PostgreSQL 13+ (Azure)
- **Encoding**: UTF-8
- **Collation**: es_EC.UTF-8
- **Timezone**: America/Guayaquil (UTC-5)

### Arquitectura
- **Modelo**: Multi-tabla por bodega
- **Total de tablas principales**: 7 (una por cada tipo de bodega)
- **Tablas de auditoría**: 2
- **Tablas de métricas**: 3
- **Vistas**: 3

## 2. Configuración de Conexión

### Credenciales de Producción
```javascript
{
  host: 'chiosburguer.postgres.database.azure.com',
  database: 'InventariosLocales',
  user: 'adminChios',
  password: 'Burger2023',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
}
```

### Variables de Entorno (.env)
```env
DB_HOST=chiosburguer.postgres.database.azure.com
DB_USER=adminChios
DB_PASSWORD=Burger2023
DB_NAME=InventariosLocales
DB_PORT=5432
```

### Pool de Conexiones (Node.js)
```javascript
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false
  },
  // Configuración recomendada para producción
  max: 20,                    // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000,   // Cerrar conexiones inactivas después de 30s
  connectionTimeoutMillis: 2000, // Timeout de conexión 2s
});
```

## 3. Esquema de Tablas Principales

### Mapeo de Bodegas a Tablas
```javascript
const TABLA_POR_BODEGA = {
  1: 'toma_bodega',           // Bodega Principal
  2: 'toma_materiaprima',     // Bodega Materia Prima
  3: 'toma_planta',           // Planta De Producción
  4: 'tomasFisicas',          // Chios Real Audiencia
  5: 'tomasFisicas',          // Chios Floreana
  6: 'tomasFisicas',          // Chios Portugal
  7: 'toma_simon_bolon',      // Simón Bolón
  8: 'toma_santo_cachon',     // Santo Cachón
  9: 'toma_bodegapulmon'      // Bodega Pulmón
};
```

### 3.1 Tabla: toma_bodega (Bodega Principal)
```sql
CREATE TABLE public.toma_bodega (
    id VARCHAR(50) PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    producto VARCHAR(100) NOT NULL,
    fecha VARCHAR(10) NOT NULL,
    usuario VARCHAR(100) NOT NULL,
    cantidades VARCHAR(50),
    total VARCHAR(20),
    unidad VARCHAR(20),
    categoria VARCHAR(100),
    "Tipo A,B o C" VARCHAR(20)
);

-- Índices
CREATE INDEX idx_toma_bodega_fecha ON public.toma_bodega(fecha);
CREATE INDEX idx_toma_bodega_codigo ON public.toma_bodega(codigo);
CREATE INDEX idx_toma_bodega_tipo ON public.toma_bodega("Tipo A,B o C");
```

### 3.2 Tabla: toma_materiaprima (Bodega Materia Prima)
```sql
CREATE TABLE public.toma_materiaprima (
    id VARCHAR(50) PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    producto VARCHAR(100) NOT NULL,
    fecha DATE NOT NULL,
    usuario VARCHAR(100) NOT NULL,
    cantidades VARCHAR(50),
    total NUMERIC(10,3),
    unidad VARCHAR(20),
    categoria VARCHAR(100),
    "Tipo A,B o C" VARCHAR(20)
);

-- Índices
CREATE INDEX idx_toma_materiaprima_fecha ON public.toma_materiaprima(fecha);
CREATE INDEX idx_toma_materiaprima_codigo ON public.toma_materiaprima(codigo);
CREATE INDEX idx_toma_materiaprima_tipo ON public.toma_materiaprima("Tipo A,B o C");
```

### 3.3 Tabla: toma_planta (Planta de Producción)
```sql
CREATE TABLE public.toma_planta (
    id VARCHAR(50) PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    producto VARCHAR(100) NOT NULL,
    fecha DATE NOT NULL,
    usuario VARCHAR(100) NOT NULL,
    cantidades VARCHAR(50),
    total NUMERIC(10,3),
    unidad VARCHAR(20),
    categoria VARCHAR(100),
    "Tipo A,B o C" VARCHAR(20)
);

-- Índices
CREATE INDEX idx_toma_planta_fecha ON public.toma_planta(fecha);
CREATE INDEX idx_toma_planta_codigo ON public.toma_planta(codigo);
CREATE INDEX idx_toma_planta_tipo ON public.toma_planta("Tipo A,B o C");
```

### 3.4 Tabla: tomasFisicas (Chios - 3 locales)
```sql
CREATE TABLE public."tomasFisicas" (
    fecha VARCHAR(10) NOT NULL,
    codtomas VARCHAR(50) PRIMARY KEY,
    cod_prod VARCHAR(20) NOT NULL,
    productos VARCHAR(100) NOT NULL,
    unidad VARCHAR(20),
    cantidad VARCHAR(20),
    anotaciones VARCHAR(50),
    local VARCHAR(50) NOT NULL,
    "cantidadSolicitada" VARCHAR(20),
    uni_bod VARCHAR(20),
    categoria VARCHAR(100),
    "Tipo A,B o C" VARCHAR(20)
);

-- Índices
CREATE INDEX idx_tomasFisicas_fecha ON public."tomasFisicas"(fecha);
CREATE INDEX idx_tomasFisicas_local ON public."tomasFisicas"(local);
CREATE INDEX idx_tomasFisicas_cod_prod ON public."tomasFisicas"(cod_prod);
CREATE INDEX idx_tomasFisicas_tipo ON public."tomasFisicas"("Tipo A,B o C");
```

### 3.5 Tabla: toma_simon_bolon
```sql
CREATE TABLE public.toma_simon_bolon (
    id VARCHAR(50) PRIMARY KEY,
    fecha DATE NOT NULL,
    usuario VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) NOT NULL,
    producto VARCHAR(100) NOT NULL,
    cantidad VARCHAR(50),
    total NUMERIC(10,3),
    uni_local VARCHAR(20),
    cant_pedir NUMERIC(10,3),
    uni_bod VARCHAR(20),
    categoria VARCHAR(100),
    "Tipo A,B o C" VARCHAR(20)
);

-- Índices
CREATE INDEX idx_toma_simon_bolon_fecha ON public.toma_simon_bolon(fecha);
CREATE INDEX idx_toma_simon_bolon_codigo ON public.toma_simon_bolon(codigo);
CREATE INDEX idx_toma_simon_bolon_tipo ON public.toma_simon_bolon("Tipo A,B o C");
```

### 3.6 Tabla: toma_santo_cachon
```sql
CREATE TABLE public.toma_santo_cachon (
    id VARCHAR(50) PRIMARY KEY,
    fecha DATE NOT NULL,
    usuario VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) NOT NULL,
    producto VARCHAR(100) NOT NULL,
    cantidad VARCHAR(50),
    total NUMERIC(10,3),
    uni_local VARCHAR(20),
    cant_pedir NUMERIC(10,3),
    uni_bod VARCHAR(20),
    categoria VARCHAR(100),
    "Tipo A,B o C" VARCHAR(20)
);

-- Índices
CREATE INDEX idx_toma_santo_cachon_fecha ON public.toma_santo_cachon(fecha);
CREATE INDEX idx_toma_santo_cachon_codigo ON public.toma_santo_cachon(codigo);
CREATE INDEX idx_toma_santo_cachon_tipo ON public.toma_santo_cachon("Tipo A,B o C");
```

### 3.7 Tabla: toma_bodegapulmon
```sql
CREATE TABLE public.toma_bodegapulmon (
    id VARCHAR(50) PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    producto VARCHAR(100) NOT NULL,
    fecha DATE NOT NULL,
    usuario VARCHAR(100) NOT NULL,
    cantidades VARCHAR(50),
    total NUMERIC(10,3),
    unidad VARCHAR(20),
    categoria VARCHAR(100),
    "Tipo A,B o C" VARCHAR(20)
);

-- Índices
CREATE INDEX idx_toma_bodegapulmon_fecha ON public.toma_bodegapulmon(fecha);
CREATE INDEX idx_toma_bodegapulmon_codigo ON public.toma_bodegapulmon(codigo);
CREATE INDEX idx_toma_bodegapulmon_tipo ON public.toma_bodegapulmon("Tipo A,B o C");
```

## 4. Tablas de Auditoría

### 4.1 Tabla: auditoria_eliminaciones
```sql
CREATE TABLE IF NOT EXISTS public.auditoria_eliminaciones (
    id SERIAL PRIMARY KEY,
    fecha_eliminacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_email VARCHAR(100),
    usuario_nombre VARCHAR(100),
    registro_id VARCHAR(100),
    registro_fecha VARCHAR(50),
    registro_bodega VARCHAR(100),
    registro_origen VARCHAR(20),
    registro_productos_count INT,
    detalles_completos JSONB
);

-- Índices
CREATE INDEX idx_auditoria_usuario ON public.auditoria_eliminaciones(usuario_email);
CREATE INDEX idx_auditoria_fecha ON public.auditoria_eliminaciones(fecha_eliminacion);
CREATE INDEX idx_auditoria_registro ON public.auditoria_eliminaciones(registro_id);

-- Comentarios
COMMENT ON COLUMN public.auditoria_eliminaciones.registro_productos_count 
IS 'Cantidad de productos diferentes en el inventario (no suma de cantidades)';
COMMENT ON COLUMN public.auditoria_eliminaciones.detalles_completos 
IS 'Backup completo del registro eliminado en formato JSON';
```

### 4.2 Tabla: auditoria_ediciones
```sql
CREATE TABLE IF NOT EXISTS public.auditoria_ediciones (
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
    tabla_inventario VARCHAR(50),
    bodega_id INTEGER,
    bodega_nombre VARCHAR(100),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_ediciones_registro ON public.auditoria_ediciones(registro_id);
CREATE INDEX idx_ediciones_fecha ON public.auditoria_ediciones(fecha_registro);
CREATE INDEX idx_ediciones_usuario ON public.auditoria_ediciones(usuario_email);
CREATE INDEX idx_ediciones_producto ON public.auditoria_ediciones(producto_codigo);
```

## 5. Tablas de Métricas de Tiempo

### 5.1 Tabla: sesiones_tiempo
```sql
CREATE TABLE sesiones_tiempo (
    id SERIAL PRIMARY KEY,
    sesion_id VARCHAR(50) UNIQUE NOT NULL,
    bodega_id INTEGER NOT NULL,
    bodega_nombre VARCHAR(100) NOT NULL,
    usuario_email VARCHAR(100) NOT NULL,
    usuario_nombre VARCHAR(100) NOT NULL,
    
    -- Tiempos de sesión
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP,
    duracion_total_segundos INTEGER,
    
    -- Contadores
    productos_totales INTEGER NOT NULL,
    productos_contados INTEGER DEFAULT 0,
    productos_con_tiempo INTEGER DEFAULT 0,
    
    -- Promedios calculados
    tiempo_promedio_producto DECIMAL(10,2),
    tiempo_min_producto DECIMAL(10,2),
    tiempo_max_producto DECIMAL(10,2),
    
    -- Metadata
    es_prueba BOOLEAN DEFAULT FALSE,
    estado VARCHAR(20) DEFAULT 'en_progreso', -- en_progreso, completado, cancelado
    dispositivo VARCHAR(50), -- mobile, tablet, desktop
    navegador VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_sesiones_fecha ON sesiones_tiempo(fecha_inicio);
CREATE INDEX idx_sesiones_bodega ON sesiones_tiempo(bodega_id);
CREATE INDEX idx_sesiones_usuario ON sesiones_tiempo(usuario_email);
CREATE INDEX idx_sesiones_estado ON sesiones_tiempo(estado);
CREATE INDEX idx_sesiones_prueba ON sesiones_tiempo(es_prueba);
```

### 5.2 Tabla: tiempos_producto
```sql
CREATE TABLE tiempos_producto (
    id SERIAL PRIMARY KEY,
    sesion_id VARCHAR(50) NOT NULL,
    
    -- Identificación del producto
    producto_id VARCHAR(100) NOT NULL,
    producto_codigo VARCHAR(50) NOT NULL,
    producto_nombre VARCHAR(200) NOT NULL,
    categoria VARCHAR(100),
    tipo VARCHAR(20), -- A, B o C
    unidad VARCHAR(50),
    
    -- Tiempos detallados
    hora_inicio TIMESTAMP NOT NULL,
    hora_primer_input TIMESTAMP,
    hora_ultimo_input TIMESTAMP,
    hora_fin TIMESTAMP NOT NULL,
    
    -- Duraciones calculadas
    duracion_total_segundos INTEGER NOT NULL,
    tiempo_hasta_primer_input INTEGER,
    tiempo_activo_segundos INTEGER,
    tiempo_inactivo_segundos INTEGER,
    
    -- Acción y resultado
    accion VARCHAR(20) NOT NULL CHECK (accion IN ('guardar', 'producto_cero', 'producto_inactivo')),
    
    -- Valores guardados
    c1 INTEGER,
    c2 INTEGER,
    c3 INTEGER,
    total NUMERIC(10,3),
    cantidad_pedir NUMERIC(10,3),
    
    -- Interacciones
    numero_cambios INTEGER DEFAULT 0,
    numero_clicks INTEGER DEFAULT 0,
    fue_editado BOOLEAN DEFAULT FALSE,
    
    -- Contexto
    orden_en_sesion INTEGER NOT NULL,
    es_primer_producto BOOLEAN DEFAULT FALSE,
    productos_abiertos_simultaneos INTEGER DEFAULT 1,
    
    -- Análisis
    velocidad_conteo DECIMAL(10,2),
    diferencia_promedio_segundos INTEGER,
    es_tiempo_record BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_sesion FOREIGN KEY (sesion_id) 
        REFERENCES sesiones_tiempo(sesion_id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_tiempos_sesion ON tiempos_producto(sesion_id);
CREATE INDEX idx_tiempos_categoria ON tiempos_producto(categoria);
CREATE INDEX idx_tiempos_tipo ON tiempos_producto(tipo);
CREATE INDEX idx_tiempos_fecha ON tiempos_producto(hora_inicio);
CREATE INDEX idx_tiempos_producto ON tiempos_producto(producto_codigo);
CREATE INDEX idx_tiempos_accion ON tiempos_producto(accion);
CREATE INDEX idx_tiempos_duracion ON tiempos_producto(duracion_total_segundos);
```

### 5.3 Tabla: eventos_producto
```sql
CREATE TABLE eventos_producto (
    id SERIAL PRIMARY KEY,
    sesion_id VARCHAR(50) NOT NULL,
    producto_id VARCHAR(100) NOT NULL,
    
    tipo_evento VARCHAR(50) NOT NULL CHECK (tipo_evento IN (
        'abrir_producto',
        'primer_input',
        'cambio_c1',
        'cambio_c2',
        'cambio_c3',
        'cambio_cantidad_pedir',
        'click_guardar',
        'click_producto_cero',
        'click_producto_inactivo',
        'cerrar_sin_guardar',
        'reabrir_producto'
    )),
    timestamp_evento TIMESTAMP NOT NULL,
    
    -- Detalles del evento
    campo_modificado VARCHAR(20),
    valor_anterior VARCHAR(50),
    valor_nuevo VARCHAR(50),
    
    -- Contexto
    duracion_desde_ultimo_evento INTEGER,
    productos_abiertos_actual INTEGER DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_sesion_evento FOREIGN KEY (sesion_id) 
        REFERENCES sesiones_tiempo(sesion_id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_eventos_sesion ON eventos_producto(sesion_id);
CREATE INDEX idx_eventos_producto ON eventos_producto(producto_id);
CREATE INDEX idx_eventos_tipo ON eventos_producto(tipo_evento);
CREATE INDEX idx_eventos_timestamp ON eventos_producto(timestamp_evento);
```

## 6. Relaciones entre Tablas

### Diagrama de Relaciones
```
┌─────────────────────┐
│  sesiones_tiempo    │
│  (tabla maestra)    │
└──────────┬──────────┘
           │ 1:N
           ├─────────────────┐
           │                 │
┌──────────▼──────────┐     ┌▼─────────────────┐
│  tiempos_producto   │     │ eventos_producto │
│  (detalle tiempos)  │     │ (log eventos)    │
└─────────────────────┘     └──────────────────┘

┌─────────────────────┐
│ Tablas Inventario   │     ┌─────────────────────┐
│ (7 tablas)          │────►│ auditoria_ediciones │
└─────────────────────┘     └─────────────────────┘
           │
           │                ┌──────────────────────┐
           └───────────────►│auditoria_eliminaciones│
                           └──────────────────────┘
```

### Relaciones Clave
1. **sesiones_tiempo → tiempos_producto**: Una sesión puede tener múltiples productos contados
2. **sesiones_tiempo → eventos_producto**: Una sesión puede tener múltiples eventos
3. **Tablas inventario → auditoria_ediciones**: Cada edición se registra en auditoría
4. **Tablas inventario → auditoria_eliminaciones**: Cada eliminación se registra con backup completo

## 7. Formatos de IDs y Códigos

### 7.1 Formato de ID Principal
```javascript
// Formato nuevo (desde enero 2025)
// DDMMYY-CODIGO-TIMESTAMP-RANDOM
// Ejemplo: "160125-pan001-1737043532123-8745"

function generarId(codigo) {
  const fecha = new Date();
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const año = fecha.getFullYear().toString().slice(-2);
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${dia}${mes}${año}-${codigo.toLowerCase()}-${timestamp}-${random}`;
}
```

### 7.2 Formato de ID Antiguo (Legacy)
```javascript
// Formato antiguo (hasta diciembre 2024)
// DDMMYY-codigo-RANDOM
// Ejemplo: "160125-pan001-1234"

function generarIdLegacy(codigo) {
  const fecha = new Date();
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const año = fecha.getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${dia}${mes}${año}-${codigo.toLowerCase()}-${random}`;
}
```

### 7.3 Códigos de Producto
- **Formato**: Alfanumérico, máximo 20 caracteres
- **Ejemplos**: "PAN001", "BEB025", "CAR010"
- **Origen**: Sincronizado desde Airtable
- **Unicidad**: Único por bodega

### 7.4 Formato de Cantidades
```javascript
// Formato: "c1+c2+c3" o "c1+c2+c3+"
// Ejemplos: "10+5+2", "8++3", "++15"

function formatearCantidades(c1, c2, c3) {
  const partes = [];
  if (c1 > 0) partes.push(c1.toString());
  else partes.push('');
  
  if (c2 > 0) partes.push(c2.toString());
  else partes.push('');
  
  if (c3 > 0) partes.push(c3.toString());
  else partes.push('');
  
  // Eliminar elementos vacíos del final
  while (partes.length > 0 && partes[partes.length - 1] === '') {
    partes.pop();
  }
  
  return partes.join('+');
}
```

## 8. Índices y Constraints

### 8.1 Índices Comunes en Todas las Tablas
```sql
-- Índices de búsqueda rápida
CREATE INDEX idx_[tabla]_fecha ON [tabla](fecha);
CREATE INDEX idx_[tabla]_codigo ON [tabla](codigo);
CREATE INDEX idx_[tabla]_tipo ON [tabla]("Tipo A,B o C");
```

### 8.2 Constraints Principales
```sql
-- Primary Keys
ALTER TABLE [tabla] ADD CONSTRAINT pk_[tabla] PRIMARY KEY (id);

-- Check Constraints
ALTER TABLE tiempos_producto 
ADD CONSTRAINT chk_accion 
CHECK (accion IN ('guardar', 'producto_cero', 'producto_inactivo'));

ALTER TABLE eventos_producto
ADD CONSTRAINT chk_tipo_evento
CHECK (tipo_evento IN (
    'abrir_producto', 'primer_input', 'cambio_c1', 
    'cambio_c2', 'cambio_c3', 'cambio_cantidad_pedir',
    'click_guardar', 'click_producto_cero', 
    'click_producto_inactivo', 'cerrar_sin_guardar',
    'reabrir_producto'
));
```

### 8.3 Foreign Keys
```sql
-- Relación sesiones_tiempo -> tiempos_producto
ALTER TABLE tiempos_producto
ADD CONSTRAINT fk_sesion 
FOREIGN KEY (sesion_id) 
REFERENCES sesiones_tiempo(sesion_id) 
ON DELETE CASCADE;

-- Relación sesiones_tiempo -> eventos_producto
ALTER TABLE eventos_producto
ADD CONSTRAINT fk_sesion_evento 
FOREIGN KEY (sesion_id) 
REFERENCES sesiones_tiempo(sesion_id) 
ON DELETE CASCADE;
```

## 9. Diferencias entre Tablas de Bodegas

### 9.1 Diferencias en Estructura

| Característica | toma_bodega/materiaprima/planta/bodegapulmon | tomasFisicas | simon_bolon/santo_cachon |
|----------------|---------------------------------------------|--------------|--------------------------|
| Formato fecha | VARCHAR(10) 'DD/MM/YYYY' | VARCHAR(10) | DATE |
| ID primario | id | codtomas | id |
| Campo cantidad | cantidades | cantidad + anotaciones | cantidad |
| Campo total | total | cantidad | total |
| Cantidad pedir | NO | cantidadSolicitada | cant_pedir |
| Unidad bodega | NO | uni_bod | uni_bod |
| Campo local | NO | local (3 valores) | NO |
| Tipo de total | VARCHAR(20) | VARCHAR(20) | NUMERIC(10,3) |

### 9.2 Campos Especiales por Tabla

**tomasFisicas (Chios)**:
- `local`: Identifica el local específico ('Real Audiencia', 'Floreana', 'Portugal')
- `anotaciones`: Contiene el detalle de cantidades (c1+c2+c3)
- `codtomas`: ID único diferente al resto de tablas

**simon_bolon/santo_cachon**:
- `cant_pedir`: Cantidad a pedir (NUMERIC)
- `uni_local`: Unidad del local
- `uni_bod`: Unidad de bodega principal

### 9.3 Formato de Usuario por Bodega
```javascript
// Formato estándar: "NombreUsuario - email@dominio.com"
const FORMATOS_USUARIO = {
  toma_bodega: "${usuario} - ${usuario} - principal@chiosburger.com",
  toma_materiaprima: "${usuario} - materia@chiosburger.com",
  toma_planta: "${usuario} - produccion@chiosburger.com",
  toma_simon_bolon: "${usuario} - simon@chiosburger.com",
  toma_santo_cachon: "${usuario} - santo@chiosburger.com",
  toma_bodegapulmon: "${usuario} - pulmon@chiosburger.com"
};
```

## 10. Procedimientos de Migración

### 10.1 Migración para Agregar Columnas categoria y tipo
```sql
-- Script: add_categoria_tipo_columns.sql
-- Ejecutado: 02/07/2025

-- Agregar columnas a todas las tablas
ALTER TABLE public.toma_bodega 
ADD COLUMN IF NOT EXISTS categoria VARCHAR(100),
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20);

-- Repetir para cada tabla...

-- Crear índices para búsquedas por tipo
CREATE INDEX IF NOT EXISTS idx_toma_bodega_tipo ON public.toma_bodega(tipo);
-- Repetir para cada tabla...
```

### 10.2 Migración de Datos Históricos
```sql
-- Actualizar registros existentes con categorías desde Airtable
UPDATE public.toma_bodega tb
SET categoria = at.categoria,
    tipo = at.tipo
FROM airtable_productos at
WHERE tb.codigo = at.codigo
AND tb.categoria IS NULL;
```

### 10.3 Procedimiento de Backup
```bash
# Backup completo de la base de datos
pg_dump -h chiosburguer.postgres.database.azure.com \
        -U adminChios \
        -d InventariosLocales \
        -f backup_$(date +%Y%m%d_%H%M%S).sql

# Backup de tabla específica
pg_dump -h chiosburguer.postgres.database.azure.com \
        -U adminChios \
        -d InventariosLocales \
        -t public.toma_bodega \
        -f backup_toma_bodega_$(date +%Y%m%d).sql
```

## 11. Consideraciones PostgreSQL

### 11.1 Configuración SSL
```javascript
// Requerido para Azure PostgreSQL
ssl: {
  rejectUnauthorized: false
}
```

### 11.2 Manejo de Transacciones
```javascript
// Patrón recomendado para transacciones
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  // Operaciones múltiples
  await client.query(query1, values1);
  await client.query(query2, values2);
  
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

### 11.3 Manejo de Nombres con Comillas
```sql
-- Tabla con nombre sensible a mayúsculas
SELECT * FROM public."tomasFisicas";  -- Correcto
SELECT * FROM public.tomasFisicas;    -- Error

-- Columna con espacios/caracteres especiales
SELECT "Tipo A,B o C" FROM toma_bodega;  -- Correcto
```

### 11.4 Timezone y Fechas
```javascript
// Ajuste a timezone Ecuador (UTC-5)
function ajustarTimezoneEcuador(fecha) {
  const offsetEcuador = -5 * 60; // UTC-5 en minutos
  const offsetLocal = fecha.getTimezoneOffset();
  const diferencia = offsetEcuador - offsetLocal;
  fecha.setMinutes(fecha.getMinutes() + diferencia);
  return fecha;
}
```

## 12. Ejemplos de Datos

### 12.1 Registro en toma_bodega
```json
{
  "id": "160125-pan001-1737043532123-8745",
  "codigo": "PAN001",
  "producto": "Pan de Hamburguesa",
  "fecha": "16/01/2025",
  "usuario": "Juan Pérez - Juan Pérez - principal@chiosburger.com",
  "cantidades": "10+5+2+",
  "total": "17",
  "unidad": "UNIDAD",
  "categoria": "PANADERIA",
  "Tipo A,B o C": "A"
}
```

### 12.2 Registro en tomasFisicas
```json
{
  "fecha": "16/01/2025",
  "codtomas": "160125-beb025-1737043532123-4521",
  "cod_prod": "BEB025",
  "productos": "Coca Cola 3L",
  "unidad": "BOTELLA",
  "cantidad": "25",
  "anotaciones": "15+7+3",
  "local": "Real Audiencia",
  "cantidadSolicitada": "30",
  "uni_bod": "CAJA",
  "categoria": "BEBIDAS",
  "Tipo A,B o C": "A"
}
```

### 12.3 Registro en auditoria_eliminaciones
```json
{
  "id": 1,
  "fecha_eliminacion": "2025-01-16 14:30:00",
  "usuario_email": "admin@chiosburger.com",
  "usuario_nombre": "Administrador Sistema",
  "registro_id": "160125-1737043532123",
  "registro_fecha": "16/01/2025",
  "registro_bodega": "Bodega Principal",
  "registro_origen": "manual",
  "registro_productos_count": 25,
  "detalles_completos": {
    "id": "160125-1737043532123",
    "fecha": "16/01/2025",
    "bodegaId": 1,
    "bodegaNombre": "Bodega Principal",
    "usuario": "Juan Pérez",
    "productos": [/* array de productos */]
  }
}
```

## 13. Queries Importantes

### 13.1 Query para Obtener Inventario Completo
```sql
-- Para tablas estándar (bodega, materiaprima, planta, bodegapulmon)
SELECT 
    id, 
    codigo, 
    producto, 
    fecha, 
    usuario, 
    cantidades, 
    total, 
    unidad,
    categoria, 
    "Tipo A,B o C" as tipo
FROM public.toma_bodega
WHERE fecha = '16/01/2025'
ORDER BY producto ASC;

-- Para tomasFisicas (Chios)
SELECT 
    fecha, 
    codtomas as id, 
    cod_prod as codigo, 
    productos as producto, 
    cantidad as total, 
    anotaciones as cantidades, 
    local, 
    "cantidadSolicitada" as cant_pedir, 
    unidad,
    categoria, 
    "Tipo A,B o C" as tipo
FROM public."tomasFisicas"
WHERE local = 'Real Audiencia'
AND fecha = '16/01/2025'
ORDER BY productos ASC;
```

### 13.2 Query para Auditoría de Cambios
```sql
-- Historial de ediciones por producto
SELECT 
    ae.fecha_registro,
    ae.usuario_nombre,
    ae.producto_nombre,
    ae.campo_modificado,
    ae.valor_anterior,
    ae.valor_nuevo,
    ae.diferencia,
    ae.bodega_nombre
FROM public.auditoria_ediciones ae
WHERE ae.producto_codigo = 'PAN001'
ORDER BY ae.fecha_registro DESC;

-- Resumen de cambios por usuario
SELECT 
    usuario_email,
    usuario_nombre,
    COUNT(*) as total_ediciones,
    SUM(CASE WHEN diferencia > 0 THEN diferencia ELSE 0 END) as aumentos,
    SUM(CASE WHEN diferencia < 0 THEN ABS(diferencia) ELSE 0 END) as disminuciones
FROM public.auditoria_ediciones
WHERE fecha_registro >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY usuario_email, usuario_nombre
ORDER BY total_ediciones DESC;
```

### 13.3 Query para Métricas de Productividad
```sql
-- Productos que más tiempo toman
SELECT 
    tp.producto_nombre,
    tp.categoria,
    tp.tipo,
    AVG(tp.duracion_total_segundos) as promedio_segundos,
    COUNT(*) as veces_contado,
    AVG(tp.numero_cambios) as promedio_cambios
FROM tiempos_producto tp
WHERE tp.accion = 'guardar'
GROUP BY tp.producto_nombre, tp.categoria, tp.tipo
HAVING AVG(tp.duracion_total_segundos) > 30
ORDER BY promedio_segundos DESC
LIMIT 20;

-- Evolución de velocidad por usuario
SELECT 
    st.usuario_nombre,
    DATE(st.fecha_inicio) as fecha,
    COUNT(DISTINCT tp.producto_id) as productos_contados,
    AVG(tp.duracion_total_segundos) as promedio_segundos,
    ROUND(60.0 / AVG(tp.duracion_total_segundos), 2) as productos_por_minuto
FROM sesiones_tiempo st
JOIN tiempos_producto tp ON st.sesion_id = tp.sesion_id
WHERE tp.accion = 'guardar'
AND st.es_prueba = FALSE
GROUP BY st.usuario_nombre, DATE(st.fecha_inicio)
ORDER BY fecha DESC, usuario_nombre;
```

### 13.4 Query para Detección de Anomalías
```sql
-- Productos con valores inusuales
WITH stats AS (
    SELECT 
        codigo,
        producto,
        AVG(CAST(total AS NUMERIC)) as promedio,
        STDDEV(CAST(total AS NUMERIC)) as desviacion
    FROM public.toma_bodega
    WHERE total IS NOT NULL 
    AND total != ''
    AND fecha >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY codigo, producto
)
SELECT 
    t.fecha,
    t.codigo,
    t.producto,
    t.total,
    s.promedio,
    ABS(CAST(t.total AS NUMERIC) - s.promedio) / NULLIF(s.desviacion, 0) as z_score
FROM public.toma_bodega t
JOIN stats s ON t.codigo = s.codigo
WHERE t.fecha = CURRENT_DATE::VARCHAR
AND ABS(CAST(t.total AS NUMERIC) - s.promedio) > 2 * s.desviacion
ORDER BY z_score DESC;
```

### 13.5 Query para Sincronización con Airtable
```sql
-- Verificar productos faltantes
SELECT DISTINCT 
    at.codigo,
    at.nombre,
    at.categoria,
    at.tipo
FROM airtable_productos at
LEFT JOIN (
    SELECT DISTINCT codigo 
    FROM public.toma_bodega 
    WHERE fecha >= CURRENT_DATE - INTERVAL '7 days'
) tb ON at.codigo = tb.codigo
WHERE tb.codigo IS NULL
ORDER BY at.categoria, at.codigo;
```

## 14. Mantenimiento y Optimización

### 14.1 Vacuum y Analyze
```sql
-- Ejecutar mensualmente
VACUUM ANALYZE public.toma_bodega;
VACUUM ANALYZE public.toma_materiaprima;
VACUUM ANALYZE public.toma_planta;
VACUUM ANALYZE public."tomasFisicas";
VACUUM ANALYZE public.toma_simon_bolon;
VACUUM ANALYZE public.toma_santo_cachon;
VACUUM ANALYZE public.toma_bodegapulmon;
```

### 14.2 Monitoreo de Índices
```sql
-- Ver uso de índices
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### 14.3 Limpieza de Datos Antiguos
```sql
-- Archivar registros antiguos (> 1 año)
INSERT INTO archivo_inventarios
SELECT * FROM public.toma_bodega
WHERE fecha::DATE < CURRENT_DATE - INTERVAL '1 year';

DELETE FROM public.toma_bodega
WHERE fecha::DATE < CURRENT_DATE - INTERVAL '1 year';
```

## 15. Seguridad y Permisos

### 15.1 Roles y Permisos Recomendados
```sql
-- Crear rol de solo lectura
CREATE ROLE inventario_readonly;
GRANT CONNECT ON DATABASE "InventariosLocales" TO inventario_readonly;
GRANT USAGE ON SCHEMA public TO inventario_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO inventario_readonly;

-- Crear rol de aplicación
CREATE ROLE inventario_app;
GRANT CONNECT ON DATABASE "InventariosLocales" TO inventario_app;
GRANT USAGE ON SCHEMA public TO inventario_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO inventario_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO inventario_app;
```

### 15.2 Auditoría de Accesos
```sql
-- Habilitar log de conexiones
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
SELECT pg_reload_conf();
```

---

**Última actualización**: 21 de enero de 2025  
**Versión**: 2.0  
**Mantenido por**: Equipo de Desarrollo ChiosBurger