import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface MultiSelectProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export default function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = 'Seleccionar...'
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const handleToggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(v => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    if (selectedValues.length === options.length) {
      return 'Todos';
    }
    if (selectedValues.length === 1) {
      return selectedValues[0];
    }
    return `${selectedValues.length} seleccionados`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
      >
        <span className={selectedValues.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
          {getDisplayText()}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          <div className="p-2">
            <label className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              selectedValues.length === options.length && options.length > 0
                ? 'bg-purple-100 hover:bg-purple-200'
                : 'hover:bg-gray-50'
            }`}>
              <input
                type="checkbox"
                checked={selectedValues.length === options.length && options.length > 0}
                onChange={handleToggleAll}
                className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer accent-purple-600"
              />
              <span className={`ml-3 text-sm font-medium ${
                selectedValues.length === options.length && options.length > 0
                  ? 'text-purple-900'
                  : 'text-gray-900'
              }`}>Todos</span>
            </label>

            <div className="border-t border-gray-100 my-2"></div>

            {options.map((option) => (
              <label
                key={option}
                className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  selectedValues.includes(option)
                    ? 'bg-purple-100 hover:bg-purple-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => handleToggleOption(option)}
                  className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer accent-purple-600"
                />
                <span className={`ml-3 text-sm ${
                  selectedValues.includes(option)
                    ? 'text-purple-900 font-medium'
                    : 'text-gray-700'
                }`}>{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
