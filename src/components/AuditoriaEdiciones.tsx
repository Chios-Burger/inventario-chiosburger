import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

interface RegistroAuditoria {
  id: number;
  registro_id: string;
  fecha_registro: string;
  usuario_email: string;
  usuario_nombre: string;
  producto_codigo: string;
  producto_nombre: string;
  campo_modificado: string;
  valor_anterior: number;
  valor_nuevo: number;
  diferencia: number;
  motivo: string;
  bodega_id: number;
  bodega_nombre: string;
  created_at: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const AuditoriaEdiciones = () => {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarAuditoria();
  }, []);

  const cargarAuditoria = async () => {
    try {
      setCargando(true);
      const response = await fetch(`${API_URL}/auditoria/ediciones`);
      
      if (!response.ok) {
        throw new Error('Error al cargar auditoría');
      }
      
      const data = await response.json();
      setRegistros(data.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-EC');
  };

  const formatearNumero = (num: number) => {
    return num.toLocaleString('es-EC', { 
      minimumFractionDigits: 3,
      maximumFractionDigits: 3 
    });
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando auditoría...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FileText className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold">Auditoría de Ediciones</h2>
        </div>
        <button
          onClick={cargarAuditoria}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Actualizar
        </button>
      </div>

      {registros.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay registros de auditoría</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Anterior
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Nuevo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diferencia
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bodega
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {registros.map((registro) => (
                <tr key={registro.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatearFecha(registro.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div>
                      <p className="font-medium">{registro.usuario_nombre}</p>
                      <p className="text-xs text-gray-500">{registro.usuario_email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div>
                      <p className="font-medium">{registro.producto_nombre}</p>
                      <p className="text-xs text-gray-500">{registro.producto_codigo}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      registro.campo_modificado === 'total' 
                        ? 'bg-purple-100 text-purple-800'
                        : registro.campo_modificado === 'cantidad_pedir'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {registro.campo_modificado === 'cantidad_pedir' ? 'Cantidad a Pedir' : 'Total'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatearNumero(registro.valor_anterior)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {formatearNumero(registro.valor_nuevo)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-medium ${
                      registro.diferencia > 0 ? 'text-green-600' : 
                      registro.diferencia < 0 ? 'text-red-600' : 
                      'text-gray-500'
                    }`}>
                      {registro.diferencia > 0 ? '+' : ''}{formatearNumero(registro.diferencia)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {registro.motivo || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {registro.bodega_nombre}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};