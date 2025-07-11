-- Script para crear tablas de medición de tiempos
-- Sistema de Inventario ChiosBurger
-- Fecha: 2025-01-11

-- Primero eliminar tablas si existen (en orden inverso por las foreign keys)
DROP TABLE IF EXISTS eventos_producto CASCADE;
DROP TABLE IF EXISTS tiempos_producto CASCADE;
DROP TABLE IF EXISTS sesiones_tiempo CASCADE;

-- =====================================================
-- TABLA 1: SESIONES DE TIEMPO (información general)
-- =====================================================
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

-- Índices para búsquedas eficientes
CREATE INDEX idx_sesiones_fecha ON sesiones_tiempo(fecha_inicio);
CREATE INDEX idx_sesiones_bodega ON sesiones_tiempo(bodega_id);
CREATE INDEX idx_sesiones_usuario ON sesiones_tiempo(usuario_email);
CREATE INDEX idx_sesiones_estado ON sesiones_tiempo(estado);
CREATE INDEX idx_sesiones_prueba ON sesiones_tiempo(es_prueba);

-- =====================================================
-- TABLA 2: TIEMPOS DETALLADOS POR PRODUCTO
-- Esta es la tabla más completa con toda la información
-- =====================================================
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
    hora_inicio TIMESTAMP NOT NULL, -- Cuando abre/selecciona el producto
    hora_primer_input TIMESTAMP, -- Cuando empieza a escribir
    hora_ultimo_input TIMESTAMP, -- Último cambio antes de guardar
    hora_fin TIMESTAMP NOT NULL, -- Cuando presiona guardar/inactivo/cero
    
    -- Duraciones calculadas
    duracion_total_segundos INTEGER NOT NULL, -- inicio a fin
    tiempo_hasta_primer_input INTEGER, -- "tiempo de pensamiento"
    tiempo_activo_segundos INTEGER, -- primer_input a ultimo_input
    tiempo_inactivo_segundos INTEGER, -- pausas detectadas
    
    -- Acción y resultado
    accion VARCHAR(20) NOT NULL CHECK (accion IN ('guardar', 'producto_cero', 'producto_inactivo')),
    
    -- Valores guardados
    c1 INTEGER,
    c2 INTEGER,
    c3 INTEGER,
    total NUMERIC(10,3),
    cantidad_pedir NUMERIC(10,3),
    
    -- Interacciones
    numero_cambios INTEGER DEFAULT 0, -- Cuántas veces modificó valores
    numero_clicks INTEGER DEFAULT 0, -- Clicks en el producto
    fue_editado BOOLEAN DEFAULT FALSE, -- Si volvió a editar después de guardar
    
    -- Contexto
    orden_en_sesion INTEGER NOT NULL, -- 1er, 2do, 3er producto...
    es_primer_producto BOOLEAN DEFAULT FALSE,
    productos_abiertos_simultaneos INTEGER DEFAULT 1, -- Cuántos tenía abiertos
    
    -- Análisis
    velocidad_conteo DECIMAL(10,2), -- productos/minuto en ese momento
    diferencia_promedio_segundos INTEGER, -- vs promedio de su categoría
    es_tiempo_record BOOLEAN DEFAULT FALSE, -- Si fue el más rápido
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_sesion FOREIGN KEY (sesion_id) REFERENCES sesiones_tiempo(sesion_id) ON DELETE CASCADE
);

-- Índices para búsquedas y análisis rápidos
CREATE INDEX idx_tiempos_sesion ON tiempos_producto(sesion_id);
CREATE INDEX idx_tiempos_categoria ON tiempos_producto(categoria);
CREATE INDEX idx_tiempos_tipo ON tiempos_producto(tipo);
CREATE INDEX idx_tiempos_fecha ON tiempos_producto(hora_inicio);
CREATE INDEX idx_tiempos_producto ON tiempos_producto(producto_codigo);
CREATE INDEX idx_tiempos_accion ON tiempos_producto(accion);
CREATE INDEX idx_tiempos_duracion ON tiempos_producto(duracion_total_segundos);

-- =====================================================
-- TABLA 3: EVENTOS DE INTERACCIÓN (Para análisis profundo)
-- =====================================================
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
    campo_modificado VARCHAR(20), -- 'c1', 'c2', 'c3', 'cantidad_pedir'
    valor_anterior VARCHAR(50),
    valor_nuevo VARCHAR(50),
    
    -- Contexto
    duracion_desde_ultimo_evento INTEGER, -- segundos
    productos_abiertos_actual INTEGER DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_sesion_evento FOREIGN KEY (sesion_id) REFERENCES sesiones_tiempo(sesion_id) ON DELETE CASCADE
);

-- Índices para eventos
CREATE INDEX idx_eventos_sesion ON eventos_producto(sesion_id);
CREATE INDEX idx_eventos_producto ON eventos_producto(producto_id);
CREATE INDEX idx_eventos_tipo ON eventos_producto(tipo_evento);
CREATE INDEX idx_eventos_timestamp ON eventos_producto(timestamp_evento);

