import { useState, useEffect } from 'react';
import { Package, Calendar, Search, Download, CheckCircle, Clock, Filter, FileText } from 'lucide-react';
import { authService } from '../services/auth';
import { historicoService } from '../services/historico';
import { exportUtils } from '../utils/exportUtils';
import { BODEGAS } from '../config';
import type { RegistroHistorico } from '../types/index';
import { fechaAISO, obtenerFechaActual } from '../utils/dateUtils';

interface PedidoConsolidado {
  productoId: string;
  codigo: string;
  nombre: string;
  categoria: string;
  tipo: string;
  unidad: string;
  pedidosPorBodega: { [bodegaId: number]: number };
  totalPedido: number;
  estado?: 'pendiente' | 'preparado' | 'entregado';
}

export const PedidosDelDia = () => {
  const [pedidosConsolidados, setPedidosConsolidados] = useState<PedidoConsolidado[]>([]);
  const [fecha, setFecha] = useState(fechaAISO(obtenerFechaActual()));
  const [filtroBodega, setFiltroBodega] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [vistaConsolidada, setVistaConsolidada] = useState(true);
  const [productosSeleccionados, setProductosSeleccionados] = useState<Set<string>>(new Set());

  const usuario = authService.getUsuarioActual();
  const puedeEditar = usuario?.email === 'bodegaprincipal@chiosburger.com';

  // Filtrar solo las bodegas que son locales (excluyendo bodegas de almacenamiento)
  const bodegasLocales = BODEGAS.filter(b =>
    ['Chios Real Audiencia', 'Chios Floreana', 'Chios Portugal', 'Santo Cachón', 'Simón Bolón', 'Bodega Santo Chios'].includes(b.nombre)
  );

  useEffect(() => {
    cargarPedidos();
  }, [fecha]);

  const cargarPedidos = async () => {
    try {
      setCargando(true);
      
      // Para usuarios especiales, obtener TODOS los históricos sin filtrar por permisos
      const usuariosEspeciales = ['bodegaprincipal@chiosburger.com', 'gerencia@chiosburger.com', 'analiasis@chiosburger.com'];
      let registros: RegistroHistorico[] = [];
      
      console.log('🔍 DEPURACIÓN - Cargando pedidos del día');
      console.log('Usuario actual:', usuario?.email);
      console.log('Es usuario especial:', usuario && usuariosEspeciales.includes(usuario.email));
      console.log('Fecha solicitada:', fecha);
      
      if (usuario && usuariosEspeciales.includes(usuario.email)) {
        // Obtener todos los registros de la fecha, sin importar permisos
        console.log('📥 Obteniendo registros SIN FILTRO para usuario especial');
        const todosLosRegistros = await historicoService.obtenerHistoricosPorFechaSinFiltro(fecha);
        registros = todosLosRegistros;
        console.log('Total registros obtenidos (todas las bodegas):', registros.length);
      } else {
        // Para otros usuarios, usar el método normal que filtra por permisos
        console.log('📥 Obteniendo registros CON FILTRO de permisos');
        registros = await historicoService.obtenerHistoricosPorFecha(fecha);
      }
      
      // Filtrar solo registros de locales
      const registrosLocales = registros.filter(r => 
        bodegasLocales.some(b => b.id === r.bodegaId)
      );
      
      console.log('📍 Registros de locales encontrados:', registrosLocales.length);
      registrosLocales.forEach(registro => {
        const bodega = bodegasLocales.find(b => b.id === registro.bodegaId);
        console.log(`  - ${bodega?.nombre}: ${registro.productos.length} productos`);
        
        // Mostrar productos con cantidadPedir > 0
        const productosConPedido = registro.productos.filter(p => p.cantidadPedir > 0);
        if (productosConPedido.length > 0) {
          console.log(`    ✅ Productos con pedido: ${productosConPedido.length}`);
          productosConPedido.slice(0, 3).forEach(p => {
            console.log(`      • ${p.nombre}: ${p.cantidadPedir}`);
          });
        } else {
          console.log(`    ⚠️ Sin productos con cantidadPedir > 0`);
        }
      });
      
      // Consolidar pedidos
      const consolidado = consolidarPedidos(registrosLocales);
      console.log('📊 Total productos consolidados con pedidos:', consolidado.length);
      setPedidosConsolidados(consolidado);
    } catch (error) {
      console.error('❌ Error al cargar pedidos:', error);
    } finally {
      setCargando(false);
    }
  };

  const consolidarPedidos = (registros: RegistroHistorico[]): PedidoConsolidado[] => {
    const pedidosMap = new Map<string, PedidoConsolidado>();
    
    console.log('🔄 CONSOLIDANDO PEDIDOS');
    console.log('Total registros a procesar:', registros.length);
    
    let totalProductosAnalizados = 0;
    let totalProductosConPedido = 0;

    registros.forEach(registro => {
      const bodega = bodegasLocales.find(b => b.id === registro.bodegaId);
      console.log(`\n🏭 Procesando bodega: ${bodega?.nombre || 'ID ' + registro.bodegaId}`);
      
      registro.productos.forEach(producto => {
        totalProductosAnalizados++;
        
        if (producto.cantidadPedir > 0) {
          totalProductosConPedido++;
          console.log(`  ✅ ${producto.nombre}: cantidadPedir = ${producto.cantidadPedir}`);
          
          // Usar código como clave principal, o nombre si no hay código
          const key = producto.codigo || producto.nombre;
          
          if (!pedidosMap.has(key)) {
            pedidosMap.set(key, {
              productoId: producto.id,
              codigo: producto.codigo || '',
              nombre: producto.nombre,
              categoria: producto.categoria || '',
              tipo: producto.tipo || '',
              unidad: (producto.unidadBodega === 'UNIDAD NO DEFINIDA' || !producto.unidadBodega) 
                ? 'Unidad' 
                : producto.unidadBodega,
              pedidosPorBodega: {},
              totalPedido: 0,
              estado: 'pendiente'
            });
          }
          
          const pedido = pedidosMap.get(key)!;
          // Sumar si ya existe un pedido de esta bodega
          pedido.pedidosPorBodega[registro.bodegaId] = 
            (pedido.pedidosPorBodega[registro.bodegaId] || 0) + producto.cantidadPedir;
          pedido.totalPedido += producto.cantidadPedir;
        } else if (producto.cantidadPedir === 0) {
          // No mostrar todos los productos en 0, solo contar
        } else {
          console.log(`  ⚠️ ${producto.nombre}: cantidadPedir = ${producto.cantidadPedir} (valor inválido)`);
        }
      });
    });
    
    console.log('\n📋 RESUMEN:');
    console.log('Total productos analizados:', totalProductosAnalizados);
    console.log('Productos con pedido (cantidadPedir > 0):', totalProductosConPedido);
    console.log('Productos consolidados únicos:', pedidosMap.size);

    return Array.from(pedidosMap.values()).sort((a, b) => 
      a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre)
    );
  };

  const pedidosFiltrados = pedidosConsolidados.filter(pedido => {
    const cumpleBusqueda = busqueda === '' || 
      pedido.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      pedido.codigo.toLowerCase().includes(busqueda.toLowerCase());
    
    const cumpleCategoria = filtroCategoria === 'todos' || pedido.categoria === filtroCategoria;
    
    const cumpleBodega = filtroBodega === 'todos' || 
      pedido.pedidosPorBodega[parseInt(filtroBodega)] > 0;
    
    return cumpleBusqueda && cumpleCategoria && cumpleBodega;
  });

  const categorias = [...new Set(pedidosConsolidados.map(p => p.categoria))].filter(Boolean).sort();

  const marcarComoPreparado = (productoIds: string[]) => {
    setPedidosConsolidados(prev => 
      prev.map(p => 
        productoIds.includes(p.productoId) 
          ? { ...p, estado: 'preparado' as const }
          : p
      )
    );
    setProductosSeleccionados(new Set());
  };

  const toggleSeleccion = (productoId: string) => {
    const nuevaSeleccion = new Set(productosSeleccionados);
    if (nuevaSeleccion.has(productoId)) {
      nuevaSeleccion.delete(productoId);
    } else {
      nuevaSeleccion.add(productoId);
    }
    setProductosSeleccionados(nuevaSeleccion);
  };

  const seleccionarTodos = () => {
    if (productosSeleccionados.size === pedidosFiltrados.length) {
      setProductosSeleccionados(new Set());
    } else {
      setProductosSeleccionados(new Set(pedidosFiltrados.map(p => p.productoId)));
    }
  };

  const exportarPedidos = () => {
    const datosExport = pedidosFiltrados.map(pedido => {
      const fila: any = {
        'Código': pedido.codigo,
        'Producto': pedido.nombre,
        'Categoría': pedido.categoria,
        'Tipo': pedido.tipo,
        'Unidad': pedido.unidad,
        'Total Pedido': pedido.totalPedido,
        'Estado': pedido.estado === 'preparado' ? 'Preparado' : 'Pendiente'
      };
      
      if (filtroBodega === 'todos') {
        bodegasLocales.forEach(bodega => {
          fila[bodega.nombre] = pedido.pedidosPorBodega[bodega.id] || 0;
        });
      } else {
        const bodegaSeleccionada = bodegasLocales.find(b => b.id === parseInt(filtroBodega));
        if (bodegaSeleccionada) {
          fila[bodegaSeleccionada.nombre] = pedido.pedidosPorBodega[parseInt(filtroBodega)] || 0;
        }
      }
      
      return fila;
    });

    exportUtils.exportarPedidosExcel(datosExport, fecha);
  };

  const exportarPDF = () => {
    const bodegaFiltrada = filtroBodega === 'todos' ? null : bodegasLocales.find(b => b.id === parseInt(filtroBodega));
    exportUtils.exportarPedidosPDF(pedidosFiltrados, fecha, bodegasLocales, bodegaFiltrada);
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-8 h-8 text-purple-600" />
              Pedidos del Día
            </h2>
            <p className="text-gray-600 mt-1">
              Consolidado de productos solicitados por los locales
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setVistaConsolidada(!vistaConsolidada)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Vista: {vistaConsolidada ? 'Consolidada' : 'Por Local'}
            </button>
            <button
              onClick={exportarPDF}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Exportar PDF
            </button>
            <button
              onClick={exportarPedidos}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="w-4 h-4 inline mr-1" />
              Local
            </label>
            <select
              value={filtroBodega}
              onChange={(e) => setFiltroBodega(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="todos">Todos los locales</option>
              {bodegasLocales.map(bodega => (
                <option key={bodega.id} value={bodega.id}>{bodega.nombre}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="w-4 h-4 inline mr-1" />
              Categoría
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="todos">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="w-4 h-4 inline mr-1" />
              Buscar
            </label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Resumen */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-sm text-purple-600">Total Productos</p>
            <p className="text-2xl font-bold text-purple-700">{pedidosFiltrados.length}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-600">Pendientes</p>
            <p className="text-2xl font-bold text-blue-700">
              {pedidosFiltrados.filter(p => p.estado !== 'preparado').length}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-green-600">Preparados</p>
            <p className="text-2xl font-bold text-green-700">
              {pedidosFiltrados.filter(p => p.estado === 'preparado').length}
            </p>
          </div>
        </div>
      </div>

      {/* Acciones masivas */}
      {puedeEditar && productosSeleccionados.size > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
          <span className="text-blue-700">
            {productosSeleccionados.size} producto(s) seleccionado(s)
          </span>
          <button
            onClick={() => marcarComoPreparado(Array.from(productosSeleccionados))}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Marcar como preparado
          </button>
        </div>
      )}

      {/* Tabla de pedidos */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {pedidosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay pedidos para los filtros seleccionados</p>
          </div>
        ) : vistaConsolidada ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {puedeEditar && (
                    <th className="p-4">
                      <input
                        type="checkbox"
                        checked={productosSeleccionados.size === pedidosFiltrados.length && pedidosFiltrados.length > 0}
                        onChange={seleccionarTodos}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </th>
                  )}
                  <th className="text-left p-4 font-medium text-gray-700">Código</th>
                  <th className="text-left p-4 font-medium text-gray-700">Producto</th>
                  <th className="text-left p-4 font-medium text-gray-700">Categoría</th>
                  <th className="text-left p-4 font-medium text-gray-700">Tipo</th>
                  {filtroBodega === 'todos' ? (
                    bodegasLocales.map(bodega => (
                      <th key={bodega.id} className="text-center p-4 font-medium text-gray-700 min-w-[100px]">
                        {bodega.nombre === 'Bodega Santo Chios'
                          ? 'Bodega Santo Chios'
                          : bodega.nombre.replace('Chios ', '').replace('Santo ', '').replace('Simón ', '')}
                      </th>
                    ))
                  ) : (
                    <th className="text-center p-4 font-medium text-gray-700 min-w-[100px]">
                      Cantidad
                    </th>
                  )}
                  <th className="text-center p-4 font-medium text-gray-700 bg-purple-50">Total</th>
                  <th className="text-center p-4 font-medium text-gray-700">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pedidosFiltrados.map((pedido) => (
                  <tr key={pedido.productoId} className={pedido.estado === 'preparado' ? 'bg-green-50' : ''}>
                    {puedeEditar && (
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={productosSeleccionados.has(pedido.productoId)}
                          onChange={() => toggleSeleccion(pedido.productoId)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                    )}
                    <td className="p-4 text-sm text-gray-600">{pedido.codigo}</td>
                    <td className="p-4 font-medium text-gray-900">{pedido.nombre}</td>
                    <td className="p-4 text-sm text-gray-600">{pedido.categoria}</td>
                    <td className="p-4 text-sm text-gray-600">{pedido.tipo}</td>
                    {filtroBodega === 'todos' ? (
                      bodegasLocales.map(bodega => (
                        <td key={bodega.id} className="p-4 text-center">
                          {pedido.pedidosPorBodega[bodega.id] ? (
                            <span className="font-medium text-blue-600">
                              {pedido.pedidosPorBodega[bodega.id]}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      ))
                    ) : (
                      <td className="p-4 text-center">
                        <span className="font-medium text-blue-600">
                          {pedido.pedidosPorBodega[parseInt(filtroBodega)]}
                        </span>
                      </td>
                    )}
                    <td className="p-4 text-center bg-purple-50">
                      <span className="font-bold text-purple-700">
                        {pedido.totalPedido} {pedido.unidad}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {pedido.estado === 'preparado' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Preparado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          Pendiente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Vista por local
          <div className="p-6 space-y-6">
            {bodegasLocales
              .filter(bodega => filtroBodega === 'todos' || bodega.id === parseInt(filtroBodega))
              .map(bodega => {
                const pedidosBodega = pedidosFiltrados.filter(p => p.pedidosPorBodega[bodega.id] > 0);
                
                if (pedidosBodega.length === 0) return null;
                
                return (
                <div key={bodega.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-3">{bodega.nombre}</h3>
                  <div className="space-y-2">
                    {pedidosBodega.map(pedido => (
                      <div key={pedido.productoId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{pedido.nombre}</p>
                          <p className="text-sm text-gray-500">{pedido.categoria} - {pedido.codigo}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">
                            {pedido.pedidosPorBodega[bodega.id]} {pedido.unidad}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};