import { useState, useEffect } from 'react';
import { Package2, LogOut, Home, History, AlertCircle, Menu, X, Eye, ShoppingCart } from 'lucide-react';
import { Login } from './components/Login';
import { SelectorBodega } from './components/SelectorBodega';
import { ListaProductos } from './components/ListaProductos';
import { Historico } from './components/Historico';
import { HistoricoOpciones } from './components/HistoricoOpciones';
import { PedidosDelDia } from './components/PedidosDelDia';
import { Toast } from './components/Toast';
import NotificationModal from './components/NotificationModal';
import { authService } from './services/auth';
import { syncService } from './services/syncService';
import { historicoService } from './services/historico';
import { notificationSystem } from './utils/notificationSystem';
import { initializeMobileFixes, startMobileFixObserver } from './utils/mobileFixUtils';
import { versionChecker } from './services/versionCheck';
import type { Usuario } from './types/index';
import './App.css';

function App() {
  const [bodegaId, setBodegaId] = useState<number | null>(null);
  const [bodegaNombre, setBodegaNombre] = useState<string>('');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [vista, setVista] = useState<'inventario' | 'historico' | 'opciones-historico' | 'pedidos'>('inventario');
  const [error, setError] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error' | 'info' | 'offline'} | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    // Initialize mobile fixes
    initializeMobileFixes();
    startMobileFixObserver();
    
    // Inicializar sistema de verificación de versión
    versionChecker.initialize();
    
    // Verificar si hay un usuario logueado
    const usuarioGuardado = authService.getUsuarioActual();
    if (usuarioGuardado) {
      setUsuario(usuarioGuardado);
    }
    
    // Iniciar sincronización automática con callback para mostrar notificaciones
    historicoService.iniciarSincronizacionAutomatica((success, count) => {
      if (success && count && count > 0) {
        setToast({ 
          message: `✅ ${count} registro${count > 1 ? 's' : ''} sincronizado${count > 1 ? 's' : ''} con la base de datos`, 
          type: 'success' 
        });
      }
    });
    
    // Mantener compatibilidad con syncService si es necesario
    syncService.startAutoSync();
    
    return () => {
      // Cleanup mobile fix observer - no longer needed since it returns null
      
      // Detener verificación de versión
      versionChecker.destroy();
      
      // Detener sincronización al desmontar
      historicoService.detenerSincronizacionAutomatica();
      syncService.stopAutoSync();
    };
  }, []);

  // Verificar notificaciones pendientes
  useEffect(() => {
    const checkNotifications = setInterval(() => {
      if (notificationSystem.hasPendingNotifications() && !showNotificationModal) {
        setShowNotificationModal(true);
      }
    }, 5000); // Verificar cada 5 segundos

    return () => clearInterval(checkNotifications);
  }, [showNotificationModal]);

  const handleLogin = () => {
    const usuarioActual = authService.getUsuarioActual();
    setUsuario(usuarioActual);
    setError('');
  };

  const handleLogout = () => {
    authService.logout();
    setUsuario(null);
    setBodegaId(null);
    setBodegaNombre('');
    setVista('inventario');
  };

  const handleSeleccionarBodega = (id: number, nombre: string) => {
    console.log('🏭 App - handleSeleccionarBodega llamado con:', id, nombre);
    
    // Verificar permisos
    const tienePermiso = authService.tienPermisoBodega(id);
    console.log('🔐 App - Tiene permiso:', tienePermiso);
    
    if (!tienePermiso) {
      console.log('❌ App - Sin permisos para bodega:', id);
      setError('No tienes permisos para acceder a esta bodega');
      return;
    }
    
    console.log('✅ App - Estableciendo bodega:', id, nombre);
    setBodegaId(id);
    setBodegaNombre(nombre);
    setError('');
  };

  const handleVolverInicio = () => {
    setBodegaId(null);
    setBodegaNombre('');
    setError('');
  };

  // Si no hay usuario, mostrar login
  if (!usuario) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y título */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg shadow-md">
                <Package2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-gray-800">
                  Sistema de Inventario
                </h1>
                <p className="text-[10px] text-gray-500 hidden sm:block">ChiosBurger</p>
              </div>
            </div>

            {/* Navegación desktop */}
            <nav className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setVista('inventario')}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  vista === 'inventario' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Home className="w-4 h-4 inline mr-2" />
                Inventario
              </button>
              <button
                onClick={() => setVista('historico')}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  vista === 'historico' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <History className="w-4 h-4 inline mr-2" />
                Histórico
              </button>
              <button
                onClick={() => setVista('opciones-historico')}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  vista === 'opciones-historico' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Opciones Histórico
              </button>
              {/* Botón Pedidos solo para usuarios autorizados */}
              {(usuario.email === 'bodegaprincipal@chiosburger.com' || 
                usuario.email === 'analisis@chiosburger.com' || 
                usuario.email === 'gerencia@chiosburger.com' || 
                usuario.email === 'contabilidad@chiosburger.com') && (
                <button
                  onClick={() => setVista('pedidos')}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    vista === 'pedidos' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 inline mr-2" />
                  Pedidos del Día
                </button>
              )}
            </nav>

            {/* Usuario y logout desktop */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{usuario.nombre}</p>
                <p className="text-xs text-gray-500">{usuario.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Menú móvil */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Menú móvil desplegable */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-gray-100 py-4">
              <nav className="flex flex-col gap-2 mb-4">
                <button
                  onClick={() => {
                    setVista('inventario');
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all text-left ${
                    vista === 'inventario' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Home className="w-4 h-4 inline mr-2" />
                  Inventario
                </button>
                <button
                  onClick={() => {
                    setVista('historico');
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all text-left ${
                    vista === 'historico' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <History className="w-4 h-4 inline mr-2" />
                  Histórico
                </button>
                <button
                  onClick={() => {
                    setVista('opciones-historico');
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all text-left ${
                    vista === 'opciones-historico' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  Opciones Histórico
                </button>
                {/* Botón Pedidos móvil solo para usuarios autorizados */}
                {(usuario.email === 'bodegaprincipal@chiosburger.com' || 
                  usuario.email === 'analisis@chiosburger.com' || 
                  usuario.email === 'gerencia@chiosburger.com' || 
                  usuario.email === 'contabilidad@chiosburger.com') && (
                  <button
                    onClick={() => {
                      setVista('pedidos');
                      setMobileMenuOpen(false);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all text-left ${
                      vista === 'pedidos' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 inline mr-2" />
                    Pedidos del Día
                  </button>
                )}
              </nav>
              
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">{usuario.nombre}</p>
                  <p className="text-xs text-gray-500">{usuario.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium text-sm"
                >
                  <LogOut className="w-4 h-4 inline mr-2" />
                  Salir
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Contenido principal */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        {/* Mensaje de error */}
        {error && (
          <div className="max-w-7xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => setError('')}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {vista === 'inventario' ? (
            <>
              {!bodegaId ? (
                <SelectorBodega 
                  onSeleccionarBodega={handleSeleccionarBodega}
                  usuario={usuario}
                  onMostrarError={(mensaje) => setToast({ message: mensaje, type: 'error' })}
                />
              ) : (
                <>
                  {/* Botón volver */}
                  <div className="max-w-5xl mx-auto mb-4 sm:mb-6">
                    <button
                      onClick={handleVolverInicio}
                      className="px-3 sm:px-4 py-2 bg-white rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-gray-700 font-medium text-sm sm:text-base"
                    >
                      <Home className="w-4 h-4" />
                      <span className="hidden sm:inline">Volver al inicio</span>
                      <span className="sm:hidden">Volver</span>
                    </button>
                  </div>

                  {/* Lista de productos */}
                  <ListaProductos 
                    bodegaId={bodegaId} 
                    bodegaNombre={bodegaNombre} 
                  />
                </>
              )}
            </>
          ) : vista === 'historico' ? (
            <Historico />
          ) : vista === 'opciones-historico' ? (
            bodegaId && bodegaNombre ? (
              <HistoricoOpciones 
                bodegaId={bodegaId} 
                bodegaNombre={bodegaNombre} 
              />
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500">Selecciona una bodega primero</p>
              </div>
            )
          ) : vista === 'pedidos' ? (
            <PedidosDelDia />
          ) : null}
      </main>
      
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Notification Modal */}
      <NotificationModal 
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />
    </div>
  );
}

export default App;