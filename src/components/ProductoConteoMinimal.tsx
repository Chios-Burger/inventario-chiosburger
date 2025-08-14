import { useState, useEffect, memo } from 'react';
import type { Producto } from '../types/index';
import { Check, X, AlertTriangle, Loader2 } from 'lucide-react';

interface ProductoConteoMinimalProps {
  producto: Producto;
  unidad: string;
  unidadBodega: string;
  onConteoChange: (productoId: string, conteo: {
    c1: number;
    c2: number;
    c3: number;
    cantidadPedir: number;
    touched?: boolean;
  }) => void;
  onGuardarProducto?: (productoId: string, esAccionRapida?: boolean, valoresRapidos?: any, esEdicion?: boolean) => void;
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

const ProductoConteoMinimalComponent = ({ 
  producto, 
  unidad,
  unidadBodega,
  onConteoChange,
  onGuardarProducto,
  guardando = false,
  isGuardado = false,
  conteoInicial
}: ProductoConteoMinimalProps) => {
  const [c1Input, setC1Input] = useState<string>((conteoInicial?.c1 || 0).toString());
  const [c2Input, setC2Input] = useState<string>((conteoInicial?.c2 || 0).toString());
  const [c3Input, setC3Input] = useState<string>((conteoInicial?.c3 || 0).toString());
  const [cantidadPedirInput, setCantidadPedirInput] = useState<string>((conteoInicial?.cantidadPedir || 0).toString());
  const [touched, setTouched] = useState(conteoInicial?.touched || false);
  const [isEditing, setIsEditing] = useState(false);

  const parseDecimal = (value: string): number => {
    if (!value || value === '' || value === '-') return 0;
    const normalizedValue = value.endsWith('.') ? value + '0' : value;
    const parsed = parseFloat(normalizedValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  const c1 = parseDecimal(c1Input);
  const c2 = parseDecimal(c2Input);
  const c3 = parseDecimal(c3Input);
  const cantidadPedir = parseDecimal(cantidadPedirInput);
  const total = c1 + c2 + c3;
  const isInactive = c1 === -1 && c2 === -1 && c3 === -1;
  const isZero = c1 === 0 && c2 === 0 && c3 === 0 && total === 0;

  useEffect(() => {
    if (conteoInicial && !touched) {
      setC1Input((conteoInicial.c1 || 0).toString());
      setC2Input((conteoInicial.c2 || 0).toString());
      setC3Input((conteoInicial.c3 || 0).toString());
      setCantidadPedirInput((conteoInicial.cantidadPedir || 0).toString());
      setTouched(conteoInicial.touched || false);
    }
  }, [producto.id]);

  useEffect(() => {
    if (touched) {
      onConteoChange(producto.id, { c1, c2, c3, cantidadPedir, touched: true });
    }
  }, [c1, c2, c3, cantidadPedir, producto.id, touched]);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setTouched(true);
    const cleanValue = value.replace(',', '.');
    if (cleanValue === '' || cleanValue === '-' || /^-?\d*\.?\d*$/.test(cleanValue)) {
      setter(cleanValue);
    }
  };

  const handleQuickAction = (action: 'zero' | 'inactive') => {
    if (!onGuardarProducto) return;
    
    if (action === 'zero') {
      setC1Input('0');
      setC2Input('0');
      setC3Input('0');
      setTouched(true);
      onGuardarProducto(producto.id, true, { c1: 0, c2: 0, c3: 0, cantidadPedir: cantidadPedir || 0, touched: true });
    } else {
      setC1Input('-1');
      setC2Input('-1');
      setC3Input('-1');
      setCantidadPedirInput('-1');
      setTouched(true);
      onGuardarProducto(producto.id, true, { c1: -1, c2: -1, c3: -1, cantidadPedir: -1, touched: true });
    }
  };

  const handleGuardar = () => {
    if (onGuardarProducto) {
      onGuardarProducto(producto.id);
      setIsEditing(false);
    }
  };

  // Determinar el color de estado
  const getStatusColor = () => {
    if (isInactive) return 'bg-gray-50 border-gray-200';
    if (isGuardado) return 'bg-green-50 border-green-200';
    if (isZero) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-300';
  };

  const getStatusIcon = () => {
    if (isInactive) return <X className="w-3 h-3 text-gray-400" />;
    if (isGuardado) return <Check className="w-3 h-3 text-green-500" />;
    if (isZero) return <AlertTriangle className="w-3 h-3 text-orange-500" />;
    return <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />;
  };

  return (
    <div className={`border rounded-lg ${getStatusColor()} transition-all duration-200 hover:shadow-sm`}>
      <div className="p-2">
        {/* Fila superior - Nombre y estado */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {getStatusIcon()}
            <h3 className={`text-[11px] font-medium truncate ${isInactive ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
              {producto.fields['Nombre Producto']}
            </h3>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-gray-500">
            {producto.fields['Categoría'] && (
              <span className="bg-gray-100 px-1 py-0.5 rounded">{producto.fields['Categoría']}</span>
            )}
            {(producto.fields['Código'] || producto.fields['Codigo']) && (
              <span className="bg-blue-100 text-blue-600 px-1 py-0.5 rounded font-mono">
                {producto.fields['Código'] || producto.fields['Codigo']}
              </span>
            )}
          </div>
        </div>

        {/* Grid de conteos - super compacto */}
        <div className="grid grid-cols-5 gap-1 mb-1.5">
          <div>
            <input
              type="search"
              inputMode="decimal"
              value={c1Input}
              onChange={(e) => handleInputChange(setC1Input, e.target.value)}
              onFocus={(e) => e.target.select()}
              disabled={isGuardado && !isEditing}
              className={`w-full px-1 py-0.5 border rounded text-center text-[10px] font-medium ${
                isGuardado && !isEditing ? 'bg-gray-50' : 'bg-white'
              }`}
              style={{ height: '20px' }}
              placeholder="C1"
            />
          </div>
          <div>
            <input
              type="search"
              inputMode="decimal"
              value={c2Input}
              onChange={(e) => handleInputChange(setC2Input, e.target.value)}
              onFocus={(e) => e.target.select()}
              disabled={isGuardado && !isEditing}
              className={`w-full px-1 py-0.5 border rounded text-center text-[10px] font-medium ${
                isGuardado && !isEditing ? 'bg-gray-50' : 'bg-white'
              }`}
              style={{ height: '20px' }}
              placeholder="C2"
            />
          </div>
          <div>
            <input
              type="search"
              inputMode="decimal"
              value={c3Input}
              onChange={(e) => handleInputChange(setC3Input, e.target.value)}
              onFocus={(e) => e.target.select()}
              disabled={isGuardado && !isEditing}
              className={`w-full px-1 py-0.5 border rounded text-center text-[10px] font-medium ${
                isGuardado && !isEditing ? 'bg-gray-50' : 'bg-white'
              }`}
              style={{ height: '20px' }}
              placeholder="C3"
            />
          </div>
          <div className="bg-purple-100 border border-purple-200 rounded px-1 py-0.5 text-center">
            <span className="text-[10px] font-bold text-purple-700">
              {total}
            </span>
          </div>
          <div>
            <input
              type="search"
              inputMode="decimal"
              value={cantidadPedirInput}
              onChange={(e) => handleInputChange(setCantidadPedirInput, e.target.value)}
              onFocus={(e) => e.target.select()}
              disabled={isGuardado && !isEditing}
              className={`w-full px-1 py-0.5 border rounded text-center text-[10px] font-medium ${
                isGuardado && !isEditing ? 'bg-gray-50' : 'bg-white'
              } border-purple-200`}
              style={{ height: '20px' }}
              placeholder="Pedir"
              title={`Cantidad a pedir en ${unidad}`}
            />
          </div>
        </div>

        {/* Fila inferior - Acciones */}
        {onGuardarProducto && (
          <div className="flex gap-1">
            {!isGuardado && (
              <>
                <button
                  onClick={() => handleQuickAction('inactive')}
                  className="flex-1 px-1.5 py-0.5 bg-gray-500 text-white rounded text-[9px] font-medium hover:bg-gray-600"
                  style={{ height: '18px' }}
                >
                  Inactivo
                </button>
                <button
                  onClick={() => handleQuickAction('zero')}
                  className="flex-1 px-1.5 py-0.5 bg-orange-500 text-white rounded text-[9px] font-medium hover:bg-orange-600"
                  style={{ height: '18px' }}
                >
                  En 0
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className="flex-1 px-1.5 py-0.5 bg-blue-500 text-white rounded text-[9px] font-medium hover:bg-blue-600 disabled:bg-gray-300"
                  style={{ height: '18px' }}
                >
                  {guardando ? <Loader2 className="w-2.5 h-2.5 animate-spin mx-auto" /> : 'Guardar'}
                </button>
              </>
            )}
            {isGuardado && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full px-1.5 py-0.5 bg-green-500 text-white rounded text-[9px] font-medium hover:bg-green-600"
                style={{ height: '18px' }}
              >
                ✓ Guardado
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const ProductoConteoMinimal = memo(ProductoConteoMinimalComponent);