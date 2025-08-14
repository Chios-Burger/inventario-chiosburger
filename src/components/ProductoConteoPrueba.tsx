import { useState, useEffect, memo } from 'react';
import type { Producto } from '../types/index';
import { Loader2, Check } from 'lucide-react';

interface ProductoConteoPruebaProps {
  producto: Producto;
  unidad: string;
  unidadBodega: string;
  onConteoChange: (id: string, conteo: {
    c1: number;
    c2: number;
    c3: number;
    cantidadPedir: number;
    touched?: boolean;
  }) => void;
  onGuardarProducto?: (id: string, esAccionRapida?: boolean) => void;
  guardando?: boolean;
  isGuardado?: boolean;
  conteoInicial?: {
    c1: number;
    c2: number;
    c3: number;
    cantidadPedir: number;
    touched?: boolean;
  };
}

const ProductoConteoPruebaComponent = ({ 
  producto, 
  unidad,
  unidadBodega: _unidadBodega,
  onConteoChange,
  onGuardarProducto,
  guardando = false,
  isGuardado = false,
  conteoInicial
}: ProductoConteoPruebaProps) => {
  const [c1Input, setC1Input] = useState<string>((conteoInicial?.c1 || 0).toString());
  const [c2Input, setC2Input] = useState<string>((conteoInicial?.c2 || 0).toString());
  const [c3Input, setC3Input] = useState<string>((conteoInicial?.c3 || 0).toString());
  const [cantidadPedirInput, setCantidadPedirInput] = useState<string>((conteoInicial?.cantidadPedir || 0).toString());

  // Calcular el total
  const calcularTotal = () => {
    const val1 = parseFloat(c1Input) || 0;
    const val2 = parseFloat(c2Input) || 0;
    const val3 = parseFloat(c3Input) || 0;
    
    // Solo sumar valores positivos
    const suma = (val1 >= 0 ? val1 : 0) + (val2 >= 0 ? val2 : 0) + (val3 >= 0 ? val3 : 0);
    return Math.round(suma * 100) / 100; // Redondear a 2 decimales
  };

  const total = calcularTotal();

  // Determinar el estado del producto
  const getEstado = () => {
    const val1 = parseFloat(c1Input) || 0;
    const val2 = parseFloat(c2Input) || 0;
    const val3 = parseFloat(c3Input) || 0;
    
    if (val1 === -1 && val2 === -1 && val3 === -1) {
      return { color: 'bg-gray-500', texto: 'Inactivo' };
    }
    if (isGuardado) {
      return { color: 'bg-green-500', texto: 'Guardado' };
    }
    if (val1 === 0 && val2 === 0 && val3 === 0) {
      return { color: 'bg-orange-500', texto: 'En cero' };
    }
    return { color: 'bg-yellow-500', texto: 'Pendiente' };
  };

  const estado = getEstado();

  useEffect(() => {
    if (conteoInicial) {
      setC1Input(conteoInicial.c1.toString());
      setC2Input(conteoInicial.c2.toString());
      setC3Input(conteoInicial.c3.toString());
      setCantidadPedirInput(conteoInicial.cantidadPedir.toString());
    }
  }, [conteoInicial]);

  const parseValue = (value: string): number => {
    if (value === '' || value === '-') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleInputChange = (
    value: string,
    setter: (val: string) => void,
    field: 'c1' | 'c2' | 'c3' | 'cantidadPedir'
  ) => {
    setter(value);

    const numValue = parseValue(value);
    const updates = {
      c1: field === 'c1' ? numValue : parseValue(c1Input),
      c2: field === 'c2' ? numValue : parseValue(c2Input),
      c3: field === 'c3' ? numValue : parseValue(c3Input),
      cantidadPedir: field === 'cantidadPedir' ? numValue : parseValue(cantidadPedirInput),
      touched: true
    };

    onConteoChange(producto.id, updates);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onGuardarProducto) {
      e.preventDefault();
      onGuardarProducto(producto.id);
    }
  };

  // Obtener tipo del producto
  const getTipoProducto = () => {
    const posiblesNombres = [
      'Tipo A,B o C', 'Tipo A, B o C', 'Tipo A,B,C', 
      'Tipo A, B, C', 'Tipo ABC', 'TipoABC', 'Tipo', 'tipo'
    ];
    
    for (const nombre of posiblesNombres) {
      if (producto.fields[nombre]) {
        return producto.fields[nombre];
      }
    }
    return '';
  };

  const tipoProducto = getTipoProducto();

  return (
    <div className={`
      relative overflow-hidden rounded-xl transition-all duration-300
      ${isGuardado 
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 shadow-lg shadow-green-100/50' 
        : 'bg-white hover:shadow-xl shadow-md border-l-4 border-purple-500'}
      ${estado.color === 'bg-gray-500' ? 'opacity-75 grayscale' : ''}
    `}>
      {/* Barra de estado superior */}
      <div className={`absolute top-0 right-0 h-full w-1 ${estado.color}`} />
      
      <div className="p-3">
        {/* Header con información del producto */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            {/* Nombre y badges */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[12px] font-semibold text-gray-800 leading-tight">
                {producto.fields['Nombre Producto']}
              </h3>
              {tipoProducto && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  {tipoProducto}
                </span>
              )}
            </div>
            
            {/* Categoría y unidad */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {producto.fields['Categoría']}
              </span>
              <span className="text-[10px] font-medium text-purple-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
                {unidad || 'Sin definir'}
              </span>
            </div>
          </div>
          
          {/* Badge de estado */}
          <div className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-wide ${
            estado.color === 'bg-green-500' ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-green-200 shadow-md' :
            estado.color === 'bg-yellow-500' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white shadow-yellow-200 shadow-md' :
            estado.color === 'bg-orange-500' ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-orange-200 shadow-md' :
            'bg-gradient-to-r from-gray-400 to-slate-400 text-white shadow-gray-200 shadow-md'
          }`}>
            {estado.texto.toUpperCase()}
          </div>
        </div>

        {/* Controles de entrada */}
        <div className="bg-gray-50/50 rounded-lg p-2 backdrop-blur">
          <div className="grid grid-cols-7 gap-2 items-end">
            {/* Inputs de conteo */}
            <div>
              <label className="text-[8px] font-semibold text-gray-600 uppercase tracking-wider mb-1 block">C1</label>
              <input
                type="search"
                value={c1Input}
                onChange={(e) => handleInputChange(e.target.value, setC1Input, 'c1')}
                onKeyDown={handleKeyDown}
                className="w-full h-7 text-[11px] text-center font-medium border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                disabled={guardando}
              />
            </div>

            <div>
              <label className="text-[8px] font-semibold text-gray-600 uppercase tracking-wider mb-1 block">C2</label>
              <input
                type="search"
                value={c2Input}
                onChange={(e) => handleInputChange(e.target.value, setC2Input, 'c2')}
                onKeyDown={handleKeyDown}
                className="w-full h-7 text-[11px] text-center font-medium border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                disabled={guardando}
              />
            </div>

            <div>
              <label className="text-[8px] font-semibold text-gray-600 uppercase tracking-wider mb-1 block">C3</label>
              <input
                type="search"
                value={c3Input}
                onChange={(e) => handleInputChange(e.target.value, setC3Input, 'c3')}
                onKeyDown={handleKeyDown}
                className="w-full h-7 text-[11px] text-center font-medium border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                disabled={guardando}
              />
            </div>

            {/* Total con diseño especial */}
            <div>
              <label className="text-[8px] font-semibold text-gray-600 uppercase tracking-wider mb-1 block">Total</label>
              <div className="h-7 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg flex items-center justify-center font-bold text-[12px] shadow-md">
                {total}
              </div>
            </div>

            {/* Cantidad a pedir */}
            <div>
              <label className="text-[8px] font-semibold text-gray-600 uppercase tracking-wider mb-1 block">Pedir</label>
              <input
                type="search"
                value={cantidadPedirInput}
                onChange={(e) => handleInputChange(e.target.value, setCantidadPedirInput, 'cantidadPedir')}
                onKeyDown={handleKeyDown}
                className="w-full h-7 text-[11px] text-center font-medium border-2 border-amber-300 bg-amber-50 rounded-lg focus:border-amber-500 focus:outline-none transition-colors"
                disabled={guardando}
              />
            </div>

            {/* Botones de acción */}
            <div className="col-span-2 flex gap-1">
              <button
                onClick={() => {
                  setC1Input('0');
                  setC2Input('0');
                  setC3Input('0');
                  onConteoChange(producto.id, { c1: 0, c2: 0, c3: 0, cantidadPedir: parseValue(cantidadPedirInput), touched: true });
                }}
                className="flex-1 h-7 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-[9px] font-bold hover:shadow-lg transition-all transform hover:scale-105"
                title="Marcar en cero"
              >
                CERO
              </button>

              <button
                onClick={() => {
                  setC1Input('-1');
                  setC2Input('-1');
                  setC3Input('-1');
                  onConteoChange(producto.id, { c1: -1, c2: -1, c3: -1, cantidadPedir: parseValue(cantidadPedirInput), touched: true });
                }}
                className="flex-1 h-7 bg-gradient-to-r from-gray-500 to-slate-600 text-white rounded-lg text-[9px] font-bold hover:shadow-lg transition-all transform hover:scale-105"
                title="Marcar como inactivo"
              >
                INACT
              </button>

              {onGuardarProducto && (
                <button
                  onClick={() => onGuardarProducto(producto.id)}
                  disabled={guardando || isGuardado}
                  className={`
                    flex-1 h-7 rounded-lg text-[9px] font-bold transition-all transform hover:scale-105 hover:shadow-lg
                    ${isGuardado 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'}
                    ${guardando ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {guardando ? (
                    <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                  ) : isGuardado ? (
                    <span className="flex items-center justify-center gap-1">
                      <Check className="w-3 h-3" />
                      OK
                    </span>
                  ) : (
                    'GUARDAR'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProductoConteoPrueba = memo(ProductoConteoPruebaComponent);