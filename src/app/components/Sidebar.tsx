'use client';

import { useState } from 'react';
import { Plus, Trash2, Folder, FileCode, ChevronRight } from 'lucide-react';
import { AppInfo } from '../../types';

interface SidebarProps {
  apps: AppInfo[];
  activeApp: string | null;
  onSelectApp: (name: string) => void;
  onCreateApp: (name: string, className: string) => void;
  onDeleteApp: (name: string) => void;
}

export function Sidebar({ apps, activeApp, onSelectApp, onCreateApp, onDeleteApp }: SidebarProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newClassName, setNewClassName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAppName && newClassName) {
      onCreateApp(newAppName, newClassName);
      setNewAppName('');
      setNewClassName('');
      setShowCreateModal(false);
    }
  };

  const generateClassName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  };

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <FileCode className="w-5 h-5 text-blue-400" />
          AppDaemon Studio
        </h1>
      </div>

      <div className="p-2">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create App
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {apps.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No apps yet</p>
        ) : (
          <div className="space-y-1">
            {apps.map((app) => (
              <div
                key={app.name}
                className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  activeApp === app.name
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-700 text-slate-300'
                }`}
                onClick={() => onSelectApp(app.name)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Folder className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm truncate">{app.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteApp(app.name);
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${
                    activeApp === app.name
                      ? 'hover:bg-blue-700'
                      : 'hover:bg-slate-600'
                  }`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-96 border border-slate-700">
            <h2 className="text-lg font-bold text-white mb-4">Create New App</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  App Name
                </label>
                <input
                  type="text"
                  value={newAppName}
                  onChange={(e) => {
                    setNewAppName(e.target.value);
                    setNewClassName(generateClassName(e.target.value));
                  }}
                  placeholder="my_app"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="MyApp"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
