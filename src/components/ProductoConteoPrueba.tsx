import { useState, useEffect, memo } from 'react';
import type { Producto } from '../types/index';

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
  unidadBodega,
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
        {/* Header en UNA SOLA LÍNEA */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-medium text-gray-800 truncate flex-1">
            {producto.fields['Nombre Producto']}
          </span>
          {tipoProducto && (
            <span className="text-[9px] text-gray-600">
              {tipoProducto}
            </span>
          )}
          <span className="text-[9px] text-gray-600">
            {producto.fields['Categoría'] || '-'}
          </span>
        </div>

        {/* Controles de entrada */}
        <div className="bg-gray-50/50 rounded-lg p-2 backdrop-blur">
          {/* Primera línea: Cantidades y Total con unidad */}
          <div className="flex items-end gap-1 mb-1">
            <div className="flex-1">
              <label className="text-[7px] font-semibold text-gray-600 uppercase tracking-wider block">C1</label>
              <input
                type="search"
                value={c1Input}
                onChange={(e) => handleInputChange(e.target.value, setC1Input, 'c1')}
                onKeyDown={handleKeyDown}
                className="w-full h-6 text-[10px] text-center font-medium border border-gray-200 rounded focus:border-purple-500 focus:outline-none transition-colors"
                disabled={guardando}
              />
            </div>

            <div className="flex-1">
              <label className="text-[7px] font-semibold text-gray-600 uppercase tracking-wider block">C2</label>
              <input
                type="search"
                value={c2Input}
                onChange={(e) => handleInputChange(e.target.value, setC2Input, 'c2')}
                onKeyDown={handleKeyDown}
                className="w-full h-6 text-[10px] text-center font-medium border border-gray-200 rounded focus:border-purple-500 focus:outline-none transition-colors"
                disabled={guardando}
              />
            </div>

            <div className="flex-1">
              <label className="text-[7px] font-semibold text-gray-600 uppercase tracking-wider block">C3</label>
              <input
                type="search"
                value={c3Input}
                onChange={(e) => handleInputChange(e.target.value, setC3Input, 'c3')}
                onKeyDown={handleKeyDown}
                className="w-full h-6 text-[10px] text-center font-medium border border-gray-200 rounded focus:border-purple-500 focus:outline-none transition-colors"
                disabled={guardando}
              />
            </div>

            {/* Total con unidad */}
            <div className="flex-1">
              <label className="text-[7px] font-semibold text-gray-600 uppercase tracking-wider block">Total</label>
              <div className="h-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded flex items-center justify-center gap-0.5 font-bold text-[9px] px-1">
                <span>{total}</span>
                <span className="text-[7px] opacity-90">{unidad}</span>
              </div>
            </div>
          </div>

          {/* Segunda línea: Pedir, unidad y equivalencia */}
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1">
              <label className="text-[7px] font-semibold text-gray-600 uppercase">Pedir:</label>
              <input
                type="search"
                value={cantidadPedirInput}
                onChange={(e) => handleInputChange(e.target.value, setCantidadPedirInput, 'cantidadPedir')}
                onKeyDown={handleKeyDown}
                className="w-16 h-5 text-[9px] text-center font-medium border border-amber-300 bg-amber-50 rounded focus:border-amber-500 focus:outline-none"
                disabled={guardando}
              />
              <span className="text-[7px] text-amber-600 font-medium">{unidadBodega}</span>
            </div>
            
            {producto.fields['Equivalencias Inventarios'] && (
              <span className="text-[7px] text-gray-600">
                <span className="font-medium">Equiv:</span> {producto.fields['Equivalencias Inventarios']}
              </span>
            )}
          </div>

          {/* Tercera línea: Botones */}
          <div className="flex gap-1">
            <button
              onClick={() => {
                setC1Input('0');
                setC2Input('0');
                setC3Input('0');
                onConteoChange(producto.id, { c1: 0, c2: 0, c3: 0, cantidadPedir: parseValue(cantidadPedirInput), touched: true });
              }}
              className="flex-1 h-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded text-[9px] font-bold hover:shadow-md transition-all"
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
              className="flex-1 h-6 bg-gradient-to-r from-gray-500 to-slate-600 text-white rounded text-[9px] font-bold hover:shadow-md transition-all"
              title="Marcar como inactivo"
            >
              INACTIVO
            </button>

            {onGuardarProducto && (
              <button
                onClick={() => onGuardarProducto(producto.id)}
                disabled={guardando || isGuardado}
                className={`flex-1 h-6 rounded text-[9px] font-bold transition-all hover:shadow-md
                  ${isGuardado 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'}
                  ${guardando ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {guardando ? '...' : isGuardado ? '✓' : 'GUARDAR'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProductoConteoPrueba = memo(ProductoConteoPruebaComponent);