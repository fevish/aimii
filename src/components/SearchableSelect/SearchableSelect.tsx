import React, { useState, useRef, useEffect } from 'react';
import { SvgIcon } from '../SvgIcon/SvgIcon';
import './SearchableSelect.css';

interface SearchableSelectProps {
  id: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** When false, acts as a simple dropdown (no type-to-filter). Default true. */
  searchable?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  value,
  options,
  placeholder = 'Select an option',
  onChange,
  onKeyDown,
  required = false,
  disabled = false,
  className = '',
  searchable = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const filteredOptions = searchable
    ? options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : options;

  // Update input value when value prop changes
  useEffect(() => {
    const selectedOption = options.find(option => option.value === value);
    setInputValue(selectedOption ? selectedOption.label : '');
    setSearchTerm('');
  }, [value, options]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleOptionSelect(filteredOptions[highlightedIndex]);
          } else if (filteredOptions.length === 1) {
            // If only one result, select it
            handleOptionSelect(filteredOptions[0]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          if (searchable) {
            if (value) {
              onChange('');
              setInputValue('');
              setSearchTerm('');
              setTimeout(() => inputRef.current?.focus(), 0);
            } else {
              setInputValue('');
              setSearchTerm('');
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions, value, onChange, searchable]);

  // Handle Escape key globally (searchable only: clear selection when Escape and value)
  useEffect(() => {
    const handleGlobalEscape = (e: KeyboardEvent) => {
      if (searchable && e.key === 'Escape' && value) {
        onChange('');
        setInputValue('');
        setSearchTerm('');
        setIsOpen(false);
        setHighlightedIndex(-1);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };

    document.addEventListener('keydown', handleGlobalEscape);
    return () => document.removeEventListener('keydown', handleGlobalEscape);
  }, [value, onChange, searchable]);

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
        setHighlightedIndex(-1);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!searchable) return;
    if (value) return;

    const newValue = e.target.value;
    setInputValue(newValue);
    setSearchTerm(newValue);
    setIsOpen(true);
    setHighlightedIndex(newValue ? 0 : -1);
  };

  const handleOptionSelect = (option: { value: string; label: string }) => {
    onChange(option.value);
    setInputValue(option.label);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isOpen) {
      // Only open dropdown if no game is selected
      if (!value) {
        setIsOpen(true);
        setSearchTerm('');
        setHighlightedIndex(-1);
      } else {
        // If game is selected, trigger the parent's onKeyDown for continue
        if (onKeyDown) {
          onKeyDown(e);
        }
      }
    } else if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const selectedOption = options.find(option => option.value === value);

  return (
    <div
      ref={containerRef}
      className={`searchable-select ${className} ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
    >
      <div className="select-input-wrapper">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          placeholder={placeholder}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onKeyDown={handleInputKeyDown}
          onFocus={() => {
            // Don't auto-expand on focus, only focus the input
          }}
          required={required}
          disabled={disabled}
          readOnly={!searchable || !!value}
          className="select-input"
          autoComplete="off"
        />
        {searchable && value ? (
          <button
            type="button"
            className="select-button select-clear"
            onClick={() => {
              onChange('');
              setInputValue('');
              setSearchTerm('');
              setIsOpen(false);
              setHighlightedIndex(-1);
            }}
            disabled={disabled}
            title="Clear selection"
          >
            <SvgIcon name="close" />
          </button>
        ) : (
          <button
            type="button"
            className="select-button select-arrow"
            onClick={handleInputClick}
            disabled={disabled}
          >
            <SvgIcon name="chevron-down" />
          </button>
        )}

        {isOpen && (
          <ul ref={dropdownRef} className="select-dropdown">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  className={`select-option ${index === highlightedIndex ? 'highlighted' : ''} ${option.value === value ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="select-no-results">No Results</li>
            )}
          </ul>
        )}
      </div>

    </div>
  );
};