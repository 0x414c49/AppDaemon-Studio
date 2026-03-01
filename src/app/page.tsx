'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { AppInfo } from '@/types';

export default function Home() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/apps');
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

  const handleCreateApp = async (name: string, className: string) => {
    try {
      const response = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, class_name: className }),
      });
      if (!response.ok) throw new Error('Failed to create app');
      await fetchApps();
      setActiveApp(name);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create app');
    }
  };

  const handleDeleteApp = async (name: string) => {
    if (!confirm(`Delete app "${name}"?`)) return;
    try {
      const response = await fetch(`/api/files/${name}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete app');
      await fetchApps();
      if (activeApp === name) setActiveApp(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete app');
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
      />
      <main className="flex-1 flex flex-col min-w-0">
        {activeApp ? (
          <Editor appName={activeApp} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <p className="text-xl mb-2">No app selected</p>
              <p>Select an app from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
