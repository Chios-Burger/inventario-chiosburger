import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, Loader2, AlertCircle, Package2, X, Save, Clock, TrendingUp, BarChart3, Award, ArrowUp, Sparkles, ArrowUpDown, ArrowUp01, ArrowDown01, Hash, Tag } from 'lucide-react';
import type { Producto } from '../types/index';
import { ProductoConteo } from './ProductoConteo';
import { Toast } from './Toast';
import { Timer } from './Timer';
import { airtableService } from '../services/airtable';
import { historicoService } from '../services/historico';
import { authService } from '../services/auth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useDebounce } from '../hooks/useDebounce';

interface ListaProductosProps {
  bodegaId: number;
  bodegaNombre: string;
}

// Función helper para obtener el día actual
const getDiaActual = (): number => {
  return new Date().getDay(); // 0 = Domingo, 1 = Lunes, etc.
};

// Función helper para obtener los tipos permitidos según bodega y día
const getTiposPermitidos = (bodegaId: number, dia: number, userEmail?: string): string[] | null => {
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

export const ListaProductos = ({ 
  bodegaId, 
  bodegaNombre 
}: ListaProductosProps) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [conteos, setConteos] = useState<{[key: string]: any}>({});
  const [productosGuardados, setProductosGuardados] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error' | 'info' | 'offline'} | null>(null);
  const [guardandoProductos, setGuardandoProductos] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showMetrics, setShowMetrics] = useState(false);
  const [mostrarSinContarPrimero, setMostrarSinContarPrimero] = useState(false);
  const [ordenSnapshot, setOrdenSnapshot] = useState<string[]>([]); // Guardar el orden en el momento del clic
  const [guardandoInventario, setGuardandoInventario] = useState(false); // Estado para mostrar mensaje de guardado
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isOnline = useOnlineStatus();
  const debouncedBusqueda = useDebounce(busqueda, 300);
  
  // Estados para ordenamiento
  const [ordenCategoria, setOrdenCategoria] = useState<'asc' | 'desc' | 'none'>('none');
  const [ordenCodigo, setOrdenCodigo] = useState<'asc' | 'desc' | 'none'>('none');

  // Timer
  useEffect(() => {
    setStartTime(new Date());
    setElapsedTime(0);
    setShowMetrics(false);
    setProductosGuardados(new Set());
    setConteos({});
    setMostrarSinContarPrimero(false); // Resetear ordenamiento al cambiar de bodega
    setOrdenSnapshot([]); // Limpiar el snapshot del orden
    
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
    const datosGuardados = localStorage.getItem(`conteos_${bodegaId}`);
    if (datosGuardados) {
      setConteos(JSON.parse(datosGuardados));
      // Mensaje eliminado
    }
    
    // Cargar productos guardados del localStorage
    const productosGuardadosLocal = localStorage.getItem(`productosGuardados_${bodegaId}`);
    if (productosGuardadosLocal) {
      setProductosGuardados(new Set(JSON.parse(productosGuardadosLocal)));
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
  const usuario = useMemo(() => authService.getUsuarioActual(), []);
  const diaActual = useMemo(() => getDiaActual(), []);
  const tiposPermitidosHoy = useMemo(() => getTiposPermitidos(bodegaId, diaActual, usuario?.email), [bodegaId, diaActual, usuario?.email]);
  const hayTomaHoy = tiposPermitidosHoy !== null;

  const productosFiltrados = useMemo(() => {
    // Si no hay toma hoy, retornar array vacío
    if (!hayTomaHoy) {
      return [];
    }

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
    
    // Luego aplicar ordenamiento normal
    let productosOrdenados = [...productosFiltrados];
    
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
    
    return productosOrdenados;
  }, [productos, debouncedBusqueda, ordenCategoria, ordenCodigo, mostrarSinContarPrimero, ordenSnapshot, hayTomaHoy, tiposPermitidosHoy]);

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

  const handleGuardar = async () => {
    // CAMBIO TEMPORAL: Permitir guardar sin completar todos los productos
    // Comentado para pruebas
    /*
    const productosSinContarActual = productos.filter(producto => {
      // Un producto está contado SOLO si ha sido guardado explícitamente
      return !productosGuardados.has(producto.id);
    });
    
    setToast({ message: '✨ Producto guardado exitosamente', type: 'success' });
  }, [bodegaId]);

  const handleGuardarProducto = useCallback(async (productoId: string, esAccionRapida?: boolean, valoresRapidos?: any) => {
    // Si es acción rápida, usar la nueva función
    if (esAccionRapida && valoresRapidos) {
      handleAccionRapida(productoId, valoresRapidos);
      return;
    }
    */

    // Mostrar mensaje de guardado
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
          productosConConteo,
          duracion
        );
        
        // Limpiar datos locales
        localStorage.removeItem(`conteos_${bodegaId}`);
        localStorage.removeItem(`productosGuardados_${bodegaId}`);
        
        setToast({ message: '✅ Inventario guardado exitosamente', type: 'success' });
        
        setToast({ message: '🎉 Inventario guardado exitosamente', type: 'success' });
        localStorage.removeItem(`conteos_${bodegaId}`);
        localStorage.removeItem(`productosGuardados_${bodegaId}`);
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
      setToast({ message: 'Error al guardar', type: 'error' });
    } finally {
      setGuardandoInventario(false);
    }
  };

  // Calcular productos sin contar
  const productosSinContar = productos.filter(producto => {
    const conteo = conteos[producto.id];
    return !conteo || !conteo.touched;
  }).length;
  
  // CAMBIO TEMPORAL: Permitir guardar inventario siempre
  // const sePuedeGuardar = productosSinContar === 0 && productos.length > 0;
  const sePuedeGuardar = productos.length > 0; // Solo verificar que haya productos
  const sePuedeGuardar = productos.length > 0;
  
  // Desactivar el reordenamiento cuando todos los productos estén contados
  useEffect(() => {
    if (mostrarSinContarPrimero && sePuedeGuardar) {
      setMostrarSinContarPrimero(false);
      setOrdenSnapshot([]); // Limpiar el snapshot cuando todos estén contados
    }
  }, [sePuedeGuardar, mostrarSinContarPrimero]);

  const obtenerUnidad = (producto: Producto): string => {
    // Para Chios, Simón Bolón y Santo Cachón, usar la unidad de bodega principal para cantidad a pedir
    if ([4, 5, 6, 7, 8].includes(bodegaId)) {
      return producto.fields['Unidad Conteo Bodega Principal'] as string || 'unidades';
    }
    // Para las demás bodegas, usar la unidad específica de la bodega
    const campoUnidad = airtableService.obtenerCampoUnidad(bodegaId);
    return producto.fields[campoUnidad as keyof typeof producto.fields] as string || 'unidades';
  };

  const obtenerUnidadBodega = (producto: Producto): string => {
    const campoUnidad = airtableService.obtenerCampoUnidad(bodegaId);
    return producto.fields[campoUnidad as keyof typeof producto.fields] as string || 'unidades';
  };

  const productosGuardadosCount = productosGuardados.size;
  // Usar el total de productos en lugar de productos filtrados para el porcentaje
  const porcentajeCompletado = productos.length > 0 ? Math.min(Math.round((productosGuardadosCount / productos.length) * 100), 100) : 0;
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

      {/* Mensaje de guardado */}
      {guardandoInventario && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
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

      {/* Status Cards flotantes - móvil y desktop */}
      <div className="fixed top-16 sm:top-24 right-2 sm:right-4 z-40 flex sm:flex-col gap-2 sm:gap-3">
        {/* Conexión */}
        <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl backdrop-blur-lg flex items-center gap-2 shadow-lg ${
          isOnline ? 'bg-green-400/20 border border-green-400/30' : 'bg-orange-400/20 border border-orange-400/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`}></div>
          <span className={`text-xs font-medium ${isOnline ? 'text-green-700' : 'text-orange-700'}`}>
            {isOnline ? 'En línea' : 'Offline'}
          </span>
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
        
        {/* Barra de búsqueda moderna */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-11 sm:pl-14 pr-11 sm:pr-14 py-3.5 sm:py-5 bg-white border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all text-gray-700 placeholder-gray-400 shadow-sm text-sm sm:text-base"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 sm:right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
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
        
        {/* Filtros de ordenamiento */}
        <div className="mt-4">
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

      {/* Progress Bar - Opción 2 con porcentajes */}
      <div className="sticky top-16 z-30 mb-3 sm:mb-4">
        <div className="bg-white rounded-lg px-2 py-1 shadow-md border border-gray-100 flex items-center gap-2">
          <span className="text-[10px] font-medium text-gray-700">{productosGuardadosCount}/{productos.length}</span>
          
          <div className="flex-1 flex items-center gap-1">
            <div className="flex-1 flex items-center gap-1">
              <span className="text-[9px] font-bold text-blue-600">A</span>
              <div className="flex-1 h-2 bg-blue-100 rounded overflow-hidden">
                <div className="h-full bg-blue-500"
                  style={{ width: productosPorTipo.totales.A > 0 ? `${(productosPorTipo.guardados.A / productosPorTipo.totales.A) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-[8px] text-gray-500">
                {productosPorTipo.totales.A > 0 
                  ? `${Math.round((productosPorTipo.guardados.A / productosPorTipo.totales.A) * 100)}%`
                  : '0%'}
              </span>
            </div>
            
            <div className="flex-1 flex items-center gap-1">
              <span className="text-[9px] font-bold text-green-600">B</span>
              <div className="flex-1 h-2 bg-green-100 rounded overflow-hidden">
                <div className="h-full bg-green-500"
                  style={{ width: productosPorTipo.totales.B > 0 ? `${(productosPorTipo.guardados.B / productosPorTipo.totales.B) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-[8px] text-gray-500">
                {productosPorTipo.totales.B > 0 
                  ? `${Math.round((productosPorTipo.guardados.B / productosPorTipo.totales.B) * 100)}%`
                  : '0%'}
              </span>
            </div>
            
            <div className="flex-1 flex items-center gap-1">
              <span className="text-[9px] font-bold text-yellow-600">C</span>
              <div className="flex-1 h-2 bg-yellow-100 rounded overflow-hidden">
                <div className="h-full bg-yellow-500"
                  style={{ width: productosPorTipo.totales.C > 0 ? `${(productosPorTipo.guardados.C / productosPorTipo.totales.C) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-[8px] text-gray-500">
                {productosPorTipo.totales.C > 0 
                  ? `${Math.round((productosPorTipo.guardados.C / productosPorTipo.totales.C) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
          
          <span className="text-[9px] font-bold text-purple-600">{porcentajeCompletado}%</span>
          <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>
          {startTime && <Timer startTime={startTime} className="!p-0 !px-1 !py-0 !text-[9px]" />}
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
        {!hayTomaHoy ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No hay toma física programada para hoy
            </h3>
            <p className="text-gray-600">
              {bodegaId === 7 ? 'Las tomas físicas son: Domingo (todos), Martes y Miércoles (A y B)' :
               bodegaId === 8 ? 'Las tomas físicas son: Lunes (A y B) y Viernes (todos)' :
               [4, 5, 6].includes(bodegaId) ? 'Las tomas físicas son: Lunes (A y C), Martes/Miércoles/Viernes (B y A)' :
               'Esta bodega no tiene restricciones por día'}
            </p>
          </div>
        ) : productosFiltrados.length === 0 ? (
        {productosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Package2 className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No se encontraron productos</p>
          </div>
        ) : (
          productosFiltrados.map(producto => {
            const estaGuardado = productosGuardados.has(producto.id);
            const sinContar = !estaGuardado; // Simplificado: sin contar = no guardado
            
            return (
              <div 
                key={producto.id} 
                className={`${sinContar ? 'ring-2 ring-red-400 rounded-2xl' : ''} transition-all duration-300`}
              >
                <ProductoConteo
                  producto={producto}
                  unidad={obtenerUnidad(producto)}
                  unidadBodega={obtenerUnidadBodega(producto)}
                  onConteoChange={handleConteoChange}
                  onGuardarProducto={handleGuardarProducto}
                  guardando={guardandoProductos.has(producto.id)}
                  isGuardado={productosGuardados.has(producto.id)}
                  conteoInicial={conteos[producto.id]}
                />
              </div>
            );
          })
        )}
      </div>


      {/* Floating Action Buttons - Responsivo para móviles */}
      {hayTomaHoy && (
      <div className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 z-50 flex flex-col items-end gap-3 sm:gap-4">
        {/* Botón principal */}
        <div className="relative">
          {/* Tooltip cuando hay productos sin contar */}
          {!sePuedeGuardar && (
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Productos sin contar: {productosSinContar}</span>
                </div>
                <div className="absolute bottom-0 right-8 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
              </div>
            </div>
          )}
          
          <button
            disabled={!sePuedeGuardar}
            onClick={() => {
              if (sePuedeGuardar) {
                if (window.confirm('¿Estás seguro de que deseas guardar el inventario completo?')) {
                  handleGuardar();
                }
              }
            }}
            className={`group relative px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-white transition-all duration-300 flex items-center gap-2 sm:gap-3 text-sm sm:text-base ${
              sePuedeGuardar
                ? 'bg-gradient-to-r from-purple-500 to-blue-600 hover:shadow-2xl hover:scale-105' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            title={!sePuedeGuardar ? `Productos sin contar: ${productosSinContar}` : ''}
          >
          <Save className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Guardar Inventario</span>
          </button>
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
