import React from 'react';

// Opción 1: Versión actual pero más compacta
export const ProgressBarOption1 = ({ productosGuardadosCount, productos, isOnline, startTime, Timer, productosPorTipo, porcentajeCompletado }: any) => (
  <div className="sticky top-16 z-30 mb-2">
    <div className="bg-white rounded-lg p-1 shadow-md border border-gray-100">
      <div className="flex items-center justify-between mb-0.5 text-[10px]">
        <span className="font-medium text-gray-700">{productosGuardadosCount}/{productos.length}</span>
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`}></div>
          {startTime && <Timer startTime={startTime} className="!p-0 !px-1 !py-0 !text-[10px] !bg-transparent !border-0 !shadow-none" />}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-0.5">
        {['A', 'B', 'C'].map((tipo) => {
          const color = tipo === 'A' ? 'blue' : tipo === 'B' ? 'green' : 'red';
          return (
            <div key={tipo} className="text-center">
              <div className="text-[9px]">
                <span className={`font-bold text-${color}-600`}>{tipo}</span>
                <span className="text-gray-500 ml-0.5">({productosPorTipo.pendientes[tipo]})</span>
              </div>
              <div className={`h-1.5 bg-${color}-100 rounded overflow-hidden`}>
                <div 
                  className={`h-full bg-${color}-500 transition-all duration-300`}
                  style={{ width: productosPorTipo.totales[tipo] > 0 ? `${(productosPorTipo.guardados[tipo] / productosPorTipo.totales[tipo]) * 100}%` : '0%' }}
                />
              </div>
              <div className="text-[8px] text-gray-600">
                {productosPorTipo.guardados[tipo]}/{productosPorTipo.totales[tipo]}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="text-center mt-0.5">
        <span className="text-[9px] font-bold text-purple-600">Total: {porcentajeCompletado}%</span>
      </div>
    </div>
  </div>
);

// Opción 2: Una sola línea con las 3 barras horizontales
export const ProgressBarOption2 = ({ productosGuardadosCount, productos, isOnline, startTime, Timer, productosPorTipo, porcentajeCompletado }: any) => (
  <div className="sticky top-16 z-30 mb-2">
    <div className="bg-white rounded-lg px-2 py-1 shadow-md border border-gray-100 flex items-center gap-2">
      <span className="text-[10px] font-medium text-gray-700">{productosGuardadosCount}/{productos.length}</span>
      
      <div className="flex-1 flex items-center gap-1">
        {['A', 'B', 'C'].map((tipo) => {
          const color = tipo === 'A' ? 'blue' : tipo === 'B' ? 'green' : 'red';
          return (
            <div key={tipo} className="flex-1 flex items-center gap-1">
              <span className={`text-[9px] font-bold text-${color}-600`}>{tipo}</span>
              <div className={`flex-1 h-2 bg-${color}-100 rounded overflow-hidden`}>
                <div 
                  className={`h-full bg-${color}-500`}
                  style={{ width: productosPorTipo.totales[tipo] > 0 ? `${(productosPorTipo.guardados[tipo] / productosPorTipo.totales[tipo]) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-[8px] text-gray-500">({productosPorTipo.pendientes[tipo]})</span>
            </div>
          );
        })}
      </div>
      
      <span className="text-[9px] font-bold text-purple-600">{porcentajeCompletado}%</span>
      <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>
      {startTime && <Timer startTime={startTime} className="!p-0 !px-1 !py-0 !text-[9px]" />}
    </div>
  </div>
);

// Opción 3: Súper minimalista - solo números y mini barras
export const ProgressBarOption3 = ({ productosGuardadosCount, productos, isOnline, productosPorTipo, porcentajeCompletado }: any) => (
  <div className="sticky top-16 z-30 mb-2">
    <div className="bg-white rounded px-2 py-0.5 shadow-sm border border-gray-100 flex items-center gap-2 text-[9px]">
      <span className="font-medium">{productosGuardadosCount}/{productos.length}</span>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          <span className="text-blue-600 font-bold">A</span>
          <div className="w-8 h-1 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${(productosPorTipo.guardados.A / productosPorTipo.totales.A) * 100}%` }}/>
          </div>
          <span className="text-gray-500">{productosPorTipo.pendientes.A}</span>
        </div>
        
        <div className="flex items-center gap-0.5">
          <span className="text-green-600 font-bold">B</span>
          <div className="w-8 h-1 bg-green-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${(productosPorTipo.guardados.B / productosPorTipo.totales.B) * 100}%` }}/>
          </div>
          <span className="text-gray-500">{productosPorTipo.pendientes.B}</span>
        </div>
        
        <div className="flex items-center gap-0.5">
          <span className="text-red-600 font-bold">C</span>
          <div className="w-8 h-1 bg-red-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-500" style={{ width: `${(productosPorTipo.guardados.C / productosPorTipo.totales.C) * 100}%` }}/>
          </div>
          <span className="text-gray-500">{productosPorTipo.pendientes.C}</span>
        </div>
      </div>
      
      <span className="font-bold text-purple-600 ml-auto">{porcentajeCompletado}%</span>
      <div className={`w-1 h-1 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>
    </div>
  </div>
);

// Opción 4: Ultra compacta - todo en una línea con puntos de colores
export const ProgressBarOption4 = ({ productosGuardadosCount, productos, productosPorTipo, porcentajeCompletado }: any) => (
  <div className="sticky top-16 z-30 mb-2">
    <div className="bg-white rounded px-2 py-0.5 shadow-sm border border-gray-100 flex items-center gap-1.5 text-[8px]">
      <span>{productosGuardadosCount}/{productos.length}</span>
      <span className="text-gray-400">•</span>
      <span>
        <span className="text-blue-600">A:</span>{productosPorTipo.guardados.A}/{productosPorTipo.totales.A}
      </span>
      <span className="text-gray-400">•</span>
      <span>
        <span className="text-green-600">B:</span>{productosPorTipo.guardados.B}/{productosPorTipo.totales.B}
      </span>
      <span className="text-gray-400">•</span>
      <span>
        <span className="text-red-600">C:</span>{productosPorTipo.guardados.C}/{productosPorTipo.totales.C}
      </span>
      <span className="text-gray-400">•</span>
      <span className="font-bold text-purple-600">{porcentajeCompletado}%</span>
    </div>
  </div>
);

// Opción 5: Micro - solo lo esencial
export const ProgressBarOption5 = ({ productosGuardadosCount, productos, productosPorTipo }: any) => (
  <div className="sticky top-16 z-30 mb-1">
    <div className="bg-gray-50 rounded px-1.5 py-0.5 text-[8px] flex items-center gap-2">
      <span>{productosGuardadosCount}/{productos.length}</span>
      <span className="text-blue-500">A:{productosPorTipo.pendientes.A}↓</span>
      <span className="text-green-500">B:{productosPorTipo.pendientes.B}↓</span>
      <span className="text-red-500">C:{productosPorTipo.pendientes.C}↓</span>
    </div>
  </div>
);