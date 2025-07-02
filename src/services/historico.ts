import type { RegistroHistorico, RegistroDiario, ProductoHistorico, Producto, Conteo } from '../types/index';
import { authService } from './auth';

// URL del API backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to find the tipo field with various possible names
function obtenerTipoProducto(fields: any): string {
  // Lista de posibles nombres del campo tipo
  const posiblesNombres = [
    'Tipo A,B o C',
    'Tipo A, B o C',
    'Tipo A,B,C',
    'Tipo A, B, C',
    'Tipo ABC',
    'TipoABC',
    'Tipo',
    'tipo'
  ];
  
  // Buscar el campo con cualquiera de los nombres posibles
  for (const nombre of posiblesNombres) {
    if (fields[nombre]) {
      return fields[nombre];
    }
  }
  
  // Si no se encuentra, buscar cualquier campo que contenga "tipo" (case insensitive)
  const campoTipo = Object.keys(fields).find(key => 
    key.toLowerCase().includes('tipo') && fields[key]
  );
  
  if (campoTipo) {
    return fields[campoTipo];
  }
  
  return '';
}


// Función para generar ID único con formato: YYMMDD-[número]codigo+timestamp
function generarIdUnico(fecha: string, bodegaId: number, codigoProducto: string): string {
  // Convertir fecha a formato YYMMDD
  const fechaParts = fecha.split('-');
  if (fechaParts.length !== 3) {
    // Si la fecha no tiene el formato esperado, usar fecha actual
    const ahora = new Date();
    const año = ahora.getFullYear().toString().slice(-2);
    const mes = (ahora.getMonth() + 1).toString().padStart(2, '0');
    const dia = ahora.getDate().toString().padStart(2, '0');
    return `${año}${mes}${dia}-${bodegaId}${codigoProducto}+${Date.now().toString().slice(-6)}`;
  }
  
  const fechaFormateada = fechaParts[0].substring(2) + fechaParts[1] + fechaParts[2];
  
  // Generar timestamp único (últimos 6 dígitos del timestamp actual)
  const timestamp = Date.now().toString().slice(-6);
  
  // Formato simplificado: YYMMDD-[número]codigo+timestamp
  return `${fechaFormateada}-${bodegaId}${codigoProducto}+${timestamp}`;
}

