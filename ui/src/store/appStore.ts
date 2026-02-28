import { create } from 'zustand';
import type {
  AppInfo,
  CreateAppData,
  LogEntry,
  VersionInfo,
  BottomPanelTab,
  LogFilter,
  FileType,
  Toast,
} from '@/types';
import * as api from '@/services/api';

interface AppState {
  // Apps
  apps: AppInfo[];
  activeApp: string | null;
  isLoadingApps: boolean;
  appsError: string | null;

  // Editor
  activeFileType: FileType;
  editorContent: string;
  originalContent: string;
  isSaving: boolean;
  editorError: string | null;

  // UI
  sidebarOpen: boolean;
  bottomPanelOpen: boolean;
  bottomPanelTab: BottomPanelTab;
  showCreateModal: boolean;

  // Logs
  logs: LogEntry[];
  logFilter: LogFilter;
  logPaused: boolean;
  wsConnected: boolean;

  // Versions
  versions: VersionInfo[];
  isLoadingVersions: boolean;
  versionsError: string | null;

  // Toasts
  toasts: Toast[];

  // Computed
  isDirty: boolean;
  filteredLogs: LogEntry[];

  // Actions
  fetchApps: () => Promise<void>;
  setActiveApp: (app: string) => void;
  createApp: (data: CreateAppData) => Promise<void>;
  deleteApp: (name: string) => Promise<void>;
  loadFile: (app: string, type: FileType) => Promise<void>;
  saveFile: () => Promise<void>;
  updateContent: (content: string) => void;
  fetchVersions: () => Promise<void>;
  restoreVersion: (version: string) => Promise<void>;
  deleteVersion: (version: string) => Promise<void>;
  cleanupVersions: (keepCount: number) => Promise<void>;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  setLogFilter: (filter: LogFilter) => void;
  setLogPaused: (paused: boolean) => void;
  setWsConnected: (connected: boolean) => void;
  toggleSidebar: () => void;
  toggleBottomPanel: () => void;
  setBottomPanelTab: (tab: BottomPanelTab) => void;
  setShowCreateModal: (show: boolean) => void;
  setActiveFileType: (type: FileType) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  apps: [],
  activeApp: null,
  isLoadingApps: false,
  appsError: null,

  activeFileType: 'python',
  editorContent: '',
  originalContent: '',
  isSaving: false,
  editorError: null,

  sidebarOpen: true,
  bottomPanelOpen: false,
  bottomPanelTab: 'logs',
  showCreateModal: false,

  logs: [],
  logFilter: 'all',
  logPaused: false,
  wsConnected: false,

  versions: [],
  isLoadingVersions: false,
  versionsError: null,

  toasts: [],

  // Computed
  get isDirty() {
    return get().editorContent !== get().originalContent;
  },

  get filteredLogs() {
    const { logs, logFilter } = get();
    if (logFilter === 'all') return logs;
    return logs.filter(
      (log) => log.level.toLowerCase() === logFilter
    );
  },

