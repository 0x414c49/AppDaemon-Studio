# Task: Editor Settings - Themes and Fonts

## Overview
Add a settings UI to allow users to customize Monaco Editor with:
- **Theme selection**: Multiple popular color themes
- **Font selection**: Developer fonts with ligature support
- **Settings persistence**: Save preferences locally

## UI Placement

### Settings Button Location
Add settings button in **Sidebar header** (top right corner of sidebar):

```
┌─────────────────────────────────────┐
│  AppDaemon Studio      [⚙️ Settings] │  ← Header with settings icon
├─────────────────────────────────────┤
│  [+ New App]                        │
│                                     │
│  Apps:                              │
│  • solar_data                       │
│  • motion_lights                    │
│  • ...                              │
└─────────────────────────────────────┘
```

**Rationale:**
- Sidebar is always visible (not dependent on active app)
- Consistent with modern IDE layouts (VS Code, etc.)
- Easy to discover
- Doesn't clutter the editor toolbar

## Features

### 1. Theme Selection
**Themes to include:**
- **Built-in:**
  - VS Dark (default)
  - VS Light
  - High Contrast
  
- **Popular Custom:**
  - One Dark Pro ⭐
  - Dracula
  - GitHub Dark
  - Nord
  - Monokai
  - Solarized Dark
  - Material Darker
  - Night Owl

### 2. Font Selection
**Fonts with ligatures (top picks):**
- Fira Code ⭐ (default)
- JetBrains Mono ⭐
- Cascadia Code ⭐

**Other good options:**
- Source Code Pro
- Hack
- Consolas
- Monaco
- Menlo

**Font Settings:**
- Font family dropdown
- Font size slider (12-24px, default 14)
- Font ligatures toggle (on/off)

### 3. Settings Modal

```
┌──────────────────────────────────────────┐
│  Settings                         [X]    │
├──────────────────────────────────────────┤
│                                          │
│  Editor Theme                            │
│  [One Dark Pro              ▼]          │
│                                          │
│  Font Family                             │
│  [Fira Code                 ▼]          │
│                                          │
│  Font Size                               │
│  [14        ] px                         │
│                                          │
│  Enable Font Ligatures                   │
│  [✓]                                     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ Preview                        │     │
│  │  => !== === >= <=              │     │
│  │  function example() {          │     │
│  │    return "hello";             │     │
│  │  }                             │     │
│  └────────────────────────────────┘     │
│                                          │
│         [Cancel]  [Save Settings]        │
└──────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Create Settings Store
**File:** `src/lib/settings-store.ts`

```typescript
export interface EditorSettings {
  theme: string;
  fontFamily: string;
  fontSize: number;
  fontLigatures: boolean;
}

const STORAGE_KEY = 'appdaemon-studio-settings';

export function getSettings(): EditorSettings {
  // Load from localStorage
}

export function saveSettings(settings: EditorSettings): void {
  // Save to localStorage
}

export const DEFAULT_SETTINGS: EditorSettings = {
  theme: 'one-dark-pro',
  fontFamily: 'Fira Code',
  fontSize: 14,
  fontLigatures: true,
};
```

**Time:** 30 minutes

### Step 2: Load Custom Themes
**File:** `src/lib/monaco/themes.ts`

```typescript
import * as monaco from 'monaco-editor';

export function registerCustomThemes(monaco: any) {
  // Register One Dark Pro
  monaco.editor.defineTheme('one-dark-pro', oneDarkProTheme);
  // Register Dracula
  monaco.editor.defineTheme('dracula', draculaTheme);
  // ... etc
}
```

**Theme sources:**
- Use `monaco-themes` npm package (has 100+ themes)
- Or manually copy theme JSON from VS Code extensions

**Time:** 1-2 hours

### Step 3: Load Custom Fonts
**Approach A: Self-host fonts (Recommended)**
```typescript
// src/app/layout.tsx or via CSS
@font-face {
  font-family: 'Fira Code';
  src: url('/fonts/FiraCode-Regular.woff2') format('woff2');
}
```

Download from:
- Fira Code: https://github.com/tonsky/FiraCode
- JetBrains Mono: https://www.jetbrains.com/lp/mono/
- Cascadia Code: https://github.com/microsoft/cascadia-code

**Approach B: Google Fonts CDN**
```typescript
// Only Source Code Pro available on Google Fonts
```

**File location:** `public/fonts/` directory

**Time:** 30 minutes

### Step 4: Create Settings Component
**File:** `src/app/components/Settings.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon } from 'lucide-react';
import { EditorSettings, getSettings, saveSettings, DEFAULT_SETTINGS } from '../../lib/settings-store';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: EditorSettings) => void;
}

