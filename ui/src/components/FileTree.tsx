import React from 'react';
import { ChevronRight, ChevronDown, FileCode, FileJson, Trash2 } from 'lucide-react';
import type { AppInfo } from '@/types';
import { useAppStore } from '@/store/appStore';
import { useApps } from '@/hooks/useApps';

interface FileTreeProps {
  apps: AppInfo[];
}

interface AppTreeItemProps {
  app: AppInfo;
}

const AppTreeItem: React.FC<AppTreeItemProps> = ({ app }) => {
  const { activeApp, setActiveApp, setActiveFileType } = useAppStore();
  const { deleteApp } = useApps();
  const [expanded, setExpanded] = React.useState(true);
  const isActive = activeApp === app.name;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${app.name}"? This cannot be undone.`)) {
      try {
        await deleteApp(app.name);
      } catch (error) {
        console.error('Failed to delete app:', error);
      }
    }
  };

  const handleFileClick = (type: 'python' | 'yaml') => {
    setActiveApp(app.name);
    setActiveFileType(type);
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center px-2 py-1.5 cursor-pointer group ${
          isActive ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-slate-800 text-slate-300'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <button
          className="p-0.5 mr-1 hover:bg-slate-700 rounded"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        <span className="flex-1 font-medium text-sm truncate">{app.name}</span>

        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600/20 hover:text-red-400 rounded transition-all"
          aria-label={`Delete ${app.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="ml-4">
          {app.has_python && (
            <button
              onClick={() => handleFileClick('python')}
              className={`w-full flex items-center px-2 py-1.5 text-sm ${
                isActive
                  ? 'text-slate-200 hover:bg-slate-800'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 mr-2 text-yellow-500" />
              <span className="truncate">{app.name}.py</span>
            </button>
          )}
          {app.has_yaml && (
            <button
              onClick={() => handleFileClick('yaml')}
              className={`w-full flex items-center px-2 py-1.5 text-sm ${
                isActive
                  ? 'text-slate-200 hover:bg-slate-800'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <FileJson className="w-3.5 h-3.5 mr-2 text-blue-500" />
              <span className="truncate">{app.name}.yaml</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ apps }) => {
  return (
    <div className="py-2">
      {apps.map((app) => (
        <AppTreeItem key={app.name} app={app} />
      ))}
    </div>
  );
};
