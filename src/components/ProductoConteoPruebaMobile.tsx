import { useState, useEffect, memo, useCallback } from 'react';
import type { Producto } from '../types/index';
import { Loader2, Edit3, XCircle, Ban } from 'lucide-react';

interface ProductoConteoPruebaMobileProps {
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
  sizePercentage?: number; // Porcentaje de aumento (0-100)
}

// Función para calcular configuración dinámica basada en porcentaje
const calculateSizeConfig = (percentage: number = 0) => {
  const factor = 1 + (percentage / 100);

  // Tamaños base (100%)
  const baseInputHeight = 20;
  const baseFontNombre = 9;
  const baseFontCodigo = 8;
  const baseFontBadge = 12;
  const baseFontTotal = 8;
  const baseFontUnidad = 7;
  const baseFontEq = 6;
  const basePaddingY = 2;
  const basePaddingX = 4;
  const baseGap = 2;
  const baseRounded = 12;
  const baseBarWidth = 4;
  const baseIconSize = 12;

  // Calcular tamaños con el factor
  const inputHeight = Math.round(baseInputHeight * factor);
  const fontNombre = Math.round(baseFontNombre * factor);
  const fontCodigo = Math.round(baseFontCodigo * factor);
  const fontBadge = Math.round(baseFontBadge * factor);
  const fontTotal = Math.round(baseFontTotal * factor);
  const fontUnidad = Math.round(baseFontUnidad * factor);
  const fontEq = Math.round(baseFontEq * factor);
  const paddingY = Math.max(2, Math.round(basePaddingY * factor));
  const paddingX = Math.max(4, Math.round(basePaddingX * factor));
  const gap = Math.max(2, Math.round(baseGap * factor));
  const rounded = Math.round(baseRounded * factor);
  const barWidth = Math.max(4, Math.round(baseBarWidth * factor));
  const iconSize = Math.round(baseIconSize * factor);

  // Convertir a Tailwind classes
  const getPaddingClass = (y: number, x: number) => {
    const pyMap: {[key: number]: string} = {2: 'py-0.5', 3: 'py-1', 4: 'py-1', 5: 'py-1.5', 6: 'py-2'};
    const pxMap: {[key: number]: string} = {4: 'px-1', 5: 'px-1', 6: 'px-1.5', 7: 'px-2', 8: 'px-2'};
    return `${pyMap[y] || 'py-1'} ${pxMap[x] || 'px-1.5'}`;
  };

  const getGapClass = (g: number) => g <= 2 ? 'gap-0.5' : 'gap-1';
  const getMbClass = (g: number) => g <= 2 ? 'mb-0.5' : 'mb-1';
  const getRoundedClass = (r: number) => r <= 12 ? 'rounded-xl' : 'rounded-2xl';

  return {
    inputHeight: `${inputHeight}px`,
    inputFontSize: `${fontNombre}px`,
    textNombre: `text-[${fontNombre}px]`,
    textCodigo: `text-[${fontCodigo}px]`,
    textCategoria: `text-[${fontCodigo}px]`,
    textBadge: fontBadge >= 14 ? 'text-sm' : 'text-xs',
    textTotal: `text-[${fontTotal}px]`,
    textUnidad: `text-[${fontUnidad}px]`,
    textPedir: `text-[${fontTotal}px]`,
    textEq: `text-[${fontEq}px]`,
    textButton: `text-[${fontTotal}px]`,
    padding: getPaddingClass(paddingY, paddingX),
    gap: getGapClass(gap),
    gapMb: getMbClass(gap),
    rounded: getRoundedClass(rounded),
    barWidth: `w-[${barWidth}px]`,
    buttonHeight: `h-[${inputHeight}px]`,
    iconSize: `w-${Math.floor(iconSize/4)} h-${Math.floor(iconSize/4)}` // Convertir px a Tailwind (4px = 1 unit)
  };
};

