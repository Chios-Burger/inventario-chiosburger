import { useState, useEffect, memo, useCallback } from 'react';
import type { Producto } from '../types/index';
import { Calculator, Loader2, Check, Hash, Edit3, XCircle, Ban, X } from 'lucide-react';

interface ProductoConteoProps {
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

const ProductoConteoComponent = ({ 
  producto, 
  unidad,
  unidadBodega,
  onConteoChange,
  onGuardarProducto,
  guardando = false,
  isGuardado = false,
  conteoInicial
}: ProductoConteoProps) => {
  // Estados duales: string para mostrar, number para cálculos
  const [c1Input, setC1Input] = useState<string>((conteoInicial?.c1 || 0).toString());
  const [c2Input, setC2Input] = useState<string>((conteoInicial?.c2 || 0).toString());
  const [c3Input, setC3Input] = useState<string>((conteoInicial?.c3 || 0).toString());
  const [cantidadPedirInput, setCantidadPedirInput] = useState<string>((conteoInicial?.cantidadPedir || 0).toString());
  
  // Valores numéricos derivados
  const c1 = parseFloat(c1Input) || 0;
  const c2 = parseFloat(c2Input) || 0;
  const c3 = parseFloat(c3Input) || 0;
  const cantidadPedir = parseFloat(cantidadPedirInput) || 0;
  const [touched, setTouched] = useState(conteoInicial?.touched || false);
  const [savedValues, setSavedValues] = useState<{c1: number; c2: number; c3: number; cantidadPedir: number} | null>(null);

  const total = c1 + c2 + c3;
  const hasData = touched && (c1 > 0 || c2 > 0 || c3 > 0 || cantidadPedir > 0);
  const isInactive = c1 === -1 && c2 === -1 && c3 === -1; // Producto marcado como inactivo
  
  // Actualizar valores solo cuando cambie el producto (no cuando el usuario esté escribiendo)
  useEffect(() => {
    if (conteoInicial && !touched) {
      setC1Input((conteoInicial.c1 || 0).toString());
      setC2Input((conteoInicial.c2 || 0).toString());
      setC3Input((conteoInicial.c3 || 0).toString());
      setCantidadPedirInput((conteoInicial.cantidadPedir || 0).toString());
      setTouched(conteoInicial.touched || false);
    }
  }, [producto.id]); // Solo cuando cambie el producto
  
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
      // Al desmontar, guardar el estado actual si hay datos
      if (touched) {
        onConteoChange(producto.id, { c1, c2, c3, cantidadPedir, touched: true });
      }
    };
  }, [c1, c2, c3, cantidadPedir, producto.id, touched]);

  // Enviar cambios inmediatamente cuando cambien los valores
  useEffect(() => {
    // Solo enviar cambios si el usuario tocó el producto
    if (touched) {
      onConteoChange(producto.id, { c1, c2, c3, cantidadPedir, touched: true });
    }
  }, [c1, c2, c3, cantidadPedir, producto.id, touched, isGuardado, onConteoChange]);

  // Cuando se guarda, almacenar los valores actuales
  useEffect(() => {
    if (isGuardado && !savedValues) {
      setSavedValues({ c1, c2, c3, cantidadPedir });
    }
  }, [isGuardado]); // Solo depender de isGuardado, no de los valores

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    console.log('Input change:', value); // Debug
    setTouched(true);
    
    // Reemplazar coma por punto
    const cleanValue = value.replace(',', '.');
    
    // Permitir: números, punto decimal, string vacío
    // Esta regex permite "5", "5.", "5.2", ".5", etc.
    if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
      setter(cleanValue);
    }
  };

  const handleGuardar = () => {
    if (onGuardarProducto) {
      // Si estamos en modo edición y no hay cambios, solo activar la edición
      if (showEditButton) {
        setIsEditing(true);
        // Llamar con flag de edición para remover de guardados
        onGuardarProducto(producto.id, false, null, true);
        return;
      }
      
      onGuardarProducto(producto.id);
      // Actualizar los valores guardados después de guardar
      setSavedValues({ c1, c2, c3, cantidadPedir });
      // Salir del modo edición
      setIsEditing(false);
    }
  };

  const handleProductoEnCero = () => {
    if (!onGuardarProducto) return;
    
    // Valores para producto en 0 - Mantener cantidad a pedir actual
    const nuevosValores = { c1: 0, c2: 0, c3: 0, cantidadPedir: cantidadPedir || 0, touched: true };
    
    // Actualizar estado local inmediatamente
    setC1Input('0');
    setC2Input('0');
    setC3Input('0');
    // Mantener cantidadPedir con su valor actual
    setTouched(true);
    setSavedValues(nuevosValores);
    setIsEditing(false);
    
    // Guardar automáticamente con flag de acción rápida
    onGuardarProducto(producto.id, true, nuevosValores);
  };

  const handleProductoInactivo = () => {
    if (!onGuardarProducto) return;
    
    // Valores para producto inactivo
    const nuevosValores = { c1: -1, c2: -1, c3: -1, cantidadPedir: -1, touched: true };
    
    // Actualizar estado local inmediatamente
    setC1Input('-1');
    setC2Input('-1');
    setC3Input('-1');
    setCantidadPedirInput('-1');
    setTouched(true);
    setSavedValues(nuevosValores);
    setIsEditing(false);
    
    // Llamar a guardar con flag de acción rápida
    onGuardarProducto(producto.id, true, nuevosValores);
  };

  // Estado para rastrear si estamos en modo edición
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado para el modal de calculadora - Optimizado con un solo estado
  const [calculatorState, setCalculatorState] = useState({
    show: false,
    value: '0',
    operation: '',
    previousValue: ''
  });
  
  // Función para manejar los botones de la calculadora - Optimizada con useCallback
  const handleCalculatorButton = useCallback((value: string) => {
    setCalculatorState(prevState => {
      const { value: calcValue, operation, previousValue } = prevState;
      
      if (value >= '0' && value <= '9') {
        // Números
        if (calcValue === '0') {
          return { ...prevState, value: value };
        } else if (operation && calcValue.includes(operation)) {
          // Si ya hay una operación, agregar el número después
          return { ...prevState, value: calcValue + value };
        } else {
          return { ...prevState, value: calcValue + value };
        }
      } else if (value === '.') {
        // Decimal
        const parts = calcValue.split(/[\+\-\*\/]/);
        const currentPart = parts[parts.length - 1];
        if (!currentPart.includes('.')) {
          return { ...prevState, value: calcValue + '.' };
        }
      } else if (['+', '-', '*', '/'].includes(value)) {
        // Operaciones
        if (!operation) {
          return {
            ...prevState,
            previousValue: calcValue,
            operation: value,
            value: calcValue + ' ' + value + ' '
          };
        }
      } else if (value === '=') {
        // Resultado
        if (previousValue && operation && calcValue.includes(operation)) {
          const parts = calcValue.split(operation);
          const current = parseFloat(parts[1]) || 0;
          const prev = parseFloat(previousValue);
          let result = 0;
          
          switch (operation) {
            case '+':
              result = prev + current;
              break;
            case '-':
              result = prev - current;
              break;
            case '*':
              result = prev * current;
              break;
            case '/':
              result = current !== 0 ? prev / current : 0;
              break;
          }
          
          return {
            ...prevState,
            value: result.toString(),
            previousValue: '',
            operation: ''
          };
        }
      }
      return prevState;
    });
  }, []);
  
  // Efecto para manejar el teclado cuando la calculadora está abierta - Optimizado
  useEffect(() => {
    if (!calculatorState.show) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // Solo prevenir default para teclas de calculadora
      if (['0','1','2','3','4','5','6','7','8','9','+','-','*','/','=','Enter','.','Backspace','Escape'].includes(e.key)) {
        e.preventDefault();
      }
      
      // Números
      if (e.key >= '0' && e.key <= '9') {
        handleCalculatorButton(e.key);
      }
      // Operaciones
      else if (['+', '-', '*', '/'].includes(e.key)) {
        handleCalculatorButton(e.key);
      }
      // Enter o = para calcular
      else if (e.key === 'Enter' || e.key === '=') {
        handleCalculatorButton('=');
      }
      // Punto decimal
      else if (e.key === '.') {
        handleCalculatorButton('.');
      }
      // Backspace para borrar
      else if (e.key === 'Backspace') {
        setCalculatorState(prevState => {
          if (prevState.value.length > 1) {
            return { ...prevState, value: prevState.value.slice(0, -1) };
          } else {
            return { ...prevState, value: '0' };
          }
        });
      }
      // Escape para limpiar
      else if (e.key === 'Escape') {
        setCalculatorState(prevState => ({
          ...prevState,
          value: '0',
          operation: '',
          previousValue: ''
        }));
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [calculatorState.show, handleCalculatorButton]);
  
  // Determinar qué botón mostrar
  const showEditButton = isGuardado && !hasChangedSinceSave && !isEditing;
  
  // Función para calcular el resultado pendiente
  const calcularResultadoPendiente = useCallback(() => {
    const { value: calcValue, operation, previousValue } = calculatorState;
    
    if (previousValue && operation && calcValue.includes(operation)) {
      const parts = calcValue.split(operation);
      
      // Validar que hay un segundo número
      if (parts[1]?.trim() === '' || parts[1] === undefined) {
        alert('Por favor completa la operación antes de guardar');
        return null;
      }
      
      const current = parseFloat(parts[1]) || 0;
      const prev = parseFloat(previousValue);
      
      let result = 0;
      switch (operation) {
        case '+':
          result = prev + current;
          break;
        case '-':
          result = prev - current;
          break;
        case '*':
          result = prev * current;
          break;
        case '/':
          if (current === 0) {
            alert('Error: División entre cero');
            return 0;
          }
          result = prev / current;
          break;
        default:
          return 0;
      }
      
      // Limitar decimales a 4
      return Math.round(result * 10000) / 10000;
    }
    return parseFloat(calcValue) || 0;
  }, [calculatorState]);
  

  return (
    <div className={`relative bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 transition-all duration-300 hover:shadow-xl ${
      isInactive ? 'ring-2 ring-gray-400 bg-gradient-to-br from-gray-100 to-gray-50 opacity-75' :
      isGuardado ? 'ring-2 ring-green-400 bg-gradient-to-br from-green-50 to-white' : ''
    }`}>
      {/* Badge de "No contado" */}
      {!isGuardado && !isInactive && (
        <div className="absolute -top-2 -right-2 z-10 pointer-events-none">
          <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
            NO CONTADO
          </div>
        </div>
      )}
      
      {/* Header del producto */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex items-start gap-2 sm:gap-3 flex-1 w-full">
          <div className="flex gap-1">
            <button
              onClick={() => {
              if (!isInactive) {
                setCalculatorState({
                  show: true,
                  value: '0',
                  operation: '',
                  previousValue: ''
                });
              }
            }}
              className={`p-3 sm:p-3 rounded-xl sm:rounded-2xl transition-all touch-manipulation min-w-[48px] min-h-[48px] ${
                isInactive ? 'bg-gray-200 cursor-not-allowed' :
                'bg-blue-100 hover:bg-blue-200 active:bg-blue-300 cursor-pointer'
              }`}
              title="Calculadora"
            >
              {isInactive ? (
                <Ban className="w-6 h-6 sm:w-6 sm:h-6 text-gray-600" />
              ) : (
                <Calculator className="w-6 h-6 sm:w-6 sm:h-6 text-blue-600" />
              )}
            </button>
          </div>
          <div className="flex-1">
            <h3 className={`text-base sm:text-lg font-bold leading-tight ${
              isInactive ? 'text-gray-500 line-through' : 'text-gray-800'
            }`}>
              {producto.fields['Nombre Producto']}
              {isInactive && <span className="ml-2 text-xs font-normal text-gray-500">(INACTIVO)</span>}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {producto.fields['Categoría'] && (
                <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {producto.fields['Categoría']}
                </p>
              )}
              {(producto.fields['Código'] || producto.fields['Codigo']) && (
                <>
                  {producto.fields['Categoría'] && <span className="text-gray-400">•</span>}
                  <p className="text-xs sm:text-sm text-blue-600 font-medium">
                    Código: {producto.fields['Código'] || producto.fields['Codigo']}
                  </p>
                </>
              )}
              {tipoProducto && (
                <>
                  {(producto.fields['Categoría'] || producto.fields['Código'] || producto.fields['Codigo']) && <span className="text-gray-400">•</span>}
                  <p className="text-xs sm:text-sm text-purple-600 font-medium">
                    Tipo: {tipoProducto}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
      

      {/* Grid de conteos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 sm:mb-2 text-center">
            Conteo 1
          </label>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            step="any"
            value={c1Input}
            onChange={(e) => handleInputChange(setC1Input, e.target.value)}
            onFocus={(e) => {
              e.target.select();
              console.log('Input focused'); // Debug
            }}
            onClick={(e) => {
              e.stopPropagation();
              console.log('Input clicked'); // Debug
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              console.log('Input touched'); // Debug
            }}
            disabled={isGuardado && !isEditing}
            readOnly={false}
            className={`w-full px-2 sm:px-3 py-3 sm:py-3.5 border-2 rounded-lg sm:rounded-xl transition-all text-center font-medium text-base sm:text-lg min-h-[44px] relative z-20 ${
              isGuardado && !isEditing 
                ? 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed' 
                : 'bg-white border-gray-300 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 cursor-text'
            }`}
            style={{ 
              WebkitUserSelect: 'text',
              touchAction: 'manipulation',
              fontSize: '16px'
            }}
            placeholder="0"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 sm:mb-2 text-center">
            Conteo 2
          </label>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            step="any"
            value={c2Input}
            onChange={(e) => handleInputChange(setC2Input, e.target.value)}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            disabled={isGuardado && !isEditing}
            readOnly={false}
            className={`w-full px-2 sm:px-3 py-3 sm:py-3.5 border-2 rounded-lg sm:rounded-xl transition-all text-center font-medium text-base sm:text-lg min-h-[44px] relative z-20 ${
              isGuardado && !isEditing 
                ? 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed' 
                : 'bg-white border-gray-300 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 cursor-text'
            }`}
            style={{ 
              WebkitUserSelect: 'text',
              touchAction: 'manipulation',
              fontSize: '16px'
            }}
            placeholder="0"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 sm:mb-2 text-center">
            Conteo 3
          </label>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            step="any"
            value={c3Input}
            onChange={(e) => handleInputChange(setC3Input, e.target.value)}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            disabled={isGuardado && !isEditing}
            readOnly={false}
            className={`w-full px-2 sm:px-3 py-3 sm:py-3.5 border-2 rounded-lg sm:rounded-xl transition-all text-center font-medium text-base sm:text-lg min-h-[44px] relative z-20 ${
              isGuardado && !isEditing 
                ? 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed' 
                : 'bg-white border-gray-300 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 cursor-text'
            }`}
            style={{ 
              WebkitUserSelect: 'text',
              touchAction: 'manipulation',
              fontSize: '16px'
            }}
            placeholder="0"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 sm:mb-2 text-center">
            Total
          </label>
          <div className={`px-2 sm:px-3 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-center ${
            isInactive ? 'bg-gray-100 border border-gray-300' : 
            'bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200'
          }`}>
            {isInactive ? (
              <span className="text-base sm:text-lg font-bold text-gray-500">N/A</span>
            ) : (
              <>
                <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {maxDecimals > 0 ? total.toFixed(maxDecimals) : total}
                </span>
                <span className="text-xs text-gray-600 ml-1 font-medium">{unidadBodega}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sección inferior */}
      <div className="bg-gray-50 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-3 sm:py-4 rounded-b-2xl sm:rounded-b-3xl border-t border-gray-100">
        <div className="w-full">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Cantidad a pedir
          </label>
          <div className="flex items-center gap-2 max-w-full">
            <input
              type="tel"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              step="0.01"
              value={cantidadPedirInput}
              onChange={(e) => handleInputChange(setCantidadPedirInput, e.target.value)}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              disabled={isGuardado && !isEditing}
              readOnly={false}
              className={`w-2/3 px-2 sm:px-3 py-2.5 sm:py-3 border-2 rounded-lg transition-all font-medium text-base min-h-[44px] relative z-20 ${
                isGuardado && !isEditing 
                  ? 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed' 
                  : 'bg-white border-gray-300 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 cursor-text'
              }`}
              style={{ 
                WebkitUserSelect: 'text',
                touchAction: 'manipulation',
                fontSize: '16px'
              }}
              placeholder="0"
              autoComplete="off"
            />
            <span className="w-1/3 text-xs font-semibold text-gray-700 bg-purple-100 px-2 sm:px-3 py-2 rounded-lg whitespace-nowrap flex-shrink-0 text-center">
              {unidad}
            </span>
          </div>
        </div>

        {/* Equivalencias */}
        {producto.fields['Equivalencias Inventarios'] && (
          <div className="mt-3 sm:mt-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl">
            <p className="text-xs font-medium text-blue-800">
              <span className="font-bold">Equivalencia:</span>{' '}
              {producto.fields['Equivalencias Inventarios']}
            </p>
          </div>
        )}
        
        {/* Botones en fila - Producto Inactivo, Producto en 0, Guardar */}
        {onGuardarProducto && (
          <div className="mt-3 sm:mt-4 w-full flex gap-2">
            {/* Botón Producto inactivo */}
            {(!isGuardado || isEditing) && (
              <button
                onClick={handleProductoInactivo}
                disabled={guardando}
                className="flex-1 px-2 sm:px-3 py-2 sm:py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl sm:rounded-2xl font-medium text-xs sm:text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-1 justify-center"
                title="Marcar como producto que ya no existe"
              >
                <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Producto inactivo</span>
                <span className="sm:hidden">Inactivo</span>
              </button>
            )}
            
            {/* Botón Producto en 0 */}
            {(!isGuardado || isEditing) && (
              <button
                onClick={handleProductoEnCero}
                disabled={guardando}
                className="flex-1 px-2 sm:px-3 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl sm:rounded-2xl font-medium text-xs sm:text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-1 justify-center"
                title="Marcar producto sin stock (cantidad 0)"
              >
                <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Producto en 0</span>
                <span className="sm:hidden">En 0</span>
              </button>
            )}
            
            {/* Botón Guardar/Editar */}
            <button
              onClick={handleGuardar}
              disabled={guardando || (!showEditButton && !hasChangedSinceSave && !isEditing && (!hasData || isGuardado))}
              className={`flex-1 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-medium text-xs sm:text-sm transition-all duration-300 ${
                showEditButton
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:shadow-lg transform hover:scale-105'
                  : isGuardado && !hasChangedSinceSave && !isEditing
                  ? 'bg-green-500 text-white cursor-default'
                  : guardando
                  ? 'bg-gray-200 text-gray-400'
                  : (hasData || hasChangedSinceSave || isEditing)
                  ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {showEditButton ? (
                <span className="flex items-center gap-1 justify-center">
                  <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                  Editar
                </span>
              ) : isGuardado && !hasChangedSinceSave && !isEditing ? (
                <span className="flex items-center gap-1 justify-center">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  Guardado
                </span>
              ) : guardando ? (
                <span className="flex items-center gap-1 justify-center">
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  Guardando
                </span>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        )}
      </div>
      
      
      {/* Modal de Calculadora 2 - Pantalla Completa */}
      {calculatorState.show && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col">
          {/* Header de la calculadora */}
          <div className="bg-blue-600 text-white p-2.5 sm:p-4 flex-shrink-0">
            <div className="flex justify-between items-center mb-1.5 sm:mb-3">
              <h3 className="text-sm sm:text-lg font-bold">Calculadora</h3>
              <button
                onClick={() => {
                  setCalculatorState({
                    show: false,
                    value: '0',
                    operation: '',
                    previousValue: ''
                  });
                }}
                className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Información del producto */}
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-medium">{producto.fields['Nombre Producto']}</p>
              <p>Unidad de conteo: <span className="font-semibold">{unidad}</span></p>
              <p>Unidad para pedir: <span className="font-semibold">{unidadBodega}</span></p>
              {producto.fields['Equivalencias Inventarios'] && (
                <p className="text-xs bg-blue-700 p-2 rounded mt-2">
                  Equivalencia: {producto.fields['Equivalencias Inventarios']}
                </p>
              )}
            </div>
          </div>
          
          {/* Display de la calculadora */}
          <div className="bg-gray-100 p-3 sm:p-4 flex-shrink-0">
            <div className="bg-white p-2 sm:p-3 rounded-lg text-right text-lg sm:text-2xl font-mono">
              {calculatorState.value}
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              Puedes usar el teclado • Esc=Limpiar
            </p>
          </div>
          
          {/* Contenedor de botones que ocupa el resto */}
          <div className="flex-1 bg-gray-50 p-3 flex flex-col">
            {/* Botones de guardado arriba */}
            <div className="mb-3">
              <p className="text-xs text-gray-600 font-medium mb-2">Guardar en:</p>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    const finalValue = calcularResultadoPendiente();
                    if (finalValue !== null) {
                      handleInputChange(setC1Input, finalValue.toString());
                      setCalculatorState({
                        show: false,
                        value: '0',
                        operation: '',
                        previousValue: ''
                      });
                    }
                  }}
                  className="p-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 active:bg-green-700"
                >
                  C1
                </button>
                <button
                  onClick={() => {
                    const finalValue = calcularResultadoPendiente();
                    if (finalValue !== null) {
                      handleInputChange(setC2Input, finalValue.toString());
                      setCalculatorState({
                        show: false,
                        value: '0',
                        operation: '',
                        previousValue: ''
                      });
                    }
                  }}
                  className="p-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 active:bg-green-700"
                >
                  C2
                </button>
                <button
                  onClick={() => {
                    const finalValue = calcularResultadoPendiente();
                    if (finalValue !== null) {
                      handleInputChange(setC3Input, finalValue.toString());
                      setCalculatorState({
                        show: false,
                        value: '0',
                        operation: '',
                        previousValue: ''
                      });
                    }
                  }}
                  className="p-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 active:bg-green-700"
                >
                  C3
                </button>
                <button
                  onClick={() => {
                    const finalValue = calcularResultadoPendiente();
                    if (finalValue !== null) {
                      handleInputChange(setCantidadPedirInput, finalValue.toString());
                      setCalculatorState({
                        show: false,
                        value: '0',
                        operation: '',
                        previousValue: ''
                      });
                    }
                  }}
                  className="p-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 active:bg-purple-700"
                >
                  Pedir
                </button>
              </div>
            </div>
            
            {/* Grilla de números expandida */}
            <div className="flex-1 grid grid-cols-4 gap-2">
              {/* Números y operaciones */}
              {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'].map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleCalculatorButton(btn)}
                  className={`rounded-lg font-bold text-lg transition-all ${
                    ['/', '*', '-', '+', '='].includes(btn)
                      ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
                      : 'bg-white hover:bg-gray-100 active:bg-gray-200 border border-gray-200'
                  }`}
                >
                  {btn}
                </button>
              ))}
              
              {/* Botones especiales en la última fila */}
              <button
                onClick={() => {
                  setCalculatorState(prevState => ({
                    ...prevState,
                    value: '0',
                    operation: '',
                    previousValue: ''
                  }));
                }}
                className="bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 active:bg-red-700"
              >
                C
              </button>
              <button
                onClick={() => {
                  setCalculatorState(prevState => {
                    if (prevState.value.length > 1) {
                      return { ...prevState, value: prevState.value.slice(0, -1) };
                    } else {
                      return { ...prevState, value: '0' };
                    }
                  });
                }}
                className="bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 active:bg-orange-700"
              >
                ←
              </button>
              <button
                onClick={() => {
                  setCalculatorState(prevState => {
                    const current = parseFloat(prevState.value) || 0;
                    return { ...prevState, value: (current * -1).toString() };
                  });
                }}
                className="bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 active:bg-gray-800 col-span-2"
              >
                +/-
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProductoConteo = memo(ProductoConteoComponent);