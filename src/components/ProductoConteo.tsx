import { useState, useEffect, memo } from 'react';
import type { Producto } from '../types/index';
import { Package, Loader2, Check, Hash, Edit3, XCircle, Ban } from 'lucide-react';

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
  const [c1, setC1] = useState<number>(conteoInicial?.c1 || 0);
  const [c2, setC2] = useState<number>(conteoInicial?.c2 || 0);
  const [c3, setC3] = useState<number>(conteoInicial?.c3 || 0);
  const [cantidadPedir, setCantidadPedir] = useState<number>(conteoInicial?.cantidadPedir || 0);
  const [touched, setTouched] = useState(conteoInicial?.touched || false);
  const [savedValues, setSavedValues] = useState<{c1: number; c2: number; c3: number; cantidadPedir: number} | null>(null);

  const total = c1 + c2 + c3;
  const hasData = touched && (c1 > 0 || c2 > 0 || c3 > 0 || cantidadPedir > 0);
  const isInactive = c1 === -1 && c2 === -1 && c3 === -1; // Producto marcado como inactivo
  
  // Actualizar valores solo cuando cambie el producto (no cuando el usuario esté escribiendo)
  useEffect(() => {
    if (conteoInicial && !touched) {
      setC1(conteoInicial.c1 || 0);
      setC2(conteoInicial.c2 || 0);
      setC3(conteoInicial.c3 || 0);
      setCantidadPedir(conteoInicial.cantidadPedir || 0);
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
    // Solo enviar el cambio si el usuario ha tocado el producto
    if (touched || isGuardado) {
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
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: string
  ) => {
    setTouched(true);
    const numValue = value === '' ? 0 : parseFloat(value);
    if (!isNaN(numValue)) {
      setter(numValue);
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
    setC1(0);
    setC2(0);
    setC3(0);
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
    setC1(-1);
    setC2(-1);
    setC3(-1);
    setCantidadPedir(-1);
    setTouched(true);
    setSavedValues(nuevosValores);
    setIsEditing(false);
    
    // Llamar a guardar con flag de acción rápida
    onGuardarProducto(producto.id, true, nuevosValores);
  };

  // Estado para rastrear si estamos en modo edición
  const [isEditing, setIsEditing] = useState(false);
  
  // Determinar qué botón mostrar
  const showEditButton = isGuardado && !hasChangedSinceSave && !isEditing;

  return (
    <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 transition-all duration-300 hover:shadow-xl ${
      isInactive ? 'ring-2 ring-gray-400 bg-gradient-to-br from-gray-100 to-gray-50 opacity-75' :
      isGuardado ? 'ring-2 ring-green-400 bg-gradient-to-br from-green-50 to-white' : ''
    }`}>
      {/* Header del producto */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full">
          <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${
            isInactive ? 'bg-gray-200' :
            isGuardado ? 'bg-green-100' : 'bg-purple-100'
          }`}>
            {isInactive ? (
              <Ban className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            ) : (
              <Package className={`w-5 h-5 sm:w-6 sm:h-6 ${
                isGuardado ? 'text-green-600' : 'text-purple-600'
              }`} />
            )}
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
            type="number"
            step="0.01"
            value={c1 || ''}
            onChange={(e) => handleInputChange(setC1, e.target.value)}
            disabled={isGuardado && !isEditing}
            className={`w-full px-2 sm:px-3 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl transition-all text-center font-medium text-sm sm:text-base ${
              isGuardado && !isEditing 
                ? 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed' 
                : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white'
            }`}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 sm:mb-2 text-center">
            Conteo 2
          </label>
          <input
            type="number"
            step="0.01"
            value={c2 || ''}
            onChange={(e) => handleInputChange(setC2, e.target.value)}
            disabled={isGuardado && !isEditing}
            className={`w-full px-2 sm:px-3 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl transition-all text-center font-medium text-sm sm:text-base ${
              isGuardado && !isEditing 
                ? 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed' 
                : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white'
            }`}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 sm:mb-2 text-center">
            Conteo 3
          </label>
          <input
            type="number"
            step="0.01"
            value={c3 || ''}
            onChange={(e) => handleInputChange(setC3, e.target.value)}
            disabled={isGuardado && !isEditing}
            className={`w-full px-2 sm:px-3 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl transition-all text-center font-medium text-sm sm:text-base ${
              isGuardado && !isEditing 
                ? 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed' 
                : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white'
            }`}
            placeholder="0"
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
              type="number"
              step="0.01"
              value={cantidadPedir || ''}
              onChange={(e) => handleInputChange(setCantidadPedir, e.target.value)}
              disabled={isGuardado && !isEditing}
              className={`w-2/3 px-2 sm:px-3 py-2 sm:py-2.5 border rounded-lg transition-all font-medium text-sm ${
                isGuardado && !isEditing 
                  ? 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed' 
                  : 'bg-white border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-purple-400'
              }`}
              placeholder="0"
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
    </div>
  );
};

export const ProductoConteo = memo(ProductoConteoComponent);