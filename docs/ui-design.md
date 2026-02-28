# UI Design Documentation

## Design System

### Colors (Tailwind)
```javascript
// tailwind.config.js
colors: {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  dark: {
    bg: '#1e1e1e',
    sidebar: '#252526',
    panel: '#2d2d2d',
    border: '#3e3e42',
  }
}
```

### Typography
- **Font**: System UI / Inter
- **Editor**: JetBrains Mono / Fira Code
- **Sizes**: 
  - Sidebar: 13px
  - Editor: 14px
  - Logs: 12px
  - UI: 14px

### Icons
- **Library**: Lucide React
- **Size**: 16px (UI), 20px (sidebar)

## Layout Structure

### Main Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Title Bar (40px)                                            │
│  [🔷 AppDaemon Studio]        [AI] [Settings] [Close]       │
├──────────┬──────────────────────────────────────────────────┤
│          │  Tab Bar (35px)                                   │
│ Sidebar  │  [📄 motion_lights.py] [+] [💾] [🔄]            │
│ (250px)  ├──────────────────────────────────────────────────┤
│          │                                                   │
│          │  Editor Area                                      │
│          │  ┌─────────────────────────────────────────────┐ │
│          │  │                                             │ │
│          │  │  Monaco Editor                              │ │
│          │  │  • Line numbers                             │ │
│          │  │  • Syntax highlighting                      │ │
│          │  │  • Minimap (optional)                       │ │
│          │  │  • Scrollbar                                │ │
│          │  │                                             │ │
│          │  └─────────────────────────────────────────────┘ │
│          │                                                   │
│          │  ┌─────────────────────────────────────────────┐ │
│          │  │  Bottom Panel (collapsible)                 │ │
│          │  │  [📝 Logs] [🤖 AI] [📊 Debug]              │ │
│          │  │  ────────────────────────────────────────   │ │
│          │  │  Log content / AI chat / Debug info         │ │
│          │  └─────────────────────────────────────────────┘ │
│          │                                                   │
└──────────┴──────────────────────────────────────────────────┘
```

### Sidebar
```
┌─────────────────────────────┐
│  📁 APPS                    │
│  ─────────────────────────  │
│  ➕ Create New App          │
│                             │
│  motion_lights      ●       │  ← Active
│  ├── motion_lights.py       │
│  └── motion_lights.yaml     │
│                             │
│  weather_app        ○       │
│  ├── weather_app.py         │
│  └── weather_app.yaml       │
│                             │
│  ─────────────────────────  │
│                             │
│  🤖 AI Assistant            │
│  📝 Logs                    │
│  ⚙️ Settings                │
└─────────────────────────────┘
```

### Editor Tab Bar
```
┌─────────────────────────────────────────────────────────────┐
│  [📄 motion_lights.py] [✕] [📄 weather.py] [✕] [+] │ [💾] [🔄]│
│   └─ Active tab                                          │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Sidebar Component

**File**: `components/Sidebar.tsx`

**Props**:
```typescript
interface SidebarProps {
  apps: AppInfo[];
  activeApp: string | null;
  onSelectApp: (app: string) => void;
  onCreateApp: () => void;
  onOpenAI: () => void;
  onOpenLogs: () => void;
  onOpenSettings: () => void;
}
```

**Features**:
- Collapsible (mobile)
- App tree with expand/collapse
- File icons (.py, .yaml)
- Context menu (right-click)
- Drag to resize (optional)

### 2. Editor Panel

**File**: `components/EditorPanel.tsx`

**Features**:
- Monaco Editor integration
- Tab management (open multiple files)
- Auto-save (debounced 1s)
- Split view (optional)
- Minimap (toggle)
- Line numbers
- Syntax highlighting (Python)

**Monaco Configuration**:
```typescript
const editorOptions = {
  fontSize: 14,
  fontFamily: 'JetBrains Mono, monospace',
  minimap: { enabled: true },
  lineNumbers: 'on',
  automaticLayout: true,
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  theme: 'vs-dark',
  quickSuggestions: true,
  suggestOnTriggerCharacters: true,
};
```

### 3. Log Viewer

