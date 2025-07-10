import { useState, useEffect, useMemo } from 'react';
import { Calendar, User, Package, FileText, Trash2, Search, ChevronDown, ChevronUp, BarChart, AlertTriangle, FileSpreadsheet, Database, CloudOff, AlertCircle, Edit, Tag } from 'lucide-react';
import React from 'react';
import { historicoService } from '../services/historico';
import { exportUtils } from '../utils/exportUtils';
import { authService } from '../services/auth';
import { BODEGAS } from '../config';
import type { RegistroHistorico, RegistroDiario, ProductoHistorico } from '../types/index';
import { EditarProductoModal } from './EditarProductoModal';
import { fechaAISO, obtenerFechaActual, normalizarFechaAISO } from '../utils/dateUtils';

export const Historico = () => {
  const [registrosPorDia, setRegistrosPorDia] = useState<RegistroDiario[]>([]);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroBodega, setFiltroBodega] = useState('todos');
  const [filtroUsuario, setFiltroUsuario] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [expandedRegistros, setExpandedRegistros] = useState<Set<string>>(new Set());
  const [mostrarSoloConCero, setMostrarSoloConCero] = useState(false);
  const [ordenarPor, setOrdenarPor] = useState<'fecha' | 'bodega' | 'usuario'>('fecha');
  const [cargando, setCargando] = useState(true);
  const [productoEditando, setProductoEditando] = useState<{producto: ProductoHistorico, registro: RegistroHistorico} | null>(null);
  
  const usuario = authService.getUsuarioActual();
  const esAdmin = authService.esAdmin();
  const esUsuarioAnalisis = usuario?.email === 'analisis@chiosburger.com';

  // Obtener fecha de hoy en formato ISO (YYYY-MM-DD)
  const hoy = obtenerFechaActual();
  const fechaHoy = fechaAISO(hoy);

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
    const fechaRegistroNorm = normalizarFechaAISO(fechaRegistro);
    const fechaHoyNorm = normalizarFechaAISO(fechaHoy);
    
    return fechaRegistroNorm === fechaHoyNorm;
  };


  // Verificar si el usuario puede eliminar un registro
  const puedeEliminar = (registro: RegistroHistorico): boolean => {
    if (!usuario) return false;
    
    const esAnalisis = usuario.email.toLowerCase() === 'analisis@chiosburger.com';
    const esGerencia = usuario.email.toLowerCase() === 'gerencia@chiosburger.com';
    const esHoy = esRegistroDeHoy(registro.fecha);
    
    console.log('🔐 Verificando permisos de eliminación:', {
      usuario: usuario.email,
      esAnalisis,
      esGerencia,
      esHoy,
      fecha: registro.fecha,
      fechaHoy
    });
    
    // Análisis puede eliminar cualquier registro
    if (esAnalisis) return true;
    
    // Gerencia NO puede eliminar nunca
    if (esGerencia) return false;
    
    // Para otros usuarios, verificar restricciones
    if (!esHoy) {
      // No pueden eliminar registros de días anteriores
      return false;
    }
    
    // Para registros del día actual, verificar hora límite (mediodía)
    const ahora = new Date();
    const horaActual = ahora.getHours();
    
    // Solo pueden eliminar hasta las 12:00 PM (mediodía)
    if (horaActual >= 12) {
      return false;
    }
    
    // Verificar que el usuario tenga permiso para la bodega
    const tienPermisoBodega = usuario.bodegasPermitidas.includes(registro.bodegaId);
    
    return tienPermisoBodega;
  };

  const handleEliminar = async (registro: RegistroHistorico) => {
    console.log('🗑️ Intentando eliminar registro:', registro);
    console.log('📌 ID del registro:', registro.id);
    
    if (!puedeEliminar(registro)) {
      alert('No tienes permisos para eliminar este registro');
      return;
    }

    if (window.confirm('¿Estás seguro de eliminar este registro?')) {
      try {
        const esHoy = esRegistroDeHoy(registro.fecha);
        // Para registros de database, necesitamos eliminar de BD
        const eliminarDeBD = registro.origen === 'database' || (esHoy && registro.sincronizado && registro.origen === 'local');
        
        console.log('📅 Es registro de hoy:', esHoy);
        console.log('🔄 Está sincronizado:', registro.sincronizado);
        console.log('📍 Origen:', registro.origen);
        console.log('🗄️ Eliminar de BD:', eliminarDeBD);
        
        await historicoService.eliminarHistorico(registro.id, usuario, eliminarDeBD);
        await cargarHistoricos();
      } catch (error) {
        alert('Error al eliminar el registro: ' + (error as Error).message);
      }
    }
  };

  const handleExportarPDF = (registro: RegistroHistorico) => {
    exportUtils.exportarPDF(registro);
  };

  const handleExportarCSV = (registro: RegistroHistorico) => {
    exportUtils.exportarCSV(registro);
  };

  const handleExportarExcel = (registro: RegistroHistorico) => {
    exportUtils.exportarExcel(registro);
  };

  const handleExportarTodosCSV = () => {
    const todosLosRegistros = registrosPorDia.flatMap(dia => dia.inventarios);
    exportUtils.exportarTodosCSV(todosLosRegistros);
  };

  // Verificar si se puede editar un registro según roles
  const puedeEditar = (registro: RegistroHistorico): boolean => {
    if (!usuario) return false;
    
    const esAnalisis = usuario.email.toLowerCase() === 'analisis@chiosburger.com';
    const esGerencia = usuario.email.toLowerCase() === 'gerencia@chiosburger.com';
    const esHoy = esRegistroDeHoy(registro.fecha);
    
    // Análisis puede editar TODO sin restricciones
    if (esAnalisis) return true;
    
    // Gerencia puede editar sin límite de horario (cualquier día)
    if (esGerencia) return true;
    
    // Para otros usuarios, verificar restricciones
    if (!esHoy) {
      // Solo pueden ver (lectura) registros de días anteriores
      return false;
    }
    
    // Para registros del día actual, verificar hora límite (mediodía)
    const ahora = new Date();
    const horaActual = ahora.getHours();
    
    // Solo pueden editar hasta las 12:00 PM (mediodía)
    if (horaActual >= 12) {
      return false;
    }
    
    // Verificar que el usuario tenga permiso para la bodega
    const tienPermisoBodega = usuario.bodegasPermitidas.includes(registro.bodegaId);
    
    return tienPermisoBodega;
  };

  // Manejar la edición de un producto
  const handleEditarProducto = async (productoId: string, nuevoTotal: number, nuevaCantidadPedir: number, motivo: string) => {
    if (!productoEditando || !usuario) return;
    
    try {
      await historicoService.editarProducto(
        productoEditando.registro.id,
        productoId,
        nuevoTotal,
        nuevaCantidadPedir,
        motivo,
        usuario,
        productoEditando.registro
      );
      
      // Recargar los históricos
      await cargarHistoricos();
      
      // Mostrar mensaje de éxito
      alert('Producto editado correctamente');
    } catch (error) {
      console.error('Error al editar producto:', error);
      throw error;
    }
  };



  const handleExportarTodos = () => {
    const todosLosRegistros = registrosPorDia.flatMap(dia => dia.inventarios);
    exportUtils.exportarTodosPDF(todosLosRegistros);
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
    let todosRegistros = registrosPorDia.flatMap(dia => dia.inventarios);

    // Aplicar filtros
    todosRegistros = todosRegistros.filter(inv => {
      // Filtro por permisos de usuario
      if (!esAdmin && usuario) {
        // Verificar que la bodega esté en las permitidas
        const bodegasPermitidas = usuario.bodegasPermitidas || [];
        if (!bodegasPermitidas.includes(inv.bodegaId)) {
          return false;
        }
      }
      
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
        // Normalizar la fecha del registro a formato ISO para comparación
        const normalizarAISO = (fecha: string): string => {
          // Si ya está en formato ISO
          if (fecha.includes('-') && fecha.split('-')[0].length === 4) {
            return fecha;
          }
          // Si está en formato DD/MM/YYYY
          if (fecha.includes('/')) {
            const [d, m, y] = fecha.split('/');
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }
          return fecha;
        };
        
        const fechaRegistroISO = normalizarAISO(inv.fecha);
        
        if (fechaRegistroISO !== filtroFecha) {
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

      // Filtro por tipo de producto
      if (filtroTipo !== 'todos') {
        const tieneProductosTipo = inv.productos.some(p => {
          // Handle missing tipo field
          if (!p.tipo || p.tipo === '') return false;
          return p.tipo === filtroTipo;
        });
        if (!tieneProductosTipo) {
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

  // Formatear fecha para mostrar solo YYYY-MM-DD
  const formatearFechaSimple = (fecha: string): string => {
    // Si la fecha incluye 'T', es formato ISO, tomar solo la parte de fecha
    if (fecha && fecha.includes('T')) {
      return fecha.split('T')[0];
    }
    // Si ya está en formato YYYY-MM-DD, devolverla tal cual
    if (fecha && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return fecha;
    }
    // Para otros formatos, intentar parsear y formatear
    try {
      const date = new Date(fecha);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {
      // Si falla, devolver la fecha original
    }
    return fecha;
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
          <span className="text-gray-500">Estados:</span>
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full">
            <Database className="w-3 h-3 text-blue-600" />
            <span className="text-blue-700 font-medium">Base de datos</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-full">
            <CloudOff className="w-3 h-3 text-orange-600" />
            <span className="text-orange-700 font-medium">Pendiente</span>
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

          {/* Filtro tipo de producto */}
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 appearance-none"
            >
              <option value="todos">Todos los tipos</option>
              <option value="A">Tipo A</option>
              <option value="B">Tipo B</option>
              <option value="C">Tipo C</option>
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
                <FileText className="w-4 h-4" />
                Exportar Todo PDF
              </button>
              {esUsuarioAnalisis && (
                <>
                  <button
                    onClick={handleExportarTodosCSV}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Exportar Todo CSV
                  </button>
                </>
              )}
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
                    <p className="text-xs text-gray-500">{formatearFechaSimple(registro.fecha)} - {registro.hora}</p>
                    <p className="text-xs text-gray-600 mt-1">Por: {registro.usuario}</p>
                    <div className="mt-2">
                      {(registro.origen === 'database' || registro.sincronizado) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                          <Database className="w-3 h-3" />
                          Base de datos
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium">
                          <CloudOff className="w-3 h-3" />
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
                    onClick={() => handleExportarPDF(registro)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg"
                    title="Descargar PDF"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  {esRegistroDeHoy(registro.fecha) && (
                    <button
                      onClick={() => handleEliminar(registro)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Eliminar registro (solo registros de hoy)"
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
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className={`text-sm font-bold ${
                                producto.total === 0 ? 'text-red-600' : 'text-gray-800'
                              }`}>
                                {formatearNumero(producto.total)} {producto.unidad}
                              </p>
                            </div>
                            {puedeEditar(registro) && (
                              <button
                                onClick={() => setProductoEditando({ producto, registro })}
                                className="p-1 hover:bg-blue-100 rounded transition-colors"
                                title="Editar total"
                              >
                                <Edit className="w-3 h-3 text-blue-600" />
                              </button>
                            )}
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
                    <React.Fragment key={registro.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {esDeHoy && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                              HOY
                            </span>
                          )}
                          {(registro.origen === 'database' || registro.sincronizado) ? (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              BD
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium flex items-center gap-1">
                              <CloudOff className="w-3 h-3" />
                              Local
                            </span>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{formatearFechaSimple(registro.fecha)}</p>
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
                            onClick={() => handleExportarPDF(registro)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Exportar PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {esUsuarioAnalisis && (
                            <>
                              <button
                                onClick={() => handleExportarCSV(registro)}
                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                title="Exportar CSV"
                              >
                                <FileSpreadsheet className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleExportarExcel(registro)}
                                className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                                title="Exportar Excel"
                              >
                                <FileSpreadsheet className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {esRegistroDeHoy(registro.fecha) && (
                            <button
                              onClick={() => handleEliminar(registro)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              title="Eliminar registro (solo registros de hoy)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRegistros.has(registro.id) && (
                      <tr>
                        <td colSpan={6} className="px-3 sm:px-6 py-4 bg-gray-50">
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">Detalle de Productos</h4>
                            <div className="overflow-x-auto -mx-3 sm:mx-0 rounded-lg border border-gray-200">
                              <table className="w-full text-xs sm:text-sm">
                                <thead className="bg-gray-50">
                                  <tr className="text-left text-xs text-gray-700 font-medium">
                                    <th className="py-3 px-3 sm:px-4">Producto</th>
                                    <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Categoría</th>
                                    <th className="py-3 px-2 text-center bg-purple-50">C1</th>
                                    <th className="py-3 px-2 text-center bg-blue-50">C2</th>
                                    <th className="py-3 px-2 text-center bg-green-50">C3</th>
                                    <th className="py-3 px-3 sm:px-4 text-center bg-yellow-50 font-bold">Total</th>
                                    <th className="py-3 px-3 hidden sm:table-cell">Unidad</th>
                                    <th className="py-3 px-3 text-center hidden sm:table-cell">Pedir</th>
                                    <th className="py-3 px-3 hidden sm:table-cell">Unidad Pedido</th>
                                    {puedeEditar(registro) && (
                                      <th className="py-3 px-2 text-center hidden sm:table-cell">Acciones</th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {registro.productos.map((producto, idx) => {
                                    const esProductoEnCero = producto.total === 0;
                                    return (
                                      <tr key={idx} className={`${esProductoEnCero ? 'bg-red-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/50 transition-colors`}>
                                        <td className="py-3 px-3 sm:px-4">
                                          <p className="font-medium text-gray-900 text-xs sm:text-sm">{producto.nombre}</p>
                                          <div className="flex gap-2 mt-1">
                                            {producto.codigo && <span className="text-xs text-gray-500">Cód: {producto.codigo}</span>}
                                            {producto.tipo ? (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                                Tipo {producto.tipo}
                                              </span>
                                            ) : (
                                              registro.origen === 'database' ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs text-gray-400 italic">
                                                  Sin tipo
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 italic">
                                                  Sin tipo
                                                </span>
                                              )
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                                          {producto.categoria || <span className="text-gray-400 italic">Sin categoría</span>}
                                        </td>
                                        <td className="py-3 px-2 text-center">
                                          <span className={`font-mono font-medium text-xs sm:text-sm ${producto.c1 === 0 ? 'text-red-600' : 'text-purple-700'}`}>
                                            {formatearNumero(producto.c1)}
                                          </span>
                                        </td>
                                        <td className="py-3 px-2 text-center">
                                          <span className={`font-mono font-medium text-xs sm:text-sm ${producto.c2 === 0 ? 'text-red-600' : 'text-blue-700'}`}>
                                            {formatearNumero(producto.c2)}
                                          </span>
                                        </td>
                                        <td className="py-3 px-2 text-center">
                                          <span className={`font-mono font-medium text-xs sm:text-sm ${producto.c3 === 0 ? 'text-red-600' : 'text-green-700'}`}>
                                            {formatearNumero(producto.c3)}
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 sm:px-4 text-center">
                                          <span className={`font-mono font-bold text-sm sm:text-base ${esProductoEnCero ? 'text-red-600 bg-red-100 px-2 py-1 rounded' : 'text-gray-900'}`}>
                                            {formatearNumero(producto.total)}
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                                          <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                            {producto.unidad || '-'}
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 text-center hidden sm:table-cell">
                                          <span className={`font-mono font-medium text-xs sm:text-sm ${producto.cantidadPedir > 0 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                                            {producto.cantidadPedir > 0 ? formatearNumero(producto.cantidadPedir) : '-'}
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                                          <span className="bg-blue-50 px-2 py-1 rounded text-xs text-blue-700">
                                            {producto.unidadBodega || '-'}
                                          </span>
                                        </td>
                                        {puedeEditar(registro) && (
                                          <td className="py-3 px-2 text-center hidden sm:table-cell">
                                            <button
                                              onClick={() => setProductoEditando({ producto, registro })}
                                              className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-all transform hover:scale-105"
                                              title="Editar total"
                                            >
                                              <Edit className="w-4 h-4 text-blue-600" />
                                            </button>
                                          </td>
                                        )}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
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
                      {puedeEditar(registro) && (
                        <th className="pb-2 text-center">Editar</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {registro.productos.map(producto => (
                      <tr key={producto.id} className={producto.total === 0 ? 'bg-red-50' : ''}>
                        <td className="py-2 pr-4">{producto.nombre}</td>
                        <td className="py-2 pr-4 text-gray-600">{producto.categoria || <span className="text-gray-400 italic">Sin categoría</span>}</td>
                        <td className="py-2 pr-4 text-right font-mono">{formatearNumero(producto.c1)}</td>
                        <td className="py-2 pr-4 text-right font-mono">{formatearNumero(producto.c2)}</td>
                        <td className="py-2 pr-4 text-right font-mono">{formatearNumero(producto.c3)}</td>
                        <td className="py-2 pr-4 text-right font-mono font-bold">
                          {formatearNumero(producto.total)}
                        </td>
                        <td className="py-2 pr-4 text-right font-mono">{formatearNumero(producto.cantidadPedir)}</td>
                        <td className="py-2 text-gray-600">{producto.unidadBodega}</td>
                        {puedeEditar(registro) && (
                          <td className="py-2 text-center">
                            <button
                              onClick={() => setProductoEditando({ producto, registro })}
                              className="p-1 hover:bg-blue-100 rounded transition-colors"
                              title="Editar total"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
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

      {/* Mensaje informativo sobre campos faltantes */}
      {registrosFiltrados.some(r => r.origen === 'database') && (
        <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs sm:text-sm text-blue-800 font-medium">Información sobre categorías y tipos</p>
            <p className="text-xs text-blue-700 mt-0.5 sm:mt-1">
              Los campos "Categoría" y "Tipo A,B o C" pueden aparecer vacíos en registros históricos de la base de datos. 
              Estos campos se muestran cuando están disponibles y se incluyen en todas las exportaciones.
            </p>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {productoEditando && (
        <EditarProductoModal
          producto={productoEditando.producto}
          registro={{
            id: productoEditando.registro.id,
            fecha: productoEditando.registro.fecha,
            bodega: productoEditando.registro.bodega,
            bodegaId: productoEditando.registro.bodegaId
          }}
          onClose={() => setProductoEditando(null)}
          onGuardar={handleEditarProducto}
        />
      )}
    </div>
  );
};