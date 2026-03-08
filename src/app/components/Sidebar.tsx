'use client';

import { useState } from 'react';
import { 
  Plus, Trash2, Folder, FolderOpen, FileCode, 
  Zap, Sun, Moon, Thermometer, Lightbulb, 
  Home, Lock, Bell, Calendar, Clock,
  Wifi, Music, Camera, Tv, Power,
  Activity, Gauge, Cpu, Database, Check, Settings,
  ChevronDown
} from 'lucide-react';
import { AppInfo } from '@/types';

interface SidebarProps {
  apps: AppInfo[];
  activeApp: string | null;
  onSelectApp: (name: string) => void;
  onCreateApp: (name: string, className: string, icon?: string, description?: string) => void;
  onDeleteApp: (name: string) => void;
  onOpenSettings: () => void;
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

export function Sidebar({ apps, activeApp, onSelectApp, onCreateApp, onDeleteApp, onOpenSettings }: SidebarProps) {
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
    <aside className="w-64 bg-[#252526] border-r border-[#3c3c3c] flex flex-col">
      {/* Header - VS Style */}
      <div className="h-9 flex items-center justify-between px-3 bg-[#323233] border-b border-[#3c3c3c]">
        <span className="text-xs font-medium text-[#cccccc] uppercase tracking-wide">
          Solution Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1 text-[#cccccc] hover:text-white hover:bg-[#3c3c3c] rounded transition-colors"
            title="New App"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1 text-[#cccccc] hover:text-white hover:bg-[#3c3c3c] rounded transition-colors"
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
            <Folder className="w-12 h-12 text-[#5a5a5a] mb-3" />
            <p className="text-sm text-[#858585] mb-3">No apps yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-sm text-[#3794ff] hover:underline"
            >
              Create your first app
            </button>
          </div>
        ) : (
          <div className="py-1">
            {/* Solution Root */}
            <div className="flex items-center h-[22px] px-2 text-[#cccccc]">
              <ChevronDown className="w-4 h-4 mr-1 text-[#858585]" />
              <FolderOpen className="w-4 h-4 mr-1.5 text-[#dcb67a]" />
              <span className="text-sm font-medium">apps</span>
              <span className="text-xs text-[#858585] ml-auto">{apps.length}</span>
            </div>

            {/* Apps list */}
            <div className="ml-4">
              {apps.map((app) => {
                const Icon = getIconComponent(app.icon);
                const isActive = activeApp === app.name;
                
                return (
                  <div
                    key={app.name}
                    className={`group flex items-center h-[22px] px-2 cursor-pointer ${
                      isActive ? 'bg-[#094771]' : 'hover:bg-[#2a2d2e]'
                    }`}
                    onClick={() => onSelectApp(app.name)}
                    title={app.description || app.name}
                  >
                    <span className="w-4 mr-1" />
                    <Folder className="w-4 h-4 mr-1.5 text-[#dcb67a]" />
                    <Icon className={`w-3.5 h-3.5 mr-1.5 ${
                      isActive ? 'text-[#4fc1ff]' : 'text-[#858585]'
                    }`} />
                    <span className={`text-sm flex-1 truncate ${
                      isActive ? 'text-white' : 'text-[#cccccc]'
                    }`}>
                      {app.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteApp(app.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-[#858585] hover:text-[#f48771] transition-all"
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
      <div className="h-6 flex items-center px-3 bg-[#007acc] text-white text-xs">
        <span>{apps.length} app{apps.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#252526] rounded-lg p-6 w-96 border border-[#3c3c3c]">
            <h2 className="text-lg font-bold text-white mb-4">Create New App</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-1">
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
                  className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#3c3c3c] rounded text-white placeholder-[#858585] focus:outline-none focus:border-[#007acc]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="MyApp"
                  className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#3c3c3c] rounded text-white placeholder-[#858585] focus:outline-none focus:border-[#007acc]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-10 gap-1">
                  {ICON_OPTIONS.map(({ name, component: IconComp }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedIcon(name)}
                      className={`p-2 rounded transition-colors relative ${
                        selectedIcon === name
                          ? 'bg-[#094771] text-white'
                          : 'bg-[#3c3c3c] hover:bg-[#505050] text-[#cccccc]'
                      }`}
                      title={name}
                    >
                      <IconComp className="w-4 h-4" />
                      {selectedIcon === name && (
                        <Check className="w-2.5 h-2.5 absolute -top-1 -right-1 text-white bg-[#007acc] rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-1">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of what this app does"
                  className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#3c3c3c] rounded text-white placeholder-[#858585] focus:outline-none focus:border-[#007acc] resize-none"
                  rows={2}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-[#3c3c3c] hover:bg-[#505050] text-[#cccccc] rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#007acc] hover:bg-[#0098ff] text-white rounded transition-colors"
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
