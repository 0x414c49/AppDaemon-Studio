import React from 'react';
import { FileTree } from './FileTree';
import { Plus, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useApps } from '@/hooks/useApps';

export const Sidebar: React.FC = () => {
  const { apps, isLoading, error, refreshApps } = useApps();
  const { setShowCreateModal } = useAppStore();

  return (
    <div className="h-full flex flex-col bg-slate-900">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-200">Apps</h2>
          <div className="flex gap-1">
            <button
              onClick={refreshApps}
              disabled={isLoading}
              className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
              aria-label="Refresh apps"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              data-testid="create-app-button"
              onClick={() => setShowCreateModal(true)}
              className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Create new app"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-md">
            {error}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <FileTree apps={apps} />
      </div>

      {apps.length === 0 && !isLoading && !error && (
        <div className="p-4 text-center">
          <p className="text-sm text-slate-500 mb-3">No apps yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create App
          </button>
        </div>
      )}
    </div>
  );
};
