'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'sm-tall' | 'md-tall' | 'lg-tall' | 'xl-tall' | 'full-tall';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  children: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnClickOutside?: boolean;
  closeOnEsc?: boolean;
  footer?: React.ReactNode;
  headerBackground?: string;
}

const MODAL_SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-7xl',
  full: 'max-w-full mx-[100px]',
  'sm-tall': 'max-w-md',
  'md-tall': 'max-w-2xl',
  'lg-tall': 'max-w-4xl',
  'xl-tall': 'max-w-7xl',
  'full-tall': 'max-w-full mx-[100px]',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnClickOutside = true,
  closeOnEsc = true,
  footer,
  headerBackground,
}: ModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleEscKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEsc) {
        onClose();
      }
    },
    [closeOnEsc, onClose]
  );

  useEffect(() => {
    if (isOpen && closeOnEsc) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen, closeOnEsc, handleEscKey]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isMounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300 ease-out"
        style={{
          opacity: isAnimating ? 1 : 0,
        }}
        onClick={closeOnClickOutside ? onClose : undefined}
      />

      <div className="flex min-h-full items-center justify-center p-2 text-center">
        <div
          className={`relative transform overflow-hidden rounded-lg bg-background border border-border-color text-left align-bottom transition-all duration-300 ease-out w-full shadow-lg shadow-black/4 ${MODAL_SIZE_CLASSES[size]}`}
          style={{
            opacity: isAnimating ? 1 : 0,
            transform: isAnimating ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.98)',
            display: 'flex',
            flexDirection: 'column',
            // Aplicar altura fija para modales con sufijo -tall
            ...(size.endsWith('-tall') ? {
              maxHeight: '91vh',
              height: '91vh',
            } : {
              maxHeight: '91vh',
            }),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            // aqui
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-border-color"
              style={headerBackground ? { background: headerBackground } : undefined}
            > 
               {title && (
                React.isValidElement(title) ? (
                  <div className="flex-1">
                    {title}
                  </div>
                ) : (
                  <h3 className="text-sm font-bold text-text-secondary">
                    {title}
                  </h3>
                )
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-text-secondary hover:text-text-primary focus:outline-none transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-2 py-3 border-t border-border-color/30">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}