  // Actions
  fetchApps: async () => {
    set({ isLoadingApps: true, appsError: null });
    try {
      const apps = await api.getApps();
      set({ apps, isLoadingApps: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch apps';
      set({ appsError: message, isLoadingApps: false });
      get().addToast({ type: 'error', message });
    }
  },

  setActiveApp: (app: string) => {
    set({ activeApp: app });
    get().loadFile(app, get().activeFileType);
    get().fetchVersions();
  },

  createApp: async (data: CreateAppData) => {
    try {
      const newApp = await api.createApp(data);
      set((state) => ({
        apps: [...state.apps, newApp],
        showCreateModal: false,
      }));
      get().addToast({
        type: 'success',
        message: `App "${data.name}" created successfully`,
      });
      get().setActiveApp(data.name);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create app';
      get().addToast({ type: 'error', message });
      throw error;
    }
  },

  deleteApp: async (name: string) => {
    try {
      await api.deleteApp(name);
      set((state) => ({
        apps: state.apps.filter((app) => app.name !== name),
        activeApp: state.activeApp === name ? null : state.activeApp,
      }));
      get().addToast({
        type: 'success',
        message: `App "${name}" deleted successfully`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete app';
      get().addToast({ type: 'error', message });
      throw error;
    }
  },

  loadFile: async (app: string, type: FileType) => {
    try {
      const fileData =
        type === 'python'
          ? await api.getPythonFile(app)
          : await api.getYamlFile(app);
      set({
        editorContent: fileData.content,
        originalContent: fileData.content,
        editorError: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load file';
      set({ editorError: message, editorContent: '', originalContent: '' });
      get().addToast({ type: 'error', message });
    }
  },

  saveFile: async () => {
    const { activeApp, activeFileType, editorContent } = get();
    if (!activeApp) return;

    set({ isSaving: true });
    try {
      if (activeFileType === 'python') {
        await api.savePythonFile(activeApp, editorContent);
      } else {
        await api.saveYamlFile(activeApp, { content: editorContent });
      }
      set({
        originalContent: editorContent,
        isSaving: false,
      });
      get().addToast({ type: 'success', message: 'File saved successfully' });
      get().fetchVersions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save file';
      set({ isSaving: false });
      get().addToast({ type: 'error', message });
    }
  },

  updateContent: (content: string) => {
    set({ editorContent: content });
  },

  fetchVersions: async () => {
    const { activeApp } = get();
    if (!activeApp) return;

    set({ isLoadingVersions: true, versionsError: null });
    try {
      const versions = await api.getVersions(activeApp);
      set({ versions, isLoadingVersions: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch versions';
      set({ versionsError: message, isLoadingVersions: false });
    }
  },

  restoreVersion: async (version: string) => {
    const { activeApp } = get();
    if (!activeApp) return;

    try {
      const fileData = await api.restoreVersion(activeApp, version);
      set({
        editorContent: fileData.content,
        originalContent: fileData.content,
      });
      get().addToast({
        type: 'success',
        message: `Version ${version} restored successfully`,
      });
      get().fetchVersions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore version';
      get().addToast({ type: 'error', message });
    }
  },

  deleteVersion: async (version: string) => {
    const { activeApp } = get();
    if (!activeApp) return;

    try {
      await api.deleteVersion(activeApp, version);
      get().addToast({
        type: 'success',
        message: `Version ${version} deleted successfully`,
      });
      get().fetchVersions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete version';
      get().addToast({ type: 'error', message });
    }
  },

  cleanupVersions: async (keepCount: number) => {
    const { activeApp } = get();
    if (!activeApp) return;

    try {
      await api.cleanupVersions(activeApp, keepCount);
      get().addToast({
        type: 'success',
        message: `Old versions cleaned up successfully`,
      });
      get().fetchVersions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cleanup versions';
      get().addToast({ type: 'error', message });
    }
  },

  addLog: (log: LogEntry) => {
    if (!get().logPaused) {
      set((state) => ({
        logs: [...state.logs, log].slice(-1000),
      }));
    }
  },

  clearLogs: () => {
    set({ logs: [] });
  },

  setLogFilter: (filter: LogFilter) => {
    set({ logFilter: filter });
  },

  setLogPaused: (paused: boolean) => {
    set({ logPaused: paused });
  },

  setWsConnected: (connected: boolean) => {
    set({ wsConnected: connected });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  toggleBottomPanel: () => {
    set((state) => ({ bottomPanelOpen: !state.bottomPanelOpen }));
  },

  setBottomPanelTab: (tab: BottomPanelTab) => {
    set({ bottomPanelTab: tab, bottomPanelOpen: true });
  },

  setShowCreateModal: (show: boolean) => {
    set({ showCreateModal: show });
  },

  setActiveFileType: (type: FileType) => {
    set({ activeFileType: type });
    const { activeApp } = get();
    if (activeApp) {
      get().loadFile(activeApp, type);
    }
  },

  addToast: (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));