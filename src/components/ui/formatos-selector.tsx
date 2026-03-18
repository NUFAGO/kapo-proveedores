'use client';

import { useState } from 'react';

interface FormatosSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const FORMATOS_DISPONIBLES = [
  { id: 'pdf', label: 'PDF', checked: false },
  { id: 'doc', label: 'DOC', checked: false },
  { id: 'docx', label: 'DOCX', checked: false },
  { id: 'xls', label: 'XLS', checked: false },
  { id: 'xlsx', label: 'XLSX', checked: false },
  { id: 'ppt', label: 'PPT', checked: false },
  { id: 'pptx', label: 'PPTX', checked: false },
  { id: 'txt', label: 'TXT', checked: false },
  { id: 'jpg', label: 'JPG', checked: false },
  { id: 'jpeg', label: 'JPEG', checked: false },
  { id: 'png', label: 'PNG', checked: false },
];

export function FormatosSelector({ value = '', onChange, className = '', disabled = false }: FormatosSelectorProps) {
  // Parsear el valor inicial (ej: "pdf,doc,docx" -> ['pdf', 'doc', 'docx'])
  const formatosSeleccionados = value ? value.split(',').map(f => f.trim().toLowerCase()) : [];
  
  // Actualizar el estado de los checkboxes
  const formatosConEstado = FORMATOS_DISPONIBLES.map(formato => ({
    ...formato,
    checked: formatosSeleccionados.includes(formato.id)
  }));

  const handleFormatoChange = (formatoId: string, checked: boolean) => {
    let nuevosFormatos: string[];
    
    if (checked) {
      // Agregar formato si no está ya seleccionado
      if (!formatosSeleccionados.includes(formatoId)) {
        nuevosFormatos = [...formatosSeleccionados, formatoId];
      } else {
        nuevosFormatos = formatosSeleccionados;
      }
    } else {
      // Quitar formato
      nuevosFormatos = formatosSeleccionados.filter(f => f !== formatoId);
    }
    
    // Validar formato: "pdf,doc,docx" separados por comas
    const formatosValidos = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png'];
    const isValid = nuevosFormatos.every(f => formatosValidos.includes(f));
    if (!isValid) {
      throw new Error('Formatos no válidos. Use: pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png separados por comas');
    }
    
    // Ordenar alfabéticamente y unir con comas
    const resultado = nuevosFormatos.sort().join(',');
    onChange(resultado);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-xs font-medium text-text-primary mb-2">
        Formos Permitidos
      </div>
      <div className="grid grid-cols-3 gap-2">
        {formatosConEstado.map((formato) => (
          <label 
            key={formato.id} 
            className={`flex items-center space-x-2 text-xs cursor-pointer ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-primary'
            }`}
          >
            <input
              type="checkbox"
              checked={formato.checked}
              onChange={(e) => !disabled && handleFormatoChange(formato.id, e.target.checked)}
              disabled={disabled}
              className="w-3 h-3 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className={formato.checked ? 'font-medium' : ''}>
              {formato.label}
            </span>
          </label>
        ))}
      </div>
      {value && (
        <div className="text-xs text-gray-500 mt-1">
          Seleccionados: {value}
        </div>
      )}
    </div>
  );
}
