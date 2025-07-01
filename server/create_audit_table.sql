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

-- Crear índices para búsquedas rápidas
CREATE INDEX idx_auditoria_usuario ON public.auditoria_eliminaciones(usuario_email);
CREATE INDEX idx_auditoria_fecha ON public.auditoria_eliminaciones(fecha_eliminacion);
CREATE INDEX idx_auditoria_registro ON public.auditoria_eliminaciones(registro_id);
EOF < /dev/null
