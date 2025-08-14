import { useState, useEffect, useMemo, useCallback } from 'react';
import { Save, Search, Filter, X, Package, Loader2, AlertCircle } from 'lucide-react';
import type { Producto } from '../types/index';
import { ProductoConteoCompacto } from './ProductoConteoCompacto';
import { Toast } from './Toast';
import { Timer } from './Timer';
import { airtableService } from '../services/airtable';
import { authService } from '../services/auth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useDebounce } from '../hooks/useDebounce';

interface HistoricoOpcionesProps {
  bodegaId: number;
  bodegaNombre: string;
}

interface ProductoConConteo extends Producto {
  cantidadPedir: number;
  conteos: number[];
}

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

export const HistoricoOpciones = ({ 
  bodegaId, 
  bodegaNombre 
}: HistoricoOpcionesProps) => {
  // Estados principales
  const [productos, setProductos] = useState<ProductoConConteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Estados para controlar edición y guardado
  const [productosGuardados, setProductosGuardados] = useState<Set<string>>(new Set());
  const [mostrarCalculadora, setMostrarCalculadora] = useState<string | null>(null);
  const [guardandoProductos, setGuardandoProductos] = useState<Set<string>>(new Set());
  const [guardandoInventario, setGuardandoInventario] = useState(false);
  
  // Estados adicionales
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error' | 'info' | 'offline' | 'warning'} | null>(null);
  const [startTime] = useState<Date>(new Date());
  const isOnline = useOnlineStatus();
  const debouncedBusqueda = useDebounce(busqueda, 300);

  // Helper para obtener el tipo del producto
  const obtenerTipoProducto = (fields: any): string => {
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
      if (fields[nombre]) {
        return fields[nombre];
      }
    }
    
    return '';
  };

  // Cargar productos de Airtable
  const cargarProductos = async () => {
    if (!isOnline) {
      setError('Sin conexión a Internet. Los cambios se guardarán localmente.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const productosAirtable = await airtableService.obtenerProductos(bodegaId);
      
      // Cargar conteos guardados del localStorage
      const savedConteos = localStorage.getItem(`conteos_bodega_${bodegaId}`);
      let conteosGuardados: any = {};
      let productosConEstadoGuardado = new Set<string>();
      
      if (savedConteos) {
        conteosGuardados = JSON.parse(savedConteos);
        // Marcar como guardados los productos que tienen conteos
        Object.keys(conteosGuardados).forEach(productoId => {
          const conteo = conteosGuardados[productoId];
          if (conteo && (conteo.c1 > 0 || conteo.c2 > 0 || conteo.c3 > 0 || conteo.c4 > 0 || conteo.c5 > 0 || conteo.cantidadPedir > 0 || conteo.touched)) {
            productosConEstadoGuardado.add(productoId);
          }
        });
      }
      
      // Convertir productos de Airtable al formato necesario
      const productosConConteo: ProductoConConteo[] = productosAirtable.map(p => {
        const conteoGuardado = conteosGuardados[p.id];
        return {
          ...p,
          cantidadPedir: conteoGuardado?.cantidadPedir || 0,
          conteos: conteoGuardado ? [
            conteoGuardado.c1 || 0,
            conteoGuardado.c2 || 0,
            conteoGuardado.c3 || 0,
            conteoGuardado.c4 || 0,
            conteoGuardado.c5 || 0
          ] : [0, 0, 0, 0, 0]
        };
      });
      
      setProductos(productosConConteo);
      setProductosGuardados(productosConEstadoGuardado);
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError('Error al cargar productos. Por favor, recarga la página.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, [bodegaId, isOnline]);

  // Guardar conteos en localStorage
  const guardarConteosLocalmente = useCallback(() => {
    try {
      // Convertir el estado actual a formato para localStorage
      const conteosParaGuardar: any = {};
      productos.forEach(producto => {
        if (producto.conteos.some(c => c !== 0) || producto.cantidadPedir !== 0) {
          conteosParaGuardar[producto.id] = {
            c1: producto.conteos[0],
            c2: producto.conteos[1],
            c3: producto.conteos[2],
            c4: producto.conteos[3],
            c5: producto.conteos[4],
            cantidadPedir: producto.cantidadPedir,
            touched: true
          };
        }
      });
      
      const dataToStore = JSON.stringify(conteosParaGuardar);
      const spaceCheck = checkLocalStorageSpace(dataToStore);
      
      if (!spaceCheck.hasSpace) {
        setToast({
          message: spaceCheck.message,
          type: 'error'
        });
        return false;
      }
      
      localStorage.setItem(`conteos_bodega_${bodegaId}`, dataToStore);
      
      if (spaceCheck.percentageUsed > 90) {
        setToast({
          message: spaceCheck.message,
          type: 'warning'
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
      setToast({
        message: '❌ Error al guardar localmente',
        type: 'error'
      });
      return false;
    }
  }, [productos, bodegaId]);

  // Debounced save
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (productos.length > 0) {
        guardarConteosLocalmente();
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [productos, guardarConteosLocalmente]);

  // Extraer categorías y tipos únicos
  const categorias = useMemo(() => {
    const cats = new Set(productos.map(p => p.fields['Categoría'] || 'Sin categoría'));
    return Array.from(cats).sort();
  }, [productos]);

  const tipos = useMemo(() => {
    const tiposSet = new Set(productos.map(p => obtenerTipoProducto(p.fields) || 'Sin tipo'));
    return Array.from(tiposSet).sort();
  }, [productos]);

  // Filtrar productos
  const productosFiltrados = useMemo(() => {
    return productos.filter(producto => {
      // Filtro de búsqueda
      if (debouncedBusqueda) {
        const busquedaLower = debouncedBusqueda.toLowerCase();
        const nombre = (producto.fields['Nombre Producto'] || '').toLowerCase();
        const codigo = (producto.fields['Código'] || '').toLowerCase();
        const categoria = (producto.fields['Categoría'] || '').toLowerCase();
        
        if (!nombre.includes(busquedaLower) && 
            !codigo.includes(busquedaLower) && 
            !categoria.includes(busquedaLower)) {
          return false;
        }
      }

      // Filtro de categoría
      if (filtroCategoria !== 'todos' && producto.fields['Categoría'] !== filtroCategoria) {
        return false;
      }

      // Filtro de tipo
      if (filtroTipo !== 'todos' && obtenerTipoProducto(producto.fields) !== filtroTipo) {
        return false;
      }

      // Filtro de estado
      if (filtroEstado !== 'todos') {
        const estaGuardado = productosGuardados.has(producto.id);
        const esInactivo = producto.conteos.every(c => c === -1);
        
        if (filtroEstado === 'guardados' && !estaGuardado) return false;
        if (filtroEstado === 'pendientes' && (estaGuardado || esInactivo)) return false;
        if (filtroEstado === 'inactivos' && !esInactivo) return false;
      }

      return true;
    });
  }, [productos, debouncedBusqueda, filtroCategoria, filtroTipo, filtroEstado, productosGuardados]);

  // Contadores
  const contadores = useMemo(() => {
    const guardados = productosFiltrados.filter(p => productosGuardados.has(p.id)).length;
    const inactivos = productosFiltrados.filter(p => p.conteos.every(c => c === -1)).length;
    const pendientes = productosFiltrados.length - guardados - inactivos;
    
    return { total: productosFiltrados.length, guardados, pendientes, inactivos };
  }, [productosFiltrados, productosGuardados]);


  // Función para manejar cambios del componente ProductoConteo
  const handleConteoChange = (productoId: string, conteo: {
    c1: number;
    c2: number;
    c3: number;
    cantidadPedir: number;
    touched?: boolean;
  }) => {
    setProductos(productos.map(p => {
      if (p.id === productoId) {
        return {
          ...p,
          conteos: [conteo.c1, conteo.c2, conteo.c3, 0, 0],
          cantidadPedir: conteo.cantidadPedir
        };
      }
      return p;
    }));
  };

  // Funciones para obtener unidades (como en ListaProductos)
  const obtenerUnidad = (producto: ProductoConConteo): string => {
    return producto.fields['Unidad De Conteo General'] as string || 'unidades';
  };

  const obtenerUnidadBodega = (producto: ProductoConConteo): string => {
    return producto.fields['Unidad De Conteo General'] as string || 'unidades';
  };


  // Guardar producto individual
  const guardarProducto = async (id: string, esAccionRapida?: boolean) => {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    if (!isOnline) {
      // Guardar localmente si no hay conexión
      setProductosGuardados(prev => new Set(prev).add(id));
      setToast({
        message: '💾 Guardado localmente (sin conexión)',
        type: 'offline'
      });
      return;
    }

    setGuardandoProductos(prev => new Set(prev).add(id));

    try {
      const total = producto.conteos.filter(c => c >= 0).reduce((sum, val) => sum + val, 0);
      
      // Por ahora, solo marcar como guardado localmente
      // TODO: Implementar guardado real cuando esté disponible el método

      setProductosGuardados(prev => new Set(prev).add(id));
      
      // Si es acción rápida, mostrar mensaje específico
      if (esAccionRapida) {
        const esInactivo = producto.conteos.every(c => c === -1);
        const esCero = producto.conteos.every(c => c === 0) && total === 0;
        
        if (esInactivo) {
          setToast({ message: '✅ Producto marcado como inactivo', type: 'success' });
        } else if (esCero) {
          setToast({ message: '✅ Producto marcado en cero', type: 'success' });
        }
      } else {
        setToast({ message: '✅ Producto guardado', type: 'success' });
      }
    } catch (error) {
      console.error('Error guardando producto:', error);
      setToast({
        message: '❌ Error al guardar. Se guardó localmente.',
        type: 'error'
      });
      // Guardar localmente en caso de error
      setProductosGuardados(prev => new Set(prev).add(id));
    } finally {
      setGuardandoProductos(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };


  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroCategoria('todos');
    setFiltroTipo('todos');
    setFiltroEstado('todos');
  };

  // Guardar todo el inventario
  const handleGuardarInventario = async () => {
    if (!isOnline) {
      setToast({
        message: '❌ Sin conexión. Los datos ya están guardados localmente.',
        type: 'offline'
      });
      return;
    }

    const productosParaGuardar = productos.filter(p => {
      const tieneConteo = p.conteos.some(c => c !== 0) || p.cantidadPedir !== 0;
      return tieneConteo && !productosGuardados.has(p.id);
    });

    if (productosParaGuardar.length === 0) {
      setToast({
        message: 'ℹ️ No hay productos nuevos para guardar',
        type: 'info'
      });
      return;
    }

    setGuardandoInventario(true);

    try {
      // Guardar cada producto
      for (const producto of productosParaGuardar) {
        await guardarProducto(producto.id);
      }

      setToast({
        message: `✅ ${productosParaGuardar.length} productos guardados exitosamente`,
        type: 'success'
      });

      // Notificar si es necesario
      // TODO: Implementar notificación cuando esté disponible el método
    } catch (error) {
      console.error('Error guardando inventario:', error);
      setToast({
        message: '❌ Error al guardar algunos productos',
        type: 'error'
      });
    } finally {
      setGuardandoInventario(false);
    }
  };

  // Verificar si el usuario es solo lectura
  const esUsuarioSoloLectura = useMemo(() => {
    const userEmail = authService.getUserEmail();
    return userEmail === 'analisis@chiosburger.com';
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (error && !productos.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error al cargar productos</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={cargarProductos}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-1">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal de guardando inventario */}
      {guardandoInventario && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 shadow-2xl max-w-sm w-full">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">
                Guardando Inventario
              </h3>
              <p className="text-sm text-gray-600 text-center">
                Por favor espera...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header fijo */}
      <div className="sticky top-0 bg-white z-40 shadow-sm">
        <header className="py-1 px-1">
          <div className="flex items-center justify-between">
            <h1 className="text-xs font-bold text-gray-800">{bodegaNombre}</h1>
            <div className="flex items-center gap-2">
              {startTime && <Timer startTime={startTime} className="!p-0 !px-0.5 !py-0 !text-[8px]" />}
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>
            </div>
          </div>
        </header>

        {/* Barra de búsqueda y filtros */}
        <div className="px-1 pb-1">
          <div className="flex gap-1">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-6 pr-6 py-0.5 text-[8px] border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
              <Search className="absolute left-1 top-1 w-3 h-3 text-gray-400" />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-1 top-1"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`px-2 py-0.5 border rounded-sm text-[8px] font-medium flex items-center gap-0.5 ${
                mostrarFiltros ? 'bg-purple-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <Filter className="w-3 h-3" />
              Filtros
            </button>
          </div>

          {/* Panel de filtros */}
          {mostrarFiltros && (
            <div className="mt-1 p-1 bg-gray-50 rounded-sm border border-gray-200">
              <div className="grid grid-cols-3 gap-1 mb-1">
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="text-[8px] px-1 py-0.5 border rounded-sm"
                >
                  <option value="todos">Categorías</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="text-[8px] px-1 py-0.5 border rounded-sm"
                >
                  <option value="todos">Tipos</option>
                  {tipos.map(tipo => (
                    <option key={tipo} value={tipo}>Tipo {tipo}</option>
                  ))}
                </select>
                
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="text-[8px] px-1 py-0.5 border rounded-sm"
                >
                  <option value="todos">Estados</option>
                  <option value="guardados">Guardados</option>
                  <option value="pendientes">Pendientes</option>
                  <option value="inactivos">Inactivos</option>
                </select>
              </div>
              
              <button
                onClick={limpiarFiltros}
                className="w-full text-[8px] text-purple-600 underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Contadores */}
        <div className="px-1 pb-1 flex justify-between items-center text-[8px]">
          <div className="flex gap-2">
            <span className="text-gray-600">Total: <b>{contadores.total}</b></span>
            <span className="text-green-600">Guardados: <b>{contadores.guardados}</b></span>
            <span className="text-orange-600">Pendientes: <b>{contadores.pendientes}</b></span>
            <span className="text-red-600">Inactivos: <b>{contadores.inactivos}</b></span>
          </div>
        </div>
      </div>

      {/* Lista de productos - Estilo Inventario Compacto */}
      <div className="space-y-1 w-full pb-16">
        {productosFiltrados.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-[10px] text-gray-500">No se encontraron productos</p>
          </div>
        ) : (
          productosFiltrados.map((producto) => {
            const estaGuardado = productosGuardados.has(producto.id);
            const guardando = guardandoProductos.has(producto.id);
            const esInactivo = producto.conteos.every(c => c === -1);
            const sinContar = !estaGuardado && !esInactivo;

            return (
              <div 
                key={producto.id} 
                className={`${sinContar ? 'ring-1 ring-red-400 rounded-lg' : ''} transition-all duration-300`}
              >
                <ProductoConteoCompacto
                  producto={producto}
                  unidad={obtenerUnidad(producto)}
                  unidadBodega={obtenerUnidadBodega(producto)}
                  onConteoChange={handleConteoChange}
                  onGuardarProducto={esUsuarioSoloLectura ? undefined : (productoId) => guardarProducto(productoId)}
                  guardando={guardando}
                  isGuardado={estaGuardado}
                  conteoInicial={{
                    c1: producto.conteos[0] || 0,
                    c2: producto.conteos[1] || 0,
                    c3: producto.conteos[2] || 0,
                    cantidadPedir: producto.cantidadPedir || 0,
                    touched: true
                  }}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Botón flotante guardar todo */}
      {!esUsuarioSoloLectura && contadores.pendientes > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={handleGuardarInventario}
            disabled={guardandoInventario}
            className="bg-purple-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-purple-600 transition-all flex items-center gap-2"
          >
            {guardandoInventario ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span className="text-sm">Guardar Todo</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Modal de calculadora (simulado) */}
      {mostrarCalculadora && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-xs w-full mx-4">
            <h3 className="text-sm font-bold mb-3">Calculadora</h3>
            <p className="text-xs text-gray-600 mb-3">
              Producto: {productos.find(p => p.id === mostrarCalculadora)?.fields['Nombre Producto']}
            </p>
            <div className="text-center text-[10px] text-gray-500 py-4 border rounded">
              [Aquí iría la calculadora completa]
            </div>
            <button
              onClick={() => setMostrarCalculadora(null)}
              className="w-full mt-3 bg-gray-500 text-white py-1.5 rounded text-xs hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};