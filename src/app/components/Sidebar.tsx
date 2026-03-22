'use client';

import { useState } from 'react';
import {
  Plus, Trash2, Folder, FolderOpen, FileCode,
  Zap, Sun, Moon, Thermometer, Lightbulb,
  Home, Lock, Bell, Calendar, Clock,
  Wifi, Music, Camera, Tv, Power,
  Activity, Gauge, Cpu, Database, Check, Settings,
  ChevronDown, RotateCcw
} from 'lucide-react';
import { AppInfo } from '@/types';

interface SidebarProps {
  apps: AppInfo[];
  activeApp: string | null;
  onSelectApp: (name: string) => void;
  onCreateApp: (name: string, className: string, icon?: string, description?: string) => void;
  onDeleteApp: (name: string) => void;
  onToggleDisabled: (name: string, disabled: boolean) => void;
  onRestartApp?: (name: string) => void;
  onOpenSettings: () => void;
  adApiConfigured?: boolean;
  width?: number;
  fontSize?: number;
}

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

function getIconComponent(iconName?: string) {
  if (!iconName) return Folder;
  const icon = ICON_OPTIONS.find(i => i.name === iconName);
  return icon?.component || Folder;
}

export function Sidebar({
  apps, activeApp, onSelectApp, onCreateApp, onDeleteApp,
  onToggleDisabled, onRestartApp, onOpenSettings,
  adApiConfigured, width = 256, fontSize = 14,
}: SidebarProps) {
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

  const toSnakeCase = (name: string) => name
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s\-]+/g, '_')
    .toLowerCase();

  const generateClassName = (name: string) => name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return (
    <aside
      className="bg-ha-sidebar border-r border-ha-border flex flex-col flex-shrink-0"
      style={{ width: `${width}px`, fontSize: `${fontSize}px` }}
    >
      {/* Header */}
      <div className="h-9 flex items-center justify-between px-3 bg-ha-surface border-b border-ha-border">
        <span className="font-medium text-ha-text-secondary uppercase tracking-wide" style={{ fontSize: '0.75rem' }}>
          Apps
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1 text-ha-text-secondary hover:text-ha-text hover:bg-ha-surface-hover rounded transition-colors"
            title="New App"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1 text-ha-text-secondary hover:text-ha-text hover:bg-ha-surface-hover rounded transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto">
        {apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Folder className="w-12 h-12 text-ha-text-disabled mb-3" />
            <p className="text-ha-text-secondary mb-3">No apps yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-ha-primary hover:underline"
            >
              Create your first app
            </button>
          </div>
        ) : (
          <div className="py-1">
            {/* Root row */}
            <div className="flex items-center h-[22px] px-2 text-ha-text">
              <ChevronDown className="w-4 h-4 mr-1 text-ha-text-secondary" />
              <FolderOpen className="w-4 h-4 mr-1.5 text-ha-accent" />
              <span className="font-medium">apps</span>
              <span className="text-ha-text-secondary ml-auto" style={{ fontSize: '0.75rem' }}>{apps.length}</span>
            </div>

            {/* Apps list */}
            <div className="ml-4">
              {apps.map((app) => {
                const Icon = getIconComponent(app.icon);
                const isActive = activeApp === app.name;

                return (
                  <div
                    key={app.name}
                    className={`group flex items-center h-[22px] px-2 cursor-pointer rounded-sm ${
                      isActive ? 'bg-ha-surface-active' : 'hover:bg-ha-surface-hover'
                    } ${app.disabled ? 'opacity-50' : ''}`}
                    onClick={() => onSelectApp(app.name)}
                    title={app.description || app.name}
                  >
                    <Icon className={`w-4 h-4 mr-2 flex-shrink-0 ${
                      isActive ? 'text-ha-primary' : 'text-ha-text-secondary'
                    }`} />
                    <span className={`flex-1 truncate ${
                      isActive ? 'text-ha-text font-medium' : 'text-ha-text'
                    } ${app.disabled ? 'line-through' : ''}`}>
                      {app.name}
                    </span>

                    {/* Enable/disable toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleDisabled(app.name, !app.disabled);
                      }}
                      className={`flex-shrink-0 transition-opacity ${app.disabled ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      title={app.disabled ? 'Enable app' : 'Disable app'}
                    >
                      <span className={`flex items-center w-7 h-4 rounded-full transition-colors ${app.disabled ? 'bg-ha-text-disabled' : 'bg-green-500'}`}>
                        <span className={`block w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${app.disabled ? '' : 'translate-x-3'}`} />
                      </span>
                    </button>

                    {/* Restart button (only if AD API configured) */}
                    {adApiConfigured && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestartApp?.(app.name);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-ha-text-secondary hover:text-ha-primary transition-all"
                        title="Restart app"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteApp(app.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-ha-text-secondary hover:text-ha-error transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="h-6 flex items-center px-3 bg-ha-status text-white" style={{ fontSize: '0.75rem' }}>
        <span>{apps.length} app{apps.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-ha-card rounded-xl p-6 w-96 border border-ha-border shadow-2xl">
            <h2 className="text-lg font-bold text-ha-text mb-4">Create New App</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ha-text-secondary mb-1">
                  App Name
                </label>
                <input
                  type="text"
                  value={newAppName}
                  onChange={(e) => {
                    const snakeCaseName = toSnakeCase(e.target.value);
                    setNewAppName(snakeCaseName);
                    setNewClassName(generateClassName(snakeCaseName));
                  }}
                  placeholder="my_app"
                  className="w-full px-3 py-2 bg-ha-surface border border-ha-border rounded-lg text-ha-text focus:outline-none focus:border-ha-primary"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ha-text-secondary mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="MyApp"
                  className="w-full px-3 py-2 bg-ha-surface border border-ha-border rounded-lg text-ha-text focus:outline-none focus:border-ha-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ha-text-secondary mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-10 gap-1">
                  {ICON_OPTIONS.map(({ name, component: IconComp }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedIcon(name)}
                      className={`p-2 rounded-lg transition-colors relative ${
                        selectedIcon === name
                          ? 'bg-ha-surface-active text-ha-primary'
                          : 'bg-ha-surface hover:bg-ha-surface-hover text-ha-text-secondary'
                      }`}
                      title={name}
                    >
                      <IconComp className="w-4 h-4" />
                      {selectedIcon === name && (
                        <Check className="w-2.5 h-2.5 absolute -top-1 -right-1 text-white bg-ha-primary rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ha-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of what this app does"
                  className="w-full px-3 py-2 bg-ha-surface border border-ha-border rounded-lg text-ha-text focus:outline-none focus:border-ha-primary resize-none"
                  rows={2}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-ha-border text-ha-text hover:bg-ha-surface rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-ha-primary hover:bg-ha-primary-dark text-white rounded-lg transition-colors"
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
