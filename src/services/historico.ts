import type { RegistroHistorico, RegistroDiario, ProductoHistorico, Producto, Conteo } from '../types/index';
import { authService } from './auth';
import { notificationSystem } from '../utils/notificationSystem';
import { 
  obtenerFechaActual, 
  fechaAISO, 
  horaADisplay, 
  generarIdUnico as generarIdUnicoUtil
} from '../utils/dateUtils';

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
function generarIdUnico(fecha: string, bodegaId: number, codigoProducto: string, timestampSesion: number): string {
  // Convertir fecha a formato YYMMDD
  const fechaParts = fecha.split('-');
  if (fechaParts.length !== 3) {
    // Si la fecha no tiene el formato esperado, usar utilidad
    return generarIdUnicoUtil();
  }
  
  const fechaFormateada = fechaParts[0].substring(2) + fechaParts[1] + fechaParts[2];
  
  // Usar el timestamp de sesión proporcionado
  return `${fechaFormateada}-${bodegaId}${codigoProducto}+${timestampSesion}`;
}

// Intervalo para sincronización automática
let syncInterval: NodeJS.Timeout | null = null;

export const historicoService = {
  // Iniciar sincronización automática
  iniciarSincronizacionAutomatica(onSyncComplete?: (success: boolean, count?: number) => void) {
    // Limpiar intervalo anterior si existe
    if (syncInterval) {
      clearInterval(syncInterval);
    }
    
    // Sincronizar cada 10 minutos
    syncInterval = setInterval(async () => {
      const result = await this.sincronizarRegistrosLocales();
      if (onSyncComplete) {
        onSyncComplete(result.success, result.count);
      }
    }, 10 * 60 * 1000); // 10 minutos
    
    // Sincronizar inmediatamente al iniciar
    this.sincronizarRegistrosLocales().then(result => {
      if (onSyncComplete) {
        onSyncComplete(result.success, result.count);
      }
    });
  },
  
  // Detener sincronización automática
  detenerSincronizacionAutomatica() {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  },
  
  // Sincronizar todos los registros locales
  async sincronizarRegistrosLocales(): Promise<{success: boolean, count: number}> {
    const registrosLocales = this.obtenerHistoricosLocales();
    let sincronizados = 0;
    
    // Filtrar registros con fechas válidas antes de intentar sincronizar
    const registrosValidos = registrosLocales.filter(registro => {
      if (!registro.fecha) return false;
      const fechaValida = fechaAISO(registro.fecha);
      return fechaValida && fechaValida !== '';
    });
    
    for (const registro of registrosValidos) {
      try {
        const response = await fetch(`${API_URL}/inventario`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...registro,
            fecha: fechaAISO(registro.fecha) // Asegurar formato ISO
          })
        });
        
        if (response.ok) {
          sincronizados++;
          // Eliminar el registro local ya que se sincronizó
          const registrosActualizados = this.obtenerHistoricosLocales();
          const registrosFiltrados = registrosActualizados.filter(r => r.id !== registro.id);
          localStorage.setItem('historicos', JSON.stringify(registrosFiltrados));
        }
      } catch (error: any) {
        // Solo mostrar error si no es de conexión
        if (!error.message?.includes('Failed to fetch')) {
          console.error('Error sincronizando registro:', registro.id, error);
        }
      }
    }
    
    // Limpiar registros con fechas inválidas del localStorage
    if (registrosValidos.length < registrosLocales.length) {
      localStorage.setItem('historicos', JSON.stringify(registrosValidos));
    }
    
    return { success: sincronizados > 0, count: sincronizados };
  },
  
  // Método auxiliar para obtener el campo de unidad según la bodega
  obtenerCampoUnidad(_bodegaId: number): string {
    return 'Unidad De Conteo General';
  },
  async guardarInventario(
    bodegaId: number,
    bodegaNombre: string,
    productos: Producto[],
    conteos: {[key: string]: Conteo},
    productosGuardados: Set<string>,
    duracion: string
  ): Promise<void> {
    const usuario = authService.getUsuarioActual();
    if (!usuario) {
      throw new Error('No hay usuario autenticado');
    }

    const ahora = obtenerFechaActual();
    // Formato para el ID y la base de datos (YYYY-MM-DD)
    const fechaISO = fechaAISO(ahora);
    const hora = horaADisplay(ahora);

    // Generar UN SOLO timestamp para TODA la sesión
    const timestampSesion = Date.now();
    console.log('🕐 Timestamp único para toda la sesión:', timestampSesion);

    // Convertir productos guardados a formato histórico
    const productosHistorico: ProductoHistorico[] = Array.from(productosGuardados).map((productoId) => {
      const producto = productos.find(p => p.id === productoId);
      const conteo = conteos[productoId];
      
      if (!producto || !conteo) return null;

      const total = conteo.c1 + conteo.c2 + conteo.c3;
      
      
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
      
      // Generar ID único con el nuevo formato usando el timestamp de sesión
      const idUnico = generarIdUnico(fechaISO, bodegaId, codigoProducto, timestampSesion);
      // ID generado con timestamp de sesión
      
      
      // Obtener la unidad correcta desde el campo general
      const unidadGeneral = producto.fields['Unidad De Conteo General'];
      
      // Debug: Ver qué valores vienen de Airtable
      if (!unidadGeneral) {
        console.warn(`⚠️ Producto sin unidad definida:`, {
          producto: producto.fields['Nombre Producto'],
          codigo: codigoProducto,
          bodegaId,
          unidadGeneral: unidadGeneral || 'NO DEFINIDA'
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
        unidad: unidadGeneral || 'unidad', // Unidad general para todo
        unidadBodega: unidadGeneral || 'unidad', // Misma unidad para todo
        equivalencia: producto.fields['Equivalencias Inventarios'],
        tipo: obtenerTipoProducto(producto.fields)
      };
    }).filter(Boolean) as ProductoHistorico[];

    const registro: RegistroHistorico = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fecha: fechaISO, // SIEMPRE formato YYYY-MM-DD
      fechaDisplay: fechaISO, // SIEMPRE usar formato ISO
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

    // Guardar en localStorage primero (SIEMPRE con fecha ISO)
    const registroParaLocalStorage = {
      ...registro,
      fecha: fechaISO, // SIEMPRE guardamos la fecha en formato ISO (YYYY-MM-DD)
      origen: 'local' as 'local', // Marcar como origen local con tipo correcto
      sincronizado: false // Marcar como no sincronizado inicialmente
    };
    const registrosExistentes = this.obtenerHistoricosLocales();
    registrosExistentes.push(registroParaLocalStorage);
    localStorage.setItem('historicos', JSON.stringify(registrosExistentes));

    // Intentar guardar en la base de datos
    try {
      console.log('📤 Enviando al servidor:', {
        bodegaId: registro.bodegaId,
        totalProductos: registro.productos.length,
        primerProducto: registro.productos[0]
      });
      
      const response = await fetch(`${API_URL}/inventario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registro)
      });

      if (!response.ok) {
        await response.json();
        // No lanzamos error para que el guardado local funcione
      } else {
        const result = await response.json();
        console.log('✅ Inventario guardado en base de datos exitosamente', result);
        
        // Agregar notificación para bodega principal
        notificationSystem.addNotification(registro.bodega);
        
        // Eliminar de localStorage ya que se guardó en BD
        const registrosActualizados = this.obtenerHistoricosLocales();
        const registrosFiltered = registrosActualizados.filter(r => r.id !== registro.id);
        localStorage.setItem('historicos', JSON.stringify(registrosFiltered));
      }
    } catch {
      // No lanzamos error, el inventario ya está guardado localmente
      // Agregar notificación también cuando se guarda solo localmente
      notificationSystem.addNotification(registro.bodega);
    }
  },

  async obtenerHistoricos(): Promise<RegistroHistorico[]> {
    try {
      // Importar authService para verificar permisos
      const { authService } = await import('./auth');
      const usuario = authService.getUsuarioActual();
      
      if (!usuario) {
        return [];
      }
      
      // Determinar qué bodegas puede ver el usuario
      let bodegasAConsultar: number[] = [];
      
      if (usuario.esAdmin) {
        // Los administradores ven todas las bodegas
        bodegasAConsultar = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      } else {
        // Los usuarios normales solo ven sus bodegas permitidas
        bodegasAConsultar = usuario.bodegasPermitidas;
      }
      
      const todosLosHistoricos: RegistroHistorico[] = [];
      
      // Solo consultar las bodegas permitidas
      for (const bodegaId of bodegasAConsultar) {
        try {
          console.log(`🔍 Consultando históricos para bodega ${bodegaId}`);
          const response = await fetch(`${API_URL}/inventarios/${bodegaId}`);
          if (response.ok) {
            const data = await response.json();
            console.log(`📊 Respuesta bodega ${bodegaId}:`, data.success ? `${data.data?.length || 0} registros` : 'Sin datos');
            
            if (data.success && data.data) {
              // Convertir los datos de la BD al formato de RegistroHistorico
              const historicos = this.convertirDatosBD(data.data, bodegaId);
              console.log(`✅ Bodega ${bodegaId}: ${historicos.length} sesiones agrupadas`);
              todosLosHistoricos.push(...historicos);
            }
          } else {
            console.error(`❌ Error al obtener datos de bodega ${bodegaId}: HTTP ${response.status}`);
          }
        } catch (error) {
          console.error(`❌ Error al consultar bodega ${bodegaId}:`, error);
        }
      }
      
      // Combinar con datos locales si existen
      const datosLocales = this.obtenerHistoricosLocales();
      
      // Filtrar datos locales para mostrar solo los de las bodegas permitidas
      const datosLocalesFiltrados = datosLocales.filter(local => 
        bodegasAConsultar.includes(local.bodegaId)
      );
      
      // Agregar históricos locales que no estén en la BD
      datosLocalesFiltrados.forEach(local => {
        local.origen = 'local';
      });
      
      const resultadoFinal = [...todosLosHistoricos, ...datosLocalesFiltrados];
      console.log('📊 Total históricos a mostrar:', resultadoFinal.length, '(BD:', todosLosHistoricos.length, ', Local:', datosLocalesFiltrados.length, ')');
      return resultadoFinal;
    } catch {
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
        // Convertir fechas a formato ISO para comparación consistente
        const normalizarFecha = (fecha: string): Date => {
          if (fecha.includes('/')) {
            // Formato DD/MM/YYYY
            const [dia, mes, año] = fecha.split('/');
            return new Date(`${año}-${mes}-${dia}`);
          } else {
            // Formato YYYY-MM-DD
            return new Date(fecha);
          }
        };
        
        const fechaA = normalizarFecha(a.fecha);
        const fechaB = normalizarFecha(b.fecha);
        return fechaB.getTime() - fechaA.getTime();
      });
  },

  async obtenerHistoricosPorFecha(fecha: string): Promise<RegistroHistorico[]> {
    const historicos = await this.obtenerHistoricos();
    
    // Convertir fecha ISO (YYYY-MM-DD) a formato display (DD/MM/YYYY) para comparar con registros antiguos
    const [year, month, day] = fecha.split('-');
    const fechaDisplay = `${day}/${month}/${year}`;
    
    return historicos.filter(registro => {
      // Comparar con ambos formatos para compatibilidad con registros antiguos y nuevos
      return registro.fecha === fecha || registro.fecha === fechaDisplay;
    });
  },

  async obtenerHistoricosPorFechaSinFiltro(fecha: string): Promise<RegistroHistorico[]> {
    try {
      console.log('🔍 obtenerHistoricosPorFechaSinFiltro - INICIO');
      console.log('Fecha solicitada:', fecha);
      
      // Obtener TODOS los históricos de TODAS las bodegas, sin filtrar por permisos
      const todosLosHistoricos: RegistroHistorico[] = [];
      const todasLasBodegas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      // Convertir fecha ISO (YYYY-MM-DD) a formato display (DD/MM/YYYY) para comparar con registros antiguos
      const [year, month, day] = fecha.split('-');
      const fechaDisplay = `${day}/${month}/${year}`;
      console.log('Fecha display para comparar:', fechaDisplay);
      
      // Consultar todas las bodegas sin importar permisos
      for (const bodegaId of todasLasBodegas) {
        try {
          const url = `${API_URL}/inventarios/${bodegaId}`;
          console.log(`🏭 Consultando bodega ${bodegaId}:`, url);
          
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              console.log(`  ✅ Bodega ${bodegaId}: ${data.data.length} registros totales`);
              const historicos = this.convertirDatosBD(data.data, bodegaId);
              
              // Filtrar por fecha
              const historicosFecha = historicos.filter(registro => 
                registro.fecha === fecha || registro.fecha === fechaDisplay
              );
              
              console.log(`  📅 Registros del ${fecha}: ${historicosFecha.length}`);
              
              // Mostrar info sobre cantidadPedir
              historicosFecha.forEach(registro => {
                const productosConPedido = registro.productos.filter(p => p.cantidadPedir > 0);
                if (productosConPedido.length > 0) {
                  console.log(`    🛋️ ${productosConPedido.length} productos con pedido`);
                }
              });
              
              todosLosHistoricos.push(...historicosFecha);
            } else {
              console.log(`  ⚠️ Bodega ${bodegaId}: Sin datos`);
            }
          } else {
            console.log(`  ❌ Bodega ${bodegaId}: Error HTTP ${response.status}`);
          }
        } catch (error) {
          console.error(`  ❌ Error al consultar bodega ${bodegaId}:`, error);
        }
      }
      
      // También incluir datos locales de todas las bodegas
      const datosLocales = this.obtenerHistoricosLocales();
      console.log('💾 Datos locales totales:', datosLocales.length);
      
      const datosLocalesFecha = datosLocales.filter(registro => 
        registro.fecha === fecha || registro.fecha === fechaDisplay
      );
      console.log('💾 Datos locales de la fecha:', datosLocalesFecha.length);
      
      const resultado = [...todosLosHistoricos, ...datosLocalesFecha];
      console.log('🎯 TOTAL registros devueltos:', resultado.length);
      
      return resultado;
    } catch (error) {
      console.error('❌ Error general en obtenerHistoricosPorFechaSinFiltro:', error);
      return [];
    }
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
    if (!registroAEliminar && usuario.email.toLowerCase() === 'analisis@chiosburger.com') {
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
      
      // Buscar el producto específico por ID exacto
      let productoIndex = registroActual.productos.findIndex(p => p.id === productoId);
      
      // Si no se encuentra por ID y es un registro antiguo sin timestamp, buscar por código
      if (productoIndex === -1 && !productoId.includes('+')) {
        // Solo para IDs antiguos sin timestamp
        // Extraer el código del productoId si tiene el formato antiguo
        let codigoBusqueda = productoId;
        if (productoId.includes('-')) {
          const partes = productoId.split('-');
          if (partes.length > 1) {
            const parteCodigo = partes[1];
            // Quitar el primer dígito que es el bodegaId si existe
            if (parteCodigo.length > 1 && !isNaN(parseInt(parteCodigo[0]))) {
              codigoBusqueda = parteCodigo.substring(1);
            }
          }
        }
        
        // Buscar por código solo para registros antiguos
        productoIndex = registroActual.productos.findIndex(p => 
          p.codigo === codigoBusqueda || p.codigo === productoId
        );
      }
      
      if (productoIndex === -1) {
        console.error('Producto no encontrado. ID buscado:', productoId);
        console.error('Productos disponibles:', registroActual.productos.map(p => ({ id: p.id, codigo: p.codigo, nombre: p.nombre })));
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
      7: 'Simón Bolón',
      8: 'Santo Cachón',
      9: 'Bodega Pulmon',
      10: 'Bodega Santo Chios'
    };
    
    // Log para verificar estructura de datos de BD
    console.log('🔍 convertirDatosBD - Bodega:', bodegaId, 'Total registros:', datos.length);
    if (datos.length > 0) {
      console.log('📊 Primer registro:', datos[0]);
      console.log('📊 IDs (primeros 5):', datos.slice(0, 5).map(d => d.id));
      
      // Log específico para bodega 3 (Planta Producción)
      if (bodegaId === 3) {
        console.log('🏭 DEBUG PLANTA PRODUCCIÓN:');
        console.log('- Primeros 3 registros completos:', datos.slice(0, 3));
        console.log('- Campos disponibles:', Object.keys(datos[0]));
      }
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
      
      // Convertir fecha ISO a formato YYYY-MM-DD
      let fechaNormalizada = '';
      if (row.fecha) {
        // Si viene en formato ISO (2025-07-11T05:00:00.000Z), extraer solo la fecha
        if (row.fecha.includes('T')) {
          fechaNormalizada = row.fecha.split('T')[0];
        } else {
          fechaNormalizada = row.fecha;
        }
      }
      
      // Crear clave única para la sesión
      let claveSesion = '';
      
      // SOLO para IDs nuevos con formato que incluye + usar timestamp para separar sesiones
      if (row.id && row.id.includes('+')) {
        const partes = row.id.split('+');
        if (partes.length > 1) {
          // Usar fecha + usuario + timestamp para sesiones únicas
          const timestamp = partes[1];
          claveSesion = `${fechaNormalizada}_${usuario}_${timestamp}`;
        }
      }
      
      // Para IDs SIN + pero con formato nuevo (YYMMDD-bodegaCODIGO-numero)
      // ESTOS SON REGISTROS ANTIGUOS que se guardaron mal - agrupar por día+usuario
      if (!claveSesion && row.id && row.id.match(/^\d{6}-\d+[a-zA-Z0-9]+-\d+$/)) {
        // Formato: YYMMDD-bodegaCODIGO-numero (registros existentes)
        // Agrupar todos del mismo día+usuario como UNA sesión
        claveSesion = `${fechaNormalizada}_${usuario}`;
        console.log('🆔 ID formato antiguo sin +:', row.id, '-> Agrupando por día+usuario:', claveSesion);
      }
      
      // Para todos los demás casos (registros antiguos), agrupar por fecha + usuario
      if (!claveSesion) {
        claveSesion = `${fechaNormalizada}_${usuario}`;
        console.log('📅 Registro antiguo:', row.id, '-> Clave sesión:', claveSesion);
      }
      
      if (!sesiones[claveSesion]) {
        sesiones[claveSesion] = [];
      }
      
      sesiones[claveSesion].push(row);
    });

    console.log('📊 Sesiones agrupadas:', Object.keys(sesiones).length, 'sesiones de bodega', bodegaId);
    
    // Log específico para bodega 3
    if (bodegaId === 3) {
      console.log('🏭 SESIONES PLANTA PRODUCCIÓN:');
      Object.entries(sesiones).forEach(([clave, prods]) => {
        console.log(`  - Sesión "${clave}": ${prods.length} productos`);
        if (prods.length > 0) {
          console.log(`    Primer producto:`, prods[0]);
        }
      });
    }

    // Convertir cada sesión en un RegistroHistorico
    return Object.entries(sesiones).map(([claveSesion, productos], index) => {
      const primerProducto = productos[0];
      
      // Extraer usuario del formato almacenado
      let usuario = 'Usuario';
      if (primerProducto.usuario) {
        const partes = primerProducto.usuario.split(' - ');
        usuario = partes[0] || 'Usuario';
      }

      // Convertir fecha ISO a formato YYYY-MM-DD
      let fecha = primerProducto.fecha;
      if (fecha && fecha.includes('T')) {
        fecha = fecha.split('T')[0];
      }
      
      // Si no tiene fecha válida, usar fecha actual
      if (!fecha || !fecha.match(/\d{4}-\d{2}-\d{2}/)) {
        const ahora = new Date();
        const año = ahora.getFullYear();
        const mes = (ahora.getMonth() + 1).toString().padStart(2, '0');
        const dia = ahora.getDate().toString().padStart(2, '0');
        fecha = `${año}-${mes}-${dia}`;
      }
      
      let horaInventario = '00:00';
      
      // Intentar extraer hora del ID o usar hora actual
      if (primerProducto.id && primerProducto.id.includes('-')) {
        const ahora = new Date();
        horaInventario = ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
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
            'Tipo A,B o C': row['Tipo A,B o C'],
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
          categoria: row.categoria || row.categoría || row.Categoria || row.Categoría || row.CATEGORIA || '', // Try different variations
          tipo: row.tipo || row['Tipo A,B o C'] || row['tipo a,b o c'] || row.Tipo || row.TIPO || row['tipo_abc'] || row['tipo_a_b_c'] || '', // Try different field names
          c1,
          c2,
          c3,
          total: parseFloat(row.total) || 0,
          cantidadPedir: parseFloat(row.cant_pedir || row.cantidadSolicitada || '0') || 0,
          // Las unidades ya vienen correctas de la BD
          unidad: row.unidad || 'Unidad',
          unidadBodega: row.uni_bod || row.uni_local || row.unidad_bodega || 'Unidad',
          equivalencia: row.equivalencia || ''
        };
      });

      // Generar ID único para la sesión
      let sessionId = '';
      
      // Extraer información de la clave de sesión para generar ID único
      const partesClave = claveSesion.split('_');
      if (partesClave.length >= 3) {
        // Si tiene timestamp (registros nuevos con +)
        const timestamp = partesClave[partesClave.length - 1];
        if (timestamp && !timestamp.includes('-') && !isNaN(Number(timestamp))) {
          // Es un timestamp válido
          sessionId = `${bodegaId}-${usuario.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}-${timestamp}`;
        }
      }
      
      // Si no se generó ID (registros antiguos o nuevos sin +), usar fecha + bodega + usuario + índice
      if (!sessionId) {
        const fechaParaTimestamp = fecha || new Date().toISOString().split('T')[0];
        const fechaTimestamp = new Date(fechaParaTimestamp).getTime();
        const usuarioLimpio = usuario.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
        // Usar un ID único que combine todos los elementos
        sessionId = `${fechaTimestamp}-${bodegaId}-${usuarioLimpio}-${index}`;
      }

      return {
        id: sessionId,
        fecha: fecha, // SIEMPRE formato YYYY-MM-DD
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
