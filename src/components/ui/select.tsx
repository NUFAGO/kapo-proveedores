'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  renderOption?: (option: SelectOption, isSelected: boolean, onSelect: () => void) => React.ReactNode;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  className,
  disabled = false,
  isLoading = false,
  renderOption,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ 
    top: 0, 
    left: 0, 
    width: 0, 
    isDropup: false, 
    bottom: undefined as number | undefined 
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = React.useMemo(() => {
    if (!value && value !== '') {
      const defaultOption = options.find(opt => opt.value === '');
      return defaultOption || null;
    }
    return options.find(opt => opt.value === value);
  }, [value, options]);

  // Función mejorada para calcular posición del dropdown
  const updateDropdownPosition = () => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownMaxHeight = 240; // max-h-60 = 240px
    const gap = 4;
    
    // Espacio disponible arriba y abajo
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Decidir si mostrar arriba o abajo
    const shouldShowAbove = spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow;
    
    if (shouldShowAbove) {
      setDropdownPosition({
        top: 0,
        left: rect.left,
        width: rect.width,
        isDropup: true,
        bottom: viewportHeight - rect.top + gap,
      });
    } else {
      setDropdownPosition({
        top: rect.bottom + gap,
        left: rect.left,
        width: rect.width,
        isDropup: false,
        bottom: undefined,
      });
    }
  };

  // Actualizar posición cuando se abre el dropdown
  useEffect(() => {
    if (isOpen) {
      // Usar requestAnimationFrame para asegurar que el cálculo se hace después del render
      const frameId = requestAnimationFrame(() => {
        updateDropdownPosition();
      });
      
      return () => cancelAnimationFrame(frameId);
    }
  }, [isOpen]);

  // Actualizar posición en scroll y resize
  useEffect(() => {
    if (!isOpen) return;
    
    const handleUpdate = () => {
      requestAnimationFrame(() => {
        updateDropdownPosition();
      });
    };
    
    // Escuchar eventos tanto en window como en todos los ancestros con scroll
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    
    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelectOption = (option: SelectOption) => {
    onChange(option.value === '' ? '' : option.value);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === 'Enter' && isOpen && options.length > 0) {
      e.preventDefault();
      handleSelectOption(options[0]);
    }
  };

  const baseClasses = 'w-full bg-transparent border border-[var(--border-color)] text-[var(--text-primary)] rounded-md focus:outline-none px-2 py-2 text-xs';

  const widthClass = className?.match(/w-\w+/)?.[0] || 'w-full';
  const otherInputClasses = className?.replace(/w-\w+/, '').trim() || '';
  
  const finalClasses = otherInputClasses 
    ? `${baseClasses} ${otherInputClasses}`.trim()
    : baseClasses;

  const hasTextAlign = className?.includes('text-center') || className?.includes('text-right');
  const textAlignClass = hasTextAlign ? '' : 'text-left';

  const displayValue = selectedOption ? selectedOption.label : placeholder;
  const showPlaceholder = !selectedOption;

  return (
    <div ref={containerRef} className={cn('relative', widthClass)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          finalClasses,
          textAlignClass,
          'cursor-pointer relative',
          disabled && 'opacity-50 cursor-not-allowed',
          showPlaceholder && 'text-text-secondary'
        )}
      >
        <span className="truncate pr-6">{displayValue}</span>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-0.5 shrink-0 pointer-events-none">
          {selectedOption && !disabled && value && value !== '' && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleClear(e);
              }}
              className="text-text-secondary hover:text-text-primary p-0.5 pointer-events-auto cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClear(e as any);
                }
              }}
            >
              <X className="h-2.5 w-2.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-2.5 w-2.5 text-text-secondary transition-transform shrink-0',
              isOpen && 'transform rotate-180'
            )}
          />
        </div>
      </button>

      {isOpen && !disabled && options.length > 0 && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-9999 bg-card-bg border border-border-color rounded-md shadow-lg max-h-60 overflow-hidden"
          style={{
            ...(dropdownPosition.isDropup && dropdownPosition.bottom !== undefined
              ? { bottom: `${dropdownPosition.bottom}px`, top: 'auto' }
              : { top: `${dropdownPosition.top}px`, bottom: 'auto' }
            ),
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-2 text-xs text-text-secondary text-center">
                Cargando...
              </div>
            ) : (
              (dropdownPosition.isDropup ? [...options].reverse() : options).map((option) => {
                const isSelected = value === option.value;
                const onSelect = () => handleSelectOption(option);
                
                if (renderOption) {
                  return (
                    <div key={option.value}>
                      {renderOption(option, isSelected, onSelect)}
                    </div>
                  );
                }
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={onSelect}
                    className={cn(
                      'w-full px-3 py-2 text-left text-xs text-text-primary transition-colors',
                      isSelected
                        ? 'bg-(--active-bg) font-medium'
                        : 'hover:bg-(--hover-bg)'
                    )}
                    style={{
                      color: 'var(--text-primary)',
                      backgroundColor: isSelected ? 'var(--active-bg)' : 'transparent',
                    }}
                  >
                    {option.label}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}