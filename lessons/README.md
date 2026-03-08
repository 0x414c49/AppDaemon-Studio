# Lessons Learned

This directory contains important lessons learned during development.

## Structure

### Current Documentation
- **[000-project-status.md](./000-project-status.md)** - 📋 **START HERE** - Complete project status and key lessons
- **[008-flat-structure-complete.md](./008-flat-structure-complete.md)** - Flat structure implementation details

### Technical References
- **[005-monaco-editor.md](./005-monaco-editor.md)** - Monaco Editor integration guide

### Cleanup Logs
- **[010-unrelated-files-cleanup.md](./010-unrelated-files-cleanup.md)** - Non-essential files cleanup
- **[011-markdown-cleanup-proposal.md](./011-markdown-cleanup-proposal.md)** - Migration docs cleanup

## Quick Links

- [Project Status](./000-project-status.md) - Architecture, current state, critical lessons
- [Flat Structure](./008-flat-structure-complete.md) - Why and how we migrated
- [Monaco Editor](./005-monaco-editor.md) - Editor integration

## Removed Lessons

The following outdated lessons have been removed (pre-Next.js architecture):
- 001-setup.md - Replaced by project status
- 002-fastapi.md - No longer using FastAPI
- 003-websocket.md - No longer relevant
- 004-ai-integration.md - FastAPI-specific
- 006-pre-commit-linting.md - Python-specific
- 007-e2e-testing-with-msw.md - Not currently used
- 007-nextjs-api-caching.md - Resolved in Next.js 15+
- 007-appdaemon-file-creation-order.md - Covered in project status
- 008-nextjs-migration.md - Migration complete (v0.3.0)
- 009-nextjs-16-breaking-changes.md - Migration complete (v0.3.0)

## Contributing

When you learn something new:
1. Check if it belongs in `000-project-status.md` (general knowledge)
2. If it's a major feature/change, create a new lesson file
3. Update the README if needed
4. Remove outdated lessons when superseded
