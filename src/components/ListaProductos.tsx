import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Loader2, AlertCircle, Package2, Save, Clock, TrendingUp, BarChart3, Award, ArrowUp, Sparkles, ArrowUpDown, ArrowUp01, ArrowDown01, Hash, Tag, Check } from 'lucide-react';
import type { Producto } from '../types/index';
import { ProductoConteo } from './ProductoConteo';
import { ProductoConteoPruebaMobile } from './ProductoConteoPruebaMobile';
import { Toast } from './Toast';
import { Timer } from './Timer';
import { airtableService } from '../services/airtable';
import { historicoService } from '../services/historico';
import { authService } from '../services/auth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useDebounce } from '../hooks/useDebounce';
import { useIsMobile } from '../hooks/useIsMobile';

interface ListaProductosProps {
  bodegaId: number;
  bodegaNombre: string;
}


// Función helper para obtener los tipos permitidos según bodega y día
const getTiposPermitidos = (): string[] | null => {
  // SIEMPRE permitir contar todos los tipos cualquier día
  return ['A', 'B', 'C'];
  
  // Código anterior comentado - por instrucción del usuario, siempre está habilitado para contar
  /*
  // Super admin ve todo
  if (userEmail === 'analisis@chiosburger.com') {
    return ['A', 'B', 'C']; // Todos los tipos
  }

  // Chios (IDs: 4, 5, 6)
  if ([4, 5, 6].includes(bodegaId)) {
    switch (dia) {
      case 1: return ['A', 'C']; // Lunes
      case 2: return ['B', 'A']; // Martes (igual que miércoles)
      case 3: return ['B', 'A']; // Miércoles
      case 5: return ['B', 'A']; // Viernes
      default: return null; // No hay toma otros días
    }
  }
  
  // Simón Bolívar (ID: 7)
  if (bodegaId === 7) {
    switch (dia) {
      case 0: return ['A', 'B', 'C']; // Domingo
      case 2: return ['A', 'B']; // Martes (igual que miércoles)
      case 3: return ['A', 'B']; // Miércoles
      default: return null; // No hay toma otros días
    }
  }
  
  // Santo Cachón (ID: 8)
  if (bodegaId === 8) {
    switch (dia) {
      case 1: return ['A', 'B']; // Lunes
      case 5: return ['A', 'B', 'C']; // Viernes
      default: return null; // No hay toma otros días
    }
  }
  
  // Otras bodegas: mostrar todos
  return ['A', 'B', 'C'];
  */
};

// Utilidades para localStorage
const getLocalStorageSize = (): number => {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total * 2; // UTF-16
};

const checkLocalStorageSpace = (dataToStore: string, usarPorcentajePrueba: number = 0): {
  hasSpace: boolean;
  currentSize: number;
  estimatedSize: number;
  percentageUsed: number;
  message: string;
} => {
  const currentSize = getLocalStorageSize();
  const newDataSize = dataToStore.length * 2;
  const estimatedTotal = currentSize + newDataSize;
  const STORAGE_LIMIT = 4 * 1024 * 1024; // 4MB
  const percentageUsed = usarPorcentajePrueba > 0 ? usarPorcentajePrueba : (estimatedTotal / STORAGE_LIMIT) * 100;
  
  if (percentageUsed > 95) {
    return {
      hasSpace: false,
      currentSize,
      estimatedSize: estimatedTotal,
      percentageUsed,
      message: '❌ Almacenamiento lleno (' + Math.round(percentageUsed) + '%)'
    };
  } else if (percentageUsed > 90) {
    return {
      hasSpace: true,
      currentSize,
      estimatedSize: estimatedTotal,
      percentageUsed,
      message: '⚠️ Almacenamiento al ' + Math.round(percentageUsed) + '%'
    };
  }
  
  return {
    hasSpace: true,
    currentSize,
    estimatedSize: estimatedTotal,
    percentageUsed,
    message: '✅ Espacio suficiente'
  };
};

