import { useState, useEffect } from 'react';
import { Package2, LogOut, Home, History, AlertCircle, Menu, X } from 'lucide-react';
import { Login } from './components/Login';
import { SelectorBodega } from './components/SelectorBodega';
import { ListaProductos } from './components/ListaProductos';
import { Historico } from './components/Historico';
import { authService } from './services/auth';
import type { Usuario } from './types/index';
import './App.css';

function App() {
  const [bodegaId, setBodegaId] = useState<number | null>(null);
  const [bodegaNombre, setBodegaNombre] = useState<string>('');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [vista, setVista] = useState<'inventario' | 'historico'>('inventario');
  const [error, setError] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Verificar si hay un usuario logueado
    const usuarioGuardado = authService.getUsuarioActual();
    if (usuarioGuardado) {
      setUsuario(usuarioGuardado);
    }
  }, []);

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
    // Verificar permisos
    if (!authService.tienPermisoBodega(id)) {
      setError('No tienes permisos para acceder a esta bodega');
      return;
    }
    
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
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg sm:rounded-xl shadow-md">
                <Package2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                  Sistema de Inventario
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">ChiosBurger</p>
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
          ) : (
            <Historico />
          )}
      </main>
    </div>
  );
}

export default App;