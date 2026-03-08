# Task 003: Frontend UI Implementation

## Objective

Build React frontend with TypeScript, Monaco Editor, and simple version control UI.

## Requirements

### Tech Stack
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Monaco Editor (@monaco-editor/react)
- Zustand (state management)
- Axios (HTTP client)
- Lucide React (icons)

### Files to Create

```
ui/
├── index.html
├── vite.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── components/
    │   ├── Layout.tsx
    │   ├── Sidebar.tsx
    │   ├── EditorPanel.tsx
    │   ├── LogViewer.tsx
    │   ├── VersionPanel.tsx       # Simple version control UI
    │   ├── FileTree.tsx
    │   ├── Wizard/
    │   │   └── CreateAppModal.tsx  # Simplified - just name/class
    │   └── Settings/
    │       └── SettingsModal.tsx   # Just app settings, no AI
    ├── hooks/
    │   ├── useApps.ts
    │   ├── useFiles.ts
    │   ├── useLogs.ts
    │   └── useVersions.ts          # Version control hooks
    ├── services/
    │   ├── api.ts
    │   └── websocket.ts
    ├── store/
    │   └── appStore.ts
    └── types/
        └── index.ts
```

### Components

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Title Bar (40px)                                            │
│  [🔷 AppDaemon Studio]        [Logs] [Versions] [Settings]  │
├──────────┬──────────────────────────────────────────────────┤
│          │  Tab Bar (35px)                                   │
│ Sidebar  │  [📄 my_app.py] [✕] [+] [💾] [🔄] [⏰ Versions]  │
│ (250px)  ├──────────────────────────────────────────────────┤
│          │                                                   │
│ Apps     │  ┌─────────────────────────────────────────────┐ │
│ list     │  │                                             │ │
│          │  │  Monaco Editor (Python)                     │ │
│ [+ New]  │  │                                             │ │
│          │  └─────────────────────────────────────────────┘ │
│          │                                                   │
│          │  ┌─────────────────────────────────────────────┐ │
│          │  │  Bottom Panel                               │ │
│          │  │  [📝 Logs] [⏰ Versions]                    │ │
│          │  │  ────────────────────────────────────────   │ │
│          │  │  Content based on selected tab              │ │
│          │  └─────────────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────────┘
```

#### Sidebar
- App tree with expand/collapse
- Shows apps from /addon_configs/*_appdaemon/apps/
- Create new app button
- Collapsible on mobile (drawer)

#### EditorPanel
- Monaco Editor with Python support
- Single file view (no complex tabs needed for MVP)
- Auto-save indicator (unsaved changes dot)
- Action buttons: Save (Ctrl+S), View Versions
- Shows current file path

#### VersionPanel (Bottom Panel Tab)
```
┌─────────────────────────────────────────────────────────────┐
│ ⏰ Version History for my_app                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ○ 2024-02-28 10:23:00    1.2 KB    [Restore] [Delete]     │
│  ○ 2024-02-28 10:15:00    1.1 KB    [Restore] [Delete]     │
│  ○ 2024-02-28 09:45:00    1.0 KB    [Restore] [Delete]     │
│                                                             │
│  [🗑️ Clean Old] (keep last 10)                              │
└─────────────────────────────────────────────────────────────┘
```
- List all versions with timestamp and size
- Click version to view diff (optional for MVP)
- Restore button to rollback
- Delete individual versions
- Cleanup old versions (keep last N)

#### LogViewer (Bottom Panel Tab)
```
┌─────────────────────────────────────────────────────────────┐
│ 📝 Logs                                                      │
├─────────────────────────────────────────────────────────────┤
│ [All] [INFO] [DEBUG] [WARNING] [ERROR]  [Search...]         │
├─────────────────────────────────────────────────────────────┤
│ 10:23:15  INFO  my_app    App initialized                    │
│ 10:23:20  DEBUG my_app    Sensor state changed              │
│ 10:24:01  ERROR other     Connection failed                 │
├─────────────────────────────────────────────────────────────┤
│ [⏸️ Pause] [🗑️ Clear]                                       │
└─────────────────────────────────────────────────────────────┘
```
- Real-time streaming from WebSocket
- Filter by log level (buttons)
- Search/filter by app name
- Pause/Resume stream
- Clear logs button

#### CreateAppModal (Simplified Wizard)
```
┌────────────────────────────────────────┐
│  Create New App                 [✕]   │
├────────────────────────────────────────┤
│                                        │
│  App Name: [my_new_app________]       │
│                                        │
│  Class Name: [MyNewApp]               │
│                                        │
│  Description:                         │
│  ┌────────────────────────────────┐   │
│  │ My automation app description │   │
│  └────────────────────────────────┘   │
│                                        │
│  [Cancel]        [Create]             │
└────────────────────────────────────────┘
```
- Simple form: name, class_name, description
- No template selection (always uses empty template)
- Validation: name must be valid Python module name

### State Management (Zustand)

```typescript
interface AppState {
  // Apps
  apps: AppInfo[];
  activeApp: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Editor
  editorContent: string;
  originalContent: string;  // For dirty check
  isDirty: boolean;
  