-- =====================================================
-- VISTAS ÚTILES PARA ANÁLISIS
-- =====================================================

-- Vista de resumen por categoría
CREATE VIEW resumen_tiempos_categoria AS
SELECT 
    categoria,
    tipo,
    COUNT(*) as total_conteos,
    AVG(duracion_total_segundos) as promedio_segundos,
    MIN(duracion_total_segundos) as minimo_segundos,
    MAX(duracion_total_segundos) as maximo_segundos,
    STDDEV(duracion_total_segundos) as desviacion_estandar,
    AVG(numero_cambios) as promedio_cambios,
    SUM(CASE WHEN accion = 'guardar' THEN 1 ELSE 0 END) as guardados,
    SUM(CASE WHEN accion = 'producto_cero' THEN 1 ELSE 0 END) as puestos_en_cero,
    SUM(CASE WHEN accion = 'producto_inactivo' THEN 1 ELSE 0 END) as inactivados
FROM tiempos_producto
GROUP BY categoria, tipo;

-- Vista de evolución por usuario
CREATE VIEW evolucion_usuario AS
SELECT 
    tp.sesion_id,
    st.usuario_email,
    st.usuario_nombre,
    DATE(tp.hora_inicio) as fecha,
    COUNT(*) as productos_contados,
    AVG(tp.duracion_total_segundos) as promedio_dia,
    MIN(tp.duracion_total_segundos) as mejor_tiempo,
    MAX(tp.duracion_total_segundos) as peor_tiempo,
    SUM(tp.numero_cambios) as total_cambios,
    AVG(tp.velocidad_conteo) as velocidad_promedio
FROM tiempos_producto tp
JOIN sesiones_tiempo st ON tp.sesion_id = st.sesion_id
WHERE tp.accion = 'guardar'
GROUP BY tp.sesion_id, st.usuario_email, st.usuario_nombre, DATE(tp.hora_inicio);

-- Vista de productos problemáticos
CREATE VIEW productos_problematicos AS
SELECT 
    producto_codigo,
    producto_nombre,
    categoria,
    tipo,
    COUNT(*) as veces_contado,
    AVG(duracion_total_segundos) as promedio_segundos,
    AVG(numero_cambios) as promedio_cambios,
    SUM(CASE WHEN fue_editado THEN 1 ELSE 0 END) as veces_editado,
    AVG(tiempo_hasta_primer_input) as promedio_tiempo_pensamiento
FROM tiempos_producto
GROUP BY producto_codigo, producto_nombre, categoria, tipo
HAVING AVG(duracion_total_segundos) > (
    SELECT AVG(duracion_total_segundos) * 1.5 
    FROM tiempos_producto
)
ORDER BY promedio_segundos DESC;

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función para calcular estadísticas de sesión
CREATE OR REPLACE FUNCTION actualizar_estadisticas_sesion(p_sesion_id VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE sesiones_tiempo
    SET 
        productos_contados = (
            SELECT COUNT(*) FROM tiempos_producto 
            WHERE sesion_id = p_sesion_id AND accion IN ('guardar', 'producto_cero', 'producto_inactivo')
        ),
        productos_con_tiempo = (
            SELECT COUNT(*) FROM tiempos_producto WHERE sesion_id = p_sesion_id
        ),
        tiempo_promedio_producto = (
            SELECT AVG(duracion_total_segundos) FROM tiempos_producto WHERE sesion_id = p_sesion_id
        ),
        tiempo_min_producto = (
            SELECT MIN(duracion_total_segundos) FROM tiempos_producto WHERE sesion_id = p_sesion_id
        ),
        tiempo_max_producto = (
            SELECT MAX(duracion_total_segundos) FROM tiempos_producto WHERE sesion_id = p_sesion_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE sesion_id = p_sesion_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sesiones_tiempo_updated_at 
BEFORE UPDATE ON sesiones_tiempo 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS DE EJEMPLO PARA PRUEBAS
-- =====================================================

-- Insertar una sesión de ejemplo
INSERT INTO sesiones_tiempo (
    sesion_id, bodega_id, bodega_nombre, usuario_email, usuario_nombre,
    fecha_inicio, productos_totales, es_prueba
) VALUES (
    'test-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    3,
    'Planta de Producción',
    'prueba@chiosburger.com',
    'Usuario Prueba',
    NOW(),
    10,
    TRUE
);

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Tablas de medición de tiempos creadas exitosamente';
    RAISE NOTICE 'Tablas creadas:';
    RAISE NOTICE '  - sesiones_tiempo';
    RAISE NOTICE '  - tiempos_producto (tabla más completa)';
    RAISE NOTICE '  - eventos_producto';
    RAISE NOTICE 'Vistas creadas:';
    RAISE NOTICE '  - resumen_tiempos_categoria';
    RAISE NOTICE '  - evolucion_usuario';
    RAISE NOTICE '  - productos_problematicos';
END $$;