export const ListaProductos = ({ 
  bodegaId, 
  bodegaNombre 
}: ListaProductosProps) => {
  const deviceInfo = useIsMobile();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [conteos, setConteos] = useState<{[key: string]: any}>({});
  const [productosGuardados, setProductosGuardados] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error' | 'info' | 'offline' | 'warning'} | null>(null);
  const [guardandoProductos, setGuardandoProductos] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showMetrics, setShowMetrics] = useState(false);
  const [mostrarSinContarPrimero, setMostrarSinContarPrimero] = useState(false);
  const [ordenSnapshot, setOrdenSnapshot] = useState<string[]>([]); // Guardar el orden en el momento del clic
  const [intentoGuardarIncompleto, setIntentoGuardarIncompleto] = useState(false); // Para activar reordenamiento
  const [ordenCongelado, setOrdenCongelado] = useState<string[]>([]); // Guardar el orden actual de IDs
  const [guardandoInventario, setGuardandoInventario] = useState(false); // Estado para mostrar mensaje de guardado
  const [procesandoTodoEnCero, setProcesandoTodoEnCero] = useState(false); // Estado para el botón "Todo en 0"
  const [botonGuardarDeshabilitado, setBotonGuardarDeshabilitado] = useState(false);
  const [tiempoRestanteCooldown, setTiempoRestanteCooldown] = useState(0);
  // Estados para el progreso visual del botón "Todo en 0"
  const [progresoProcesamiento, setProgresoProcesamiento] = useState(0);
  const [totalAProcesar, setTotalAProcesar] = useState(0);
  const [productoActual, setProductoActual] = useState('');
  const [resetKey, setResetKey] = useState(0); // Key para forzar re-renderizado
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isOnline = useOnlineStatus();
  const debouncedBusqueda = useDebounce(busqueda, 300);
  
  // Estados para ordenamiento
  const [ordenCategoria, setOrdenCategoria] = useState<'asc' | 'desc' | 'none'>('none');
  const [ordenCodigo, setOrdenCodigo] = useState<'asc' | 'desc' | 'none'>('none');
  
  // Estados para agrupación
  const [agruparPorCategoria, setAgruparPorCategoria] = useState(false);
  const [ordenarPorTipo, setOrdenarPorTipo] = useState(false);
  
  // Función para obtener el tipo de producto
  const obtenerTipoProducto = (campos: any): string => {
    // Buscar el tipo del producto en diferentes campos posibles
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
    
    for (const nombre of posiblesNombres) {
      if (campos[nombre]) {
        return campos[nombre];
      }
    }
    
    return '';
  };
  
  
  // Obtener usuario actual
  const usuario = authService.getUsuarioActual();
  const esContabilidad = usuario?.email === 'contabilidad@chiosburger.com';
  const esUsuarioSoloLectura = esContabilidad;

  // Timer
  useEffect(() => {
    setStartTime(new Date());
    setElapsedTime(0);
    setShowMetrics(false);
    setProductosGuardados(new Set());
    setConteos({});
    setMostrarSinContarPrimero(false); // Resetear ordenamiento al cambiar de bodega
    setOrdenSnapshot([]); // Limpiar el snapshot del orden
    setIntentoGuardarIncompleto(false); // Resetear estado de intento incompleto
    setOrdenCongelado([]); // Resetear orden congelado
    
    intervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [bodegaId]);
  

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Calcular métricas
  const calculateMetrics = (totalProductos: number) => {
    const totalTime = elapsedTime;
    const productosPorMinuto = totalTime > 0 ? ((productosGuardados.size / totalTime) * 60).toFixed(1) : '0';
    const tiempoPromedio = productosGuardados.size > 0 ? Math.round(totalTime / productosGuardados.size) : 0;
    const productosConCero = Array.from(productosGuardados).filter(id => {
      const conteo = conteos[id];
      return conteo && (conteo.c1 + conteo.c2 + conteo.c3) === 0;
    }).length;
    
    return {
      totalTime: formatTime(totalTime),
      productosPorMinuto,
      tiempoPromedio: formatTime(tiempoPromedio),
      productosConCero,
      eficiencia: Math.round((productosGuardados.size / totalProductos) * 100)
    };
  };

  // Cargar datos
  useEffect(() => {
    // Verificar si existe un guardado previo exitoso
    const ultimoGuardado = localStorage.getItem(`ultimoGuardado_${bodegaId}`);

    if (ultimoGuardado) {
      // Existe un guardado previo (no importa la fecha), limpiar todo para empezar nuevo inventario
      console.log('✅ Inventario previo detectado. Iniciando sesión limpia...');
      localStorage.removeItem(`conteos_${bodegaId}`);
      localStorage.removeItem(`productosGuardados_${bodegaId}`);
      localStorage.removeItem(`intentoGuardarIncompleto_${bodegaId}`);
      // NO borrar ultimoGuardado - mantener la marca de que ya se guardó

      // Estados empiezan limpios
      setConteos({});
      setProductosGuardados(new Set());
      setIntentoGuardarIncompleto(false);
    } else {
      // No hay guardado previo, cargar datos si existen (trabajo en progreso)
      const datosGuardados = localStorage.getItem(`conteos_${bodegaId}`);
      if (datosGuardados) {
        setConteos(JSON.parse(datosGuardados));
        console.log('📂 Cargando inventario en progreso...');
      }

      // Cargar productos guardados del localStorage
      const productosGuardadosLocal = localStorage.getItem(`productosGuardados_${bodegaId}`);
      if (productosGuardadosLocal) {
        setProductosGuardados(new Set(JSON.parse(productosGuardadosLocal)));
      }

      // Cargar estado de intento de guardar incompleto
      const intentoGuardarIncompletoLocal = localStorage.getItem(`intentoGuardarIncompleto_${bodegaId}`);
      if (intentoGuardarIncompletoLocal === 'true') {
        console.log('📌 Cargando estado de reordenamiento desde localStorage');
        setIntentoGuardarIncompleto(true);
      }
    }

    cargarProductos();
  }, [bodegaId]);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await airtableService.obtenerProductos(bodegaId);
      setProductos(data);
    } catch (err) {
      setError('Error al cargar los productos. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  // Obtener tipos permitidos para hoy (memoizado para evitar recálculos)
  const tiposPermitidosHoy = useMemo(() => getTiposPermitidos(), []);
  const hayTomaHoy = tiposPermitidosHoy !== null;
  
  // Calcular porcentaje completado antes de usarlo en el useMemo
  const productosGuardadosCount = productosGuardados.size;
  const porcentajeCompletado = productos.length > 0 ? Math.min(Math.round((productosGuardadosCount / productos.length) * 100), 100) : 0;

  const productosFiltrados = useMemo(() => {
    console.log('🔍 Estado actual del reordenamiento:', {
      intentoGuardarIncompleto,
      porcentajeCompletado,
      productosGuardadosCount,
      totalProductos: productos.length,
      mostrarSinContarPrimero,
      ordenCategoria,
      ordenCodigo
    });
    // Siempre mostrar productos (temporal mientras se soluciona el problema)
    // if (!hayTomaHoy) {
    //   return [];
    // }

    // Primero filtrar por tipo permitido
    // COMENTADO TEMPORALMENTE: Mostrar todos los productos sin filtrar por tipo A,B,C
    // let productosFiltrados = productos.filter(producto => {
    //   const tipoProducto = producto.fields['Tipo A,B o C'] as string;
    //   
    //   
    //   // Si no tiene tipo o es un valor no válido, no mostrar
    //   if (!tipoProducto || !['A', 'B', 'C'].includes(tipoProducto)) {
    //     return false;
    //   }
    //   
    //   // Verificar si el tipo está permitido hoy
    //   return tiposPermitidosHoy?.includes(tipoProducto) || false;
    // });
    
    // Mostrar todos los productos sin filtro de tipo
    let productosFiltrados = productos;
    
    // Luego filtrar por búsqueda
    if (debouncedBusqueda.trim()) {
      const busquedaLower = debouncedBusqueda.toLowerCase();
      productosFiltrados = productosFiltrados.filter(producto => {
        const nombre = producto.fields['Nombre Producto']?.toLowerCase() || '';
        const categoria = producto.fields['Categoría']?.toLowerCase() || '';
        const codigo = producto.fields['Código']?.toLowerCase() || producto.fields['Codigo']?.toLowerCase() || '';
        return nombre.includes(busquedaLower) || categoria.includes(busquedaLower) || codigo.includes(busquedaLower);
      });
    }
    
    // Si hay un orden snapshot activo, usarlo
    if (mostrarSinContarPrimero && ordenSnapshot.length > 0) {
      // Crear un mapa de posiciones basado en el snapshot
      const posicionMap = new Map<string, number>();
      ordenSnapshot.forEach((id, index) => {
        posicionMap.set(id, index);
      });
      
      // Ordenar según el snapshot
      return [...productosFiltrados].sort((a, b) => {
        const posA = posicionMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const posB = posicionMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return posA - posB;
      });
    }
    
    // Aplicar reordenamiento si se intentó guardar con inventario incompleto
    if (intentoGuardarIncompleto && porcentajeCompletado < 100) {
      // Si ya hay un orden congelado, usarlo
      if (ordenCongelado.length > 0) {
        console.log('❄️ Usando orden congelado existente');
        const ordenMap = new Map<string, number>();
        ordenCongelado.forEach((id, index) => {
          ordenMap.set(id, index);
        });
        
        return [...productosFiltrados].sort((a, b) => {
          const posA = ordenMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
          const posB = ordenMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
          return posA - posB;
        });
      }
      console.log('🔄 ENTRÓ A REORDENAMIENTO AUTOMÁTICO');
      console.log('📊 Porcentaje completado:', porcentajeCompletado);
      console.log('📦 Total productos filtrados:', productosFiltrados.length);
      console.log('🔍 Productos guardados Set:', productosGuardados);
      
      let productosOrdenados = [...productosFiltrados];
      
      // Separar productos contados y no contados
      const productosNoContados = productosOrdenados.filter(p => !productosGuardados.has(p.id));
      const productosContados = productosOrdenados.filter(p => productosGuardados.has(p.id));
      
      console.log('❌ Productos NO contados:', productosNoContados.length);
      console.log('✅ Productos contados:', productosContados.length);
      
      // Mostrar primeros 3 de cada grupo para verificar
      console.log('🔍 Primeros 3 NO contados:', productosNoContados.slice(0, 3).map(p => p.fields['Nombre Producto']));
      console.log('🔍 Primeros 3 contados:', productosContados.slice(0, 3).map(p => p.fields['Nombre Producto']));
      
      // Ordenar alfabéticamente cada grupo
      productosNoContados.sort((a, b) => {
        const nombreA = a.fields['Nombre Producto'] || '';
        const nombreB = b.fields['Nombre Producto'] || '';
        return nombreA.localeCompare(nombreB);
      });
      
      productosContados.sort((a, b) => {
        const nombreA = a.fields['Nombre Producto'] || '';
        const nombreB = b.fields['Nombre Producto'] || '';
        return nombreA.localeCompare(nombreB);
      });
      
      // Concatenar: no contados primero, luego contados
      const productosReordenados = [...productosNoContados, ...productosContados];
      console.log('✅ REORDENAMIENTO APLICADO - Total productos reordenados:', productosReordenados.length);
      console.log('🔍 Primeros 5 productos después del reordenamiento:', productosReordenados.slice(0, 5).map(p => ({
        nombre: p.fields['Nombre Producto'],
        guardado: productosGuardados.has(p.id)
      })));
      return productosReordenados;
    }
    
    // Luego aplicar ordenamiento normal
    let productosOrdenados = [...productosFiltrados];
    
    // Aplicar ordenamiento por tipo A-B-C si está activo
    if (ordenarPorTipo) {
      productosOrdenados.sort((a, b) => {
        const tipoA = obtenerTipoProducto(a.fields) || 'Z';
        const tipoB = obtenerTipoProducto(b.fields) || 'Z';
        return tipoA.localeCompare(tipoB);
      });
    }
    
    // Aplicar ordenamiento por filtros
    productosOrdenados.sort((a, b) => {
      // Ordenar por código si está activo
      if (ordenCodigo !== 'none') {
        const codA = a.fields['Código'] || a.fields['Codigo'] || '';
        const codB = b.fields['Código'] || b.fields['Codigo'] || '';
        const compareCode = ordenCodigo === 'asc' 
          ? codA.localeCompare(codB)
          : codB.localeCompare(codA);
        
        // Si los códigos son diferentes, usar ese orden
        if (compareCode !== 0) return compareCode;
      }
      
      // Luego ordenar por categoría si está activo
      if (ordenCategoria !== 'none') {
        const catA = a.fields['Categoría'] || '';
        const catB = b.fields['Categoría'] || '';
        return ordenCategoria === 'asc'
          ? catA.localeCompare(catB)
          : catB.localeCompare(catA);
      }
      
      // Si no hay filtros activos, mantener orden original
      return 0;
    });
    
    console.log('🏁 RESULTADO FINAL del useMemo:', {
      totalProductos: productosOrdenados.length,
      primeros3: productosOrdenados.slice(0, 3).map(p => ({
        nombre: p.fields['Nombre Producto'],
        guardado: productosGuardados.has(p.id)
      }))
    });
    
    return productosOrdenados;
  }, [productos, debouncedBusqueda, ordenCategoria, ordenCodigo, mostrarSinContarPrimero, ordenSnapshot, hayTomaHoy, tiposPermitidosHoy, intentoGuardarIncompleto, porcentajeCompletado, productosGuardados, ordenCongelado, ordenarPorTipo]);

  const handleConteoChange = useCallback((productoId: string, nuevoConteo: any) => {
    setConteos(prev => {
      const nuevosConteos = {
        ...prev,
        [productoId]: nuevoConteo
      };
      localStorage.setItem(`conteos_${bodegaId}`, JSON.stringify(nuevosConteos));
      return nuevosConteos;
    });
  }, [bodegaId]);

  // Nueva función para manejar acciones rápidas (Producto en 0, Producto Inactivo)
  const handleAccionRapida = useCallback((productoId: string, valores: any) => {
    // Primero actualizar el conteo
    setConteos(prev => {
      const nuevosConteos = {
        ...prev,
        [productoId]: valores
      };
      localStorage.setItem(`conteos_${bodegaId}`, JSON.stringify(nuevosConteos));
      return nuevosConteos;
    });
    
    // Luego marcar como guardado inmediatamente
    setProductosGuardados(prev => {
      const newSet = new Set(prev).add(productoId);
      localStorage.setItem(`productosGuardados_${bodegaId}`, JSON.stringify([...newSet]));
      return newSet;
    });
    
    // Mensaje de confirmación eliminado
  }, [bodegaId]);

  // Nueva función para manejar cuando se edita un producto guardado
  const handleEditarProducto = useCallback((productoId: string) => {
    // Remover el producto de la lista de guardados
    setProductosGuardados(prev => {
      const newSet = new Set(prev);
      newSet.delete(productoId);
      // Actualizar localStorage
      localStorage.setItem(`productosGuardados_${bodegaId}`, JSON.stringify([...newSet]));
      return newSet;
    });
  }, [bodegaId]);

  const handleGuardarProducto = useCallback(async (productoId: string, esAccionRapida?: boolean, valoresRapidos?: any, esEdicion?: boolean) => {
    // Bloquear si es usuario de solo lectura
    if (esUsuarioSoloLectura) {
      setToast({ message: '⚠️ Usuario de solo lectura - No puede guardar inventarios', type: 'warning' });
      return;
    }
    
    // Si es edición, primero remover de guardados
    if (esEdicion) {
      handleEditarProducto(productoId);
      return;
    }
    
    // Si es acción rápida, usar la nueva función
    if (esAccionRapida && valoresRapidos) {
      handleAccionRapida(productoId, valoresRapidos);
      return;
    }
    
    // Verificar que el producto tenga un conteo válido
    const conteo = conteos[productoId];
    if (!conteo) return;
    
    setGuardandoProductos(prev => new Set(prev).add(productoId));
    
    try {
      if (isOnline) {
        setProductosGuardados(prev => {
          const newSet = new Set(prev).add(productoId);
          // Persistir en localStorage
          localStorage.setItem(`productosGuardados_${bodegaId}`, JSON.stringify([...newSet]));
          return newSet;
        });
        // Mensaje de confirmación eliminado
      } else {
        setProductosGuardados(prev => {
          const newSet = new Set(prev).add(productoId);
          // Persistir en localStorage
          localStorage.setItem(`productosGuardados_${bodegaId}`, JSON.stringify([...newSet]));
          return newSet;
        });
        // Mensaje de guardado offline eliminado
      }
    } catch (error) {
      setToast({ message: 'Error al guardar producto', type: 'error' });
    } finally {
      setGuardandoProductos(prev => {
        const newSet = new Set(prev);
        newSet.delete(productoId);
        return newSet;
      });
    }
  }, [conteos, handleAccionRapida, handleEditarProducto]);

  const handleTodoEnCero = async () => {
    // Función solo para Planta Producción (bodega ID 3)
    if (bodegaId !== 3) return;
    
    // Bloquear si es usuario de solo lectura
    if (esUsuarioSoloLectura) {
      setToast({ message: '⚠️ Usuario de solo lectura - No puede guardar inventarios', type: 'warning' });
      return;
    }
    
    if (!window.confirm('¿Está seguro de poner todos los productos no guardados en 0?')) {
      return;
    }
    
    setProcesandoTodoEnCero(true);
    
    try {
      // Filtrar productos que NO están guardados y NO son inactivos
      const productosParaCero = productos.filter(producto => {
        const yaGuardado = productosGuardados.has(producto.id);
        const conteo = conteos[producto.id];
        const esInactivo = conteo && conteo.c1 === -1 && conteo.c2 === -1 && conteo.c3 === -1;
        
        // Solo procesar si NO está guardado y NO es inactivo
        return !yaGuardado && !esInactivo;
      });
      
      if (productosParaCero.length === 0) {
        setToast({ message: 'No hay productos pendientes para poner en 0', type: 'info' });
        return;
      }
      
      // Inicializar progreso
      setTotalAProcesar(productosParaCero.length);
      setProgresoProcesamiento(0);
      setProductoActual('');
      
      // Preparar actualizaciones en batch
      const nuevosConteos: {[key: string]: any} = {};
      const nuevosGuardadosIds: string[] = [];
      
      // Procesar con animación
      for (let i = 0; i < productosParaCero.length; i++) {
        const producto = productosParaCero[i];
        setProductoActual(producto.fields['Nombre Producto']);
        setProgresoProcesamiento(i + 1);
        
        nuevosConteos[producto.id] = {
          c1: 0,
          c2: 0,
          c3: 0,
          diferencia: 0,
          cantidadBodega: 0,
          touched: true
        };
        nuevosGuardadosIds.push(producto.id);
        
        // Pequeño delay para que la animación sea visible
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      
      // Validar espacio solo si supera el 90%
      const datosAGuardar = JSON.stringify({ ...conteos, ...nuevosConteos });
      const espacioCheck = checkLocalStorageSpace(datosAGuardar, 0);
      
      if (espacioCheck.percentageUsed > 90) {
        setToast({ message: espacioCheck.message, type: espacioCheck.percentageUsed > 95 ? 'error' : 'warning' });
      }
      
      // Actualizar conteos con localStorage
      setConteos(prev => {
        const actualizados = { ...prev, ...nuevosConteos };
        try {
          localStorage.setItem(`conteos_${bodegaId}`, JSON.stringify(actualizados));
        } catch (e) {
          if ((e as Error).name === 'QuotaExceededError') {
            console.error('localStorage lleno:', e);
            setToast({ message: '❌ Almacenamiento lleno. Cambios guardados solo en memoria.', type: 'error' });
          }
        }
        return actualizados;
      });
      
      // Actualizar productos guardados en una sola operación
      setProductosGuardados(prev => {
        const newSet = new Set(prev);
        nuevosGuardadosIds.forEach(id => newSet.add(id));
        localStorage.setItem(`productosGuardados_${bodegaId}`, JSON.stringify([...newSet]));
        return newSet;
      });
      
      setToast({ 
        message: `✅ ${productosParaCero.length} productos puestos en 0 y guardados`, 
        type: 'success' 
      });
      
    } catch (error) {
      console.error('Error al poner productos en 0:', error);
      setToast({ message: 'Error al procesar los productos', type: 'error' });
    } finally {
      setProcesandoTodoEnCero(false);
    }
  };

  const handleGuardar = async () => {
    // Bloquear si es usuario de solo lectura
    if (esUsuarioSoloLectura) {
      setToast({ message: '⚠️ Usuario de solo lectura - No puede guardar inventarios', type: 'warning' });
      return;
    }
    
    // Validar que todos los productos estén guardados
    const productosNoGuardados = productos.filter(producto => !productosGuardados.has(producto.id));
    
    if (productosNoGuardados.length > 0) {
      setToast({ 
        message: `⚠️ Debes guardar todos los productos antes de guardar el inventario. Faltan ${productosNoGuardados.length} productos por guardar.`, 
        type: 'error' 
      });
      return;
    }
    
    setGuardandoInventario(true);
    
    try {
      if (isOnline) {
        const duracion = formatTime(elapsedTime);
        
        // Obtener todos los productos con conteo
        const productosConConteo = new Set(
          Object.keys(conteos).filter(productoId => {
            const conteo = conteos[productoId];
            return conteo && conteo.touched;
          })
        );
        
        if (productosConConteo.size === 0) {
          setToast({ message: '⚠️ No hay productos con conteo para guardar', type: 'error' });
          setGuardandoInventario(false);
          return;
        }
        
        await historicoService.guardarInventario(
          bodegaId,
          bodegaNombre,
          productos,
          conteos,
          productosGuardados, // Enviar solo los productos guardados explícitamente
          duracion
        );
        
        // Marcar fecha de último guardado exitoso
        const hoy = new Date().toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
        localStorage.setItem(`ultimoGuardado_${bodegaId}`, hoy);
        
        // Limpiar datos locales
        localStorage.removeItem(`conteos_${bodegaId}`);
        localStorage.removeItem(`productosGuardados_${bodegaId}`);
        localStorage.removeItem(`intentoGuardarIncompleto_${bodegaId}`);
        
        // Resetear estados
        setIntentoGuardarIncompleto(false);
        setConteos({}); // Limpiar conteos en memoria
        setProductosGuardados(new Set()); // Limpiar productos guardados
        setResetKey(prev => prev + 1); // Incrementar key para forzar re-renderizado
        
        setToast({ message: '🎉 Inventario guardado exitosamente', type: 'success' });
        
        // Deshabilitar botón por 1 minuto
        setBotonGuardarDeshabilitado(true);
        setTiempoRestanteCooldown(60);
        
        // Contador regresivo
        const interval = setInterval(() => {
          setTiempoRestanteCooldown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setBotonGuardarDeshabilitado(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Mostrar métricas después de un momento
        setTimeout(() => setShowMetrics(true), 500);
      } else {
        setToast({ message: '📱 Guardado offline', type: 'offline' });
      }
    } catch (error) {
      console.error('Error al guardar inventario:', error);
      setToast({ message: 'Error al guardar el inventario', type: 'error' });
    } finally {
      // Ocultar mensaje de guardado
      setGuardandoInventario(false);
    }
  };

  
  // Bloquear el botón hasta que el progreso sea 100%
  const sePuedeGuardar = porcentajeCompletado === 100 && productos.length > 0;
  
  // Congelar el orden después del reordenamiento
  useEffect(() => {
    if (intentoGuardarIncompleto && ordenCongelado.length === 0 && productosFiltrados.length > 0) {
      const nuevosIds = productosFiltrados.map(p => p.id);
      setOrdenCongelado(nuevosIds);
      console.log('❄️ Orden congelado después del reordenamiento con', nuevosIds.length, 'productos');
    }
  }, [intentoGuardarIncompleto, productosFiltrados]);
  
  // Desactivar el reordenamiento cuando todos los productos estén contados
  useEffect(() => {
    if (mostrarSinContarPrimero && sePuedeGuardar) {
      setMostrarSinContarPrimero(false);
      setOrdenSnapshot([]); // Limpiar el snapshot cuando todos estén contados
    }
    
    // Desactivar reordenamiento cuando se alcanza el 100%
    if (intentoGuardarIncompleto && porcentajeCompletado === 100) {
      setIntentoGuardarIncompleto(false);
      setOrdenCongelado([]);
      localStorage.removeItem(`intentoGuardarIncompleto_${bodegaId}`);
    }
  }, [sePuedeGuardar, mostrarSinContarPrimero, intentoGuardarIncompleto, porcentajeCompletado, bodegaId]);

  const obtenerUnidad = (producto: Producto): string => {
    return producto.fields['Unidad De Conteo General'] as string || 'unidad';
  };

  const obtenerUnidadBodega = (producto: Producto): string => {
    return producto.fields['Unidad De Conteo General'] as string || 'unidad';
  };

  const metrics = showMetrics ? calculateMetrics(productos.length) : null;
  
  // Calcular totales por tipo (solo una vez cuando se cargan los productos)
  const totalesPorTipo = useMemo(() => {
    const totales = { A: 0, B: 0, C: 0 };
    
    productos.forEach(producto => {
      // Buscar el tipo del producto
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
      
      let tipo = '';
      for (const nombre of posiblesNombres) {
        if (producto.fields[nombre]) {
          tipo = producto.fields[nombre];
          break;
        }
      }
      
      // Normalizar el tipo a A, B o C
      const tipoNormalizado = tipo.toUpperCase().trim();
      if (tipoNormalizado === 'A' || tipoNormalizado === 'B' || tipoNormalizado === 'C') {
        totales[tipoNormalizado as 'A' | 'B' | 'C']++;
      }
    });
    
    return totales;
  }, [productos]);
  
  // Calcular productos guardados por tipo (más eficiente)
  const productosPorTipo = useMemo(() => {
    const guardados = { A: 0, B: 0, C: 0 };
    
    productos.forEach(producto => {
      if (productosGuardados.has(producto.id)) {
        // Buscar el tipo del producto
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
        
        let tipo = '';
        for (const nombre of posiblesNombres) {
          if (producto.fields[nombre]) {
            tipo = producto.fields[nombre];
            break;
          }
        }
        
        const tipoNormalizado = tipo.toUpperCase().trim();
        if (tipoNormalizado === 'A' || tipoNormalizado === 'B' || tipoNormalizado === 'C') {
          guardados[tipoNormalizado as 'A' | 'B' | 'C']++;
        }
      }
    });
    
    // Calcular pendientes (más eficiente que recalcular todo)
    const pendientes = {
      A: totalesPorTipo.A - guardados.A,
      B: totalesPorTipo.B - guardados.B,
      C: totalesPorTipo.C - guardados.C
    };
    
    return { guardados, pendientes, totales: totalesPorTipo };
  }, [productos, productosGuardados, totalesPorTipo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-500 rounded-3xl animate-pulse mx-auto"></div>
            <Loader2 className="w-10 h-10 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin" />
          </div>
          <p className="text-gray-600 mt-4 font-medium">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-white rounded-3xl p-8 shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-800 font-medium mb-4">{error}</p>
          <button
            onClick={cargarProductos}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-2xl font-medium hover:shadow-lg transition-all duration-300"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal de progreso de guardado */}
      {guardandoInventario && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 text-center">
                Guardando Inventario
              </h3>
              <p className="text-gray-600 text-center text-sm sm:text-base">
                Espera mientras se guardan los datos ingresados...
              </p>
              <p className="text-gray-500 text-xs sm:text-sm mt-4 text-center">
                Por favor, no cierres la aplicación
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Header con título */}
      <div className="mb-4 sm:mb-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-8 mb-4 sm:mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-400 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg">
                <Package2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-3xl font-bold text-gray-800">{bodegaNombre}</h2>
                <p className="text-gray-500 text-sm sm:text-base mt-0.5 sm:mt-1">Gestión de inventario</p>
              </div>
            </div>
            <div className="text-left sm:text-right ml-auto">
              <p className="text-xs sm:text-sm text-gray-500">Total de productos</p>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {productos.length}
              </p>
            </div>
          </div>
        </div>
        
        
        {/* Información de tipos permitidos hoy - COMENTADO */}
        {/* hayTomaHoy && tiposPermitidosHoy && (
          <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Productos del día:</span> 
                {' Tipo ' + tiposPermitidosHoy.join(', ')}
              </p>
            </div>
          </div>
        ) */}
        
        {/* Filtros de agrupación y ordenamiento */}
        <div className="mt-4">
          {/* Toggles de agrupación */}
          <div className="mb-3 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setAgruparPorCategoria(!agruparPorCategoria)}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                agruparPorCategoria
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span className="text-sm">Agrupar por Categorías</span>
              {agruparPorCategoria && <Check className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setOrdenarPorTipo(!ordenarPorTipo)}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                ordenarPorTipo
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span className="text-sm">Ordenar por Tipo (A-B-C)</span>
              {ordenarPorTipo && <Check className="w-4 h-4" />}
            </button>
          </div>
          {/* Indicador de filtros activos */}
          {(ordenCategoria !== 'none' || ordenCodigo !== 'none') && (
            <div className="mb-3 text-xs text-gray-600 flex items-center gap-2">
              <span className="font-medium">Ordenado por:</span>
              {ordenCodigo !== 'none' && (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                  Código {ordenCodigo === 'asc' ? '↑' : '↓'}
                </span>
              )}
              {ordenCategoria !== 'none' && (
                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full">
                  Categoría {ordenCategoria === 'asc' ? '↑' : '↓'}
                </span>
              )}
              {ordenCodigo !== 'none' && ordenCategoria !== 'none' && (
                <span className="text-gray-500">(combinado)</span>
              )}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
          {/* Filtro por Categoría */}
          <div className="flex-1">
            <button
              onClick={() => {
                if (ordenCategoria === 'none') {
                  setOrdenCategoria('asc');
                } else if (ordenCategoria === 'asc') {
                  setOrdenCategoria('desc');
                } else {
                  setOrdenCategoria('none');
                }
              }}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                ordenCategoria !== 'none' 
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' 
                  : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span className="text-sm sm:text-base">Categoría</span>
              {ordenCategoria === 'asc' && <ArrowUp01 className="w-4 h-4" />}
              {ordenCategoria === 'desc' && <ArrowDown01 className="w-4 h-4" />}
              {ordenCategoria === 'none' && <ArrowUpDown className="w-4 h-4 opacity-50" />}
            </button>
          </div>
          
          {/* Filtro por Código */}
          <div className="flex-1">
            <button
              onClick={() => {
                if (ordenCodigo === 'none') {
                  setOrdenCodigo('asc');
                } else if (ordenCodigo === 'asc') {
                  setOrdenCodigo('desc');
                } else {
                  setOrdenCodigo('none');
                }
              }}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                ordenCodigo !== 'none' 
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                  : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Hash className="w-4 h-4" />
              <span className="text-sm sm:text-base">Código</span>
              {ordenCodigo === 'asc' && <ArrowUp01 className="w-4 h-4" />}
              {ordenCodigo === 'desc' && <ArrowDown01 className="w-4 h-4" />}
              {ordenCodigo === 'none' && <ArrowUpDown className="w-4 h-4 opacity-50" />}
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Progress Bar y Buscador - Sticky */}
      <div className="sticky top-16 z-30 mb-3 sm:mb-4">
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-0.5 sm:p-2 space-y-0.5 sm:space-y-2">
          {/* Barra de progreso */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-[8px] sm:text-[10px] font-medium text-gray-700">{productosGuardadosCount}/{productos.length}</span>
            
            <div className="flex-1 flex items-center gap-0.5 sm:gap-1">
              <div className="flex-1 flex items-center gap-0.5 sm:gap-1">
                <span className="text-[7px] sm:text-[9px] font-bold text-blue-600">A</span>
                <div className="flex-1 h-1 sm:h-2 bg-blue-100 rounded overflow-hidden">
                  <div className="h-full bg-blue-500"
                    style={{ width: productosPorTipo.totales.A > 0 ? `${(productosPorTipo.guardados.A / productosPorTipo.totales.A) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-[6px] sm:text-[8px] text-gray-500">
                  {productosPorTipo.totales.A > 0 
                    ? `${Math.round((productosPorTipo.guardados.A / productosPorTipo.totales.A) * 100)}%`
                    : '0%'}
                </span>
              </div>
              
              <div className="flex-1 flex items-center gap-0.5 sm:gap-1">
                <span className="text-[7px] sm:text-[9px] font-bold text-green-600">B</span>
                <div className="flex-1 h-1 sm:h-2 bg-green-100 rounded overflow-hidden">
                  <div className="h-full bg-green-500"
                    style={{ width: productosPorTipo.totales.B > 0 ? `${(productosPorTipo.guardados.B / productosPorTipo.totales.B) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-[6px] sm:text-[8px] text-gray-500">
                  {productosPorTipo.totales.B > 0 
                    ? `${Math.round((productosPorTipo.guardados.B / productosPorTipo.totales.B) * 100)}%`
                    : '0%'}
                </span>
              </div>
              
              <div className="flex-1 flex items-center gap-0.5 sm:gap-1">
                <span className="text-[7px] sm:text-[9px] font-bold text-yellow-600">C</span>
                <div className="flex-1 h-1 sm:h-2 bg-yellow-100 rounded overflow-hidden">
                  <div className="h-full bg-yellow-500"
                    style={{ width: productosPorTipo.totales.C > 0 ? `${(productosPorTipo.guardados.C / productosPorTipo.totales.C) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-[6px] sm:text-[8px] text-gray-500">
                  {productosPorTipo.totales.C > 0 
                    ? `${Math.round((productosPorTipo.guardados.C / productosPorTipo.totales.C) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>
            
            <span className="text-[7px] sm:text-[9px] font-bold text-purple-600">{porcentajeCompletado}%</span>
            <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>
            {startTime && <Timer startTime={startTime} className="!p-0 !px-0.5 sm:!px-1 !py-0 !text-[7px] sm:!text-[9px]" />}
          </div>
          
          {/* Barra de búsqueda con la misma altura que la sección de progreso */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <input
              type="search"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="flex-[2] h-[20px] sm:h-auto px-1 py-0 bg-gray-50 border border-gray-200 rounded text-[7px] sm:text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-400 leading-none"
            />
            <button
              onClick={() => setBusqueda('')}
              disabled={!busqueda}
              className={`flex-[0.5] h-[20px] sm:h-auto px-1 py-0 rounded border text-[7px] sm:text-sm leading-none ${
                busqueda
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200 cursor-pointer'
                  : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
              }`}
            >
              Limpiar
            </button>
            <div className="flex-[0.5] h-[20px] sm:h-auto px-1 py-0 rounded border bg-gray-50 text-gray-600 border-gray-200 text-[7px] sm:text-sm leading-none text-center flex items-center justify-center">
              V.1
            </div>
          </div>
        </div>
      </div>

      {/* Modal de métricas moderno */}
      {showMetrics && metrics && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 max-w-md w-full shadow-2xl animate-bounce-in">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ¡Excelente trabajo!
              </h3>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Inventario completado exitosamente</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-5 rounded-xl sm:rounded-2xl">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-1 sm:mb-2" />
                <p className="text-xs text-gray-600">Tiempo total</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{metrics.totalTime}</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-5 rounded-xl sm:rounded-2xl">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-1 sm:mb-2" />
                <p className="text-xs text-gray-600">Productos/min</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{metrics.productosPorMinuto}</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-5 rounded-xl sm:rounded-2xl">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-1 sm:mb-2" />
                <p className="text-xs text-gray-600">Tiempo promedio</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{metrics.tiempoPromedio}</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 sm:p-5 rounded-xl sm:rounded-2xl">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mb-1 sm:mb-2" />
                <p className="text-xs text-gray-600">Eficiencia</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{metrics.eficiencia}%</p>
              </div>
            </div>
            
            {metrics.productosConCero > 0 && (
              <div className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-red-600 font-medium">
                  ⚠️ {metrics.productosConCero} productos con conteo en cero
                </p>
              </div>
            )}
            
            <button
              onClick={() => setShowMetrics(false)}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}


      {/* Lista de productos */}
      <div className="space-y-4">
        {productosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Package2 className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No se encontraron productos</p>
          </div>
        ) : agruparPorCategoria ? (
          // Vista agrupada por categoría
          (() => {
            const productosAgrupados = productosFiltrados.reduce((acc, producto) => {
              const categoria = producto.fields['Categoría'] || 'Sin categoría';
              if (!acc[categoria]) {
                acc[categoria] = [];
              }
              acc[categoria].push(producto);
              return acc;
            }, {} as Record<string, typeof productosFiltrados>);
            
            return Object.entries(productosAgrupados).map(([categoria, productosCategoria]) => (
              <div key={categoria} className="mb-6">
                {/* Header de categoría */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg mb-3 shadow-md">
                  <h3 className="font-bold text-sm sm:text-base">{categoria}</h3>
                  <p className="text-xs opacity-90">{productosCategoria.length} productos</p>
                </div>
                
                {/* Productos de la categoría */}
                <div className="space-y-4">
                  {productosCategoria.map(producto => {
                    const estaGuardado = productosGuardados.has(producto.id);
                    const sinContar = !estaGuardado;
                    
                    return (
                      <div 
                        key={`${producto.id}-${resetKey}`} 
                        className={`${sinContar ? 'ring-2 ring-red-400 rounded-2xl' : ''} transition-all duration-300`}
                      >
                        {deviceInfo.isMobile ? (
                          <ProductoConteoPruebaMobile
                            producto={producto}
                            unidad={obtenerUnidad(producto)}
                            unidadBodega={obtenerUnidadBodega(producto)}
                            onConteoChange={handleConteoChange}
                            onGuardarProducto={esUsuarioSoloLectura ? undefined : handleGuardarProducto}
                            guardando={guardandoProductos.has(producto.id)}
                            isGuardado={productosGuardados.has(producto.id)}
                            conteoInicial={resetKey > 0 ? undefined : conteos[producto.id]}
                          />
                        ) : (
                          <ProductoConteo
                            producto={producto}
                            unidad={obtenerUnidad(producto)}
                            unidadBodega={obtenerUnidadBodega(producto)}
                            onConteoChange={handleConteoChange}
                            onGuardarProducto={esUsuarioSoloLectura ? undefined : handleGuardarProducto}
                            guardando={guardandoProductos.has(producto.id)}
                            isGuardado={productosGuardados.has(producto.id)}
                            conteoInicial={resetKey > 0 ? undefined : conteos[producto.id]}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()
        ) : (
          // Vista normal sin agrupar
          productosFiltrados.map(producto => {
            const estaGuardado = productosGuardados.has(producto.id);
            const sinContar = !estaGuardado;
            
            return (
              <div 
                key={`${producto.id}-${resetKey}`} 
                className={`${sinContar ? 'ring-2 ring-red-400 rounded-2xl' : ''} transition-all duration-300`}
              >
                {deviceInfo.isMobile ? (
                  <ProductoConteoPruebaMobile
                    producto={producto}
                    unidad={obtenerUnidad(producto)}
                    unidadBodega={obtenerUnidadBodega(producto)}
                    onConteoChange={handleConteoChange}
                    onGuardarProducto={esUsuarioSoloLectura ? undefined : handleGuardarProducto}
                    guardando={guardandoProductos.has(producto.id)}
                    isGuardado={productosGuardados.has(producto.id)}
                    conteoInicial={resetKey > 0 ? undefined : conteos[producto.id]}
                  />
                ) : (
                  <ProductoConteo
                    producto={producto}
                    unidad={obtenerUnidad(producto)}
                    unidadBodega={obtenerUnidadBodega(producto)}
                    onConteoChange={handleConteoChange}
                    onGuardarProducto={esUsuarioSoloLectura ? undefined : handleGuardarProducto}
                    guardando={guardandoProductos.has(producto.id)}
                    isGuardado={productosGuardados.has(producto.id)}
                    conteoInicial={resetKey > 0 ? undefined : conteos[producto.id]}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Buttons - Optimizado para móviles */}
      <div className="fixed bottom-3 right-3 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end gap-2 sm:gap-4">
        {/* Botón "Todo en 0" - Solo para Planta Producción */}
        {bodegaId === 3 && (
          <button
            onClick={handleTodoEnCero}
            disabled={procesandoTodoEnCero}
            className={`px-3 py-1.5 rounded-full font-medium text-white transition-all duration-300 flex items-center gap-1 shadow-lg hover:shadow-xl ${
              procesandoTodoEnCero 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
            title="Poner todos los productos no guardados en 0"
          >
            {procesandoTodoEnCero ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs">Procesando...</span>
              </>
            ) : (
              <>
                <Package2 className="w-3 h-3" />
                <span className="text-xs">Todo en 0</span>
              </>
            )}
          </button>
        )}
        
        {/* Botón principal */}
        <div className="relative">
          
          <button
            onClick={() => {
              if (sePuedeGuardar) {
                if (window.confirm('¿Estás seguro de que deseas guardar el inventario completo?')) {
                  handleGuardar();
                }
              } else if (porcentajeCompletado < 100) {
                // Activar reordenamiento cuando se intenta guardar con progreso < 100%
                console.log('🚨 BOTÓN BLOQUEADO CLICKEADO - Activando reordenamiento');
                console.log('📊 Progreso actual:', porcentajeCompletado + '%');
                console.log('📊 Productos guardados:', productosGuardadosCount, 'de', productos.length);
                console.log('🔄 Estado anterior intentoGuardarIncompleto:', intentoGuardarIncompleto);
                
                // Limpiar el orden congelado para forzar nuevo reordenamiento
                setOrdenCongelado([]);
                
                // Activar el reordenamiento
                setIntentoGuardarIncompleto(true);
                localStorage.setItem(`intentoGuardarIncompleto_${bodegaId}`, 'true');
                
                console.log('✅ Reordenamiento activado - El orden se congelará automáticamente');
              }
            }}
            className={`group relative p-1 sm:p-1.5 rounded-full font-medium text-white transition-all duration-300 flex items-center justify-center ${
              sePuedeGuardar && !botonGuardarDeshabilitado
                ? 'bg-gradient-to-r from-purple-500 to-blue-600 hover:shadow-xl hover:scale-105' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            title={
              botonGuardarDeshabilitado 
                ? `Espera ${tiempoRestanteCooldown} segundos para guardar nuevamente` 
                : !sePuedeGuardar 
                ? `Completa el inventario. Progreso: ${porcentajeCompletado}%` 
                : ''
            }
            disabled={botonGuardarDeshabilitado || esUsuarioSoloLectura}
          >
          <div className="flex flex-col items-center gap-0">
            <Save className="w-3 h-3" />
            <span className="text-[8px]">Guardar</span>
          </div>
          </button>
        </div>
      </div>

      {/* Modal de progreso visual para "Todo en 0" */}
      {procesandoTodoEnCero && totalAProcesar > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Procesando productos...</h3>
            
            {/* Barra de progreso */}
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(progresoProcesamiento / totalAProcesar) * 100}%` }}
              />
            </div>
            
            {/* Contador */}
            <p className="text-sm text-gray-600 text-center mb-2">
              {progresoProcesamiento} de {totalAProcesar} productos
            </p>
            
            {/* Producto actual */}
            {productoActual && (
              <p className="text-xs text-gray-500 text-center truncate">
                Procesando: {productoActual}
              </p>
            )}
            
            {/* Porcentaje grande */}
            <div className="mt-4 text-center">
              <span className="text-3xl font-bold text-blue-600">
                {Math.round((progresoProcesamiento / totalAProcesar) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}



      {/* Botón scroll to top - Solo visible en desktop */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="hidden sm:flex fixed bottom-8 left-8 bg-white p-3 sm:p-4 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 z-50 border border-gray-100 items-center justify-center"
        title="Ir al inicio"
      >
        <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
      </button>
    </div>
  );
};
