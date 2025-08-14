import { useState, useEffect, memo } from 'react';
import type { Producto } from '../types/index';
import { Calculator, Loader2, Check, Edit3, XCircle, Ban } from 'lucide-react';

interface ProductoConteoCompactoProps {
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

const ProductoConteoCompactoComponent = ({ 
  producto, 
  unidad,
  unidadBodega: _unidadBodega,
  onConteoChange,
  onGuardarProducto,
  guardando = false,
  isGuardado = false,
  conteoInicial
}: ProductoConteoCompactoProps) => {
  // Estados duales: string para mostrar, number para cálculos
  const [c1Input, setC1Input] = useState<string>((conteoInicial?.c1 || 0).toString());
  const [c2Input, setC2Input] = useState<string>((conteoInicial?.c2 || 0).toString());
  const [c3Input, setC3Input] = useState<string>((conteoInicial?.c3 || 0).toString());
  const [cantidadPedirInput, setCantidadPedirInput] = useState<string>((conteoInicial?.cantidadPedir || 0).toString());
  
  // Función mejorada para parsear decimales
  const parseDecimal = (value: string): number => {
    if (!value || value === '' || value === '-') return 0;
    const normalizedValue = value.endsWith('.') ? value + '0' : value;
    const parsed = parseFloat(normalizedValue);
    return isNaN(parsed) ? 0 : parsed;
  };
  
  // Valores numéricos derivados
  const c1 = parseDecimal(c1Input);
  const c2 = parseDecimal(c2Input);
  const c3 = parseDecimal(c3Input);
  const cantidadPedir = parseDecimal(cantidadPedirInput);
  const [touched, setTouched] = useState(conteoInicial?.touched || false);
  const [savedValues, setSavedValues] = useState<{c1: number; c2: number; c3: number; cantidadPedir: number} | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const total = c1 + c2 + c3;
  const hasData = touched && (c1 > 0 || c2 > 0 || c3 > 0 || cantidadPedir > 0);
  const isInactive = c1 === -1 && c2 === -1 && c3 === -1;
  
  // Actualizar valores solo cuando cambie el producto
  useEffect(() => {
    if (conteoInicial && !touched) {
      setC1Input((conteoInicial.c1 || 0).toString());
      setC2Input((conteoInicial.c2 || 0).toString());
      setC3Input((conteoInicial.c3 || 0).toString());
      setCantidadPedirInput((conteoInicial.cantidadPedir || 0).toString());
      setTouched(conteoInicial.touched || false);
    }
  }, [producto.id]);
  
  // Función para obtener cantidad de decimales
  const getDecimalPlaces = (num: number): number => {
    const str = num.toString();
    const decimalIndex = str.indexOf('.');
    return decimalIndex === -1 ? 0 : str.length - decimalIndex - 1;
  };

  // Determinar máximo de decimales entre los conteos
  const maxDecimals = Math.max(
    getDecimalPlaces(c1),
    getDecimalPlaces(c2),
    getDecimalPlaces(c3)
  );
  
  // Verificar si los valores han cambiado desde el último guardado
  const hasChangedSinceSave = savedValues !== null && (
    savedValues.c1 !== c1 || 
    savedValues.c2 !== c2 || 
    savedValues.c3 !== c3 || 
    savedValues.cantidadPedir !== cantidadPedir
  );
  
  // Helper function para obtener el tipo del producto
  const obtenerTipoProducto = (fields: any): string => {
    const posiblesNombres = [
      'Tipo A,B o C',
      'Tipo A, B o C',
      'Tipo A,B,C',
      'Tipo A, B, C',
      'Tipo ABC',
      'TipoABC',
      'Tipo',
      'tipo'
    ];
    
    for (const nombre of posiblesNombres) {
      if (fields[nombre]) {
        return fields[nombre];
      }
    }
    
    return '';
  };
  
  const tipoProducto = obtenerTipoProducto(producto.fields);

  // Guardar cambios inmediatamente cuando se desmonte el componente
  useEffect(() => {
    return () => {
      if (touched) {
        onConteoChange(producto.id, { c1, c2, c3, cantidadPedir, touched: true });
      }
    };
  }, [c1, c2, c3, cantidadPedir, producto.id, touched]);

  // Enviar cambios inmediatamente cuando cambien los valores
  useEffect(() => {
    if (touched) {
      onConteoChange(producto.id, { c1, c2, c3, cantidadPedir, touched: true });
    }
  }, [c1, c2, c3, cantidadPedir, producto.id, touched]);

  // Cuando se guarda, almacenar los valores actuales
  useEffect(() => {
    if (isGuardado && !savedValues) {
      setSavedValues({ c1, c2, c3, cantidadPedir });
    }
  }, [isGuardado]);

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    setTouched(true);
    const cleanValue = value.replace(',', '.');
    
    if (cleanValue === '' || cleanValue === '-' || /^-?\d*\.?\d*$/.test(cleanValue)) {
      setter(cleanValue);
    }
  };
  