export function Settings({ isOpen, onClose, onSettingsChange }: SettingsProps) {
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  
  // Load settings on mount
  // Handle form changes
  // Preview changes
  // Save and close
  
  return (
    // Modal with theme/font selectors
  );
}
```

**Time:** 2 hours

### Step 5: Add Settings Button to Sidebar
**File:** `src/app/components/Sidebar.tsx`

```typescript
// Add to sidebar header:
<div className="p-4 border-b border-slate-700">
  <div className="flex items-center justify-between">
    <h1 className="text-lg font-bold">AppDaemon Studio</h1>
    <button onClick={() => setShowSettings(true)}>
      <Settings className="w-5 h-5" />
    </button>
  </div>
</div>
```

**Time:** 15 minutes

### Step 6: Apply Settings to Monaco Editor
**File:** `src/app/components/Editor.tsx`

```typescript
const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);

// Load settings on mount
useEffect(() => {
  setSettings(getSettings());
}, []);

// Apply to Monaco
<MonacoEditor
  theme={settings.theme}
  options={{
    fontFamily: settings.fontFamily,
    fontSize: settings.fontSize,
    fontLigatures: settings.fontLigatures,
  }}
/>
```

**Time:** 30 minutes

### Step 7: Apply to Version Compare
**File:** `src/app/components/VersionCompare.tsx`

```typescript
// Apply same settings to DiffEditor
```

**Time:** 15 minutes

## Technical Details

### Monaco Theme Format
```json
{
  "base": "vs-dark",
  "inherit": true,
  "rules": [
    { "foreground": "5c6773", "token": "comment" },
    { "foreground": "73d0ff", "token": "string" }
  ],
  "colors": {
    "editor.background": "#282c34"
  }
}
```

### Font Ligatures
Monaco supports font ligatures via CSS:
```typescript
options={{
  fontLigatures: true  // Enables =>, !==, etc.
}}
```

Works automatically with Fira Code, JetBrains Mono, Cascadia Code.

### Settings Persistence
Use `localStorage` for simplicity:
- Key: `appdaemon-studio-settings`
- Format: JSON
- Sync across tabs via `storage` event

**Alternative (future):** Sync to Home Assistant via API

## Testing Plan

1. **Theme Switching**
   - Switch between all themes
   - Verify colors apply correctly
   - Check Python syntax highlighting
   - Check YAML syntax highlighting

2. **Font Switching**
   - Switch between all fonts
   - Verify ligatures render (=>, !==, ===)
   - Test different font sizes
   - Check readability at all sizes

3. **Persistence**
   - Refresh page, verify settings retained
   - Open in new tab, verify same settings
   - Clear localStorage, verify defaults restored

4. **Cross-browser**
   - Chrome/Edge
   - Firefox
   - Safari
   - Mobile (if applicable)

## Dependencies

### NPM Packages
```json
{
  "dependencies": {
    "monaco-themes": "^3.0.0"  // Optional: pre-made themes
  }
}
```

### Fonts to Download
- Fira Code (woff2)
- JetBrains Mono (woff2)  
- Cascadia Code (woff2)

Place in `public/fonts/`:
```
public/
  fonts/
    FiraCode-Regular.woff2
    JetBrainsMono-Regular.woff2
    CascadiaCode-Regular.woff2
```

## File Structure

```
src/
  lib/
    settings-store.ts         # Settings state management
    monaco/
      themes.ts               # Theme registration
  app/
    components/
      Settings.tsx            # Settings modal
      Sidebar.tsx             # Add settings button
      Editor.tsx              # Apply settings
      VersionCompare.tsx      # Apply settings
  types/
    settings.ts               # TypeScript interfaces
public/
  fonts/                      # Self-hosted fonts
```

## Future Enhancements

- Tab size configuration (2 vs 4 spaces)
- Word wrap toggle
- Minimap toggle
- Line numbers toggle
- Auto-save interval
- Import/export settings
- Sync settings to HA user preferences

## Estimated Time

**Total: 5-6 hours**

- Step 1 (Settings Store): 30 min
- Step 2 (Themes): 1-2 hours
- Step 3 (Fonts): 30 min
- Step 4 (Settings Component): 2 hours
- Step 5 (Sidebar Button): 15 min
- Step 6 (Apply to Editor): 30 min
- Step 7 (Apply to VersionCompare): 15 min
- Testing: 1 hour

## Acceptance Criteria

- [ ] Settings button in sidebar header
- [ ] Modal opens with theme selector
- [ ] Modal has font family selector (3 fonts minimum)
- [ ] Modal has font size selector
- [ ] Modal has font ligatures toggle
- [ ] Settings persist in localStorage
- [ ] Theme changes apply immediately to editor
- [ ] Font changes apply immediately to editor
- [ ] Settings apply to both Editor and VersionCompare
- [ ] Default settings match current behavior (vs-dark, 14px, ligatures on)
- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)

## Resources

- [Monaco Editor Themes](https://microsoft.github.io/monaco-editor/playground.html#customizing-the-appearence-exposed-colors)
- [Monaco Themes Package](https://github.com/brijeshb42/monaco-themes)
- [Fira Code Font](https://github.com/tonsky/FiraCode)
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/)
- [Cascadia Code](https://github.com/microsoft/cascadia-code)
- [VS Code Theme docs](https://code.visualstudio.com/api/extension-guides/color-theme)
