import React from 'react';
import { Package, Hash, Calendar, Clock, Edit } from 'lucide-react';

// Función para simplificar unidades
const simplificarUnidad = (unidad: string): string => {
  const abreviaciones: { [key: string]: string } = {
    'KILOGRAMO': 'KG',
    'KILOGRAMOS': 'KG',
    'LITRO': 'LT',
    'LITROS': 'LT',
    'UNIDAD': 'UN',
    'UNIDADES': 'UN',
    'BIDON': 'BID',
    'BIDONES': 'BID',
    'CAJA': 'CJ',
    'CAJAS': 'CJ',
    'PAQUETE': 'PQ',
    'PAQUETES': 'PQ',
    'BOLSA': 'BLS',
    'BOLSAS': 'BLS',
    'SACO': 'SC',
    'SACOS': 'SC',
    'GALON': 'GL',
    'GALONES': 'GL',
    'BOTELLA': 'BT',
    'BOTELLAS': 'BT',
    'LATA': 'LT',
    'LATAS': 'LT',
    'BANDEJA': 'BDJ',
    'BANDEJAS': 'BDJ'
  };
  
  const unidadUpper = unidad?.toUpperCase();
  return abreviaciones[unidadUpper] || unidad?.substring(0, 3).toUpperCase() || '-';
};

// OPCIÓN 1: Vista de Tarjetas Compactas
export const VistaCompacta = ({ registro, producto }: any) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-2">
    <div className="flex justify-between items-center">
      <h4 className="font-medium text-sm truncate flex-1">{producto.nombre}</h4>
      <div className="text-right ml-2">
        <p className="font-bold text-lg">{producto.total}</p>
        <p className="text-xs text-gray-500">{simplificarUnidad(producto.unidad)}</p>
      </div>
    </div>
    
    {producto.cantidadPedir > 0 && (
      <div className="mt-2 flex justify-between items-center text-xs">
        <span className="text-gray-500">Pedir:</span>
        <span className="font-semibold text-blue-600">
          {producto.cantidadPedir} {simplificarUnidad(producto.unidadBodega)}
        </span>
      </div>
    )}
  </div>
);

// OPCIÓN 2: Vista de Lista Simple
export const VistaLista = ({ registro, producto, onEdit }: any) => (
  <div className="bg-white border-b border-gray-100 p-2">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h4 className="font-medium text-xs">{producto.nombre}</h4>
        {producto.cantidadPedir > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">
            Pedir: {producto.cantidadPedir} {simplificarUnidad(producto.unidadBodega)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-sm font-bold">{producto.total}</p>
          <p className="text-xs text-gray-500">{simplificarUnidad(producto.unidad)}</p>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-1 hover:bg-blue-100 rounded transition-colors"
            title="Editar total"
          >
            <Edit className="w-3 h-3 text-blue-600" />
          </button>
        )}
      </div>
    </div>
  </div>
);

// OPCIÓN 3: Vista Expandible/Colapsable
export const VistaExpandible = ({ registro, producto, isExpanded, onToggle }: any) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-2 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full p-3 text-left focus:outline-none focus:bg-gray-50"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{producto.nombre}</h4>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-base font-bold">{producto.total}</p>
            <p className="text-xs text-gray-500">{simplificarUnidad(producto.unidad)}</p>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </button>
    
    {isExpanded && (
      <div className="px-3 pb-3 bg-gray-50">
        {producto.cantidadPedir > 0 && (
          <div className="mt-2 p-2 bg-blue-50 rounded">
            <p className="text-xs">
              <span className="text-gray-600">Cantidad a pedir:</span>
              <span className="font-semibold text-blue-700 ml-1">
                {producto.cantidadPedir} {simplificarUnidad(producto.unidadBodega)}
              </span>
            </p>
          </div>
        )}
      </div>
    )}
  </div>
);

