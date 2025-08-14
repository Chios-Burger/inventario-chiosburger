import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Save, Search, Package, Loader2, AlertCircle, X, Eye, EyeOff, Layout, Grid3x3, List, BarChart3, Settings2 } from 'lucide-react';
import type { Producto } from '../types/index';
import { ProductoConteoMinimal } from './ProductoConteoMinimal';
import { ProductoConteoCompacto } from './ProductoConteoCompacto';
import { ProductoConteo } from './ProductoConteo';
import { Toast } from './Toast';
import { airtableService } from '../services/airtable';
import { authService } from '../services/auth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useDebounce } from '../hooks/useDebounce';

interface HistoricoOpcionesNuevoProps {
  bodegaId: number;
  bodegaNombre: string;
}

interface ProductoConConteo extends Producto {
  cantidadPedir: number;
  conteos: number[];
}

export const HistoricoOpcionesNuevo = ({ 
  bodegaId, 
  bodegaNombre 
}: HistoricoOpcionesNuevoProps) => {
  const [productos, setProductos] = useState<ProductoConConteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [vistaCompacta, setVistaCompacta] = useState(true);
  const [tipoVista, setTipoVista] = useState<'minimal' | 'compacto' | 'normal' | 'lista'>('minimal');
  const [mostrarMetricas, setMostrarMetricas] = useState(true);
  const [modoComparacion, setModoComparacion] = useState(false);
  const [vistaComparacion, setVistaComparacion] = useState<'minimal' | 'compacto' | 'normal'>('compacto');
  const listRef = useRef<HTMLDivElement>(null);
  const [productosVisibles, setProductosVisibles] = useState(0);
  const [productosGuardados, setProductosGuardados] = useState<Set<string>>(new Set());
  const [guardandoProductos, setGuardandoProductos] = useState<Set<string>>(new Set());
  const [guardandoInventario, setGuardandoInventario] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error' | 'info' | 'offline' | 'warning'} | null>(null);
  const isOnline = useOnlineStatus();
  const debouncedBusqueda = useDebounce(busqueda, 300);

  // Calcular productos visibles sin scroll
  useEffect(() => {
    const calcularProductosVisibles = () => {
      if (!listRef.current) return;
      
      const containerHeight = window.innerHeight - 280; // Altura aproximada del header
      let alturaProducto = 60; // Por defecto minimal
      
      switch(tipoVista) {
        case 'minimal': alturaProducto = 60; break;
        case 'compacto': alturaProducto = 100; break;
        case 'normal': alturaProducto = 140; break;
        case 'lista': alturaProducto = 40; break;
      }
      
      const espaciado = vistaCompacta ? 4 : 8;
      const productosCalculados = Math.floor(containerHeight / (alturaProducto + espaciado));
      setProductosVisibles(productosCalculados);
    };

    calcularProductosVisibles();
    window.addEventListener('resize', calcularProductosVisibles);
    return () => window.removeEventListener('resize', calcularProductosVisibles);
  }, [tipoVista, vistaCompacta]);

  // Cargar productos
  const cargarProductos = async () => {
    if (!isOnline) {
      setError('Sin conexión a Internet');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const productosAirtable = await airtableService.obtenerProductos(bodegaId);
      
      // Cargar conteos guardados
      const savedConteos = localStorage.getItem(`conteos_bodega_${bodegaId}`);
      let conteosGuardados: any = {};
      let productosConEstadoGuardado = new Set<string>();
      
      if (savedConteos) {
        conteosGuardados = JSON.parse(savedConteos);
        Object.keys(conteosGuardados).forEach(productoId => {
          const conteo = conteosGuardados[productoId];
          if (conteo && (conteo.c1 > 0 || conteo.c2 > 0 || conteo.c3 > 0 || conteo.cantidadPedir > 0 || conteo.touched)) {
            productosConEstadoGuardado.add(productoId);
          }
        });
      }
      
      const productosConConteo: ProductoConConteo[] = productosAirtable.map(p => {
        const conteoGuardado = conteosGuardados[p.id];
        return {
          ...p,
          cantidadPedir: conteoGuardado?.cantidadPedir || 0,
          conteos: conteoGuardado ? [
            conteoGuardado.c1 || 0,
            conteoGuardado.c2 || 0,
            conteoGuardado.c3 || 0
          ] : [0, 0, 0]
        };
      });
      
      setProductos(productosConConteo);
      setProductosGuardados(productosConEstadoGuardado);
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, [bodegaId, isOnline]);

  // Guardar conteos localmente
  const guardarConteosLocalmente = useCallback(() => {
    try {
      const conteosParaGuardar: any = {};
      productos.forEach(producto => {
        if (producto.conteos.some(c => c !== 0) || producto.cantidadPedir !== 0) {
          conteosParaGuardar[producto.id] = {
            c1: producto.conteos[0],
            c2: producto.conteos[1],
            c3: producto.conteos[2],
            cantidadPedir: producto.cantidadPedir,
            touched: true
          };
        }
      });
      
      localStorage.setItem(`conteos_bodega_${bodegaId}`, JSON.stringify(conteosParaGuardar));
      return true;
    } catch (error) {
      console.error('Error guardando:', error);
      return false;
    }
  }, [productos, bodegaId]);

  // Auto-guardar
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (productos.length > 0) {
        guardarConteosLocalmente();
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [productos, guardarConteosLocalmente]);

  // Filtrar productos
  const productosFiltrados = useMemo(() => {
    return productos.filter(producto => {
      // Búsqueda
      if (debouncedBusqueda) {
        const busquedaLower = debouncedBusqueda.toLowerCase();
        const nombre = (producto.fields['Nombre Producto'] || '').toLowerCase();
        const codigo = (producto.fields['Código'] || '').toLowerCase();
        
        if (!nombre.includes(busquedaLower) && !codigo.includes(busquedaLower)) {
          return false;
        }
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
  }, [productos, debouncedBusqueda, filtroEstado, productosGuardados]);

  // Contadores
  const contadores = useMemo(() => {
    const guardados = productosFiltrados.filter(p => productosGuardados.has(p.id)).length;
    const inactivos = productosFiltrados.filter(p => p.conteos.every(c => c === -1)).length;
    const pendientes = productosFiltrados.length - guardados - inactivos;
    
    return { total: productosFiltrados.length, guardados, pendientes, inactivos };
  }, [productosFiltrados, productosGuardados]);

  // Manejar cambio de conteo
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
          conteos: [conteo.c1, conteo.c2, conteo.c3],
          cantidadPedir: conteo.cantidadPedir
        };
      }
      return p;
    }));
  };

  // Obtener unidades
  const obtenerUnidad = (producto: ProductoConConteo): string => {
    return producto.fields['Unidad De Conteo General'] as string || 'unidad';
  };

  const obtenerUnidadBodega = (producto: ProductoConConteo): string => {
    return producto.fields['Unidad De Conteo General'] as string || 'unidad';
  };

  // Guardar producto
  const guardarProducto = async (id: string, esAccionRapida?: boolean) => {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    if (!isOnline) {
      setProductosGuardados(prev => new Set(prev).add(id));
      setToast({
        message: '💾 Guardado localmente',
        type: 'offline'
      });
      return;
    }

    setGuardandoProductos(prev => new Set(prev).add(id));

    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProductosGuardados(prev => new Set(prev).add(id));
      
      if (esAccionRapida) {
        const esInactivo = producto.conteos.every(c => c === -1);
        const esCero = producto.conteos.every(c => c === 0);
        
        if (esInactivo) {
          setToast({ message: '✅ Marcado como inactivo', type: 'success' });
        } else if (esCero) {
          setToast({ message: '✅ Marcado en cero', type: 'success' });
        }
      } else {
        setToast({ message: '✅ Guardado', type: 'success' });
      }
    } catch (error) {
      console.error('Error guardando:', error);
      setToast({
        message: '❌ Error al guardar',
        type: 'error'
      });
      setProductosGuardados(prev => new Set(prev).add(id));
    } finally {
      setGuardandoProductos(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Guardar todo
  const handleGuardarInventario = async () => {
    if (!isOnline) {
      setToast({
        message: '❌ Sin conexión',
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
        message: 'ℹ️ No hay productos para guardar',
        type: 'info'
      });
      return;
    }

    setGuardandoInventario(true);

    try {
      for (const producto of productosParaGuardar) {
        await guardarProducto(producto.id);
      }

      setToast({
        message: `✅ ${productosParaGuardar.length} productos guardados`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error:', error);
      setToast({
        message: '❌ Error al guardar',
        type: 'error'
      });
    } finally {
      setGuardandoInventario(false);
    }
  };

  // Verificar si es solo lectura
  const esUsuarioSoloLectura = useMemo(() => {
    const userEmail = authService.getUserEmail();
    return userEmail === 'analisis@chiosburger.com';
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (error && !productos.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={cargarProductos}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal guardando */}
      {guardandoInventario && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 shadow-2xl">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-800">Guardando inventario...</p>
          </div>
        </div>
      )}

      {/* Header fijo y moderno */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 shadow-sm border-b border-gray-100">
        {/* Título y stats */}
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-bold text-gray-800">{bodegaNombre}</h1>
              <p className="text-[10px] text-gray-500">Gestión de Inventario</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMostrarMetricas(!mostrarMetricas)}
                className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Mostrar/ocultar métricas"
              >
                <BarChart3 className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <button
                onClick={() => setVistaCompacta(!vistaCompacta)}
                className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title={vistaCompacta ? "Vista expandida" : "Vista compacta"}
              >
                {vistaCompacta ? <Eye className="w-3.5 h-3.5 text-gray-600" /> : <EyeOff className="w-3.5 h-3.5 text-gray-600" />}
              </button>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`} />
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        {mostrarMetricas && (
          <div className="px-3 py-2 grid grid-cols-4 gap-2 text-[10px] border-b border-gray-100">
            <div className="text-center">
              <p className="font-bold text-gray-800">{contadores.total}</p>
              <p className="text-gray-500">Total</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-green-600">{contadores.guardados}</p>
              <p className="text-gray-500">Guardados</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-orange-600">{contadores.pendientes}</p>
              <p className="text-gray-500">Pendientes</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-600">{contadores.inactivos}</p>
              <p className="text-gray-500">Inactivos</p>
            </div>
          </div>
        )}

        {/* Controles de vista */}
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-gray-600">Tipo de Vista:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setTipoVista('minimal')}
                className={`p-1.5 rounded transition-colors ${
                  tipoVista === 'minimal' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Vista Minimal"
              >
                <Grid3x3 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setTipoVista('compacto')}
                className={`p-1.5 rounded transition-colors ${
                  tipoVista === 'compacto' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Vista Compacta"
              >
                <Layout className="w-3 h-3" />
              </button>
              <button
                onClick={() => setTipoVista('normal')}
                className={`p-1.5 rounded transition-colors ${
                  tipoVista === 'normal' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Vista Normal"
              >
                <Settings2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setTipoVista('lista')}
                className={`p-1.5 rounded transition-colors ${
                  tipoVista === 'lista' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Vista Lista"
              >
                <List className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          {/* Métricas de visualización */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500">
              <span className="font-medium text-purple-600">{productosVisibles}</span> productos visibles sin scroll
            </span>
            <button
              onClick={() => setModoComparacion(!modoComparacion)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                modoComparacion ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {modoComparacion ? 'Salir comparación' : 'Comparar vistas'}
            </button>
          </div>
        </div>

        {/* Búsqueda y filtros */}
        <div className="px-3 py-2 space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              style={{ height: '28px' }}
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {['todos', 'pendientes', 'guardados', 'inactivos'].map(estado => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
                  filtroEstado === estado
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {estado.charAt(0).toUpperCase() + estado.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div ref={listRef} className={`px-3 py-3 pb-20 ${modoComparacion ? 'flex gap-2' : ''}`}>
        {modoComparacion ? (
          // Modo comparación: dos vistas lado a lado
          <>
            <div className={`flex-1 ${vistaCompacta ? 'space-y-1' : 'space-y-2'}`}>
              <div className="sticky top-0 bg-purple-50 rounded p-2 mb-2 text-center text-[10px] font-medium text-purple-700">
                Vista: {tipoVista.charAt(0).toUpperCase() + tipoVista.slice(1)}
              </div>
              {renderProductos(tipoVista)}
            </div>
            <div className="w-px bg-gray-200" />
            <div className={`flex-1 ${vistaCompacta ? 'space-y-1' : 'space-y-2'}`}>
              <div className="sticky top-0 bg-blue-50 rounded p-2 mb-2 text-center text-[10px] font-medium text-blue-700">
                Vista: {vistaComparacion.charAt(0).toUpperCase() + vistaComparacion.slice(1)}
                <select 
                  value={vistaComparacion} 
                  onChange={(e) => setVistaComparacion(e.target.value as any)}
                  className="ml-2 text-[10px] border rounded px-1"
                >
                  <option value="minimal">Minimal</option>
                  <option value="compacto">Compacto</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
              {renderProductos(vistaComparacion)}
            </div>
          </>
        ) : (
          // Vista normal
          <div className={`${vistaCompacta ? 'space-y-1' : 'space-y-2'}`}>
            {productosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No se encontraron productos</p>
              </div>
            ) : (
              renderProductos(tipoVista)
            )}
          </div>
        )}
      </div>

      {/* Botón flotante */}
      {!esUsuarioSoloLectura && contadores.pendientes > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={handleGuardarInventario}
            disabled={guardandoInventario}
            className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            {guardandoInventario ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span className="text-sm font-medium">Guardar Todo ({contadores.pendientes})</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  // Función para renderizar productos según el tipo de vista
  function renderProductos(vista: 'minimal' | 'compacto' | 'normal' | 'lista') {
    if (vista === 'lista') {
      // Vista lista (tipo tabla)
      return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-[10px] text-gray-600">
              <tr>
                <th className="text-left p-1">Producto</th>
                <th className="text-center p-1">C1</th>
                <th className="text-center p-1">C2</th>
                <th className="text-center p-1">C3</th>
                <th className="text-center p-1">Pedir</th>
                <th className="text-center p-1">Estado</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((producto) => {
                const estaGuardado = productosGuardados.has(producto.id);
                return (
                  <tr key={producto.id} className="border-t border-gray-100 hover:bg-gray-50 text-[10px]">
                    <td className="p-1">
                      <div className="truncate max-w-[120px]">
                        {producto.fields['Nombre Producto']}
                      </div>
                    </td>
                    <td className="text-center p-1">{producto.conteos[0]}</td>
                    <td className="text-center p-1">{producto.conteos[1]}</td>
                    <td className="text-center p-1">{producto.conteos[2]}</td>
                    <td className="text-center p-1">{producto.cantidadPedir}</td>
                    <td className="text-center p-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        estaGuardado ? 'bg-green-500' : 'bg-orange-500'
                      }`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    return productosFiltrados.map((producto) => {
      const estaGuardado = productosGuardados.has(producto.id);
      const guardando = guardandoProductos.has(producto.id);
      const conteoInicial = {
        c1: producto.conteos[0] || 0,
        c2: producto.conteos[1] || 0,
        c3: producto.conteos[2] || 0,
        cantidadPedir: producto.cantidadPedir || 0,
        touched: true
      };

      switch(vista) {
        case 'minimal':
          return (
            <ProductoConteoMinimal
              key={producto.id}
              producto={producto}
              unidad={obtenerUnidad(producto)}
              unidadBodega={obtenerUnidadBodega(producto)}
              onConteoChange={handleConteoChange}
              onGuardarProducto={esUsuarioSoloLectura ? undefined : guardarProducto}
              guardando={guardando}
              isGuardado={estaGuardado}
              conteoInicial={conteoInicial}
            />
          );
        case 'compacto':
          return (
            <ProductoConteoCompacto
              key={producto.id}
              producto={producto}
              unidad={obtenerUnidad(producto)}
              unidadBodega={obtenerUnidadBodega(producto)}
              onConteoChange={handleConteoChange}
              onGuardarProducto={esUsuarioSoloLectura ? undefined : guardarProducto}
              guardando={guardando}
              isGuardado={estaGuardado}
              conteoInicial={conteoInicial}
            />
          );
        case 'normal':
          return (
            <ProductoConteo
              key={producto.id}
              producto={producto}
              unidad={obtenerUnidad(producto)}
              unidadBodega={obtenerUnidadBodega(producto)}
              onConteoChange={handleConteoChange}
              onGuardarProducto={esUsuarioSoloLectura ? undefined : guardarProducto}
              guardando={guardando}
              isGuardado={estaGuardado}
              conteoInicial={conteoInicial}
            />
          );
        default:
          return null;
      }
    });
  }
};