const ProductoConteoPruebaMobileComponent = ({
  producto,
  unidad,
  unidadBodega,
  onConteoChange,
  onGuardarProducto,
  guardando = false,
  isGuardado = false,
  conteoInicial,
  sizePercentage = 0 // Por defecto 0% (tamaño original)
}: ProductoConteoPruebaMobileProps) => {
  // Calcular configuración dinámica basada en porcentaje
  const config = calculateSizeConfig(sizePercentage);

  // Crear estilos con !important usando setProperty
  const createInputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      node.style.setProperty('height', config.inputHeight, 'important');
      node.style.setProperty('min-height', config.inputHeight, 'important');
      node.style.setProperty('max-height', config.inputHeight, 'important');
      node.style.setProperty('font-size', config.inputFontSize, 'important');
      node.style.setProperty('line-height', config.inputHeight, 'important');
      node.style.setProperty('padding', '0 4px', 'important');
      node.style.setProperty('margin', '0', 'important');
      node.style.setProperty('box-sizing', 'border-box', 'important');
    }
  }, [config.inputHeight, config.inputFontSize]);

  const inputRef1 = createInputRef;
  const inputRef2 = createInputRef;
  const inputRef3 = createInputRef;
  const inputRefPedir = createInputRef;

  // Estados duales: string para mostrar, number para cálculos (IGUAL QUE DESKTOP)
  const [c1Input, setC1Input] = useState<string>((conteoInicial?.c1 || 0).toString());
  const [c2Input, setC2Input] = useState<string>((conteoInicial?.c2 || 0).toString());
  const [c3Input, setC3Input] = useState<string>((conteoInicial?.c3 || 0).toString());
  const [cantidadPedirInput, setCantidadPedirInput] = useState<string>((conteoInicial?.cantidadPedir || 0).toString());

  // Función mejorada para parsear decimales (IGUAL QUE DESKTOP)
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

  // Helper function para obtener el tipo del producto (IGUAL QUE DESKTOP)
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

    // Reemplazar coma por punto
    const cleanValue = value.replace(',', '.');

    // Permitir: números, punto decimal, string vacío, números negativos
    if (cleanValue === '' || cleanValue === '-' || /^-?\d*\.?\d*$/.test(cleanValue)) {
      setter(cleanValue);
    }
  };

  // Handler para cuando el input pierde el foco
  const handleInputBlur = () => {
    if (touched) {
      onConteoChange(producto.id, { c1, c2, c3, cantidadPedir, touched: true });
    }
  };

  const handleGuardar = () => {
    if (onGuardarProducto) {
      // Si estamos en modo edición y no hay cambios, solo activar la edición
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

  // Determinar qué botón mostrar
  const showEditButton = isGuardado && !hasChangedSinceSave && !isEditing;

  // Determinar el estado del producto para las barras de colores
  const getEstado = () => {
    if (isInactive) {
      return { color: 'bg-gray-500', texto: 'Inactivo' };
    }
    if (isGuardado) {
      return { color: 'bg-green-500', texto: 'Guardado' };
    }
    if (c1 === 0 && c2 === 0 && c3 === 0 && touched) {
      return { color: 'bg-orange-500', texto: 'En cero' };
    }
    return { color: 'bg-yellow-500', texto: 'Pendiente' };
  };

  const estado = getEstado();

  return (
    <div className={`
      relative overflow-hidden ${config.rounded} transition-all duration-300 w-full
      ${isInactive ? 'ring-2 ring-gray-400 bg-gradient-to-br from-gray-100 to-gray-50 opacity-75' :
        isGuardado ? 'ring-2 ring-green-400 bg-gradient-to-br from-green-50 to-white' :
        'bg-white hover:shadow-xl shadow-md'}
    `}>
      {/* Badge de "No contado" */}
      {!isGuardado && !isInactive && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className={`bg-red-500 text-white ${config.textBadge} font-bold px-2 py-1 rounded-full shadow-lg animate-pulse`}>
            NO CONTADO
          </div>
        </div>
      )}

      {/* Barra de estado izquierda */}
      <div className={`absolute top-0 left-0 h-full ${config.barWidth} ${isGuardado ? 'bg-green-500' : 'bg-purple-500'}`} />
      {/* Barra de estado derecha */}
      <div className={`absolute top-0 right-0 h-full ${config.barWidth} ${estado.color}`} />

      <div className={`${config.padding} w-full`}>
        {/* Header */}
        <div className={`flex items-center ${config.gap} ${config.gapMb}`}>
          <span className={`${config.textNombre} font-medium truncate flex-[3] min-w-0 ${
            isInactive ? 'text-gray-500 line-through' : 'text-gray-800'
          }`}>
            {producto.fields['Nombre Producto']}
            {isInactive && <span className={`ml-1 ${config.textCodigo} font-normal`}>(INACTIVO)</span>}
          </span>
          {tipoProducto && (
            <span className={`${config.textCodigo} text-purple-600 flex-shrink-0`}>
              {producto.fields['Código'] || ''}{producto.fields['Código'] ? '-' : ''}{tipoProducto}
            </span>
          )}
          <span className={`${config.textCategoria} text-gray-600 truncate flex-1 min-w-0 text-right`}>
            {producto.fields['Categoría'] || '-'}
          </span>
        </div>

        {/* Controles de entrada */}
        <div className={`bg-gray-50/50 rounded-lg p-0.5 backdrop-blur w-full`}>
          {/* Primera línea: Cantidades y Total con unidad */}
          <div className={`grid grid-cols-4 ${config.gap} ${config.gapMb}`}>
            {/* C1 */}
            <input
              ref={inputRef1}
              type="text"
              inputMode="decimal"
              pattern="[0-9.-]*"
              value={c1Input}
              onChange={(e) => handleInputChange(setC1Input, e.target.value)}
              onBlur={handleInputBlur}
              onFocus={(e) => e.target.select()}
              disabled={isGuardado && !isEditing}
              className={`col-span-1 text-center font-medium rounded transition-colors ${
                isGuardado && !isEditing
                  ? 'bg-gray-100 text-gray-600 border border-gray-200'
                  : 'bg-white border border-gray-200 focus:border-purple-500 focus:outline-none'
              }`}
              placeholder="0"
            />

            {/* C2 */}
            <input
              ref={inputRef2}
              type="text"
              inputMode="decimal"
              pattern="[0-9.-]*"
              value={c2Input}
              onChange={(e) => handleInputChange(setC2Input, e.target.value)}
              onBlur={handleInputBlur}
              onFocus={(e) => e.target.select()}
              disabled={isGuardado && !isEditing}
              className={`col-span-1 text-center font-medium rounded transition-colors ${
                isGuardado && !isEditing
                  ? 'bg-gray-100 text-gray-600 border border-gray-200'
                  : 'bg-white border border-gray-200 focus:border-purple-500 focus:outline-none'
              }`}
              placeholder="0"
            />

            {/* C3 */}
            <input
              ref={inputRef3}
              type="text"
              inputMode="decimal"
              pattern="[0-9.-]*"
              value={c3Input}
              onChange={(e) => handleInputChange(setC3Input, e.target.value)}
              onBlur={handleInputBlur}
              onFocus={(e) => e.target.select()}
              disabled={isGuardado && !isEditing}
              className={`col-span-1 text-center font-medium rounded transition-colors ${
                isGuardado && !isEditing
                  ? 'bg-gray-100 text-gray-600 border border-gray-200'
                  : 'bg-white border border-gray-200 focus:border-purple-500 focus:outline-none'
              }`}
              placeholder="0"
            />

            {/* Total con unidad */}
            <div
              className={`col-span-1 rounded flex items-center justify-center font-bold ${config.textTotal} px-1 box-border ${
                isInactive ? 'bg-gray-100 border border-gray-300' :
                'bg-gradient-to-r from-blue-500 to-purple-500 text-white border border-blue-500'
              }`}
              style={{ height: config.inputHeight }}
            >
              {isInactive ? (
                <span className="text-gray-500">N/A</span>
              ) : (
                <>
                  <span style={{ lineHeight: config.inputHeight }}>{maxDecimals > 0 ? total.toFixed(maxDecimals) : total}</span>
                  <span className={`${config.textUnidad} ml-0.5 opacity-90`} style={{ lineHeight: config.inputHeight }}>{unidadBodega}</span>
                </>
              )}
            </div>
          </div>

          {/* Segunda línea: Pedir, unidad y equivalencia */}
          <div className={`grid grid-cols-4 ${config.gap} ${config.gapMb}`}>
            {/* Input PEDIR */}
            <input
              ref={inputRefPedir}
              type="text"
              inputMode="decimal"
              pattern="[0-9.-]*"
              value={cantidadPedirInput}
              onChange={(e) => handleInputChange(setCantidadPedirInput, e.target.value)}
              onBlur={handleInputBlur}
              onFocus={(e) => e.target.select()}
              disabled={isGuardado && !isEditing}
              placeholder="PEDIR"
              className={`col-span-1 text-center font-medium rounded transition-colors ${
                isGuardado && !isEditing
                  ? 'bg-gray-100 text-gray-600 border border-gray-200'
                  : `bg-amber-50 border border-amber-300 focus:border-amber-500 focus:outline-none placeholder:text-amber-400 ${config.textPedir}`
              }`}
            />

            {/* Unidad */}
            <div
              className="col-span-1 flex items-center justify-center box-border"
              style={{ height: config.inputHeight }}
            >
              <span className={`${config.textPedir} text-amber-700 font-medium`}>{unidad}</span>
            </div>

            {/* Equivalencias */}
            {producto.fields['Equivalencias Inventarios'] ? (
              <div
                className="col-span-2 flex items-center overflow-hidden px-1 box-border"
                style={{ height: config.inputHeight }}
              >
                <span className={`${config.textEq} text-blue-800 font-bold`}>
                  <span className="font-bold">Eq:</span> {producto.fields['Equivalencias Inventarios']}
                </span>
              </div>
            ) : (
              <div className="col-span-2" style={{ height: config.inputHeight }} />
            )}
          </div>

          {/* Tercera línea: Botones */}
          <div className={`flex ${config.gap}`}>
            {/* Botón Producto inactivo */}
            {(!isGuardado || isEditing) && (
              <button
                onClick={handleProductoInactivo}
                disabled={guardando}
                className={`flex-1 ${config.buttonHeight} bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded ${config.textButton} font-bold hover:shadow-md transition-all flex items-center gap-0.5 justify-center`}
                title="Marcar como inactivo"
              >
                <Ban className={config.iconSize} />
                INACTIVO
              </button>
            )}

            {/* Botón Producto en 0 */}
            {(!isGuardado || isEditing) && (
              <button
                onClick={handleProductoEnCero}
                disabled={guardando}
                className={`flex-1 ${config.buttonHeight} bg-gradient-to-r from-red-500 to-red-600 text-white rounded ${config.textButton} font-bold hover:shadow-md transition-all flex items-center gap-0.5 justify-center`}
                title="Marcar en cero"
              >
                <XCircle className={config.iconSize} />
                CERO
              </button>
            )}

            {/* Botón Guardar/Editar */}
            {onGuardarProducto && (
              <button
                onClick={handleGuardar}
                disabled={guardando || (!showEditButton && !hasChangedSinceSave && !isEditing && (!hasData || isGuardado))}
                className={`flex-1 ${config.buttonHeight} rounded ${config.textButton} font-bold transition-all hover:shadow-md ${
                  showEditButton
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                    : isGuardado && !hasChangedSinceSave && !isEditing
                    ? 'bg-green-500 text-white cursor-default'
                    : guardando
                    ? 'bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed'
                    : (hasData || hasChangedSinceSave || isEditing)
                    ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {showEditButton ? (
                  <span className="flex items-center gap-0.5 justify-center">
                    <Edit3 className={config.iconSize} />
                    EDITAR
                  </span>
                ) : isGuardado && !hasChangedSinceSave && !isEditing ? (
                  '✓'
                ) : guardando ? (
                  <span className="flex items-center gap-0.5 justify-center">
                    <Loader2 className={`${config.iconSize} animate-spin`} />
                    ...
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
  );
};

export const ProductoConteoPruebaMobile = memo(ProductoConteoPruebaMobileComponent);
