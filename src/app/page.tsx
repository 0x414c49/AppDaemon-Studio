'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Settings } from './components/Settings';
import { ConfirmDialog } from './components/ConfirmDialog';
import { AlertDialog } from './components/AlertDialog';
import { TabBar, TabId } from './components/TabBar';
import { LogViewer } from './components/LogViewer';
import { AppInfo } from '@/types';
import { EditorSettings, getSettings, DEFAULT_SETTINGS, subscribeToSettings } from '@/lib/settings-store';

const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 600;
const DEFAULT_SIDEBAR_WIDTH = 256;
const SIDEBAR_WIDTH_KEY = 'appdaemon-studio-sidebar-width';

export default function Home() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    appName: string | null;
  }>({ isOpen: false, appName: null });
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'success' | 'error' | 'info';
  }>({ isOpen: false, title: '', message: '', variant: 'info' });
  
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
      if (saved) {
        const width = parseInt(saved, 10);
        if (!isNaN(width) && width >= MIN_SIDEBAR_WIDTH && width <= MAX_SIDEBAR_WIDTH) {
          return width;
        }
      }
    }
    return DEFAULT_SIDEBAR_WIDTH;
  });
  
  const [activeTab, setActiveTab] = useState<TabId>('editor');
  
  const isResizing = useRef(false);

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    setEditorSettings(getSettings());
    const unsubscribe = subscribeToSettings(setEditorSettings);
    return unsubscribe;
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      
      const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const response = await fetch('api/apps');
      if (!response.ok) throw new Error('Failed to fetch apps');
      const data = await response.json();
      setApps(data.apps);
      if (data.apps.length > 0 && !activeApp) {
        setActiveApp(data.apps[0].name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApp = async (name: string, className: string, icon?: string, description?: string) => {
    try {
      const response = await fetch('api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, class_name: className, icon, description }),
      });
      if (!response.ok) throw new Error('Failed to create app');
      await fetchApps();
      setActiveApp(name);
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `App "${name}" created successfully`,
        variant: 'success',
      });
    } catch (err) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to create app',
        variant: 'error',
      });
    }
  };

  const handleDeleteApp = async (name: string) => {
    setConfirmDialog({ isOpen: true, appName: name });
  };

  const confirmDeleteApp = async () => {
    const appName = confirmDialog.appName;
    if (!appName) return;
    
    try {
      const response = await fetch(`api/files/${appName}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete app');
      await fetchApps();
      if (activeApp === appName) setActiveApp(null);
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `App "${appName}" deleted successfully`,
        variant: 'success',
      });
    } catch (err) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to delete app',
        variant: 'error',
      });
    } finally {
      setConfirmDialog({ isOpen: false, appName: null });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading AppDaemon Studio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-200">
        <div className="text-center text-red-400">
          <p className="text-xl mb-2">Error</p>
          <p>{error}</p>
          <button 
            onClick={fetchApps}
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 overflow-hidden">
      <Sidebar 
        apps={apps}
        activeApp={activeApp}
        onSelectApp={setActiveApp}
        onCreateApp={handleCreateApp}
        onDeleteApp={handleDeleteApp}
        onOpenSettings={() => setShowSettings(true)}
        width={sidebarWidth}
        fontSize={editorSettings.sidebarFontSize}
      />
      <div
        className="w-1 bg-[#3c3c3c] hover:bg-[#007acc] cursor-col-resize flex-shrink-0 transition-colors"
        onMouseDown={handleMouseDown}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <TabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          disabled={!activeApp && activeTab === 'editor'}
        />
        {activeTab === 'logs' ? (
          <LogViewer />
        ) : activeApp ? (
          <Editor appName={activeApp} settings={editorSettings} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <p className="text-xl mb-2">No app selected</p>
              <p>Select an app from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </main>
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSettingsChange={setEditorSettings}
      />
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete App"
        message={`Are you sure you want to delete app "${confirmDialog.appName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteApp}
        onCancel={() => setConfirmDialog({ isOpen: false, appName: null })}
        variant="danger"
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        variant={alertDialog.variant}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
      />
    </div>
  );
}
