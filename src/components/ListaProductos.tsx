import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, AlertCircle, Package2, X } from 'lucide-react';
import type { Producto } from '../types/index';
import { ProductoConteo } from './ProductoConteo';
import { Toast } from './Toast';
import { airtableService } from '../services/airtable';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface ListaProductosProps {
  bodegaId: number;
  bodegaNombre: string;
}

export const ListaProductos = ({ 
  bodegaId, 
  bodegaNombre 
}: ListaProductosProps) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [conteos, setConteos] = useState<{[key: string]: any}>({});
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error' | 'info' | 'offline'} | null>(null);
  const [guardandoProductos, setGuardandoProductos] = useState<Set<string>>(new Set());
  const isOnline = useOnlineStatus();

  // Cargar datos guardados localmente al iniciar
  useEffect(() => {
    const datosGuardados = localStorage.getItem(`conteos_${bodegaId}`);
    if (datosGuardados) {
      setConteos(JSON.parse(datosGuardados));
      setToast({ message: 'Datos locales cargados', type: 'info' });
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

  const productosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return productos;
    
    const busquedaLower = busqueda.toLowerCase();
    return productos.filter(producto => {
      const nombre = producto.fields['Nombre Producto']?.toLowerCase() || '';
      const categoria = producto.fields['Categoría']?.toLowerCase() || '';
      return nombre.includes(busquedaLower) || categoria.includes(busquedaLower);
    });
  }, [productos, busqueda]);

  const handleConteoChange = (productoId: string, conteo: any) => {
    setConteos(prev => {
      const nuevosConteos = {
        ...prev,
        [productoId]: conteo
      };
      // Guardar localmente
      localStorage.setItem(`conteos_${bodegaId}`, JSON.stringify(nuevosConteos));
      return nuevosConteos;
    });
  };

  const handleGuardarProducto = async (productoId: string) => {
    if (!conteos[productoId]) return;
    
    setGuardandoProductos(prev => new Set(prev).add(productoId));
    
    try {
      if (isOnline) {
        // Simular guardado en servidor
        await new Promise(resolve => setTimeout(resolve, 1000));
        setToast({ message: 'Producto guardado exitosamente', type: 'success' });
      } else {
        setToast({ message: 'Guardado localmente (sin conexión)', type: 'offline' });
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
  };

  const handleGuardar = async () => {
    // Verificar si hay productos con conteo en 0
    const productosEnCero = Object.entries(conteos).filter(([_, conteo]) => {
      const total = (conteo.c1 || 0) + (conteo.c2 || 0) + (conteo.c3 || 0);
      return total === 0;
    });

    if (productosEnCero.length > 0) {
      const confirmacion = window.confirm(
        `Hay ${productosEnCero.length} producto(s) con conteo en 0. ¿Estás seguro de guardar?`
      );
      if (!confirmacion) return;
    }

    // Verificar campos vacíos
    const camposVacios = productos.some(producto => !conteos[producto.id]);
    if (camposVacios) {
      setToast({ message: 'Por favor, completa todos los conteos', type: 'error' });
      return;
    }

    try {
      if (isOnline) {
        // Simular guardado en servidor
        await new Promise(resolve => setTimeout(resolve, 1500));
        setToast({ message: '✅ Inventario guardado exitosamente', type: 'success' });
        // Limpiar datos locales después de sincronizar
        localStorage.removeItem(`conteos_${bodegaId}`);
      } else {
        setToast({ message: '📱 Guardado offline - Se sincronizará cuando haya conexión', type: 'offline' });
      }
    } catch (error) {
      setToast({ message: 'Error al guardar el inventario', type: 'error' });
    }
  };

  const obtenerUnidad = (producto: Producto): string => {
    // Siempre usar la unidad de Bodega Principal para cantidad a pedir
    return producto.fields['Unidad Conteo Bodega Principal'] as string || 'unidades';
  };

  const obtenerUnidadBodega = (producto: Producto): string => {
    const campoUnidad = airtableService.obtenerCampoUnidad(bodegaId);
    return producto.fields[campoUnidad as keyof typeof producto.fields] as string || 'unidades';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-foodix-rojo animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={cargarProductos}
            className="mt-4 px-4 py-2 bg-foodix-rojo text-white rounded-md hover:bg-foodix-rojo-claro transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Indicador de conexión */}
      <div className={`fixed top-20 left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
        isOnline ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
      }`}>
        <span className="w-4 h-4">●</span>
        {isOnline ? 'En línea' : 'Sin conexión'}
      </div>

      {/* Header con título y búsqueda */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Package2 className="w-8 h-8 text-foodix-azul" />
          {bodegaNombre}
        </h2>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o categoría..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-foodix-azul/20 focus:border-foodix-azul transition-all shadow-sm text-gray-700 placeholder-gray-400"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Contador de productos */}
      <div className="mb-6 flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Package2 className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Productos en esta bodega</p>
            <p className="text-lg font-semibold text-gray-900">
              {productosFiltrados.length} de {productos.length} productos
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Progreso</p>
          <p className="text-lg font-semibold text-foodix-azul">
            {Object.keys(conteos).length} / {productos.length}
          </p>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="space-y-2">
        {productosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <Package2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron productos</p>
          </div>
        ) : (
          productosFiltrados.map(producto => (
            <div key={producto.id} className="relative">
              <ProductoConteo
                key={producto.id}
                producto={producto}
                unidad={obtenerUnidad(producto)}
                unidadBodega={obtenerUnidadBodega(producto)}
                onConteoChange={handleConteoChange}
              />
              {conteos[producto.id] && (
                <button
                  onClick={() => {
                    if (window.confirm('¿Confirmar guardado de este producto?')) {
                      handleGuardarProducto(producto.id);
                    }
                  }}
                  disabled={guardandoProductos.has(producto.id)}
                  className={`absolute top-4 right-4 px-4 py-2 rounded-lg transition-all font-medium text-sm ${
                    guardandoProductos.has(producto.id)
                      ? 'bg-gray-200 text-gray-400'
                      : 'bg-foodix-rojo text-white hover:bg-red-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                  title="Guardar este producto"
                >
                  {guardandoProductos.has(producto.id) ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </span>
                  ) : (
                    'Guardar'
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Botón de guardar flotante */}
      {productos.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => {
              const productosContados = Object.keys(conteos).length;
              const totalProductos = productos.length;
              if (window.confirm(`¿Confirmar guardado del inventario?\n\nProductos contados: ${productosContados}/${totalProductos}`)) {
                handleGuardar();
              }
            }}
            className="bg-foodix-azul text-white py-3 px-6 rounded-xl font-medium shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Guardar Inventario
          </button>
          {Object.keys(conteos).length > 0 && (
            <div className="absolute -top-2 -right-2 bg-foodix-rojo text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {Object.keys(conteos).length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};