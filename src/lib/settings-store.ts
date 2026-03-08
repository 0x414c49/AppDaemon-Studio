export interface EditorSettings {
  theme: string;
  fontFamily: string;
  fontSize: number;
  fontLigatures: boolean;
}

const STORAGE_KEY = 'appdaemon-studio-settings';

export const DEFAULT_SETTINGS: EditorSettings = {
  theme: 'vs-dark',
  fontFamily: 'Fira Code',
  fontSize: 14,
  fontLigatures: true,
};

export const AVAILABLE_THEMES = [
  { id: 'vs-dark', name: 'VS Dark', base: 'vs-dark' },
  { id: 'vs-light', name: 'VS Light', base: 'vs' },
  { id: 'hc-black', name: 'High Contrast', base: 'hc-black' },
  { id: 'one-dark-pro', name: 'One Dark Pro', base: 'vs-dark' },
  { id: 'dracula', name: 'Dracula', base: 'vs-dark' },
  { id: 'github-dark', name: 'GitHub Dark', base: 'vs-dark' },
  { id: 'nord', name: 'Nord', base: 'vs-dark' },
  { id: 'monokai', name: 'Monokai', base: 'vs-dark' },
  { id: 'solarized-dark', name: 'Solarized Dark', base: 'vs-dark' },
  { id: 'night-owl', name: 'Night Owl', base: 'vs-dark' },
];

export const AVAILABLE_FONTS = [
  { id: 'Fira Code', name: 'Fira Code', ligatures: true, loaded: true },
  { id: 'JetBrains Mono', name: 'JetBrains Mono', ligatures: true, loaded: true },
  { id: 'Cascadia Code', name: 'Cascadia Code', ligatures: true, loaded: true },
  { id: 'Consolas', name: 'Consolas (Windows)', ligatures: false, loaded: false },
  { id: 'Monaco', name: 'Monaco (macOS)', ligatures: false, loaded: false },
  { id: 'Menlo', name: 'Menlo (macOS)', ligatures: false, loaded: false },
];

export function getSettings(): EditorSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: EditorSettings): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('settings-changed', { detail: settings }));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function subscribeToSettings(callback: (settings: EditorSettings) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<EditorSettings>;
    callback(customEvent.detail);
  };
  
  window.addEventListener('settings-changed', handler);
  
  const storageHandler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback(getSettings());
    }
  };
  
  window.addEventListener('storage', storageHandler);
  
  return () => {
    window.removeEventListener('settings-changed', handler);
    window.removeEventListener('storage', storageHandler);
  };
}
