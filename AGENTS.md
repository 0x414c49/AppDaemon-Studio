# AGENTS.md

## Project: AppDaemon Studio

A Home Assistant add-on providing an IDE for AppDaemon apps with AI-powered assistance.

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Server**: Uvicorn with WebSocket support
- **Key Libraries**:
  - `fastapi` - Web framework
  - `websockets` - Real-time log streaming
  - `jinja2` - App templates
  - `httpx` - AI API calls
  - `watchdog` - File watching
  - `pyyaml` - YAML config handling

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Editor**: Monaco Editor (@monaco-editor/react)
- **State**: Zustand
- **HTTP**: Axios

### Infrastructure
- **Container**: Docker (Alpine Linux)
- **Reverse Proxy**: Nginx (for Ingress)
- **CI/CD**: GitLab CI

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Home Assistant (Ingress)                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Nginx (reverse proxy)                          │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │  AppDaemon Studio Add-on                │   │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌──────────┐  │   │   │
│  │  │  │ FastAPI │ │WebSocket│ │ AI Proxy │  │   │   │
│  │  │  │ Backend │ │ Logs    │ │ Services │  │   │   │
│  │  │  └────┬────┘ └────┬────┘ └────┬─────┘  │   │   │
│  │  │       └───────────┴───────────┘        │   │   │
│  │  │  ┌─────────────────────────────────┐   │   │   │
│  │  │  │  File System (/config/appdaemon)│   │   │   │
│  │  │  └─────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
appdaemon-studio/
├── AGENTS.md                 # This file
├── config.json              # Home Assistant add-on config
├── Dockerfile               # Container definition
├── run.sh                   # Startup script
├── requirements.txt         # Python dependencies
├── .gitlab-ci.yml           # CI/CD pipeline
├── docs/                    # Project documentation
│   ├── architecture.md
│   ├── api-reference.md
│   ├── ui-design.md
│   └── deployment.md
├── lessons/                 # Lessons learned
│   ├── 001-setup.md
│   ├── 002-fastapi.md
│   ├── 003-websocket.md
│   └── 004-monaco-editor.md
├── tasks/                   # Task specifications
│   ├── 001-addon-structure.md
│   ├── 002-backend-api.md
│   ├── 003-frontend-ui.md
│   └── 004-gitlab-ci.md
├── app/                     # Backend code
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── files.py
│   │   ├── logs.py
│   │   └── versions.py       # Simple version control
│   ├── services/
│   │   ├── __init__.py
│   │   ├── file_manager.py
│   │   ├── log_watcher.py
│   │   └── version_control.py # Simple versioning per app
│   └── templates/           # App templates (Jinja2)
│       └── empty.py.j2      # Empty app template only
├── ui/                      # Frontend code
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── store/
│       └── types/
└── nginx.conf               # Nginx config for Ingress
```

## Coding Standards

### Python (Backend)
- Use type hints everywhere
- Follow PEP 8
- Use `async`/`await` for I/O operations
- Docstrings in Google format
- Error handling with custom exceptions

### TypeScript (Frontend)
- Strict TypeScript mode
- Functional components with hooks
- Custom hooks for data fetching
- Zustand for state management
- No `any` types

## Key Implementation Notes

1. **Ingress Support**: All routes must work under `/hassio/ingress/appdaemon-studio`
2. **File Paths**: Use `/addon_configs/*_appdaemon` (mapped volume) - AppDaemon config location
3. **WebSocket**: Handle reconnection gracefully
4. **Simple Version Control**: Each app gets `.versions/` folder with timestamped backups
5. **Logs**: Stream from AppDaemon log file in the config directory
6. **Templates**: Single empty template in `/app/templates/empty.py.j2`

## Testing

### Backend
```bash
cd app
pytest tests/
```

### Frontend
```bash
cd ui
npm run test
npm run build
```

## Python Version Requirement (CRITICAL)

**You MUST use Python 3.11 locally - same as CI.**

CI uses `python:3.11-alpine` Docker image. Using different Python versions causes:
- Type checking differences (mypy behavior varies by version)
- pytest-asyncio compatibility issues
- Different dependency behaviors

### Setup Python 3.11 with pyenv

```bash
# Run the setup script (installs pyenv if needed, creates venv)
./setup-python-3.11.sh

# Or manually:
brew install pyenv
pyenv install 3.11.11
pyenv local 3.11.11
python -m venv venv
source venv/bin/activate
pip install -r app/requirements.txt
pip install pytest pytest-asyncio==0.21.1 pytest-cov httpx types-PyYAML ruff mypy
```

**Always activate the venv before working:**
```bash
source venv/bin/activate
python --version  # Should show 3.11.x
```

## Pre-commit Checks (Required)

**A task is not complete until linting passes and tests run successfully.**

**CRITICAL: Only commit AFTER local checks pass with Python 3.11**

Always run these before committing:

### Backend Linting
```bash
cd app

# Install linting tools (one-time)
pip install ruff mypy types-PyYAML

# Format code
ruff format .

# Check linting
ruff check .

# Type checking
mypy . --ignore-missing-imports

# Run tests
pytest tests/ -v
```

### Frontend Linting
```bash
cd ui

# Install dependencies
npm install

# Run linter
npm run lint

# Type checking
npm run typecheck

# Run tests
npm run test

# Build (catches build errors)
npm run build
```

### Quick Check Script
```bash
#!/bin/bash
# save as check.sh in project root

echo "=== Backend Checks ==="
cd app
ruff format . --check || { echo "Backend formatting failed"; exit 1; }
ruff check . || { echo "Backend linting failed"; exit 1; }
mypy . --ignore-missing-imports || { echo "Backend type checking failed"; exit 1; }
pytest tests/ -v || { echo "Backend tests failed"; exit 1; }

echo "=== Frontend Checks ==="
cd ../ui
npm run lint || { echo "Frontend linting failed"; exit 1; }
npm run typecheck || { echo "Frontend type checking failed"; exit 1; }
npm run test || { echo "Frontend tests failed"; exit 1; }
npm run build || { echo "Frontend build failed"; exit 1; }

echo "=== All checks passed! ==="
```

## Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [AppDaemon Docs](https://appdaemon.readthedocs.io/)
- [Home Assistant Add-on Docs](https://developers.home-assistant.io/docs/add-ons)
- [Monaco Editor Docs](https://microsoft.github.io/monaco-editor/)
- [Tailwind CSS Docs](https://tailwindcss.com/)

## Questions?

Check `docs/` for detailed guides or ask for clarification.
