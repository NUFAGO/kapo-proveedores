import React, { useState, useEffect } from 'react';
import Modal from './modal';
import { Button } from './button';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export type NotificationType = "success" | "error" | "warning" | "info";

export interface CheckboxOption {
  id: string;
  label: string;
  checked: boolean;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: NotificationType;
  message?: string;
  description?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: (comment?: string, checkboxes?: CheckboxOption[]) => void;
  onCancel?: () => void;
  showCommentInput?: boolean;
  commentPlaceholder?: string;
  showCheckboxes?: boolean;
  checkboxes?: CheckboxOption[];
  onCheckboxChange?: (checkboxes: CheckboxOption[]) => void;
  loading?: boolean;
}

const TYPE_CONFIG: Record<NotificationType, {
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  iconColor: string;
  buttonColor: "primary" | "danger" | "warning" | "success";
  title: string;
  focusRingColor: string;
}> = {
  success: {
    icon: CheckCircle,
    bgColor: 'rgba(34, 197, 94, 0.1)',
    iconColor: '#22c55e',
    buttonColor: "success",
    title: "Éxito",
    focusRingColor: '#22c55e'
  },
  error: {
    icon: XCircle,
    bgColor: 'rgba(239, 68, 68, 0.1)',
    iconColor: '#ef4444',
    buttonColor: "danger",
    title: "Confirmar Acción",
    focusRingColor: '#ef4444'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'rgba(245, 158, 11, 0.1)',
    iconColor: '#f59e0b',
    buttonColor: "warning",
    title: "Advertencia",
    focusRingColor: '#f59e0b'
  },
  info: {
    icon: Info,
    bgColor: 'rgba(59, 130, 246, 0.1)',
    iconColor: '#3b82f6',
    buttonColor: "primary",
    title: "Información",
    focusRingColor: '#3b82f6'
  },
};

export default function NotificationModal({
  isOpen,
  onClose,
  type,
  message,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  showCommentInput = false,
  commentPlaceholder = "Escribe aquí el motivo...",
  showCheckboxes = false,
  checkboxes = [],
  onCheckboxChange,
  loading = false,
}: NotificationModalProps) {
  const [comment, setComment] = useState('');
  const [localCheckboxes, setLocalCheckboxes] = useState<CheckboxOption[]>(checkboxes);
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  // Update local checkboxes when props change
  useEffect(() => {
    setLocalCheckboxes(checkboxes);
  }, [checkboxes]);

  const handleCheckboxChange = (id: string, checked: boolean) => {
    const updatedCheckboxes = localCheckboxes.map(cb =>
      cb.id === id ? { ...cb, checked } : cb
    );
    setLocalCheckboxes(updatedCheckboxes);
    if (onCheckboxChange) {
      onCheckboxChange(updatedCheckboxes);
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(showCommentInput ? comment : undefined, showCheckboxes ? localCheckboxes : undefined);
    }
  };

  const isConfirmDisabled = () => {
    if (showCommentInput && !comment.trim()) return true;
    if (showCheckboxes && !localCheckboxes.every(cb => cb.checked)) return true;
    return false;
  };

  const modalTitle = (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: config.bgColor }}
      >
        <span style={{ color: config.iconColor }}>
          <Icon className="w-5 h-5" />
        </span>
      </div>
      <div>
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-on-content-bg-heading)' }}>
          {config.title}
        </h2>
      </div>
    </div>
  );

  const modalFooter = (
    <div className="flex items-center justify-between px-4">
      <div></div>
      <div className="flex gap-2">
        {onCancel && (
          <Button
            variant="custom"
            color="secondary"
            size="xs"
            onClick={onCancel}
          >
            {cancelText}
          </Button>
        )}
        {onConfirm && (
          <Button
            variant="custom"
            color={config.buttonColor}
            size="xs"
            onClick={handleConfirm}
            disabled={isConfirmDisabled() || loading}
            loading={loading}
          >
            {confirmText}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="sm"
      footer={modalFooter}
      showCloseButton={false}
      closeOnClickOutside={false}
      closeOnEsc={false}
    >
      <div className="space-y-4">
        <div className="text-center">
          {message && (
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-on-content-bg-heading)' }}>
              {message}
            </h3>
          )}
          {description && (
            typeof description === 'string' ? (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {description}
              </p>
            ) : (
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {description}
              </div>
            )
          )}
        </div>

        {showCheckboxes && localCheckboxes.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
              Confirmaciones requeridas
            </label>
            <div className="space-y-3">
              {localCheckboxes.map((checkbox) => (
                <div key={checkbox.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={checkbox.id}
                    checked={checkbox.checked}
                    onChange={(e) => handleCheckboxChange(checkbox.id, e.target.checked)}
                    className="w-4 h-4 rounded border-2 focus:ring-2 transition-colors"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--card-bg)',
                      '--tw-ring-color': config.focusRingColor
                    } as React.CSSProperties}
                  />
                  <label
                    htmlFor={checkbox.id}
                    className="text-xs cursor-pointer select-none"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {checkbox.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {showCommentInput && (
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Comentario
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={commentPlaceholder}
              rows={3}
              className="w-full px-3 py-2 text-xs border rounded-md resize-none focus:outline-none focus:ring-1 transition-colors"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-primary)',
                '--tw-ring-color': config.focusRingColor
              } as React.CSSProperties}
              autoFocus
            />
          </div>
        )}
      </div>
    </Modal>
  );
}