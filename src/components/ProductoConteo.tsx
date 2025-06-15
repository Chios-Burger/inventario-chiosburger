import { useState, useEffect } from 'react';
import type { Producto } from '../types/index';
import { Package, Calculator } from 'lucide-react';

interface ProductoConteoProps {
  producto: Producto;
  unidad: string; // Unidad para cantidad a pedir (Bodega Principal)
  unidadBodega: string; // Unidad específica de la bodega actual
  onConteoChange: (productoId: string, conteo: {
    c1: number;
    c2: number;
    c3: number;
    cantidadPedir: number;
  }) => void;
}

export const ProductoConteo = ({ 
  producto, 
  unidad,
  unidadBodega,
  onConteoChange 
}: ProductoConteoProps) => {
  const [c1, setC1] = useState<number>(0);
  const [c2, setC2] = useState<number>(0);
  const [c3, setC3] = useState<number>(0);
  const [cantidadPedir, setCantidadPedir] = useState<number>(0);

  const total = c1 + c2 + c3;

  useEffect(() => {
    onConteoChange(producto.id, { c1, c2, c3, cantidadPedir });
  }, [c1, c2, c3, cantidadPedir, producto.id]);

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: string
  ) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (!isNaN(numValue)) {
      setter(numValue);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-3 border border-gray-100 hover:shadow-md transition-all duration-200">
      {/* Encabezado del producto - más compacto */}
      <div className="mb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-foodix-rojo" />
              {producto.fields['Nombre Producto']}
            </h3>
            {producto.fields['Categoría'] && (
              <p className="text-xs text-gray-500 mt-0.5 ml-6">
                {producto.fields['Categoría']}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Campos de conteo - más compactos */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <input
            type="number"
            step="0.01"
            value={c1 || ''}
            onChange={(e) => handleInputChange(setC1, e.target.value)}
            className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-foodix-rojo/20 focus:border-foodix-rojo focus:bg-white transition-all text-sm text-center"
            placeholder="C1"
          />
        </div>
        <div>
          <input
            type="number"
            step="0.01"
            value={c2 || ''}
            onChange={(e) => handleInputChange(setC2, e.target.value)}
            className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-foodix-rojo/20 focus:border-foodix-rojo focus:bg-white transition-all text-sm text-center"
            placeholder="C2"
          />
        </div>
        <div>
          <input
            type="number"
            step="0.01"
            value={c3 || ''}
            onChange={(e) => handleInputChange(setC3, e.target.value)}
            className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-foodix-rojo/20 focus:border-foodix-rojo focus:bg-white transition-all text-sm text-center"
            placeholder="C3"
          />
        </div>
      </div>

      {/* Total - más compacto */}
      <div className="bg-gray-50 px-3 py-2 rounded-lg mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Calculator className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Total:</span>
        </div>
        <span className="text-base font-bold text-gray-900">
          {total.toFixed(2)} <span className="text-xs font-normal text-gray-600">{unidadBodega}</span>
        </span>
      </div>

      {/* Cantidad a pedir y equivalencia en la misma línea */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Cantidad a pedir
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={cantidadPedir || ''}
                onChange={(e) => handleInputChange(setCantidadPedir, e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-foodix-rojo/20 focus:border-foodix-rojo focus:bg-white transition-all text-sm"
                placeholder="0"
              />
              <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
                {unidad}
              </span>
            </div>
          </div>
        </div>

        {/* Equivalencias */}
        {producto.fields['Equivalencias Inventarios'] && (
          <div className="bg-blue-50 border border-blue-100 px-2.5 py-1.5 rounded-lg">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">Equivalencia:</span>{' '}
              {producto.fields['Equivalencias Inventarios']}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};