// OPCIÓN 4: Vista Minimalista con Colores
export const VistaMinimalista = ({ registro, producto }: any) => (
  <div className="bg-white p-3 border-l-4 border-blue-500 mb-2 shadow-sm">
    <div className="flex justify-between items-center">
      <div className="flex-1">
        <h4 className="font-medium text-sm truncate">{producto.nombre}</h4>
        {producto.cantidadPedir > 0 && (
          <p className="text-xs text-blue-600 mt-1">
            Pedir: {producto.cantidadPedir} {simplificarUnidad(producto.unidadBodega)}
          </p>
        )}
      </div>
      <div className="text-right ml-2">
        <p className="text-lg font-bold">{producto.total}</p>
        <p className="text-xs text-gray-500">{simplificarUnidad(producto.unidad)}</p>
      </div>
    </div>
  </div>
);

// OPCIÓN 5: Vista de Tabla Horizontal Scrollable
export const VistaTablaHorizontal = ({ registro, productos }: any) => (
  <div className="overflow-x-auto -mx-4 px-4">
    <table className="min-w-full">
      <thead>
        <tr className="text-xs text-gray-500">
          <th className="text-left py-2 pr-3 sticky left-0 bg-white">Producto</th>
          <th className="px-3 text-center">Total</th>
          <th className="px-2 text-center">Unidad</th>
          <th className="px-3 text-center">Pedir</th>
          <th className="px-2 text-center">U.Pedido</th>
        </tr>
      </thead>
      <tbody>
        {productos.map((producto: any, idx: number) => (
          <tr key={idx} className="border-t border-gray-100">
            <td className="py-2 pr-3 sticky left-0 bg-white">
              <p className="font-medium text-sm truncate max-w-[200px]">{producto.nombre}</p>
            </td>
            <td className="px-3 text-center text-sm font-bold">{producto.total}</td>
            <td className="px-2 text-center text-xs text-gray-500">{simplificarUnidad(producto.unidad)}</td>
            <td className="px-3 text-center text-sm">
              {producto.cantidadPedir > 0 ? (
                <span className="font-semibold text-blue-600">{producto.cantidadPedir}</span>
              ) : (
                <span className="text-gray-300">-</span>
              )}
            </td>
            <td className="px-2 text-center text-xs text-gray-500">
              {producto.cantidadPedir > 0 ? simplificarUnidad(producto.unidadBodega) : '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// OPCIÓN 6: Vista de Una Línea Horizontal
export const VistaUnaLinea = ({ registro, producto }: any) => (
  <div className="bg-white border-b border-gray-100 p-2">
    <div className="flex items-center justify-between text-xs">
      <p className="font-medium truncate max-w-[40%]">{producto.nombre}</p>
      <p className="font-bold">{producto.total} {simplificarUnidad(producto.unidad)}</p>
      {producto.cantidadPedir > 0 ? (
        <p className="text-blue-600">P: {producto.cantidadPedir} {simplificarUnidad(producto.unidadBodega)}</p>
      ) : (
        <p className="text-gray-300">Sin pedido</p>
      )}
    </div>
  </div>
);

// OPCIÓN 7: Vista de Dos Líneas
export const VistaDosLineas = ({ registro, producto }: any) => (
  <div className="bg-white border-b border-gray-100 p-3">
    <div className="flex items-center justify-between mb-1">
      <h4 className="font-medium text-sm truncate flex-1">{producto.nombre}</h4>
      <p className="font-bold text-base ml-2">{producto.total} {simplificarUnidad(producto.unidad)}</p>
    </div>
    {producto.cantidadPedir > 0 && (
      <p className="text-xs text-blue-600">
        Pedir: {producto.cantidadPedir} {simplificarUnidad(producto.unidadBodega)}
      </p>
    )}
  </div>
);

// OPCIÓN 8: Vista Tipo Badge
export const VistaBadge = ({ registro, producto }: any) => (
  <div className="bg-white rounded-full shadow-sm border border-gray-100 p-3 mb-2 flex items-center justify-between">
    <div className="flex-1 flex items-center gap-2">
      <h4 className="font-medium text-sm truncate">{producto.nombre}</h4>
      <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold">
        {producto.total} {simplificarUnidad(producto.unidad)}
      </span>
    </div>
    {producto.cantidadPedir > 0 && (
      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium ml-2">
        {producto.cantidadPedir} {simplificarUnidad(producto.unidadBodega)}
      </span>
    )}
  </div>
);

// Componente de demostración
export const DemoHistoricoMovil = () => {
  const [vistaActual, setVistaActual] = React.useState(1);
  const [expandedItems, setExpandedItems] = React.useState<Set<number>>(new Set());
  
  const toggleExpanded = (idx: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedItems(newExpanded);
  };
  
  // Datos de ejemplo
  const registro = { fecha: new Date(), bodega: 'Bodega Principal' };
  const productos = [
    {
      nombre: 'Aceite de Oliva Extra Virgen',
      codigo: 'ACE001',
      categoria: 'ACEITES Y MANTECAS',
      c1: 12,
      c2: 13,
      c3: 12,
      total: 37,
      unidad: 'LITROS',
      cantidadPedir: 5,
      unidadBodega: 'BIDON'
    },
    {
      nombre: 'Arroz Blanco Grano Largo',
      codigo: 'ARR002',
      categoria: 'GRANOS Y CEREALES',
      c1: 25,
      c2: 24,
      c3: 26,
      total: 75,
      unidad: 'KILOGRAMOS',
      cantidadPedir: 0,
      unidadBodega: 'SACO'
    },
    {
      nombre: 'Tomate Perita en Lata',
      codigo: 'TOM003',
      categoria: 'CONSERVAS',
      c1: 8,
      c2: 8,
      c3: 9,
      total: 25,
      unidad: 'LATAS',
      cantidadPedir: 12,
      unidadBodega: 'CAJA'
    }
  ];
  
  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-lg font-bold mb-4">Opciones de Vista para Histórico Móvil</h2>
      
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
          <button
            key={num}
            onClick={() => setVistaActual(num)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-sm ${
              vistaActual === num 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Op. {num}
          </button>
        ))}
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-sm mb-2">
          {vistaActual === 1 && 'Opción 1: Tarjetas Compactas'}
          {vistaActual === 2 && 'Opción 2: Lista Simple'}
          {vistaActual === 3 && 'Opción 3: Vista Expandible'}
          {vistaActual === 4 && 'Opción 4: Vista Minimalista'}
          {vistaActual === 5 && 'Opción 5: Tabla Horizontal'}
          {vistaActual === 6 && 'Opción 6: Una Línea Horizontal'}
          {vistaActual === 7 && 'Opción 7: Dos Líneas'}
          {vistaActual === 8 && 'Opción 8: Vista Tipo Badge'}
        </h3>
        
        {vistaActual === 1 && productos.map((producto, idx) => (
          <VistaCompacta key={idx} registro={registro} producto={producto} />
        ))}
        
        {vistaActual === 2 && productos.map((producto, idx) => (
          <VistaLista key={idx} registro={registro} producto={producto} />
        ))}
        
        {vistaActual === 3 && productos.map((producto, idx) => (
          <VistaExpandible 
            key={idx} 
            registro={registro} 
            producto={producto}
            isExpanded={expandedItems.has(idx)}
            onToggle={() => toggleExpanded(idx)}
          />
        ))}
        
        {vistaActual === 4 && productos.map((producto, idx) => (
          <VistaMinimalista key={idx} registro={registro} producto={producto} />
        ))}
        
        {vistaActual === 5 && (
          <VistaTablaHorizontal registro={registro} productos={productos} />
        )}
        
        {vistaActual === 6 && productos.map((producto, idx) => (
          <VistaUnaLinea key={idx} registro={registro} producto={producto} />
        ))}
        
        {vistaActual === 7 && productos.map((producto, idx) => (
          <VistaDosLineas key={idx} registro={registro} producto={producto} />
        ))}
        
        {vistaActual === 8 && productos.map((producto, idx) => (
          <VistaBadge key={idx} registro={registro} producto={producto} />
        ))}
      </div>
    </div>
  );
};