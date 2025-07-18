import React, { useState } from 'react';

export const TestInputs: React.FC = () => {
  const [values, setValues] = useState({
    tel: '',
    number: '',
    text: ''
  });

  return (
    <div className="p-4 space-y-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-bold">Test de Inputs Móviles</h3>
      
      <div>
        <label className="block text-sm font-medium mb-1">Input type="tel" (Recomendado)</label>
        <input
          type="tel"
          inputMode="decimal"
          pattern="[0-9]*[.,]?[0-9]*"
          value={values.tel}
          onChange={(e) => setValues({...values, tel: e.target.value})}
          onClick={(e) => {
            e.stopPropagation();
            console.log('Tel input clicked');
            alert('Tel input clicked!');
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            console.log('Tel input touched');
          }}
          onFocus={(e) => {
            console.log('Tel input focused');
            e.target.select();
          }}
          placeholder="0"
          className="w-full px-3 py-2 border rounded-lg text-base min-h-[44px] relative z-20"
          style={{ 
            WebkitUserSelect: 'text',
            touchAction: 'manipulation',
            fontSize: '16px'
          }}
          readOnly={false}
          autoComplete="off"
        />
        <p className="text-xs text-gray-500 mt-1">Valor: {values.tel}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Input type="number" (Problemático)</label>
        <input
          type="number"
          value={values.number}
          onChange={(e) => setValues({...values, number: e.target.value})}
          onClick={(e) => {
            e.stopPropagation();
            console.log('Number input clicked');
            alert('Number input clicked!');
          }}
          placeholder="0"
          className="w-full px-3 py-2 border rounded-lg text-base min-h-[44px]"
          style={{ fontSize: '16px' }}
        />
        <p className="text-xs text-gray-500 mt-1">Valor: {values.number}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Input type="text"</label>
        <input
          type="text"
          value={values.text}
          onChange={(e) => setValues({...values, text: e.target.value})}
          onClick={(e) => {
            e.stopPropagation();
            console.log('Text input clicked');
            alert('Text input clicked!');
          }}
          placeholder="Texto"
          className="w-full px-3 py-2 border rounded-lg text-base min-h-[44px]"
          style={{ fontSize: '16px' }}
        />
        <p className="text-xs text-gray-500 mt-1">Valor: {values.text}</p>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm font-medium text-blue-800">Instrucciones de prueba:</p>
        <ol className="text-xs text-blue-700 mt-2 space-y-1">
          <li>1. Intenta hacer click/touch en cada input</li>
          <li>2. Si aparece un alert, el click está funcionando</li>
          <li>3. Si no aparece nada, el input no está respondiendo</li>
          <li>4. Revisa la consola del navegador para más detalles</li>
        </ol>
      </div>
    </div>
  );
};