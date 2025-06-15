import React, { useState } from 'react';
import { Warehouse, Menu, X } from 'lucide-react';
import { BODEGAS } from './config';
import { ListaProductos } from './components/ListaProductos';

function App() {
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState(BODEGAS[0]);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleBodegaChange = (bodega: typeof BODEGAS[0]) => {
    setBodegaSeleccionada(bodega);
    setMenuAbierto(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenuAbierto(!menuAbierto)}
                className="md:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                {menuAbierto ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
              </button>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900 flex items-center gap-2.5">
                <div className="p-2 bg-foodix-azul rounded-xl">
                  <Warehouse className="w-6 h-6 text-white" />
                </div>
                <span>Inventario Foodix</span>
              </h1>
            </div>
            
            {/* Selector de bodega - Desktop */}
            <nav className="hidden md:flex items-center gap-2">
              {BODEGAS.map(bodega => (
                <button
                  key={bodega.id}
                  onClick={() => handleBodegaChange(bodega)}
                  className={`px-4 py-2 rounded-xl transition-all duration-200 text-sm font-medium ${
                    bodegaSeleccionada.id === bodega.id
                      ? 'bg-foodix-azul text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {bodega.nombre}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Menú móvil */}
      {menuAbierto && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setMenuAbierto(false)}>
          <div className="bg-white w-80 h-full shadow-2xl animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gray-50 border-b border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900">Seleccionar Bodega</h2>
            </div>
            <nav className="p-4">
              {BODEGAS.map(bodega => (
                <button
                  key={bodega.id}
                  onClick={() => handleBodegaChange(bodega)}
                  className={`w-full text-left px-5 py-4 rounded-xl mb-2 transition-all duration-200 font-medium ${
                    bodegaSeleccionada.id === bodega.id
                      ? 'bg-foodix-azul text-white shadow-sm'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {bodega.nombre}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-6">
        <ListaProductos
          bodegaId={bodegaSeleccionada.id}
          bodegaNombre={bodegaSeleccionada.nombre}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            © 2025 Foodix - Sistema de Inventario
          </p>
          <p className="text-xs mt-2 text-gray-400">
            Versión 1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;