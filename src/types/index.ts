export interface Producto {
  id: string;
  fields: {
    'Nombre Producto': string;
    'Categoría'?: string;
    'Equivalencias Inventarios'?: string;
    // Campos de control por bodega
    'Conteo Bodega Principal'?: string;
    'Conteo Bodega Materia Prima'?: string;
    'Conteo Planta Producción'?: string;
    'Conteo Chios'?: string;
    'Conteo Simón Bolón'?: string;
    'Conteo Santo Cachón'?: string;
    // Campos de unidad por bodega
    'Unidad Conteo Bodega Principal'?: string;
    'Unidad Conteo Bodega Materia Prima'?: string;
    'Unidad Conteo Planta Producción'?: string;
    'Unidad Conteo Chios'?: string;
    'Unidad Conteo Simón Bolón'?: string;
    'Unidad Conteo Santo Cachón'?: string;
  };
}

export interface Bodega {
  id: number;
  nombre: string;
  campo: string;
  unidad: string;
}

export interface Conteo {
  productoId: string;
  c1: number;
  c2: number;
  c3: number;
  cantidadPedir: number;
}

export interface AirtableResponse {
  records: Producto[];
  offset?: string;
}