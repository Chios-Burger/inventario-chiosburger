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
  opcionEquivalencias?: 1 | 2 | 3 | 4 | 5;
}

const ProductoConteoPruebaComponent = ({ 
  producto, 
  unidad,
  unidadBodega,
  onConteoChange,
  onGuardarProducto,
  guardando = false,
  isGuardado = false,
  conteoInicial,
  opcionEquivalencias = 1
}: ProductoConteoPruebaProps) => {
  const [c1Input, setC1Input] = useState<string>((conteoInicial?.c1 || 0).toString());
  const [c2Input, setC2Input] = useState<string>((conteoInicial?.c2 || 0).toString());
  const [c3Input, setC3Input] = useState<string>((conteoInicial?.c3 || 0).toString());
  const [cantidadPedirInput, setCantidadPedirInput] = useState<string>(conteoInicial?.cantidadPedir ? conteoInicial.cantidadPedir.toString() : '');

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
      setCantidadPedirInput(conteoInicial.cantidadPedir ? conteoInicial.cantidadPedir.toString() : '');
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
  
  // Renderizar equivalencias según la opción seleccionada
  const renderEquivalencias = () => {
    const equiv = producto.fields['Equivalencias Inventarios'];
    if (!equiv) return <div className="h-6" />;
    
    switch(opcionEquivalencias) {
      case 1: // Truncar (actual)
        return (
          <div className="h-6 flex items-center">
            <span className="text-[7px] text-gray-600 truncate w-full">
              <span className="font-medium">Eq:</span> {equiv}
            </span>
          </div>
        );
      
      case 2: // Dos líneas
        return (
          <div className="h-6 flex items-start overflow-hidden">
            <span className="text-[6px] text-gray-600 leading-tight">
              <span className="font-medium">Eq:</span> {equiv}
            </span>
          </div>
        );
      
      case 3: // Tooltip al hover
        return (
          <div className="h-6 flex items-center group relative">
            <span className="text-[7px] text-gray-600 truncate w-full">
              <span className="font-medium">Eq:</span> {equiv}
            </span>
            <div className="absolute bottom-full left-0 mb-1 p-1 bg-gray-800 text-white text-[7px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 max-w-xs">
              {equiv}
            </div>
          </div>
        );
      
      case 4: // Scroll horizontal
        return (
          <div className="h-6 flex items-center overflow-x-auto scrollbar-thin">
            <span className="text-[7px] text-gray-600 whitespace-nowrap">
              <span className="font-medium">Eq:</span> {equiv}
            </span>
          </div>
        );
      
      case 5: // Texto más pequeño
        return (
          <div className="h-6 flex items-center overflow-hidden">
            <span className="text-[5px] text-gray-600 break-all">
              <span className="font-medium">Eq:</span> {equiv}
            </span>
          </div>
        );
      
      default:
        return <div className="h-6" />;
    }
  };

  return (
    <div className={`
      relative overflow-hidden rounded-xl transition-all duration-300 w-full
      ${isGuardado 
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg shadow-green-100/50' 
        : 'bg-white hover:shadow-xl shadow-md'}
      ${estado.color === 'bg-gray-500' ? 'opacity-75 grayscale' : ''}
    `}>
      {/* Barra de estado izquierda */}
      <div className={`absolute top-0 left-0 h-full w-1 ${isGuardado ? 'bg-green-500' : 'bg-purple-500'}`} />
      {/* Barra de estado derecha */}
      <div className={`absolute top-0 right-0 h-full w-1 ${estado.color}`} />
      
      <div className="py-1 px-2 w-full">
        {/* Header en UNA SOLA LÍNEA */}
        <div className="flex items-center gap-1 mb-0.5">
          <span className="text-[9px] font-medium text-gray-800 truncate flex-[3] min-w-0">
            {producto.fields['Nombre Producto']}
          </span>
          {tipoProducto && (
            <span className="text-[8px] text-gray-600 flex-shrink-0">
              {tipoProducto}
            </span>
          )}
          <span className="text-[8px] text-gray-600 truncate flex-1 min-w-0 text-right">
            {producto.fields['Categoría'] || '-'}
          </span>
        </div>

        {/* Controles de entrada */}
        <div className="bg-gray-50/50 rounded-lg p-1 backdrop-blur w-full">
          {/* Primera línea: Cantidades y Total con unidad */}
          <div className="flex items-center gap-1 mb-0.5">
            <div className="flex-1">
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
              <div className="h-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded flex items-center justify-center gap-0.5 font-bold text-[9px] px-1">
                <span>{total}</span>
                <span className="text-[7px] opacity-90">{unidad}</span>
              </div>
            </div>
          </div>

          {/* Segunda línea: Pedir, unidad y equivalencia */}
          <div className="grid grid-cols-4 gap-1 mb-0.5">
            {/* Columna 1: Input PEDIR */}
            <div className="col-span-1">
              <input
                type="search"
                value={cantidadPedirInput}
                onChange={(e) => {
                  const value = e.target.value;
                  // Solo permitir números positivos o vacío
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    handleInputChange(value, setCantidadPedirInput, 'cantidadPedir');
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="PEDIR"
                className="w-full h-6 text-[10px] text-center font-medium border border-amber-300 bg-amber-50 rounded focus:border-amber-500 focus:outline-none placeholder:text-amber-400 placeholder:text-[9px]"
                disabled={guardando}
              />
            </div>
            
            {/* Columna 2: Unidad */}
            <div className="col-span-1">
              <div className="h-6 bg-amber-100 border border-amber-300 rounded w-full flex items-center justify-center">
                <span className="text-[9px] text-amber-700 font-medium">{unidadBodega}</span>
              </div>
            </div>
            
            {/* Columnas 3 y 4: Equivalencias */}
            <div className="col-span-2">
              {renderEquivalencias()}
            </div>
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