  // UI
  sidebarOpen: boolean;
  bottomPanelOpen: boolean;
  bottomPanelTab: 'logs' | 'versions';
  showCreateModal: boolean;
  showSettingsModal: boolean;
  
  // Logs
  logs: LogEntry[];
  logFilter: 'all' | 'debug' | 'info' | 'warning' | 'error';
  logPaused: boolean;
  
  // Versions
  versions: VersionInfo[];
  selectedVersion: string | null;
  
  // Actions
  fetchApps: () => Promise<void>;
  setActiveApp: (app: string) => void;
  createApp: (data: CreateAppData) => Promise<void>;
  deleteApp: (app: string) => Promise<void>;
  loadFile: (app: string, type: 'python' | 'yaml') => Promise<void>;
  saveFile: (app: string, type: 'python' | 'yaml') => Promise<void>;
  updateContent: (content: string) => void;
  fetchVersions: (app: string) => Promise<void>;
  restoreVersion: (app: string, version: string) => Promise<void>;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  setLogFilter: (filter: string) => void;
}
```

### API Integration

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Apps
export const getApps = () => api.get('/apps');
export const createApp = (data: CreateAppData) => api.post('/apps', data);
export const deleteApp = (name: string) => api.delete(`/apps/${name}`);

// Files
export const getPythonFile = (app: string) => 
  api.get(`/files/${app}/python`);
export const savePythonFile = (app: string, content: string) => 
  api.put(`/files/${app}/python`, { content });
export const getYamlFile = (app: string) => 
  api.get(`/files/${app}/yaml`);
export const saveYamlFile = (app: string, config: object) => 
  api.put(`/files/${app}/yaml`, config);

// Versions
export const getVersions = (app: string) => 
  api.get(`/versions/${app}`);
export const getVersion = (app: string, version: string) => 
  api.get(`/versions/${app}/${version}`);
export const restoreVersion = (app: string, version: string) => 
  api.post(`/versions/${app}/${version}/restore`);
export const deleteVersion = (app: string, version: string) => 
  api.delete(`/versions/${app}/${version}`);

// Logs (REST for history)
export const getLogs = (params?: { lines?: number; level?: string }) => 
  api.get('/logs', { params });

// services/websocket.ts
export class LogWebSocket {
  private ws: WebSocket | null = null;
  private reconnectInterval = 3000;
  private messageHandlers: Set<(msg: LogEntry) => void> = new Set();
  
  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${protocol}//${window.location.host}/ws/logs`);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.messageHandlers.forEach(handler => handler(data));
    };
    
    this.ws.onclose = () => {
      setTimeout(() => this.connect(), this.reconnectInterval);
    };
  }
  
  disconnect() {
    this.ws?.close();
  }
  
  onMessage(handler: (msg: LogEntry) => void) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }
}
```

### Type Definitions

```typescript
// types/index.ts

export interface AppInfo {
  name: string;
  class_name: string;
  description: string;
  has_python: boolean;
  has_yaml: boolean;
  last_modified: string;  // ISO date
  version_count: number;
}

export interface CreateAppData {
  name: string;
  class_name: string;
  description: string;
}

export interface VersionInfo {
  version: string;  // YYYYMMDD_HHMMSS
  timestamp: string;
  size: number;
  filename: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
  app?: string;
  message: string;
}

export interface FileContent {
  content: string;
  last_modified: string;
}
```

### Tests

Create basic component tests:

```typescript
// tests/EditorPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorPanel } from '../components/EditorPanel';

describe('EditorPanel', () => {
  it('renders Monaco editor', () => {
    render(<EditorPanel content="print('hello')" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
  
  it('shows dirty indicator when content changes', () => {
    const onChange = jest.fn();
    render(<EditorPanel content="" onChange={onChange} />);
    // Test dirty state
  });
});

// tests/VersionPanel.test.tsx
describe('VersionPanel', () => {
  it('lists versions', () => {
    const versions = [
      { version: '20240228_102300', timestamp: '2024-02-28T10:23:00Z', size: 1234, filename: 'test.py' }
    ];
    render(<VersionPanel versions={versions} />);
    expect(screen.getByText('2024-02-28 10:23:00')).toBeInTheDocument();
  });
});
```

## Acceptance Criteria

- [ ] All components implemented with TypeScript
- [ ] Strict mode enabled, no type errors
- [ ] Monaco Editor with Python syntax highlighting
- [ ] Auto-save with debounce (1s) + dirty indicator
- [ ] Version panel lists all versions for current app
- [ ] Can restore previous versions
- [ ] Real-time log streaming via WebSocket
- [ ] Create app modal (simplified, no templates)
- [ ] Delete app with confirmation
- [ ] Responsive design (sidebar drawer on mobile)
- [ ] Keyboard shortcuts: Ctrl+S (save)
- [ ] Dark theme consistent throughout
- [ ] Build passes: `npm run build`
- [ ] Unit tests for components

## Notes

- Use Home Assistant Ingress (no CORS issues)
- WebSocket auto-reconnects on disconnect
- Show toast notifications for errors/success
- Mobile: sidebar becomes slide-out drawer
- Version panel shows in bottom panel (toggle with button)
- No AI features for now (simplified scope)
- Single template: empty app only

## Time Estimate

8-10 hours (including tests)
