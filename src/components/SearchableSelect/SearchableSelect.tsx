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
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          // If a game is selected, clear the selection entirely
          if (value) {
            onChange('');
            setInputValue('');
            setSearchTerm('');
            // Refocus the input so user can start typing immediately
            setTimeout(() => inputRef.current?.focus(), 0);
          } else {
            // If no game selected, just clear the input
            setInputValue('');
            setSearchTerm('');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions, value, onChange]);

  // Handle Escape key globally (even when input is readOnly)
  useEffect(() => {
    const handleGlobalEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && value) {
        // Clear selection when Escape is pressed and we have a value
        onChange('');
        setInputValue('');
        setSearchTerm('');
        setIsOpen(false);
        setHighlightedIndex(-1);
        // Refocus the input so user can start typing immediately
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };

    document.addEventListener('keydown', handleGlobalEscape);
    return () => document.removeEventListener('keydown', handleGlobalEscape);
  }, [value, onChange]);

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
    // Only allow typing if no game is selected
    if (value) return;

    const newValue = e.target.value;
    setInputValue(newValue);
    setSearchTerm(newValue);
    setIsOpen(true);
    // Auto-highlight first result when typing
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
          readOnly={!!value}
          className="select-input"
          autoComplete="off"
        />
        {value ? (
          <button
            type="button"
            className="select-clear"
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
            className="select-arrow"
            onClick={handleInputClick}
            disabled={disabled}
          >
            <SvgIcon name="chevron-down" />
          </button>
        )}
      </div>

      {isOpen && (
        <div ref={dropdownRef} className="select-dropdown">
          {filteredOptions.length > 0 ? (
            <ul className="select-options">
              {filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  className={`select-option ${index === highlightedIndex ? 'highlighted' : ''} ${option.value === value ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          ) : (
            <div className="select-no-results">
              No Results
            </div>
          )}
        </div>
      )}
    </div>
  );
};