  const handleInputBlur = () => {
    if (touched) {
      onConteoChange(producto.id, { c1, c2, c3, cantidadPedir, touched: true });
    }
  };

  const handleGuardar = () => {
    if (onGuardarProducto) {
      if (showEditButton) {
        setIsEditing(true);
        onGuardarProducto(producto.id, false, null, true);
        return;
      }
      
      onGuardarProducto(producto.id);
      setSavedValues({ c1, c2, c3, cantidadPedir });
      setIsEditing(false);
    }
  };

  const handleProductoEnCero = () => {
    if (!onGuardarProducto) return;
    
    const nuevosValores = { c1: 0, c2: 0, c3: 0, cantidadPedir: cantidadPedir || 0, touched: true };
    
    setC1Input('0');
    setC2Input('0');
    setC3Input('0');
    setTouched(true);
    setSavedValues(nuevosValores);
    setIsEditing(false);
    
    onGuardarProducto(producto.id, true, nuevosValores);
  };

  const handleProductoInactivo = () => {
    if (!onGuardarProducto) return;
    
    const nuevosValores = { c1: -1, c2: -1, c3: -1, cantidadPedir: -1, touched: true };
    
    setC1Input('-1');
    setC2Input('-1');
    setC3Input('-1');
    setCantidadPedirInput('-1');
    setTouched(true);
    setSavedValues(nuevosValores);
    setIsEditing(false);
    
    onGuardarProducto(producto.id, true, nuevosValores);
  };

  const showEditButton = isGuardado && !hasChangedSinceSave && !isEditing;

  return (
    <div className={`relative bg-white rounded-lg shadow-sm p-2 transition-all duration-300 hover:shadow-md ${
      isInactive ? 'ring-1 ring-gray-300 bg-gray-50 opacity-75' :
      isGuardado ? 'ring-1 ring-green-300 bg-green-50/50' : ''
    }`}>
      {/* Badge de "No contado" */}
      {!isGuardado && !isInactive && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full shadow animate-pulse">
            NO CONTADO
          </div>
        </div>
      )}
      
