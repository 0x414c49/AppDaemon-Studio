import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { EditorPanel } from './EditorPanel';
import { LogViewer } from './LogViewer';
import { VersionPanel } from './VersionPanel';
import { useAppStore } from '@/store/appStore';
import { Code2, Menu, PanelBottom, History, FileText } from 'lucide-react';

export const Layout: React.FC = () => {
  const {
    sidebarOpen,
    bottomPanelOpen,
    bottomPanelTab,
    activeApp,
    toggleSidebar,
    toggleBottomPanel,
    setBottomPanelTab,
    toasts,
  } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const { saveFile, isDirty } = useAppStore.getState();
        if (isDirty) {
          saveFile();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-slate-800 rounded-md lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-blue-500" />
            <h1 className="font-semibold text-slate-100">AppDaemon Studio</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBottomPanelTab('logs')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              bottomPanelOpen && bottomPanelTab === 'logs'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Logs</span>
          </button>
          <button
            onClick={() => setBottomPanelTab('versions')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              bottomPanelOpen && bottomPanelTab === 'versions'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Versions</span>
          </button>
          <button
            onClick={toggleBottomPanel}
            className={`p-2 rounded-md transition-colors ${
              bottomPanelOpen ? 'bg-slate-800 text-slate-200' : 'hover:bg-slate-800 text-slate-400'
            }`}
            aria-label="Toggle bottom panel"
          >
            <PanelBottom className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-200 ease-in-out lg:block`}
        >
          <div className="h-full pt-12 lg:pt-0">
            <Sidebar />
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Editor area */}
        <main className="flex-1 flex flex-col min-w-0">
          <EditorPanel />

          {/* Bottom panel */}
          {bottomPanelOpen && (
            <div className="h-64 border-t border-slate-800 bg-slate-900 flex flex-col">
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setBottomPanelTab('logs')}
                  className={bottomPanelTab === 'logs' ? 'tab-active' : 'tab-inactive'}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Logs
                </button>
                <button
                  onClick={() => setBottomPanelTab('versions')}
                  className={bottomPanelTab === 'versions' ? 'tab-active' : 'tab-inactive'}
                >
                  <History className="w-4 h-4 mr-2" />
                  Versions
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                {bottomPanelTab === 'logs' && <LogViewer />}
                {bottomPanelTab === 'versions' && activeApp && <VersionPanel />}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-md shadow-lg max-w-sm animate-fade-in ${
              toast.type === 'error'
                ? 'bg-red-600 text-white'
                : toast.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};
