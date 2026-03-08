# Project Task Index

## Core Tasks (Completed)

1. [Task 001: Add-on Structure](./001-addon-structure.md) - Base HA add-on configuration
2. [Task 002: Backend API](./002-backend-api.md) - Next.js API routes with file manager and version control
3. [Task 003: Frontend UI](./003-frontend-ui.md) - React frontend with Monaco Editor and version panel
4. [Task 004: GitLab CI](./004-gitlab-ci.md) - CI/CD pipeline

## Feature Tasks

5. [Task 006: IntelliSense & Autocomplete](./006-intellisense-autocomplete.md) - Editor enhancements
6. [Task 010: Fix Versions Error](./010-fix-versions-error.md) - Bug fix for version control
7. [Task 011: Editor Settings, Themes & Fonts](./011-editor-settings-themes-fonts.md) - Editor customization

## Task Dependencies

```
Task 001 (Add-on Structure)
    ↓
Task 002 (Backend API) ←→ Task 003 (Frontend UI)
    ↓
Task 004 (GitLab CI)
    ↓
Task 006+ (Features)
```

## Completion Status

**Phase 1 (Foundation)** ✅
- Task 001: Add-on structure and Docker setup

**Phase 2 (Core)** ✅
- Task 002: Next.js API routes with file manager and version control
- Task 003: React frontend with Monaco editor and version panel

**Phase 3 (DevOps)** ✅
- Task 004: CI/CD pipeline

**Phase 4 (Features)** 🚧
- Task 006: IntelliSense & Autocomplete
- Task 010: Version control fixes
- Task 011: Editor customization

## Quick Links

- [Architecture](../docs/architecture.md)
- [API Reference](../docs/api-reference.md)
- [UI Design](../docs/ui-design.md)
- [Deployment](../docs/deployment.md)
- [AGENTS.md](../AGENTS.md)
- [Project Status](../lessons/000-project-status.md)

## Notes for Developers

- Read AGENTS.md first for tech stack and conventions
- Check architecture.md for system design
- Follow coding standards in AGENTS.md
- Update task file when complete
- Run `npm run build` and `npm run lint` before committing
- AppDaemon path: `/addon_configs/*_appdaemon` (wildcard slug)
- Version control: `.versions/` folder per app with timestamped backups
- Current stack: Next.js 16 + React 19 + TypeScript