**File**: `components/LogViewer.tsx`

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  📝 Logs                              [Filter ▼] [Search] [✕]│
├─────────────────────────────────────────────────────────────┤
│  [All] [INFO] [DEBUG] [WARNING] [ERROR]                     │
├─────────────────────────────────────────────────────────────┤
│  10:23:15  INFO  motion_lights  Motion detected              │
│  10:23:16  DEBUG motion_lights  Current state: on            │
│  10:23:20  ERROR weather_app    Connection failed            │  ← Red
│  ...                                                         │
├─────────────────────────────────────────────────────────────┤
│  [⏸️ Pause] [🗑️ Clear] [📋 Copy] [⬇️ Download]              │
└─────────────────────────────────────────────────────────────┘
```

**Features**:
- Real-time streaming (WebSocket)
- Level filtering (tabs)
- Text search
- Auto-scroll (toggle)
- Copy to clipboard
- Export to file
- Color coding by level

### 4. AI Chat Panel

**File**: `components/AIChat.tsx`

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  🤖 AI Assistant                                    [✕]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User: How do I create a sunset trigger?                    │
│                                                             │
│  AI: To create a sunset trigger in AppDaemon...             │
│                                                             │
│  ```python                                                  │
│  def initialize(self):                                      │
│      self.run_at_sunset(self.on_sunset)                     │
│                                                             │
│  def on_sunset(self, kwargs):                               │
│      self.turn_on('light.porch')                            │
│  ```                                                        │
│                                                             │
│  [Insert] [Copy] [Explain More]                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [💡] Type your question...                    [Send]       │
└─────────────────────────────────────────────────────────────┘
```

**Features**:
- Chat history
- Code syntax highlighting
- Quick actions (Insert, Copy, Explain)
- Suggestions toolbar
- Typing indicator
- Context awareness (current file)

### 5. App Creation Wizard

**File**: `components/Wizard/WizardModal.tsx`

**Flow**:
```
Step 1: Choose Template
┌────────────────────────────────────────┐
│  What type of app do you want?         │
│                                        │
│  ┌────────────┐ ┌────────────┐        │
│  │    🏠      │ │    🏃      │        │
│  │   Basic    │ │   Motion   │        │
│  │            │ │   Sensor   │        │
│  └────────────┘ └────────────┘        │
│                                        │
│  ┌────────────┐ ┌────────────┐        │
│  │    ⏰      │ │    📡      │        │
│  │  Schedule  │ │    MQTT    │        │
│  └────────────┘ └────────────┘        │
│                                        │
│           [Next →]                     │
└────────────────────────────────────────┘

Step 2: Configure
┌────────────────────────────────────────┐
│  Configure Motion Sensor               │
│                                        │
│  App Name: [motion_lights____]         │
│                                        │
│  Arguments:                            │
│  ┌─────────────────────────────────┐   │
│  │ Sensor:  [binary_sensor... ▼]  │   │
│  │ Lights:  [light.living... ▼]   │   │
│  │ Delay:   [300] seconds         │   │
│  └─────────────────────────────────┘   │
│                                        │
│  [Preview Code]                        │
│                                        │
│  [Back]            [Create App]        │
└────────────────────────────────────────┘
```

### 6. Settings Modal

**File**: `components/Settings/SettingsModal.tsx`

**Sections**:
```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ Settings                                       [✕]     │
├─────────────────────────────────────────────────────────────┤
│  [General] [Editor] [AI] [About]                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AI Provider: [Ollama ▼]                                    │
│                                                             │
│  Ollama Settings:                                           │
│  Host:   [localhost____________]                            │
│  Port:   [11434____]                                        │
│  Model:  [codellama__________▼]                             │
│                                                             │
│  [Test Connection]                                          │
│                                                             │
│  [💾 Save Changes]                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Responsive Design

### Breakpoints
```css
sm: 640px   /* Mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Mobile Adaptations
- Sidebar becomes slide-out drawer
- Bottom panel becomes full-screen modal
- Tabs become dropdown
- Touch-friendly buttons (min 44px)

### Tablet Adaptations
- Sidebar can be collapsed
- Split view available
- Full feature set

## State Management

### Zustand Store
```typescript
interface AppState {
  // Apps
  apps: AppInfo[];
  activeApp: string | null;
  activeFile: string | null;
  openFiles: string[];
  
  // Editor
  editorContent: string;
  isDirty: boolean;
  cursorPosition: { line: number; column: number };
  
  // UI
  sidebarOpen: boolean;
  bottomPanelOpen: boolean;
  bottomPanelTab: 'logs' | 'ai' | 'debug';
  
  // Logs
  logs: LogEntry[];
  logFilter: LogFilter;
  
  // AI
  aiMessages: Message[];
  aiTyping: boolean;
  
  // Settings
  settings: Settings;
}
```

## Animations

### Transitions
- Panel slide: 200ms ease-out
- Tab switch: 150ms ease
- Modal open: 200ms cubic-bezier(0.4, 0, 0.2, 1)
- Save indicator: pulse animation

### Loading States
- Editor: Skeleton lines
- Logs: Spinner in header
- AI: Typing indicator (...)
- Save: Checkmark animation

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save file |
| Ctrl+N | New app (open wizard) |
| Ctrl+O | Open file |
| Ctrl+Shift+L | Toggle logs panel |
| Ctrl+Shift+A | Toggle AI panel |
| Ctrl+Shift+F | Search in files |
| F5 | Reload app |
| Ctrl+Space | Trigger AI completion |

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader support for logs
- High contrast mode support
