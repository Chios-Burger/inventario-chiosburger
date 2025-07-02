-- Script para agregar columnas categoria y tipo a todas las tablas de inventario
-- Fecha: 2025-07-02

-- Agregar columnas a toma_bodega
ALTER TABLE public.toma_bodega 
ADD COLUMN IF NOT EXISTS categoria VARCHAR(100),
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20);

-- Agregar columnas a toma_materiaprima
ALTER TABLE public.toma_materiaprima 
ADD COLUMN IF NOT EXISTS categoria VARCHAR(100),
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20);

-- Agregar columnas a toma_planta
ALTER TABLE public.toma_planta 
ADD COLUMN IF NOT EXISTS categoria VARCHAR(100),
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20);

-- Agregar columnas a tomasFisicas
ALTER TABLE public."tomasFisicas" 
ADD COLUMN IF NOT EXISTS categoria VARCHAR(100),
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20);

-- Agregar columnas a toma_simon_bolon
ALTER TABLE public.toma_simon_bolon 
ADD COLUMN IF NOT EXISTS categoria VARCHAR(100),
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20);

-- Agregar columnas a toma_santo_cachon
ALTER TABLE public.toma_santo_cachon 
ADD COLUMN IF NOT EXISTS categoria VARCHAR(100),
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20);

-- Agregar columnas a toma_bodegapulmon
ALTER TABLE public.toma_bodegapulmon 
ADD COLUMN IF NOT EXISTS categoria VARCHAR(100),
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20);

-- Crear índices para mejorar el rendimiento de búsquedas por tipo
CREATE INDEX IF NOT EXISTS idx_toma_bodega_tipo ON public.toma_bodega(tipo);
CREATE INDEX IF NOT EXISTS idx_toma_materiaprima_tipo ON public.toma_materiaprima(tipo);
CREATE INDEX IF NOT EXISTS idx_toma_planta_tipo ON public.toma_planta(tipo);
CREATE INDEX IF NOT EXISTS idx_tomasFisicas_tipo ON public."tomasFisicas"(tipo);
CREATE INDEX IF NOT EXISTS idx_toma_simon_bolon_tipo ON public.toma_simon_bolon(tipo);
CREATE INDEX IF NOT EXISTS idx_toma_santo_cachon_tipo ON public.toma_santo_cachon(tipo);
CREATE INDEX IF NOT EXISTS idx_toma_bodegapulmon_tipo ON public.toma_bodegapulmon(tipo);