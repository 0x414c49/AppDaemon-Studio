'use client';

import { useState } from 'react';
import { 
  Plus, Trash2, Folder, FileCode, 
  Zap, Sun, Moon, Thermometer, Lightbulb, 
  Home, Lock, Bell, Calendar, Clock,
  Wifi, Music, Camera, Tv, Power,
  Activity, Gauge, Cpu, Database, Check
} from 'lucide-react';
import { AppInfo } from '@/types';

interface SidebarProps {
  apps: AppInfo[];
  activeApp: string | null;
  onSelectApp: (name: string) => void;
  onCreateApp: (name: string, className: string, icon?: string, description?: string) => void;
  onDeleteApp: (name: string) => void;
}

// Available icons for apps
const ICON_OPTIONS = [
  { name: 'Zap', component: Zap },
  { name: 'Sun', component: Sun },
  { name: 'Moon', component: Moon },
  { name: 'Thermometer', component: Thermometer },
  { name: 'Lightbulb', component: Lightbulb },
  { name: 'Home', component: Home },
  { name: 'Lock', component: Lock },
  { name: 'Bell', component: Bell },
  { name: 'Calendar', component: Calendar },
  { name: 'Clock', component: Clock },
  { name: 'Wifi', component: Wifi },
  { name: 'Music', component: Music },
  { name: 'Camera', component: Camera },
  { name: 'Tv', component: Tv },
  { name: 'Power', component: Power },
  { name: 'Activity', component: Activity },
  { name: 'Gauge', component: Gauge },
  { name: 'Cpu', component: Cpu },
  { name: 'Database', component: Database },
  { name: 'Folder', component: Folder },
];

// Get icon component by name
function getIconComponent(iconName?: string) {
  if (!iconName) return Folder;
  const icon = ICON_OPTIONS.find(i => i.name === iconName);
  return icon?.component || Folder;
}

export function Sidebar({ apps, activeApp, onSelectApp, onCreateApp, onDeleteApp }: SidebarProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Zap');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAppName && newClassName) {
      onCreateApp(newAppName, newClassName, selectedIcon, newDescription);
      setNewAppName('');
      setNewClassName('');
      setNewDescription('');
      setSelectedIcon('Zap');
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
          className="w-full flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md text-white text-sm font-medium transition-colors"
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
            {apps.map((app) => {
              const Icon = getIconComponent(app.icon);
              
              return (
                <div
                  key={app.name}
                  className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    activeApp === app.name
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                  onClick={() => onSelectApp(app.name)}
                  title={app.description || app.name}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${
                      activeApp === app.name ? 'text-blue-200' : 'text-slate-400'
                    }`} />
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
              );
            })}
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
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-10 gap-1.5">
                  {ICON_OPTIONS.map(({ name, component: IconComp }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedIcon(name)}
                      className={`p-2 rounded transition-colors relative ${
                        selectedIcon === name
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                      title={name}
                    >
                      <IconComp className="w-4 h-4" />
                      {selectedIcon === name && (
                        <Check className="w-2.5 h-2.5 absolute -top-1 -right-1 text-white bg-blue-600 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of what this app does"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
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
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md text-white transition-colors"
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
