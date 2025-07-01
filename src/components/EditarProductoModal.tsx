import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ProductoHistorico } from '../types';

interface EditarProductoModalProps {
  producto: ProductoHistorico;
  registro: {
    id: string;
    fecha: string;
    bodega: string;
    bodegaId: number;
  };
  onClose: () => void;
  onGuardar: (productoId: string, nuevoTotal: number, nuevaCantidadPedir: number, motivo: string) => Promise<void>;
}

export const EditarProductoModal = ({ producto, registro, onClose, onGuardar }: EditarProductoModalProps) => {
  const [nuevoTotal, setNuevoTotal] = useState(producto.total.toString());
  const [nuevaCantidadPedir, setNuevaCantidadPedir] = useState(producto.cantidadPedir.toString());
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const diferenciaTotal = parseFloat(nuevoTotal || '0') - producto.total;
  const diferenciaCantidad = parseFloat(nuevaCantidadPedir || '0') - producto.cantidadPedir;
  const haysCambios = diferenciaTotal !== 0 || diferenciaCantidad !== 0;

  const formatearNumero = (num: number): string => {
    return num.toLocaleString('es-EC', { 
      minimumFractionDigits: 3,
      maximumFractionDigits: 3 
    });
  };

  const handleGuardar = async () => {
    if (!haysCambios) {
      onClose();
      return;
    }

    const valorTotal = parseFloat(nuevoTotal);
    const valorCantidad = parseFloat(nuevaCantidadPedir);
    
    if (isNaN(valorTotal) || valorTotal < 0) {
      setError('El total debe ser un número válido mayor o igual a 0');
      return;
    }
    
    if (isNaN(valorCantidad) || valorCantidad < 0) {
      setError('La cantidad a pedir debe ser un número válido mayor o igual a 0');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      await onGuardar(producto.id, valorTotal, valorCantidad, motivo);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Error al guardar los cambios');
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Editar Producto</h2>
              <p className="text-purple-100 mt-1">{producto.nombre}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              disabled={guardando}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Información del registro */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-600">Bodega:</span>
                <p className="font-medium">{registro.bodega}</p>
              </div>
              <div>
                <span className="text-gray-600">Fecha:</span>
                <p className="font-medium">{registro.fecha}</p>
              </div>
              <div>
                <span className="text-gray-600">Unidad:</span>
                <p className="font-medium">{producto.unidad || '-'}</p>
              </div>
              <div>
                <span className="text-gray-600">Unidad Pedido:</span>
                <p className="font-medium">{producto.unidadBodega || '-'}</p>
              </div>
            </div>
          </div>

          {/* Conteos */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">Conteos registrados:</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-xs text-purple-600 font-medium">Conteo 1</p>
                <p className="text-lg font-bold text-purple-700">{formatearNumero(producto.c1)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-blue-600 font-medium">Conteo 2</p>
                <p className="text-lg font-bold text-blue-700">{formatearNumero(producto.c2)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-green-600 font-medium">Conteo 3</p>
                <p className="text-lg font-bold text-green-700">{formatearNumero(producto.c3)}</p>
              </div>
            </div>
          </div>

          {/* Total actual */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Total actual:</span>
              <span className="text-xl font-bold">{formatearNumero(producto.total)}</span>
            </div>

            {/* Nuevo total */}
            <div className="space-y-2">
              <label htmlFor="nuevoTotal" className="block text-sm font-medium text-gray-700">
                Nuevo total:
              </label>
              <input
                id="nuevoTotal"
                type="number"
                step="0.001"
                value={nuevoTotal}
                onChange={(e) => setNuevoTotal(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg font-bold"
                disabled={guardando}
              />
            </div>

            {/* Diferencia Total */}
            {diferenciaTotal !== 0 && (
              <div className={`mt-3 p-3 rounded-lg ${diferenciaTotal > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-sm font-medium">
                  Diferencia Total: 
                  <span className={`ml-2 text-lg font-bold ${diferenciaTotal > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {diferenciaTotal > 0 ? '+' : ''}{formatearNumero(diferenciaTotal)}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Cantidad a Pedir */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Cantidad a pedir actual:</span>
              <span className="text-xl font-bold">{formatearNumero(producto.cantidadPedir)}</span>
            </div>

            <div className="space-y-2">
              <label htmlFor="nuevaCantidadPedir" className="block text-sm font-medium text-gray-700">
                Nueva cantidad a pedir:
              </label>
              <input
                id="nuevaCantidadPedir"
                type="number"
                step="0.001"
                value={nuevaCantidadPedir}
                onChange={(e) => setNuevaCantidadPedir(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg font-bold"
                disabled={guardando}
              />
            </div>

            {/* Diferencia Cantidad */}
            {diferenciaCantidad !== 0 && (
              <div className={`mt-3 p-3 rounded-lg ${diferenciaCantidad > 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <p className="text-sm font-medium">
                  Diferencia Cantidad a Pedir: 
                  <span className={`ml-2 text-lg font-bold ${diferenciaCantidad > 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {diferenciaCantidad > 0 ? '+' : ''}{formatearNumero(diferenciaCantidad)}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <label htmlFor="motivo" className="block text-sm font-medium text-gray-700">
              Motivo (opcional):
            </label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
              placeholder="Explique brevemente la razón del cambio..."
              disabled={guardando}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};