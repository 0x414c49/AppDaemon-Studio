'use client';

import { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';
import {
  EditorSettings,
  getSettings,
  saveSettings,
  DEFAULT_SETTINGS,
  AVAILABLE_THEMES,
  AVAILABLE_FONTS,
  applyUiTheme,
} from '@/lib/settings-store';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: EditorSettings) => void;
}

const PREVIEW_CODE = `def example_function():
    # Preview with ligatures
    if value >= 10 and value <= 100:
        result = value != 0
        return result == True
    return None`;

export function Settings({ isOpen, onClose, onSettingsChange }: SettingsProps) {
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (isOpen) {
      setSettings(getSettings());
    }
  }, [isOpen]);

  const handleSave = () => {
    saveSettings(settings);
    onSettingsChange(settings);
    onClose();
  };

  const handleCancel = () => {
    const saved = getSettings();
    setSettings(saved);
    applyUiTheme(saved.uiTheme);
    onClose();
  };

  const updateSetting = <K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (key === 'uiTheme') applyUiTheme(value as 'dark' | 'light');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-ha-card rounded-xl shadow-2xl w-[480px] max-h-[90vh] overflow-y-auto border border-ha-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ha-border">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-5 h-5 text-ha-primary" />
            <h2 className="text-lg font-semibold text-ha-text">Editor Settings</h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-ha-text-secondary hover:text-ha-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-ha-text-secondary mb-2">
              UI Theme
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateSetting('uiTheme', 'dark')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings.uiTheme === 'dark'
                    ? 'bg-ha-primary text-white'
                    : 'border border-ha-border text-ha-text-secondary hover:bg-ha-surface'
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
              <button
                onClick={() => updateSetting('uiTheme', 'light')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings.uiTheme === 'light'
                    ? 'bg-ha-primary text-white'
                    : 'border border-ha-border text-ha-text-secondary hover:bg-ha-surface'
                }`}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ha-text-secondary mb-2">
              Editor Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value)}
              className="w-full bg-ha-surface text-ha-text px-3 py-2 rounded-lg border border-ha-border focus:border-ha-primary focus:outline-none"
            >
              {AVAILABLE_THEMES.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ha-text-secondary mb-2">
              Font Family
            </label>
            <select
              value={settings.fontFamily}
              onChange={(e) => updateSetting('fontFamily', e.target.value)}
              className="w-full bg-ha-surface text-ha-text px-3 py-2 rounded-lg border border-ha-border focus:border-ha-primary focus:outline-none"
            >
              {AVAILABLE_FONTS.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.name} {!font.loaded && '(system)'} {font.ligatures && '✨'}
                </option>
              ))}
            </select>
            <p className="text-xs text-ha-text-disabled mt-1">
              ✨ = Supports ligatures • (system) = Requires font installed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ha-text-secondary mb-2">
              Font Size: {settings.fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="24"
              value={settings.fontSize}
              onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-ha-text-disabled mt-1">
              <span>12px</span>
              <span>24px</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ha-text-secondary mb-2">
              Sidebar Font Size: {settings.sidebarFontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="20"
              value={settings.sidebarFontSize}
              onChange={(e) => updateSetting('sidebarFontSize', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-ha-text-disabled mt-1">
              <span>12px</span>
              <span>20px</span>
            </div>
            <div
              className="mt-2 bg-ha-sidebar border border-ha-border rounded-lg p-3"
              style={{ fontSize: `${settings.sidebarFontSize}px` }}
            >
              <div className="text-ha-text font-medium mb-1">Preview</div>
              <div className="text-ha-text-secondary">my_app_name</div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.fontLigatures}
                onChange={(e) => updateSetting('fontLigatures', e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-ha-text">Enable Font Ligatures</span>
            </label>
            <p className="text-xs text-ha-text-disabled mt-1 ml-7">
              Renders special character combinations like =&gt;, !==, === as single glyphs
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ha-text-secondary mb-2">
              Editor Preview
            </label>
            <div
              className="bg-ha-bg rounded-lg border border-ha-border p-4 overflow-x-auto"
              style={{
                fontFamily: `'${settings.fontFamily}', 'Fira Code', 'Consolas', 'Monaco', monospace`,
                fontSize: `${settings.fontSize}px`,
                fontFeatureSettings: settings.fontLigatures ? '"liga" 1, "calt" 1' : '"liga" 0, "calt" 0',
              }}
            >
              <pre className="text-ha-text whitespace-pre">{PREVIEW_CODE}</pre>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-ha-border">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-ha-border text-ha-text hover:bg-ha-surface rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-ha-primary hover:bg-ha-primary-dark text-white rounded-lg transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
