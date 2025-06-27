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

export interface Usuario {
  email: string;
  pin: string;
  nombre: string;
  bodegasPermitidas: number[];
  esAdmin: boolean;
}

export interface RegistroHistorico {
  id: string;
  fecha: string;
  hora: string;
  usuario: string;
  bodega: string;
  bodegaId: number;
  productos: ProductoHistorico[];
  duracion: string;
  productosGuardados: number;
  totalProductos: number;
}

export interface ProductoHistorico {
  id: string;
  nombre: string;
  categoria?: string;
  c1: number;
  c2: number;
  c3: number;
  total: number;
  cantidadPedir: number;
  unidad: string;
  unidadBodega: string;
  equivalencia?: string;
}

export interface RegistroDiario {
  fecha: string;
  inventarios: RegistroHistorico[];
}