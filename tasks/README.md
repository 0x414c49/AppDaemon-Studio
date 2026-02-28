# Project Task Index

## Current Tasks

1. [Task 001: Add-on Structure](./001-addon-structure.md) - Base HA add-on configuration
2. [Task 002: Backend API](./002-backend-api.md) - FastAPI backend with file manager, logs, and version control
3. [Task 003: Frontend UI](./003-frontend-ui.md) - React frontend with Monaco Editor and version panel
4. [Task 004: GitLab CI](./004-gitlab-ci.md) - CI/CD pipeline

## Task Dependencies

```
Task 001 (Add-on Structure)
    ↓
Task 002 (Backend API) ←→ Task 003 (Frontend UI)
    ↓
Task 004 (GitLab CI)
```

## Completion Order

**Phase 1 (Foundation)**
- Task 001: Add-on structure and Docker setup

**Phase 2 (Core)**
- Task 002: Backend API with file manager, log watcher, version control
- Task 003: Frontend UI with Monaco editor and version panel

**Phase 3 (DevOps)**
- Task 004: CI/CD pipeline

## Quick Links

- [Architecture](../docs/architecture.md)
- [API Reference](../docs/api-reference.md)
- [UI Design](../docs/ui-design.md)
- [Deployment](../docs/deployment.md)
- [AGENTS.md](../AGENTS.md)

## Notes for Subagents

- Read AGENTS.md first for tech stack and conventions
- Check architecture.md for system design
- Follow coding standards in AGENTS.md
- Update task file when complete
- Create unit tests for new code
- Run linting before committing
- AppDaemon path: `/addon_configs/*_appdaemon` (wildcard slug)
- Single empty template only (no AI, no complex templates)
- Version control: `.versions/` folder per app with timestamped backups
