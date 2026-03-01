# AGENTS.md

## Agent Instructions (CRITICAL - READ FIRST)

**NEVER push code unless explicitly asked by the user.**
- Only commit and push when the user specifically requests it
- It's okay to stage changes and prepare commits
- Wait for explicit confirmation before pushing to remote
- This prevents unexpected changes in the repository

**Always document new learnings in the `lessons/` folder.**

When you encounter:
- New error patterns and their solutions
- CI/CD pipeline failures and fixes
- Dependency compatibility issues
- Type checking nuances
- Testing best practices
- Any "gotchas" or non-obvious behaviors

**Create or update a lesson file** (e.g., `lessons/006-pre-commit-linting.md`) with:
1. The exact error message
2. Why it happened (root cause)
3. The solution (with code examples)
4. How to prevent it in the future

This creates a knowledge base for future agents and prevents repeating the same mistakes.

## Project: AppDaemon Studio

A Home Assistant add-on providing an IDE for AppDaemon apps with AI-powered assistance.

## Tech Stack (UPDATED: Now Next.js Full-Stack)

### Framework
- **Next.js 14** - Full-stack React framework
- **TypeScript** - Strict mode enabled
- **Build Output**: Standalone mode for Docker

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Editor**: Monaco Editor (@monaco-editor/react)
- **Icons**: Lucide React

### Backend (Next.js API Routes)
- **File Manager**: Node.js fs/promises
- **Version Control**: Timestamp-based versioning
- **No separate backend** - all in Next.js API routes

### Infrastructure
- **Container**: Docker (Alpine Linux with Node.js 20)
- **Single Process**: Next.js handles everything (no nginx, no Python)
- **CI/CD**: GitLab CI

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Home Assistant (Ingress)                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  AppDaemon Studio Add-on                        │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │  Next.js (Port 3000)                    │   │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌──────────┐  │   │   │
│  │  │  │  React  │ │  API    │ │  Static  │  │   │   │
│  │  │  │  Pages  │ │  Routes │ │  Files   │  │   │   │
│  │  │  └────┬────┘ └────┬────┘ └────┬─────┘  │   │   │
│  │  │       └───────────┴───────────┘        │   │   │
│  │  │  ┌─────────────────────────────────┐   │   │   │
│  │  │  │  File System (/config/apps)     │   │   │   │
│  │  │  └─────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
appdaemon-studio/
├── AGENTS.md                 # This file
├── config.json              # Home Assistant add-on config (port 3000)
├── Dockerfile               # Multi-stage Node.js build
├── package.json             # Node.js dependencies
├── next.config.js           # Next.js config (standalone, basePath)
├── tsconfig.json            # TypeScript config
├── tailwind.config.js       # Tailwind CSS
├── postcss.config.js        # PostCSS
├── .gitlab-ci.yml           # CI/CD pipeline
├── docs/                    # Project documentation
├── lessons/                 # Lessons learned
├── tasks/                   # Task specifications
├── src/
│   ├── app/
│   │   ├── api/             # API Routes
│   │   │   ├── apps/        # List/create apps
│   │   │   ├── files/       # File operations (python/yaml)
│   │   │   ├── health/      # Health check
│   │   │   └── versions/    # Version control
│   │   ├── components/      # React components
│   │   │   ├── Editor.tsx   # Monaco editor
│   │   │   └── Sidebar.tsx  # App list sidebar
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Main IDE page
│   │   └── globals.css      # Global styles
│   ├── lib/
│   │   ├── file-manager.ts  # File operations
│   │   └── version-control.ts # Version management
│   └── types/
│       └── index.ts         # TypeScript types
└── .gitignore
```

## Coding Standards

### TypeScript (Full Stack)
- Strict TypeScript mode
- Functional components with hooks
- No `any` types
- Proper error handling with custom error classes
- Async/await for I/O operations

### API Routes
- Use Next.js App Router convention
- Dynamic routes: `[param]` for single, `[...path]` for catch-all
- Return proper HTTP status codes
- Consistent JSON response format

### Error Handling
- Custom error classes in lib files
- Try/catch in API routes
- Return user-friendly error messages

## Key Implementation Notes

1. **Ingress Support**: Uses Next.js basePath: `/hassio/ingress/appdaemon-studio`
2. **File Paths**: Use `/config/apps` (mapped volume in Home Assistant)
3. **Version Control**: Each app gets `.versions/` folder with `YYYYMMDDHHMMSS_filename.ext` format
4. **Standalone Output**: Docker uses `.next/standalone` for minimal image size
5. **Health Check**: `GET /api/health` returns status and version

## Testing

### Build & Test
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build production
npm run build

# Linting
npm run lint
```

### Docker Testing
```bash
# Build image
docker build -t appdaemon-studio:test .

# Run container
docker run -d --name appdaemon-studio -p 3000:3000 \
  -v /tmp/test-config:/config \
  appdaemon-studio:test

# Test endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/apps
```

## Pre-commit Checks (Required)

**A task is not complete until the build passes.**

Always run these before committing:

### Build & Lint
```bash
# Install dependencies
npm install

# Build (catches TypeScript errors)
npm run build

# Linting
npm run lint
```

### Quick Check Script
```bash
#!/bin/bash
# save as check.sh in project root

echo "=== Build Check ==="
npm run build || { echo "Build failed"; exit 1; }

echo "=== Lint Check ==="
npm run lint || { echo "Linting failed"; exit 1; }

echo "=== All checks passed! ==="
```

## Migration from Python (Historical)

The project was migrated from Python FastAPI + React + Nginx to Next.js:

| Aspect | Before | After |
|--------|--------|-------|
| Processes | 3 (nginx, python, node) | 1 (Next.js) |
| Image Size | ~500MB | ~220MB |
| Build Time | 3-5 min | ~1 min |
| Languages | Python + TypeScript | TypeScript only |

See `tasks/005-nextjs-migration.md` for details.

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [AppDaemon Docs](https://appdaemon.readthedocs.io/)
- [Home Assistant Add-on Docs](https://developers.home-assistant.io/docs/add-ons)
- [Monaco Editor Docs](https://microsoft.github.io/monaco-editor/)
- [Tailwind CSS Docs](https://tailwindcss.com/)

## Questions?

Check `docs/` for detailed guides or ask for clarification.