export const historicoService = {
  async guardarInventario(
    bodegaId: number,
    bodegaNombre: string,
    productos: Producto[],
    conteos: {[key: string]: Conteo},
    productosGuardados: Set<string>,
    duracion: string
  ): Promise<void> {
    console.log('🔄 Iniciando guardado de inventario...', { bodegaId, bodegaNombre, productosGuardados: productosGuardados.size });
    
    const usuario = authService.getUsuarioActual();
    if (!usuario) {
      console.error('❌ No hay usuario autenticado');
      return;
    }

    const ahora = new Date();
    // Formato para mostrar
    const fechaDisplay = ahora.toLocaleDateString('es-EC');
    // Formato para el ID y la base de datos (YYYY-MM-DD)
    const fechaISO = ahora.toISOString().split('T')[0];
    const hora = ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

    // Convertir productos guardados a formato histórico
    const productosHistorico: ProductoHistorico[] = Array.from(productosGuardados).map((productoId, index) => {
      const producto = productos.find(p => p.id === productoId);
      const conteo = conteos[productoId];
      
      if (!producto || !conteo) return null;

      const total = conteo.c1 + conteo.c2 + conteo.c3;
      
      // Debug: Ver campos del producto (solo el primero)
      if (index === 0) {
        console.log('🔍 Campos disponibles del producto:', Object.keys(producto.fields));
        console.log('🔍 Producto completo:', producto.fields);
        
        // Buscar cualquier campo que contenga "tipo" (case insensitive)
        const camposTipo = Object.keys(producto.fields).filter(key => 
          key.toLowerCase().includes('tipo')
        );
        console.log('🔍 Campos que contienen "tipo":', camposTipo);
        
        // Mostrar valores de posibles campos tipo
        console.log('🔍 Valores de campos tipo:', {
          'Tipo A,B o C': producto.fields['Tipo A,B o C'],
          'Tipo A, B o C': producto.fields['Tipo A, B o C'],
          'Tipo': producto.fields['Tipo'],
          ...camposTipo.reduce((acc, campo) => {
            acc[campo] = producto.fields[campo];
            return acc;
          }, {} as any)
        });
        
        // Debug: Mostrar categoría
        console.log('🔍 Categoría del producto:', producto.fields['Categoría']);
      }
      
      // Obtener el código del producto desde los campos de Airtable
      let codigoProducto = '';
      
      // Intentar obtener el código real del producto si existe
      if (producto.fields['Código']) {
        codigoProducto = producto.fields['Código'] as string;
      } else if (producto.fields['Codigo']) {
        codigoProducto = producto.fields['Codigo'] as string;
      } else {
        // Si no hay código, usar los primeros caracteres del ID
        codigoProducto = producto.id.substring(0, 8);
      }
      
      // Generar ID único con el nuevo formato
      const idUnico = generarIdUnico(fechaISO, bodegaId, codigoProducto);
      
      // Log para depuración de categoría y tipo
      if (index === 0) {
        console.log('🎯 Datos finales del producto:', {
          nombre: producto.fields['Nombre Producto'],
          categoria: producto.fields['Categoría'],
          tipo: obtenerTipoProducto(producto.fields)
        });
      }
      
      return {
        id: idUnico,
        codigo: codigoProducto, // Código de Airtable
        nombre: producto.fields['Nombre Producto'],
        categoria: producto.fields['Categoría'],
        c1: conteo.c1,
        c2: conteo.c2,
        c3: conteo.c3,
        total,
        cantidadPedir: conteo.cantidadPedir,
        unidad: producto.fields['Unidad Conteo Bodega Principal'] || 'unidades',
        unidadBodega: producto.fields[`Unidad Conteo ${bodegaNombre}`] || 'unidades',
        equivalencia: producto.fields['Equivalencias Inventarios'],
        tipo: obtenerTipoProducto(producto.fields)
      };
    }).filter(Boolean) as ProductoHistorico[];

    const registro: RegistroHistorico = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fecha: fechaISO, // Usar formato ISO para la base de datos
      fechaDisplay, // Mantener fecha en formato display para localStorage
      hora,
      usuario: usuario.nombre,
      bodega: bodegaNombre,
      bodegaId,
      productos: productosHistorico,
      duracion,
      productosGuardados: productosGuardados.size,
      totalProductos: productos.length,
      timestamp: Date.now(),
      origen: 'local' // Marcar como origen local
    };

    // Guardar en localStorage primero (con fechaDisplay para mostrar)
    const registroParaLocalStorage = {
      ...registro,
      fecha: fechaDisplay, // En localStorage guardamos la fecha en formato display
      sincronizado: false // Marcar como no sincronizado inicialmente
    };
    const registrosExistentes = this.obtenerHistoricosLocales();
    registrosExistentes.push(registroParaLocalStorage);
    localStorage.setItem('historicos', JSON.stringify(registrosExistentes));
    console.log('✅ Guardado en localStorage', { registroId: registro.id });

    // Intentar guardar en la base de datos
    try {
      console.log('📡 Enviando a base de datos...', { 
        url: `${API_URL}/inventario`,
        bodegaId: registro.bodegaId,
        bodegaIdType: typeof registro.bodegaId,
        bodega: registro.bodega,
        productos: registro.productos.length 
      });
      
      console.log('📦 Registro completo a enviar:', {
        bodegaId: registro.bodegaId,
        bodegaIdType: typeof registro.bodegaId,
        bodega: registro.bodega
      });
      
      const response = await fetch(`${API_URL}/inventario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registro)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Error al guardar en base de datos:', error.message);
        // No lanzamos error para que el guardado local funcione
      } else {
        const result = await response.json();
        console.log('✅ Inventario guardado en base de datos exitosamente', result);
        
        // Marcar como sincronizado en localStorage
        const registrosActualizados = this.obtenerHistoricosLocales();
        const indice = registrosActualizados.findIndex(r => r.id === registro.id);
        if (indice !== -1) {
          registrosActualizados[indice].sincronizado = true;
          registrosActualizados[indice].fechaSincronizacion = new Date().toISOString();
          localStorage.setItem('historicos', JSON.stringify(registrosActualizados));
        }
      }
    } catch (error) {
      console.error('❌ Error de conexión con el servidor:', error);
      // No lanzamos error, el inventario ya está guardado localmente
    }
  },

  async obtenerHistoricos(): Promise<RegistroHistorico[]> {
    try {
      // Obtener todos los históricos de todas las bodegas desde la base de datos
      const bodegas = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const todosLosHistoricos: RegistroHistorico[] = [];
      
      for (const bodegaId of bodegas) {
        try {
          const response = await fetch(`${API_URL}/inventarios/${bodegaId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              // Convertir los datos de la BD al formato de RegistroHistorico
              const historicos = this.convertirDatosBD(data.data, bodegaId);
              todosLosHistoricos.push(...historicos);
            }
          }
        } catch (error) {
          console.error(`Error al obtener históricos de bodega ${bodegaId}:`, error);
        }
      }
      
      // Combinar con datos locales si existen
      const datosLocales = this.obtenerHistoricosLocales();
      
      // Agregar históricos locales que no estén en la BD
      datosLocales.forEach(local => {
        local.origen = 'local';
      });
      
      return [...todosLosHistoricos, ...datosLocales];
    } catch (error) {
      console.error('Error al obtener históricos de la BD:', error);
      // Fallback a localStorage si falla la BD
      return this.obtenerHistoricosLocales();
    }
  },

  async obtenerHistoricosPorDia(): Promise<RegistroDiario[]> {
    const historicos = await this.obtenerHistoricos();
    const porDia: { [fecha: string]: RegistroHistorico[] } = {};

    // Agrupar por fecha
    historicos.forEach(registro => {
      if (!porDia[registro.fecha]) {
        porDia[registro.fecha] = [];
      }
      porDia[registro.fecha].push(registro);
    });

    // Convertir a array y ordenar por fecha descendente
    return Object.entries(porDia)
      .map(([fecha, inventarios]) => ({
        fecha,
        inventarios: inventarios.sort((a, b) => 
          b.hora.localeCompare(a.hora)
        )
      }))
      .sort((a, b) => {
        const [diaA, mesA, añoA] = a.fecha.split('/').map(Number);
        const [diaB, mesB, añoB] = b.fecha.split('/').map(Number);
        const fechaA = new Date(añoA, mesA - 1, diaA);
        const fechaB = new Date(añoB, mesB - 1, diaB);
        return fechaB.getTime() - fechaA.getTime();
      });
  },

  async obtenerHistoricosPorBodega(bodegaId: number): Promise<RegistroHistorico[]> {
    const historicos = await this.obtenerHistoricos();
    return historicos
      .filter(registro => registro.bodegaId === bodegaId)
      .sort((a, b) => {
        const fechaA = new Date(`${a.fecha} ${a.hora}`);
        const fechaB = new Date(`${b.fecha} ${b.hora}`);
        return fechaB.getTime() - fechaA.getTime();
      });
  },

  async eliminarHistorico(id: string, usuario: any, eliminarDeBD: boolean = false): Promise<void> {
    console.log('🔍 Eliminando registro con ID:', id);
    console.log('👤 Usuario:', usuario.email);
    console.log('🗄️ Eliminar de BD:', eliminarDeBD);
    
    // Obtener TODOS los registros (locales y de BD)
    const todosLosHistoricos = await this.obtenerHistoricos();
    console.log('📋 Total de registros encontrados:', todosLosHistoricos.length);
    console.log('🔎 IDs disponibles:', todosLosHistoricos.map(h => h.id));
    console.log('🔍 Buscando coincidencia exacta para ID:', id);
    console.log('🧐 Tipo de ID buscado:', typeof id);
    console.log('📊 Primeros 5 registros con sus IDs y tipos:', 
      todosLosHistoricos.slice(0, 5).map(h => ({ 
        id: h.id, 
        tipo: typeof h.id,
        origen: h.origen,
        fecha: h.fecha 
      }))
    );
    
    const registroAEliminar = todosLosHistoricos.find(h => h.id === id);
    
    // Si no encontramos el registro y el usuario es super admin, intentar eliminarlo de todos modos
    if (!registroAEliminar && usuario.email === 'analisis@chiosburger.com') {
      console.warn('⚠️ Registro no encontrado localmente, pero intentando eliminar de BD para super admin');
      console.log('📋 IDs disponibles:', todosLosHistoricos.map(h => h.id));
      
      // Crear un registro temporal solo para la eliminación
      const registroTemporal = {
        id: id,
        origen: 'database',
        fecha: new Date().toISOString(),
        productos: []
      };
      
      // Intentar eliminar directamente de BD
      const response = await fetch(`${API_URL}/inventario/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuarioEmail: usuario.email,
          usuarioNombre: usuario.nombre,
          registroData: registroTemporal,
          eliminarDeBD: true,
          esDeBD: true,
          forzarEliminacion: true
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar registro de BD');
      }
      
      console.log('✅ Registro eliminado de BD (forzado para super admin)');
      return;
    }
    
    if (!registroAEliminar) {
      console.error('❌ Registro no encontrado con ID:', id);
      console.error('📋 Registros disponibles:', todosLosHistoricos.map(h => ({ id: h.id, fecha: h.fecha, origen: h.origen })));
      throw new Error('Registro no encontrado');
    }
    
    console.log('✅ Registro encontrado:', registroAEliminar);
    
    try {
      // Para registros de database, necesitamos información adicional
      let bodyData: any = {
        usuarioEmail: usuario.email,
        usuarioNombre: usuario.nombre,
        registroData: registroAEliminar,
        eliminarDeBD: eliminarDeBD
      };

      // Si es un registro de database, incluir información para identificarlo en BD
      if (registroAEliminar.origen === 'database') {
        bodyData.esDeBD = true;
        bodyData.fecha = registroAEliminar.fecha;
        bodyData.bodegaId = registroAEliminar.bodegaId;
        // Incluir los productos para poder identificar el registro en BD
        bodyData.productos = registroAEliminar.productos;
      }

      // Enviar a auditoría y eliminar de BD si es necesario
      const response = await fetch(`${API_URL}/inventario/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar registro');
      }

      // Eliminar de localStorage solo si es un registro local
      if (registroAEliminar.origen === 'local' || !registroAEliminar.origen) {
        const historicosLocales = this.obtenerHistoricosLocales();
        const nuevosHistoricos = historicosLocales.filter(h => h.id !== id);
        localStorage.setItem('historicos', JSON.stringify(nuevosHistoricos));
      }
      
      console.log('✅ Registro eliminado y auditado correctamente');
    } catch (error) {
      console.error('❌ Error al eliminar registro:', error);
      throw error;
    }
  },

  limpiarHistoricos(): void {
    if (confirm('¿Estás seguro de eliminar TODOS los registros históricos? Esta acción no se puede deshacer.')) {
      localStorage.removeItem('historicos');
    }
  },

  // Función auxiliar para obtener solo históricos locales
  obtenerHistoricosLocales(): RegistroHistorico[] {
    const data = localStorage.getItem('historicos');
    if (data) {
      try {
        const historicos = JSON.parse(data);
        // Marcar todos como origen local
        return historicos.map((h: RegistroHistorico) => ({
          ...h,
          origen: 'local'
        }));
      } catch {
        return [];
      }
    }
    return [];
  },

  // Editar un producto de un registro
  async editarProducto(
    registroId: string,
    productoId: string,
    nuevoTotal: number,
    nuevaCantidadPedir: number,
    motivo: string,
    usuario: any,
    registro: any
  ): Promise<void> {
    try {
      // Buscar el registro en localStorage o BD
      const todosLosHistoricos = await this.obtenerHistoricos();
      const registroActual = todosLosHistoricos.find(h => h.id === registroId);
      
      if (!registroActual) {
        throw new Error('Registro no encontrado');
      }
      
      // Buscar el producto específico
      const productoIndex = registroActual.productos.findIndex(p => p.id === productoId);
      if (productoIndex === -1) {
        throw new Error('Producto no encontrado');
      }
      
      const producto = registroActual.productos[productoIndex];
      const valorAnteriorTotal = producto.total;
      const valorAnteriorCantidad = producto.cantidadPedir;
      const diferenciaTotal = nuevoTotal - valorAnteriorTotal;
      const diferenciaCantidad = nuevaCantidadPedir - valorAnteriorCantidad;
      
      // Preparar datos para auditoría y actualización
      const datosEdicion = {
        registroId: registroId,
        productoId: productoId,
        valorAnteriorTotal: valorAnteriorTotal,
        valorNuevoTotal: nuevoTotal,
        diferenciaTotal: diferenciaTotal,
        valorAnteriorCantidad: valorAnteriorCantidad,
        valorNuevoCantidad: nuevaCantidadPedir,
        diferenciaCantidad: diferenciaCantidad,
        motivo: motivo || '',
        usuarioEmail: usuario.email,
        usuarioNombre: usuario.nombre,
        productoNombre: producto.nombre,
        productoCodigo: producto.codigo || '',
        bodegaId: registro.bodegaId,
        bodegaNombre: registro.bodega,
        fechaRegistro: new Date(registroActual.timestamp || Date.now()).toISOString()
      };
      
      console.log('📤 Enviando datos de edición:', datosEdicion);
      console.log('📌 URL:', `${API_URL}/inventario/${registroId}/editar`);
      
      // Enviar al backend para actualizar BD y crear auditoría
      const response = await fetch(`${API_URL}/inventario/${registroId}/editar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosEdicion)
      });
      
      if (!response.ok) {
        let errorMessage = 'Error al editar el producto';
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
          console.error('❌ Error del servidor:', error);
        } catch (e) {
          console.error('❌ Error al parsear respuesta:', e);
        }
        throw new Error(errorMessage);
      }
      
      // Actualizar en localStorage si es un registro local
      if (registroActual.origen === 'local' || !registroActual.origen) {
        const historicosLocales = this.obtenerHistoricosLocales();
        const registroLocalIndex = historicosLocales.findIndex(h => h.id === registroId);
        
        if (registroLocalIndex !== -1) {
          historicosLocales[registroLocalIndex].productos[productoIndex].total = nuevoTotal;
          historicosLocales[registroLocalIndex].productos[productoIndex].cantidadPedir = nuevaCantidadPedir;
          localStorage.setItem('historicos', JSON.stringify(historicosLocales));
        }
      }
      
      console.log('✅ Producto editado correctamente');
    } catch (error) {
      console.error('❌ Error al editar producto:', error);
      throw error;
    }
  },

  // Función auxiliar para convertir datos de BD al formato RegistroHistorico
  convertirDatosBD(datos: any[], bodegaId: number): RegistroHistorico[] {
    const NOMBRES_BODEGAS: { [key: number]: string } = {
      1: 'Bodega Principal',
      2: 'Bodega Materia Prima',
      3: 'Planta Producción',
      4: 'Chios Real Audiencia',
      5: 'Chios Floreana',
      6: 'Chios Portugal',
      7: 'Simón Bolívar',
      8: 'Santo Cachón',
      9: 'Bodega Pulmon'
    };
    
    // Log para verificar estructura de datos de BD
    if (datos.length > 0) {
      console.log('📊 Datos de BD - Primer registro:', datos[0]);
      console.log('📊 Campos disponibles:', Object.keys(datos[0]));
    }

    // Agrupar productos por fecha y usuario (sesión de inventario)
    const sesiones: { [key: string]: any[] } = {};
    
    datos.forEach(row => {
      // Extraer usuario del formato almacenado
      let usuario = 'Usuario';
      if (row.usuario) {
        const partes = row.usuario.split(' - ');
        usuario = partes[0] || 'Usuario';
      }
      
      // Crear clave única para la sesión (fecha + usuario)
      const fechaStr = row.fecha || '';
      const claveSesion = `${fechaStr}_${usuario}`;
      
      if (!sesiones[claveSesion]) {
        sesiones[claveSesion] = [];
      }
      
      sesiones[claveSesion].push(row);
    });

    // Convertir cada sesión en un RegistroHistorico
    return Object.entries(sesiones).map(([, productos]) => {
      const primerProducto = productos[0];
      
      // Extraer usuario del formato almacenado
      let usuario = 'Usuario';
      if (primerProducto.usuario) {
        const partes = primerProducto.usuario.split(' - ');
        usuario = partes[0] || 'Usuario';
      }

      // Formatear fecha
      let fechaDisplay = primerProducto.fecha;
      let horaInventario = '00:00';
      try {
        const fecha = new Date(primerProducto.fecha);
        fechaDisplay = fecha.toLocaleDateString('es-EC');
        
        // Intentar extraer hora del ID o usar hora actual
        if (primerProducto.id && primerProducto.id.includes('-')) {
          // Si el ID tiene formato con timestamp, intentar extraer hora
          const ahora = new Date();
          horaInventario = ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
        }
      } catch {
        // Mantener fecha original si no se puede parsear
      }

      // Convertir cada fila en un ProductoHistorico
      const productosHistorico: ProductoHistorico[] = productos.map(row => {
        // Debug log para el primer producto
        if (productos.indexOf(row) === 0) {
          console.log('🔍 Datos DB - Campos disponibles:', Object.keys(row));
          console.log('🔍 Datos DB - Valores:', {
            categoria: row.categoria,
            categoría: row.categoría,
            tipo: row.tipo,
            tipo_abc: row.tipo_abc,
            tipo_a_b_c: row.tipo_a_b_c
          });
        }
        
        // Parsear cantidades (formato: "1+2+3+0")
        const cantidadesStr = row.cantidades || row.cantidad || '';
        const cantidadesParts = cantidadesStr.split('+').map((n: string) => parseFloat(n) || 0);
        const c1 = cantidadesParts[0] || 0;
        const c2 = cantidadesParts[1] || 0;
        const c3 = cantidadesParts[2] || 0;

        return {
          id: row.id || row.codtomas || '',
          codigo: row.codigo || row.cod_prod || '',
          nombre: row.producto || row.productos || '',
          categoria: row.categoria || row.categoría || '', // Try both 'categoria' and 'categoría'
          tipo: row.tipo || row['tipo_abc'] || row['tipo_a_b_c'] || '', // Try different field names
          c1,
          c2,
          c3,
          total: parseFloat(row.total) || 0,
          cantidadPedir: parseFloat(row.cant_pedir || row.cantidadSolicitada || '0') || 0,
          unidad: row.unidad || 'unidades',
          unidadBodega: row.uni_bod || row.uni_local || row.unidad || 'unidades',
          equivalencia: row.equivalencia || ''
        };
      });

      // Generar ID único y consistente para la sesión basado en los datos
      // Usar el ID del primer producto si existe, o generar uno basado en fecha+usuario+bodega
      let sessionId = primerProducto.id || '';
      if (!sessionId || sessionId.length < 10) {
        // Si no hay ID o es muy corto, generar uno consistente basado en los datos
        const fechaTimestamp = new Date(primerProducto.fecha).getTime() || Date.now();
        const usuarioHash = usuario.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5);
        sessionId = `${fechaTimestamp}-${bodegaId}-${usuarioHash}`;
      }

      return {
        id: sessionId,
        fecha: fechaDisplay,
        hora: horaInventario,
        usuario: usuario,
        bodega: NOMBRES_BODEGAS[bodegaId] || `Bodega ${bodegaId}`,
        bodegaId: bodegaId,
        productos: productosHistorico,
        duracion: '0s', // No tenemos esta info en la BD
        productosGuardados: productosHistorico.length,
        totalProductos: productosHistorico.length,
        timestamp: new Date(primerProducto.fecha).getTime() || Date.now(),
        origen: 'database' // Marcar como origen base de datos
      };
    });
  }
};