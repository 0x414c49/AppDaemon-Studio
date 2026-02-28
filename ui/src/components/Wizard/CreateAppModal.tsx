import React, { useState } from 'react';
import { X, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { useApps } from '@/hooks/useApps';

interface CreateAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  class_name: string;
  description: string;
}

interface FormErrors {
  name?: string;
  class_name?: string;
}

export const CreateAppModal: React.FC<CreateAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createApp } = useApps();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    class_name: '',
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePythonModuleName = (name: string): boolean => {
    return /^[a-z_][a-z0-9_]*$/.test(name);
  };

  const validateClassName = (name: string): boolean => {
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'App name is required';
    } else if (!validatePythonModuleName(formData.name)) {
      newErrors.name =
        'Invalid Python module name. Use lowercase letters, numbers, and underscores only. Must start with a letter or underscore.';
    }

    if (!formData.class_name.trim()) {
      newErrors.class_name = 'Class name is required';
    } else if (!validateClassName(formData.class_name)) {
      newErrors.class_name =
        'Invalid class name. Use PascalCase (e.g., MyNewApp).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createApp({
        name: formData.name.trim(),
        class_name: formData.class_name.trim(),
        description: formData.description.trim(),
      });
      handleClose();
    } catch (error) {
      console.error('Failed to create app:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ name: '', class_name: '', description: '' });
      setErrors({});
      onClose();
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => {
      const newData = { ...prev, name };
      if (!prev.class_name && name) {
        newData.class_name = name
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');
      }
      return newData;
    });
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleClassNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, class_name: e.target.value }));
    if (errors.class_name) {
      setErrors((prev) => ({ ...prev, class_name: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">Create New App</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label
              htmlFor="app-name"
              className="block text-sm font-medium text-slate-300 mb-1"
            >
              App Name
            </label>
            <input
              id="app-name"
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="my_new_app"
              disabled={isSubmitting}
              className={`input ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              autoFocus
            />
            {errors.name ? (
              <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.name}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Use lowercase letters, numbers, and underscores
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="class-name"
              className="block text-sm font-medium text-slate-300 mb-1"
            >
              Class Name
            </label>
            <input
              id="class-name"
              type="text"
              value={formData.class_name}
              onChange={handleClassNameChange}
              placeholder="MyNewApp"
              disabled={isSubmitting}
              className={`input ${errors.class_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.class_name ? (
              <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.class_name}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Use PascalCase (e.g., MyNewApp)
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-300 mb-1"
            >
              Description <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="My automation app description"
              disabled={isSubmitting}
              rows={3}
              className="input resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
