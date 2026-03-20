'use client';

import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const iconMap = {
    danger: <Trash2 className="w-6 h-6 text-ha-error" />,
    warning: <AlertTriangle className="w-6 h-6 text-ha-warning" />,
    info: <AlertTriangle className="w-6 h-6 text-ha-primary" />,
  };

  const buttonColorMap = {
    danger: 'bg-ha-error hover:opacity-90',
    warning: 'bg-ha-warning hover:opacity-90',
    info: 'bg-ha-primary hover:bg-ha-primary-dark',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="relative bg-ha-card rounded-xl shadow-xl max-w-md w-full mx-4 border border-ha-border">
        <div className="flex items-center justify-between p-4 border-b border-ha-border">
          <div className="flex items-center gap-3">
            {iconMap[variant]}
            <h3 className="text-lg font-semibold text-ha-text">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-ha-text-secondary hover:text-ha-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-ha-text-secondary">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-ha-border">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-medium border border-ha-border text-ha-text hover:bg-ha-surface transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${buttonColorMap[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