      {/* Header del producto - Línea única */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => {/* Calculadora deshabilitada en versión compacta */}}
          className="p-1 bg-blue-50 rounded cursor-not-allowed opacity-50"
          disabled
        >
          <Calculator className="w-3 h-3 text-blue-600" />
        </button>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-[10px] font-semibold truncate ${
            isInactive ? 'text-gray-500 line-through' : 'text-gray-800'
          }`}>
            {producto.fields['Nombre Producto']}
            {isInactive && <span className="ml-1 text-[8px] font-normal">(INACTIVO)</span>}
          </h3>
          <div className="flex items-center gap-1 text-[8px] text-gray-500">
            {producto.fields['Categoría'] && (
              <span>{producto.fields['Categoría']}</span>
            )}
            {(producto.fields['Código'] || producto.fields['Codigo']) && (
              <>
                {producto.fields['Categoría'] && <span>•</span>}
                <span className="text-blue-600">#{producto.fields['Código'] || producto.fields['Codigo']}</span>
              </>
            )}
            {tipoProducto && (
              <>
                <span>•</span>
                <span className="text-purple-600">T:{tipoProducto}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grid de conteos - Más compacto */}
      <div className="grid grid-cols-4 gap-1 mb-2">
        <div>
          <label className="block text-[8px] font-medium text-gray-600 text-center">C1</label>
          <input
            type="search"
            inputMode="decimal"
            value={c1Input}
            onChange={(e) => handleInputChange(setC1Input, e.target.value)}
            onBlur={handleInputBlur}
            onFocus={(e) => e.target.select()}
            disabled={isGuardado && !isEditing}
            className={`w-full px-1 py-1 border rounded text-center font-medium text-[10px] ${
              isGuardado && !isEditing 
                ? 'bg-gray-100 border-gray-200 text-gray-600' 
                : 'bg-white border-gray-300 focus:ring-1 focus:ring-purple-400 focus:border-purple-400'
            }`}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-[8px] font-medium text-gray-600 text-center">C2</label>
          <input
            type="search"
            inputMode="decimal"
            value={c2Input}
            onChange={(e) => handleInputChange(setC2Input, e.target.value)}
            onBlur={handleInputBlur}
            onFocus={(e) => e.target.select()}
            disabled={isGuardado && !isEditing}
            className={`w-full px-1 py-1 border rounded text-center font-medium text-[10px] ${
              isGuardado && !isEditing 
                ? 'bg-gray-100 border-gray-200 text-gray-600' 
                : 'bg-white border-gray-300 focus:ring-1 focus:ring-purple-400 focus:border-purple-400'
            }`}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-[8px] font-medium text-gray-600 text-center">C3</label>
          <input
            type="search"
            inputMode="decimal"
            value={c3Input}
            onChange={(e) => handleInputChange(setC3Input, e.target.value)}
            onBlur={handleInputBlur}
            onFocus={(e) => e.target.select()}
            disabled={isGuardado && !isEditing}
            className={`w-full px-1 py-1 border rounded text-center font-medium text-[10px] ${
              isGuardado && !isEditing 
                ? 'bg-gray-100 border-gray-200 text-gray-600' 
                : 'bg-white border-gray-300 focus:ring-1 focus:ring-purple-400 focus:border-purple-400'
            }`}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-[8px] font-medium text-gray-600 text-center">Total</label>
          <div className={`px-1 py-1 rounded text-center ${
            isInactive ? 'bg-gray-100 border border-gray-200' : 
            'bg-purple-50 border border-purple-200'
          }`}>
            {isInactive ? (
              <span className="text-[10px] font-bold text-gray-500">N/A</span>
            ) : (
              <span className="text-[10px] font-bold text-purple-600">
                {maxDecimals > 0 ? total.toFixed(maxDecimals) : total}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sección inferior */}
      <div className="bg-gray-50 -mx-2 -mb-2 px-2 py-1.5 rounded-b-lg border-t border-gray-100">
        <div className="flex items-center gap-1 mb-1.5">
          <label className="text-[8px] font-medium text-gray-600">Pedir:</label>
          <input
            type="search"
            inputMode="decimal"
            value={cantidadPedirInput}
            onChange={(e) => handleInputChange(setCantidadPedirInput, e.target.value)}
            onBlur={handleInputBlur}
            onFocus={(e) => e.target.select()}
            disabled={isGuardado && !isEditing}
            className={`flex-1 px-1 py-0.5 border rounded text-[10px] font-medium ${
              isGuardado && !isEditing 
                ? 'bg-gray-100 border-gray-200 text-gray-600' 
                : 'bg-white border-gray-300 focus:ring-1 focus:ring-purple-400'
            }`}
            placeholder="0"
          />
          <span className="text-[8px] font-semibold text-gray-700 bg-purple-100 px-1 py-0.5 rounded">
            {unidad}
          </span>
        </div>

        {/* Equivalencias */}
        {producto.fields['Equivalencias Inventarios'] && (
          <div className="bg-blue-50 border border-blue-200 px-1 py-0.5 rounded mb-1">
            <p className="text-[8px] text-blue-800">
              <span className="font-bold">Eq:</span> {producto.fields['Equivalencias Inventarios']}
            </p>
          </div>
        )}
        
        {/* Botones en fila */}
        {onGuardarProducto && (
          <div className="flex gap-1">
            {/* Botón Producto inactivo */}
            {(!isGuardado || isEditing) && (
              <button
                onClick={handleProductoInactivo}
                disabled={guardando}
                className="flex-1 px-1 py-1 bg-gray-600 text-white rounded text-[8px] font-medium hover:bg-gray-700 flex items-center justify-center gap-0.5"
              >
                <Ban className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">Inactivo</span>
                <span className="sm:hidden">N/A</span>
              </button>
            )}
            
            {/* Botón Producto en 0 */}
            {(!isGuardado || isEditing) && (
              <button
                onClick={handleProductoEnCero}
                disabled={guardando}
                className="flex-1 px-1 py-1 bg-red-500 text-white rounded text-[8px] font-medium hover:bg-red-600 flex items-center justify-center gap-0.5"
              >
                <XCircle className="w-2.5 h-2.5" />
                <span>En 0</span>
              </button>
            )}
            
            {/* Botón Guardar/Editar */}
            <button
              onClick={handleGuardar}
              disabled={guardando || (!showEditButton && !hasChangedSinceSave && !isEditing && (!hasData || isGuardado))}
              className={`flex-1 px-1 py-1 rounded text-[8px] font-medium transition-all ${
                showEditButton
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : isGuardado && !hasChangedSinceSave && !isEditing
                  ? 'bg-green-500 text-white'
                  : guardando
                  ? 'bg-gray-200 text-gray-400'
                  : (hasData || hasChangedSinceSave || isEditing)
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {showEditButton ? (
                <span className="flex items-center justify-center gap-0.5">
                  <Edit3 className="w-2.5 h-2.5" />
                  Editar
                </span>
              ) : isGuardado && !hasChangedSinceSave && !isEditing ? (
                <span className="flex items-center justify-center gap-0.5">
                  <Check className="w-2.5 h-2.5" />
                  Guardado
                </span>
              ) : guardando ? (
                <span className="flex items-center justify-center gap-0.5">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ...
                </span>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProductoConteoCompacto = memo(ProductoConteoCompactoComponent);