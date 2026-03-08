'use client';

import { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon } from 'lucide-react';
import {
  EditorSettings,
  getSettings,
  saveSettings,
  DEFAULT_SETTINGS,
  AVAILABLE_THEMES,
  AVAILABLE_FONTS,
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
    setSettings(getSettings());
    onClose();
  };

  const updateSetting = <K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-[480px] max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Editor Settings</h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Editor Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value)}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              {AVAILABLE_THEMES.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Font Family
            </label>
            <select
              value={settings.fontFamily}
              onChange={(e) => updateSetting('fontFamily', e.target.value)}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              {AVAILABLE_FONTS.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.name} {!font.loaded && '(system)'} {font.ligatures && '✨'}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              ✨ = Supports ligatures • (system) = Requires font installed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Font Size: {settings.fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="24"
              value={settings.fontSize}
              onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>12px</span>
              <span>24px</span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.fontLigatures}
                onChange={(e) => updateSetting('fontLigatures', e.target.checked)}
                className="w-4 h-4 accent-blue-500 rounded"
              />
              <span className="text-sm text-slate-300">Enable Font Ligatures</span>
            </label>
            <p className="text-xs text-slate-500 mt-1 ml-7">
              Renders special character combinations like =&gt;, !==, === as single glyphs
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Preview
            </label>
            <div
              className="bg-slate-900 rounded border border-slate-700 p-4 overflow-x-auto"
              style={{
                fontFamily: `'${settings.fontFamily}', 'Fira Code', 'Consolas', 'Monaco', monospace`,
                fontSize: `${settings.fontSize}px`,
                fontFeatureSettings: settings.fontLigatures ? '"liga" 1, "calt" 1' : '"liga" 0, "calt" 0',
              }}
            >
              <pre className="text-slate-300 whitespace-pre">{PREVIEW_CODE}</pre>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-700">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
