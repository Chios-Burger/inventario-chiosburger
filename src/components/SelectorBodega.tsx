import { Package2, Lock } from 'lucide-react';
import { BODEGAS } from '../config';
import type { Usuario } from '../types/index';

interface SelectorBodegaProps {
  onSeleccionarBodega: (id: number, nombre: string) => void;
  usuario: Usuario;
  onMostrarError?: (mensaje: string) => void;
}

export const SelectorBodega = ({ onSeleccionarBodega, usuario, onMostrarError }: SelectorBodegaProps) => {
  const tienePermiso = (bodegaId: number): boolean => {
    return usuario.bodegasPermitidas.includes(bodegaId);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl sm:rounded-3xl shadow-xl mb-4 sm:mb-6">
          <Package2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
          Selecciona una Bodega
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          Bienvenido <span className="font-semibold">{usuario.nombre}</span>
        </p>
      </div>

      {/* Grid de bodegas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {BODEGAS.map((bodega) => {
          const bloqueada = !tienePermiso(bodega.id);
          
          return (
            <div
              key={bodega.id}
              onClick={() => {
                if (!bloqueada) {
                  onSeleccionarBodega(bodega.id, bodega.nombre);
                } else if (onMostrarError) {
                  onMostrarError(`No tienes permisos para acceder a la bodega: ${bodega.nombre}`);
                }
              }}
              className={`
                relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg transition-all duration-300
                ${bloqueada 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-2xl hover:scale-105 cursor-pointer'
                }
              `}
            >
              {/* Iconos superiores */}
              <div className="absolute top-4 right-4 flex gap-2 pointer-events-none">
                {/* Icono de bloqueado */}
                {bloqueada && (
                  <Lock className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* Contenido */}
              <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 mx-auto w-fit pointer-events-none ${
                bloqueada ? 'bg-gray-100' : 'bg-gradient-to-br from-purple-100 to-blue-100'
              }`}>
                <Package2 className={`w-8 h-8 sm:w-10 sm:h-10 ${
                  bloqueada ? 'text-gray-400' : 'text-purple-600'
                }`} />
              </div>
              
              <h3 className={`text-lg sm:text-xl font-bold mb-1 sm:mb-2 pointer-events-none ${
                bloqueada ? 'text-gray-400' : 'text-gray-800'
              }`}>
                {bodega.nombre}
              </h3>
              
              <p className={`text-xs sm:text-sm pointer-events-none ${
                bloqueada ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {bloqueada ? 'Sin acceso' : ''}
              </p>

              {/* Indicador visual adicional */}
              {!bloqueada && (
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-2 ring-transparent hover:ring-purple-400 transition-all duration-300 pointer-events-none"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mensaje informativo */}
      {usuario.bodegasPermitidas.length < BODEGAS.length && (
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Solo puedes acceder a las bodegas asignadas a tu cuenta
          </p>
        </div>
      )}
    </div>
  );
};