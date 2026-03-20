'use client';

import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  variant?: 'success' | 'error' | 'info';
}

export function AlertDialog({
  isOpen,
  title,
  message,
  onClose,
  variant = 'info',
}: AlertDialogProps) {
  if (!isOpen) return null;

  const iconMap = {
    success: <CheckCircle className="w-12 h-12 text-ha-success" />,
    error: <AlertCircle className="w-12 h-12 text-ha-error" />,
    info: <Info className="w-12 h-12 text-ha-primary" />,
  };

  const buttonColorMap = {
    success: 'bg-ha-success hover:opacity-90',
    error: 'bg-ha-error hover:opacity-90',
    info: 'bg-ha-primary hover:bg-ha-primary-dark',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-ha-card rounded-xl shadow-xl max-w-md w-full mx-4 border border-ha-border">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">{iconMap[variant]}</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-ha-text mb-2">{title}</h3>
              <p className="text-ha-text-secondary">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="text-ha-text-secondary hover:text-ha-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="px-6 py-4 bg-ha-surface border-t border-ha-border rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${buttonColorMap[variant]}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
