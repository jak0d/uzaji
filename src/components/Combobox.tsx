import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxGroup {
  label: string;
  options: ComboboxOption[];
  icon?: React.ReactNode;
}

interface ComboboxProps {
  options: ComboboxGroup[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Combobox({ options, value, onChange, placeholder, className = '' }: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = value
    ? options.map(group => ({
        ...group,
        options: group.options.filter(option =>
          option.label.toLowerCase().includes(value.toLowerCase())
        )
      })).filter(group => group.options.length > 0)
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectOption = (option: ComboboxOption) => {
    onChange(option.label);
    setIsOpen(false);
  };

  const allOptions = filteredOptions.flatMap(group => group.options);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % allOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + allOptions.length) % allOptions.length);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      if (allOptions[highlightedIndex]) {
        handleSelectOption(allOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {value && (
            <button 
              type="button"
              onClick={() => onChange('')}
              className="px-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 text-gray-500"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {(() => {
            let optionIndex = -1;
            return filteredOptions.map(group => (
              <React.Fragment key={group.label}>
                <li className="px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 sticky top-0 bg-gray-100 dark:bg-gray-900 flex items-center">
                  {group.icon}
                  <span className="ml-2">{group.label.toUpperCase()}</span>
                </li>
                {group.options.map(option => {
                  optionIndex++;
                  const isHighlighted = optionIndex === highlightedIndex;
                  return (
                    <li
                      key={option.value}
                      onClick={() => handleSelectOption(option)}
                      onMouseEnter={() => setHighlightedIndex(optionIndex)}
                      className={`px-4 py-2 cursor-pointer flex items-center transition-colors duration-150 ease-in-out ${isHighlighted ? 'bg-purple-600 text-white' : 'hover:bg-purple-100 dark:hover:bg-purple-900/50'}`}>
                      {option.label}
                    </li>
                  );
                })}
              </React.Fragment>
            ));
          })()}
        </ul>
      )}
    </div>
  );
}
