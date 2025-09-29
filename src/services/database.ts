import type { RegistroHistorico, ProductoHistorico } from '../types/index';

// Mapeo de bodegas a tablas
const TABLA_POR_BODEGA: { [key: number]: string } = {
  1: 'toma_bodega',           // Bodega Principal
  2: 'toma_materiaprima',     // Bodega Materia Prima
  3: 'toma_planta',           // Planta De Producción
  4: 'tomasFisicas',          // Chios Real Audiencia
  5: 'tomasFisicas',          // Chios Floreana
  6: 'tomasFisicas',          // Chios Portugal
  7: 'toma_simon_bolon',      // Simón Bolón
  8: 'toma_santo_cachon',     // Santo Cachón
  10: 'tomasFisicas'          // Bodega Santo Chios
};

// Nombres de locales para Chios
const NOMBRE_LOCAL_CHIOS: { [key: number]: string } = {
  4: 'Real Audiencia',
  5: 'Floreana',
  6: 'Portugal',
  10: 'Santo Chios'
};

export const databaseService = {
  // Generar ID único para cada registro
  generarId(codigo: string): string {
    const fecha = new Date();
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${dia}${mes}${año}-${codigo.toLowerCase()}-${random}`;
  },

  // Formatear fecha para PostgreSQL
  formatearFecha(fecha: string): string {
    // Convertir de formato DD/MM/YYYY a YYYY-MM-DD
    const partes = fecha.split('/');
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
    }
    return new Date().toISOString().split('T')[0];
  },

  // Formatear cantidades como string (c1+c2+c3)
  formatearCantidades(c1: number, c2: number, c3: number): string {
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
  },

  // Guardar inventario en la base de datos
  async guardarInventario(registro: RegistroHistorico): Promise<void> {
    const tabla = TABLA_POR_BODEGA[registro.bodegaId];
    if (!tabla) {
      throw new Error(`No se encontró tabla para la bodega ${registro.bodegaId}`);
    }

    try {
      // Aquí iría la lógica de conexión a PostgreSQL
      // Por ahora, simularemos el guardado
      console.log('Guardando en tabla:', tabla);
      console.log('Registro:', registro);

      // Para cada producto del inventario
      for (const producto of registro.productos) {
        const datos = this.prepararDatosParaTabla(
          tabla,
          registro,
          producto
        );
        
        // Aquí se ejecutaría el INSERT
        console.log('Datos a insertar:', datos);
      }

      // Simular éxito
      return Promise.resolve();
    } catch (error) {
      console.error('Error al guardar en base de datos:', error);
      throw error;
    }
  },

  // Preparar datos según la estructura de cada tabla
  prepararDatosParaTabla(
    tabla: string,
    registro: RegistroHistorico,
    producto: ProductoHistorico
  ): any {
    const fechaFormateada = this.formatearFecha(registro.fecha);
    
    switch (tabla) {
      case 'tomasFisicas':
        // Para Chios (Portugal, Real Audiencia, Floreana)
        return {
          fecha: registro.fecha,
          codtomas: `0${producto.id}`,
          cod_prod: producto.id,
          productos: producto.nombre,
          unidad: producto.unidadBodega,
          cantidad: producto.total.toString(),
          anotaciones: this.formatearCantidades(producto.c1, producto.c2, producto.c3),
          local: NOMBRE_LOCAL_CHIOS[registro.bodegaId] || '',
          cantidadSolicitada: producto.cantidadPedir > 0 ? producto.cantidadPedir.toString() : '',
          uni_bod: ''
        };

      case 'toma_bodega':
        // Bodega Principal
        return {
          id: this.generarId(producto.id),
          codigo: producto.id,
          producto: producto.nombre,
          fecha: registro.fecha,
          usuario: `${registro.usuario} - ${registro.usuario} - principal@chiosburger.com`,
          cantidades: this.formatearCantidades(producto.c1, producto.c2, producto.c3) + '+',
          total: producto.total.toString(),
          unidad: producto.unidadBodega
        };

      case 'toma_materiaprima':
        // Bodega Materia Prima
        return {
          id: this.generarId(producto.id),
          codigo: producto.id,
          producto: producto.nombre,
          fecha: fechaFormateada,
          usuario: `${registro.usuario} - materia@chiosburger.com`,
          cantidades: this.formatearCantidades(producto.c1, producto.c2, producto.c3) + '+0',
          total: producto.total,
          unidad: producto.unidadBodega
        };

      case 'toma_planta':
        // Planta Producción
        return {
          id: this.generarId(producto.id),
          codigo: producto.id,
          producto: producto.nombre,
          fecha: fechaFormateada,
          usuario: `${registro.usuario} - produccion@chiosburger.com`,
          cantidades: this.formatearCantidades(producto.c1, producto.c2, producto.c3),
          total: producto.total,
          unidad: producto.unidadBodega
        };

      case 'toma_simon_bolon':
        // Simón Bolón
        return {
          id: this.generarId(producto.id),
          fecha: fechaFormateada,
          usuario: `${registro.usuario} - simon@chiosburger.com`,
          codigo: producto.id,
          producto: producto.nombre,
          cantidad: this.formatearCantidades(producto.c1, producto.c2, producto.c3),
          total: producto.total,
          uni_local: producto.unidadBodega,
          cant_pedir: producto.cantidadPedir > 0 ? producto.cantidadPedir : null,
          uni_bod: producto.unidad
        };

      case 'toma_santo_cachon':
        // Santo Cachón
        return {
          id: this.generarId(producto.id),
          fecha: fechaFormateada,
          usuario: `${registro.usuario} - santo@chiosburger.com`,
          codigo: producto.id,
          producto: producto.nombre,
          cantidad: this.formatearCantidades(producto.c1, producto.c2, producto.c3),
          total: producto.total,
          uni_local: producto.unidadBodega,
          cant_pedir: producto.cantidadPedir > 0 ? producto.cantidadPedir : null,
          uni_bod: producto.unidad
        };

      default:
        throw new Error(`Tabla no reconocida: ${tabla}`);
    }
  }
};