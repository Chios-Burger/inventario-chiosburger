export interface Producto {
  id: string;
  fields: {
    'Nombre Producto': string;
    'Categoría'?: string;
    'Código'?: string;
    'Codigo'?: string;
    'Equivalencias Inventarios'?: string;
    'Estado'?: string;
    // Campos de tipo de producto (diferentes variaciones posibles)
    'Tipo A,B o C'?: string;
    'Tipo A, B o C'?: string;
    'Tipo A,B,C'?: string;
    'Tipo A, B, C'?: string;
    'Tipo ABC'?: string;
    'TipoABC'?: string;
    'Tipo'?: string;
    // Campos de control por bodega
    'Conteo Bodega Principal'?: string;
    'Conteo Bodega Materia Prima'?: string;
    'Conteo Planta Producción'?: string;
    'Conteo Chios'?: string;
    'Conteo Simón Bolón'?: string;
    'Conteo Santo Cachón'?: string;
    'Conteo Bodega Pulmon'?: string;
    // Campos de unidad por bodega
    'Unidad Conteo Bodega Principal'?: string;
    'Unidad Conteo Bodega Materia Prima'?: string;
    'Unidad Conteo Planta Producción'?: string;
    'Unidad Conteo Chios'?: string;
    'Unidad Conteo Simón Bolón'?: string;
    'Unidad Conteo Santo Cachón'?: string;
    'Unidad Conteo Bodega Pulmon'?: string;
    // Campos de movimientos
    'Mov. Chios'?: string;
    'Mov. Simon'?: string;
    'Mov. Santo'?: string;
    // Permitir acceso dinámico a campos
    [key: string]: any;
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
  touched?: boolean;
}

export interface AirtableResponse {
  records: Producto[];
  offset?: string;
}

export interface Usuario {
  id?: string;
  nombre: string;
  email: string;
  pin: string;
  esAdmin: boolean;
  bodegasPermitidas: number[];
}

export interface ProductoHistorico {
  id: string;
  codigo?: string;
  nombre: string;
  categoria?: string;
  tipo?: string; // Tipo A, B o C
  c1: number;
  c2: number;
  c3: number;
  total: number;
  unidad: string;
  unidadBodega: string;
  cantidadPedir: number;
  equivalencia?: string;
  movChios?: string; // Mov. Chios
  movSimon?: string; // Mov. Simon
  movSanto?: string; // Mov. Santo
}

export interface RegistroHistorico {
  id: string;
  fecha: string;
  fechaDisplay?: string; // Para mostrar en formato local
  hora: string;
  bodega: string;
  bodegaId: number;
  usuario: string;
  productos: ProductoHistorico[];
  totalProductos: number;
  productosGuardados: number;
  duracion: string;
  timestamp: number;
  origen?: 'local' | 'database'; // Indicador del origen de los datos
  sincronizado?: boolean; // Estado de sincronización
  fechaSincronizacion?: string; // Fecha ISO de última sincronización
}

export interface RegistroDiario {
  fecha: string;
  inventarios: RegistroHistorico[];
}