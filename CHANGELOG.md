# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2025-03-01

### Major Changes
- **Complete Architecture Rewrite**: Migrated from Python FastAPI + React + Nginx to Next.js full-stack
- **TypeScript-Only Codebase**: Removed Python entirely, now pure TypeScript/Node.js

### Performance Improvements
- **56% Smaller Docker Image**: Reduced from ~500MB to 222MB
- **60% Faster Builds**: Build time reduced from 3-5 minutes to ~1 minute
- **Single Process Architecture**: Replaced 3 processes (nginx + python + node) with 1 (Next.js)

### New Features
- Automatic file versioning on every save
- Dual Python/YAML editor tabs with Monaco Editor
- Health check endpoint (`/api/health`)
- Simplified API structure with Next.js App Router
- Improved error handling with custom error classes

### Removed
- Python backend (`app/` folder) - replaced with Next.js API routes
- Nginx reverse proxy configuration
- Old React/Vite frontend (`ui/` folder) - integrated into Next.js
- Python E2E tests (Playwright) - will re-add for Next.js
- Python development tooling (requirements.txt, mypy, ruff, etc.)
- Git hooks for Python linting

### API Changes
- All endpoints now under `/api/*` with consistent JSON responses
- File operations now use `/api/files/{app}/[python|yaml]`
- Version control API improved with better error messages

### Technical Details
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.3 (strict mode)
- **Styling**: Tailwind CSS
- **Editor**: Monaco Editor (@monaco-editor/react)
- **Container**: Docker with Alpine Linux + Node.js 20
- **Build**: Multi-stage Dockerfile with standalone output

### Documentation
- Updated README with new screenshots
- Updated AGENTS.md with new tech stack
- Added migration notes in `tasks/005-nextjs-migration.md`
- Added lessons learned in `lessons/008-nextjs-migration.md`

---

## [0.1.7] - 2025-02-28

### Features
- Python FastAPI backend with WebSocket log streaming
- React + Vite frontend with Monaco Editor
- Nginx reverse proxy for Home Assistant Ingress
- App creation wizard with templates
- File management (Python and YAML)
- Basic version control
- Real-time log viewer

### Architecture
- **Backend**: Python 3.11, FastAPI, Uvicorn
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Editor**: Monaco Editor
- **State**: Zustand
- **Testing**: pytest (backend), vitest (frontend), Playwright (E2E)
- **Container**: Docker with Alpine Linux
- **CI/CD**: GitLab CI with amd64 builds

---

## Migration Guide

### From v0.1.x to v0.2.x

1. **Data**: All your apps and files in `/config/apps` are preserved
2. **Configuration**: No changes needed - add-on uses same config structure
3. **Port**: Changed from 5000 to 3000 (handled automatically by add-on)
4. **Features**: All previous features maintained plus automatic versioning

### Breaking Changes
- API endpoints changed (old Python API no longer available)
- WebSocket log streaming temporarily disabled (will return in v0.2.2)

---

## Upcoming in v0.2.2

- WebSocket log streaming re-implementation
- Version restore UI (currently API-only)
- Dark/light theme toggle
- Enhanced AI assistance integration

---

## Release Checklist

For maintainers:
- [ ] Update version in `package.json`
- [ ] Update version in `config.json`
- [ ] Update CHANGELOG.md
- [ ] Update README.md if needed
- [ ] Take new screenshots if UI changed
- [ ] Test Docker build
- [ ] Test on Home Assistant Green
- [ ] Tag release in Git
- [ ] Push to registry
