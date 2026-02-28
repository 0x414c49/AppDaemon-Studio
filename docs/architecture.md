# Architecture Documentation

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Home Assistant Instance                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              AppDaemon Studio Add-on                    │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │              Nginx (Port 5000)                   │   │   │
│  │  │  • Handles Ingress routing                       │   │   │
│  │  │  • Serves static files                           │   │   │
│  │  │  • Proxy to FastAPI                              │   │   │
│  │  └────────────────┬────────────────────────────────┘   │   │
│  │                   │                                     │   │
│  │  ┌────────────────┴────────────────────────────────┐   │   │
│  │  │              FastAPI Application                 │   │   │
│  │  │                                                  │   │   │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │   │   │
│  │  │  │ REST API    │ │ WebSocket   │ │ AI Proxy   │ │   │   │
│  │  │  │             │ │ Logs        │ │ Services   │ │   │   │
│  │  │  └──────┬──────┘ └──────┬──────┘ └─────┬──────┘ │   │   │
│  │  │         │               │              │        │   │   │
│  │  │         └───────────────┴──────────────┘        │   │   │
│  │  │                    │                           │   │   │
│  │  │  ┌─────────────────┴───────────────────────┐   │   │   │
│  │  │  │         Service Layer                   │   │   │   │
│  │  │  │  • FileManager (app files)            │   │   │   │
│  │  │  │  • LogWatcher (real-time logs)        │   │   │   │
│  │  │  │  • TemplateEngine (Jinja2)            │   │   │   │
│  │  │  │  • AIProviders (Ollama, Claude, etc)  │   │   │   │
│  │  │  └───────────────────────────────────────┘   │   │   │
│  │  └────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌───────────────────────────┴───────────────────────────┐     │
│  │                   Mapped Volumes                       │     │
│  │  • /config/appdaemon/apps (read/write apps)           │     │
│  │  • /config/appdaemon/apps/*.yaml (config files)       │     │
│  │  • /config/home-assistant.log (logs)                  │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Nginx Layer
**Purpose**: Handle Ingress routing and serve static files
**Config**: `nginx.conf`
**Key Points**:
- Listens on port 5000
- Routes `/` to static UI files
- Routes `/api/` to FastAPI
- Routes `/ws/` to WebSocket handler
- Handles Ingress base path (`/hassio/ingress/appdaemon-studio`)

### 2. FastAPI Backend
**Purpose**: REST API and WebSocket server
**Entry**: `app/main.py`
**Structure**:
```
app/
├── main.py              # App factory, lifespan management
├── config.py            # Pydantic settings
├── api/                 # Route handlers
│   ├── apps.py         # GET/POST/PUT/DELETE /api/apps
│   ├── files.py        # GET/PUT /api/files/{app}
│   ├── logs.py         # GET /api/logs, WS /ws/logs
│   └── ai.py           # POST /api/ai/{action}
└── services/            # Business logic
    ├── file_manager.py  # App file CRUD
    ├── log_watcher.py   # File tail + WebSocket
    ├── template_engine.py # Jinja2 templates
    └── ai_providers.py  # AI service abstraction
```

### 3. Frontend (React + Vite)
**Purpose**: User interface
**Entry**: `ui/src/main.tsx`
**Structure**:
```
ui/src/
├── main.tsx            # React root
├── App.tsx             # Main layout
├── components/         # UI components
│   ├── Layout.tsx      # Sidebar + main area
│   ├── EditorPanel.tsx # Monaco + tabs
│   ├── FileTree.tsx    # App directory tree
│   ├── LogViewer.tsx   # Log stream display
│   ├── AIChat.tsx      # AI assistant panel
│   └── Wizard/         # App creation wizard
├── hooks/              # Custom React hooks
│   ├── useApps.ts      # App CRUD operations
│   ├── useFiles.ts     # File read/write
│   ├── useLogs.ts      # Log streaming
│   └── useAI.ts        # AI interactions
├── services/           # API clients
│   └── api.ts          # Axios + WebSocket
├── store/              # State management
│   └── appStore.ts     # Zustand store
└── types/              # TypeScript definitions
    └── index.ts
```

### 4. Service Layer

#### FileManager
```python
class FileManager:
    base_path: Path  # /config/appdaemon/apps
    
    async def list_apps() -> List[AppInfo]
    async def create_app(name: str, template: str, config: dict) -> None
    async def read_python(app: str) -> str
    async def write_python(app: str, content: str) -> None
    async def read_yaml(app: str) -> dict
    async def write_yaml(app: str, config: dict) -> None
    async def delete_app(app: str) -> None
    async def reload_app(app: str) -> None
```

#### LogWatcher
```python
class LogWatcher:
    log_path: Path  # /config/home-assistant.log
    subscribers: Set[WebSocket]
    
    async def start() -> None
    async def stop() -> None
    async def subscribe(websocket: WebSocket) -> None
    async def unsubscribe(websocket: WebSocket) -> None
    async def broadcast(message: str) -> None
```

#### TemplateEngine
```python
class TemplateEngine:
    templates_dir: Path
    env: Jinja2Environment
    
    def list_templates() -> List[TemplateInfo]
    def render(template: str, context: dict) -> str
    def get_template_description(template: str) -> str
```

#### AIProviders
```python
class AIProvider(ABC):
    @abstractmethod
    async def chat(messages: List[Message]) -> str
    @abstractmethod
    async def complete(prompt: str) -> str

class OllamaProvider(AIProvider): ...
class OpencodeProvider(AIProvider): ...
class ClaudeProvider(AIProvider): ...
class OpenAIProvider(AIProvider): ...

class AIManager:
    provider: Optional[AIProvider]
    
    async def configure(config: AIConfig) -> None
    async def chat(message: str, context: str) -> str
    async def complete(code: str, position: int) -> str
    async def explain(code: str) -> str
    async def generate(description: str, template: str) -> str
```

## Data Flow

### Creating a New App
```
User → Wizard → POST /api/apps
                     ↓
              TemplateEngine.render()
                     ↓
              FileManager.create_app()
                     ↓
              Write to /config/appdaemon/apps/{name}.py
              Write to /config/appdaemon/apps/{name}.yaml
                     ↓
              Response: 201 Created
                     ↓
              User sees new app in sidebar
```

### Editing Code
```
User → Editor → Auto-save (debounced 1s)
                     ↓
              PUT /api/files/{app}/python
                     ↓
              FileManager.write_python()
                     ↓
              Write to filesystem
                     ↓
              WebSocket broadcast: file_changed
                     ↓
              Other clients update (if multi-user)
```

### Viewing Logs
```
User → Open Log Panel → WS Connect /ws/logs
                                ↓
                         LogWatcher.subscribe()
                                ↓
                         Start tailing log file
                                ↓
                         WebSocket: send log lines
                                ↓
                         Client: append to display
```

### AI Chat
```
User → Type message → POST /api/ai/chat
                            ↓
                     AIManager.chat()
                            ↓
                     AIProvider.chat()
                            ↓
                     Call external API (server-side)
                            ↓
                     Response: AI message
                            ↓
                     Display in chat panel
```

## Security Considerations

1. **Ingress Authentication**: All requests authenticated by Home Assistant
2. **AI API Keys**: Stored server-side only, never exposed to frontend
3. **File Access**: Restricted to `/config/appdaemon/apps/*`
4. **No Shell Access**: File operations through FileManager only
5. **Rate Limiting**: AI endpoints rate-limited per provider

## Scalability Notes

- Single-user design (Home Assistant add-on)
- WebSocket connections: Max 10 concurrent
- File watching: Inotify on Linux
- AI requests: Async with timeouts
- Memory: ~100MB for add-on container

## Error Handling

- **File not found**: 404 with clear message
- **Invalid YAML**: 400 with parse error details
- **AI timeout**: 504 with retry option
- **WebSocket disconnect**: Auto-reconnect with backoff
- **Template error**: 500 with Jinja2 traceback
