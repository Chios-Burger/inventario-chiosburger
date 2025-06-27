import { useState, useEffect, useMemo } from 'react';
import { Calendar, User, Package, Download, FileText, Trash2, Search, ChevronDown, ChevronUp, BarChart, Shield, AlertTriangle, FileSpreadsheet, Database, HardDrive } from 'lucide-react';
import { historicoService } from '../services/historico';
import { exportUtils } from '../utils/exportUtils';
import { authService } from '../services/auth';
import { BODEGAS } from '../config';
import type { RegistroHistorico, RegistroDiario } from '../types/index';

export const Historico = () => {
  const [registrosPorDia, setRegistrosPorDia] = useState<RegistroDiario[]>([]);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroBodega, setFiltroBodega] = useState('todos');
  const [filtroUsuario, setFiltroUsuario] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [expandedRegistros, setExpandedRegistros] = useState<Set<string>>(new Set());
  const [mostrarSoloConCero, setMostrarSoloConCero] = useState(false);
  const [ordenarPor, setOrdenarPor] = useState<'fecha' | 'bodega' | 'usuario'>('fecha');
  const [cargando, setCargando] = useState(true);
  
  const usuario = authService.getUsuarioActual();
  const esAdmin = authService.esAdmin();

  // Obtener fecha de hoy en formato local
  const fechaHoy = new Date().toLocaleDateString('es-EC');

  useEffect(() => {
    cargarHistoricos();
  }, []);

  const cargarHistoricos = async () => {
    try {
      setCargando(true);
      const registros = await historicoService.obtenerHistoricosPorDia();
      setRegistrosPorDia(registros);
    } catch (error) {
      console.error('Error al cargar históricos:', error);
      setRegistrosPorDia([]);
    } finally {
      setCargando(false);
    }
  };

  // Verificar si un registro es del día actual
  const esRegistroDeHoy = (fechaRegistro: string): boolean => {
    return fechaRegistro === fechaHoy;
  };

  const handleEliminar = async (registro: RegistroHistorico) => {
    // Solo permitir eliminar registros del día actual
    if (!esRegistroDeHoy(registro.fecha)) {
      alert('Solo puedes eliminar registros del día actual');
      return;
    }

    if (window.confirm(`¿Estás seguro de eliminar este registro de ${registro.bodega} - ${registro.hora}?`)) {
      historicoService.eliminarHistorico(registro.id);
      await cargarHistoricos();
    }
  };

  const handleExportarCSV = (registro: RegistroHistorico) => {
    exportUtils.exportarCSV(registro);
  };

  const handleExportarPDF = (registro: RegistroHistorico) => {
    exportUtils.exportarPDF(registro);
  };


  const handleExportarTodos = () => {
    const todosLosRegistros = registrosPorDia.flatMap(dia => dia.inventarios);
    exportUtils.exportarTodosCSV(todosLosRegistros);
  };

  const toggleExpandRegistro = (id: string) => {
    const newExpanded = new Set(expandedRegistros);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRegistros(newExpanded);
  };

  // Obtener lista única de usuarios (filtrada según permisos)
  const usuariosUnicos = Array.from(
    new Set(
      registrosPorDia.flatMap(dia => 
        dia.inventarios
          .filter(inv => {
            // Si es admin, ver todos los usuarios
            if (esAdmin) return true;
            // Si no es admin, solo ver usuarios de sus bodegas
            const bodegasPermitidas = usuario?.bodegasPermitidas || [];
            return bodegasPermitidas.includes(inv.bodegaId);
          })
          .map(inv => inv.usuario)
      )
    )
  );

  // Filtrar y ordenar registros
  const registrosFiltrados = (() => {
    let todosRegistros = registrosPorDia.flatMap(dia => 
      dia.inventarios.map(inv => ({ ...inv, fechaDisplay: dia.fecha }))
    );

    // Aplicar filtros
    todosRegistros = todosRegistros.filter(inv => {
      // Filtro por bodega
      if (filtroBodega !== 'todos' && inv.bodegaId.toString() !== filtroBodega) {
        return false;
      }

      // Filtro por usuario
      if (filtroUsuario !== 'todos' && inv.usuario !== filtroUsuario) {
        return false;
      }

      // Filtro por fecha
      if (filtroFecha) {
        const fechaFormateada = new Date(filtroFecha).toLocaleDateString('es-EC');
        if (inv.fecha !== fechaFormateada) {
          return false;
        }
      }

      // Filtro por búsqueda
      if (busqueda) {
        const busquedaLower = busqueda.toLowerCase();
        const coincideProducto = inv.productos.some(p => 
          p.nombre.toLowerCase().includes(busquedaLower) ||
          (p.categoria && p.categoria.toLowerCase().includes(busquedaLower))
        );
        const coincideBodega = inv.bodega.toLowerCase().includes(busquedaLower);
        const coincideUsuario = inv.usuario.toLowerCase().includes(busquedaLower);
        
        if (!coincideProducto && !coincideBodega && !coincideUsuario) {
          return false;
        }
      }

      // Filtro por productos con cero
      if (mostrarSoloConCero) {
        const tieneProductosEnCero = inv.productos.some(p => p.total === 0);
        if (!tieneProductosEnCero) {
          return false;
        }
      }

      // Si no es admin, solo ver registros de sus bodegas permitidas
      if (!esAdmin && usuario) {
        const bodegasPermitidas = usuario.bodegasPermitidas || [];
        if (!bodegasPermitidas.includes(inv.bodegaId)) {
          return false;
        }
      }

      return true;
    });

    // Ordenar
    todosRegistros.sort((a, b) => {
      switch (ordenarPor) {
        case 'bodega':
          return a.bodega.localeCompare(b.bodega);
        case 'usuario':
          return a.usuario.localeCompare(b.usuario);
        case 'fecha':
        default:
          // Ordenar por fecha y hora descendente
          const fechaA = new Date(`${a.fecha} ${a.hora}`);
          const fechaB = new Date(`${b.fecha} ${b.hora}`);
          return fechaB.getTime() - fechaA.getTime();
      }
    });

    return todosRegistros;
  })();

  // Calcular estadísticas con memoización
  const estadisticas = useMemo(() => ({
    totalRegistros: registrosFiltrados.length,
    totalProductos: registrosFiltrados.reduce((acc, inv) => acc + inv.productosGuardados, 0),
    registrosHoy: registrosFiltrados.filter(inv => esRegistroDeHoy(inv.fecha)).length,
    productosConCero: registrosFiltrados.reduce((acc, inv) => 
      acc + inv.productos.filter(p => p.total === 0).length, 0
    )
  }), [registrosFiltrados, fechaHoy]);

  // Formatear número con decimales
  const formatearNumero = (num: number): string => {
    // Si el número tiene decimales, mostrar hasta 4 decimales significativos
    if (num % 1 !== 0) {
      const decimales = num.toString().split('.')[1]?.length || 0;
      return num.toFixed(Math.min(decimales, 4));
    }
    return num.toString();
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-8 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-400 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg">
              <BarChart className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-bold text-gray-800">Historial de Inventarios</h2>
              <p className="text-gray-500 text-sm sm:text-base mt-0.5 sm:mt-1">Consulta y exporta registros anteriores</p>
            </div>
          </div>
          
          {/* Estadísticas */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 lg:mt-0">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-500">Total Sesiones</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">{estadisticas.totalRegistros}</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-500">Total Productos</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">{estadisticas.totalProductos}</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-500">Sesiones Hoy</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{estadisticas.registrosHoy}</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-500">Productos en 0</p>
              <p className="text-lg sm:text-2xl font-bold text-orange-600">{estadisticas.productosConCero}</p>
            </div>
          </div>
        </div>
        
        {/* Leyenda de indicadores */}
        <div className="flex flex-wrap items-center gap-3 mt-4 px-4 sm:px-8 text-xs">
          <span className="text-gray-500">Origen de datos:</span>
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full">
            <Database className="w-3 h-3 text-blue-600" />
            <span className="text-blue-700 font-medium">Base de datos</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-full">
            <HardDrive className="w-3 h-3 text-gray-600" />
            <span className="text-gray-700 font-medium">Almacenamiento local</span>
          </div>
        </div>
      </div>

      {/* Filtros Avanzados */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Filtros Avanzados</h3>
        
        {/* Primera fila de filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
            />
          </div>

          {/* Filtro bodega - Solo para admin */}
          {esAdmin ? (
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filtroBodega}
                onChange={(e) => setFiltroBodega(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 appearance-none"
              >
                <option value="todos">Todas las bodegas</option>
                {BODEGAS.map(bodega => (
                  <option key={bodega.id} value={bodega.id}>
                    {bodega.nombre}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <div className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-600">
                {usuario?.bodegasPermitidas?.length === 1 
                  ? BODEGAS.find(b => b.id === usuario.bodegasPermitidas[0])?.nombre 
                  : 'Mi bodega'}
              </div>
            </div>
          )}

          {/* Filtro usuario */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 appearance-none"
            >
              <option value="todos">Todos los usuarios</option>
              {usuariosUnicos.map(usr => (
                <option key={usr} value={usr}>
                  {usr}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro fecha */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
            />
          </div>
        </div>

        {/* Segunda fila - Opciones adicionales */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            {/* Checkbox productos en cero */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mostrarSoloConCero}
                onChange={(e) => setMostrarSoloConCero(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-400"
              />
              <span className="text-sm text-gray-700">Solo productos en cero</span>
            </label>

            {/* Ordenar por */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Ordenar por:</span>
              <select
                value={ordenarPor}
                onChange={(e) => setOrdenarPor(e.target.value as any)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              >
                <option value="fecha">Fecha</option>
                <option value="bodega">Bodega</option>
                <option value="usuario">Usuario</option>
              </select>
            </div>
          </div>

          {/* Botones de exportación */}
          {estadisticas.totalRegistros > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleExportarTodos}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Exportar Todo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de registros - responsiva */}
      {cargando ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-10 sm:p-20 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-pulse">
            <BarChart className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium text-sm sm:text-base">Cargando históricos desde la base de datos...</p>
        </div>
      ) : registrosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-10 sm:p-20 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium text-sm sm:text-base">No se encontraron registros</p>
        </div>
      ) : (
        <>
          {/* Vista móvil - Cards */}
          <div className="block sm:hidden space-y-3">
            {registrosFiltrados.map((registro) => (
              <div key={registro.id} className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{registro.bodega}</p>
                    <p className="text-xs text-gray-500">{registro.fecha} - {registro.hora}</p>
                    <p className="text-xs text-gray-600 mt-1">Por: {registro.usuario}</p>
                    <div className="mt-2">
                      {registro.origen === 'database' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                          <Database className="w-3 h-3" />
                          Base de datos
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full font-medium">
                          <HardDrive className="w-3 h-3" />
                          Local
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600">{registro.productos.length}</p>
                    <p className="text-xs text-gray-500">productos</p>
                  </div>
                </div>
                
                {/* Botones de acción */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => toggleExpandRegistro(registro.id)}
                    className="flex-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium"
                  >
                    {expandedRegistros.has(registro.id) ? 'Ocultar' : 'Ver detalles'}
                  </button>
                  <button
                    onClick={() => handleExportarCSV(registro)}
                    className="px-3 py-2 bg-green-50 text-green-600 rounded-lg"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {esRegistroDeHoy(registro.fecha) && (
                    <button
                      onClick={() => handleEliminar(registro)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Detalles expandidos */}
                {expandedRegistros.has(registro.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {registro.productos.map((producto, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-700">{producto.nombre}</p>
                            {producto.categoria && (
                              <p className="text-xs text-gray-500">{producto.categoria}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${
                              producto.total === 0 ? 'text-red-600' : 'text-gray-800'
                            }`}>
                              {formatearNumero(producto.total)} {producto.unidad}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Vista desktop - Tabla */}
          <div className="hidden sm:block bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Bodega
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Productos
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {registrosFiltrados.map(registro => {
                  const esDeHoy = esRegistroDeHoy(registro.fecha);
                  const productosEnCero = registro.productos.filter(p => p.total === 0).length;
                  
                  return (
                    <tr key={registro.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {esDeHoy && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                              HOY
                            </span>
                          )}
                          {registro.origen === 'database' ? (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              BD
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full font-medium flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              Local
                            </span>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{registro.fecha}</p>
                            <p className="text-xs text-gray-500">{registro.hora}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{registro.bodega}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{registro.usuario}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {registro.productosGuardados} de {registro.totalProductos}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({Math.round((registro.productosGuardados / registro.totalProductos) * 100)}%)
                          </span>
                          {productosEnCero > 0 && (
                            <span className="mt-1 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                              {productosEnCero} en cero
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-900">{registro.duracion}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => toggleExpandRegistro(registro.id)}
                            className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                            title="Ver detalles"
                          >
                            {expandedRegistros.has(registro.id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleExportarCSV(registro)}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            title="Exportar CSV"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleExportarPDF(registro)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Exportar PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {esAdmin && (
                            <button
                              onClick={() => handleEliminar(registro)}
                              disabled={!esDeHoy}
                              className={`p-2 rounded-lg transition-colors ${
                                esDeHoy 
                                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                              title={esDeHoy ? 'Eliminar' : 'Solo se pueden eliminar registros del día actual'}
                            >
                              {esDeHoy ? (
                                <Trash2 className="w-4 h-4" />
                              ) : (
                                <Shield className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Detalles expandidos */}
          {registrosFiltrados.map(registro => expandedRegistros.has(registro.id) && (
            <div key={`detail-${registro.id}`} className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Detalle de Productos</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-600 font-medium border-b border-gray-200">
                      <th className="pb-2 pr-4">Producto</th>
                      <th className="pb-2 pr-4">Categoría</th>
                      <th className="pb-2 pr-4 text-right">Conteo 1</th>
                      <th className="pb-2 pr-4 text-right">Conteo 2</th>
                      <th className="pb-2 pr-4 text-right">Conteo 3</th>
                      <th className="pb-2 pr-4 text-right">Total</th>
                      <th className="pb-2 pr-4 text-right">Cantidad Pedir</th>
                      <th className="pb-2 text-left">Unidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {registro.productos.map(producto => (
                      <tr key={producto.id} className={producto.total === 0 ? 'bg-red-50' : ''}>
                        <td className="py-2 pr-4">{producto.nombre}</td>
                        <td className="py-2 pr-4 text-gray-600">{producto.categoria || '-'}</td>
                        <td className="py-2 pr-4 text-right font-mono">{formatearNumero(producto.c1)}</td>
                        <td className="py-2 pr-4 text-right font-mono">{formatearNumero(producto.c2)}</td>
                        <td className="py-2 pr-4 text-right font-mono">{formatearNumero(producto.c3)}</td>
                        <td className="py-2 pr-4 text-right font-mono font-bold">
                          {formatearNumero(producto.total)}
                        </td>
                        <td className="py-2 pr-4 text-right font-mono">{formatearNumero(producto.cantidadPedir)}</td>
                        <td className="py-2 text-gray-600">{producto.unidadBodega}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={5} className="py-2 pr-4 text-right font-medium">Total General:</td>
                      <td className="py-2 pr-4 text-right font-mono font-bold text-lg">
                        {formatearNumero(registro.productos.reduce((acc, p) => acc + p.total, 0))}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {/* Mensaje de seguridad */}
      {esAdmin && registrosFiltrados.some(r => !esRegistroDeHoy(r.fecha)) && (
        <div className="mt-4 sm:mt-6 bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs sm:text-sm text-amber-800 font-medium">Protección de datos históricos</p>
            <p className="text-xs text-amber-700 mt-0.5 sm:mt-1">
              Solo puedes eliminar registros del día actual. Los registros históricos están protegidos para mantener la integridad de los datos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};