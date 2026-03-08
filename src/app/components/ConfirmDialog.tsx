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
    danger: <Trash2 className="w-6 h-6 text-red-400" />,
    warning: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
    info: <AlertTriangle className="w-6 h-6 text-blue-400" />,
  };

  const buttonColorMap = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      <div className="relative bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 border border-slate-700">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            {iconMap[variant]}
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-slate-300">{message}</p>
        </div>
        
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md font-medium text-white transition-colors ${buttonColorMap[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
