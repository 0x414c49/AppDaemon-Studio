# AppDaemon Studio — Architecture & Migration Guide

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Home Assistant Addon & Ingress](#home-assistant-addon--ingress)
4. [API Reference](#api-reference)
5. [Core Libraries](#core-libraries)
6. [Frontend Architecture](#frontend-architecture)
7. [Environment Variables](#environment-variables)
8. [Docker & Deployment](#docker--deployment)
9. [Migration Plan: Next.js → React + .NET](#migration-plan-nextjs--react--net)
10. [.NET Backend Design](#net-backend-design)
11. [Build Pipeline Optimization](#build-pipeline-optimization)
12. [E2E Testing Strategy](#e2e-testing-strategy)

---

## Overview

AppDaemon Studio is a **Home Assistant addon** that provides a web-based IDE for editing [AppDaemon](https://appdaemon.readthedocs.io/) Python apps. It runs as a sidecar addon inside the HA supervisor and is exposed through the HA Ingress reverse proxy.

**Current stack:**
- Frontend: React 19 + Next.js 16 (App Router)
- Backend: Next.js API routes (Node.js)
- Editor: Monaco Editor with custom AppDaemon completions
- State: Zustand + localStorage
- Styling: Tailwind CSS

**Target stack:**
- Frontend: Pure React (Vite build, served as static files from `wwwroot`)
- Backend: ASP.NET Core (single project, serves both API and static frontend)
- E2E tests: Playwright with mocked API

---

## Project Structure

```
appdaemon-studio/
├── src/
│   ├── app/
│   │   ├── api/                        # Next.js API routes (to be replaced by .NET)
│   │   │   ├── health/route.ts         # GET /api/health
│   │   │   ├── apps/route.ts           # GET|POST /api/apps
│   │   │   ├── entities/route.ts       # GET /api/entities
│   │   │   ├── appdaemon-logs/route.ts # GET /api/appdaemon-logs
│   │   │   ├── files/[...path]/route.ts        # GET|PUT|DELETE /api/files/{app}/{type}
│   │   │   └── versions/[app]/
│   │   │       ├── route.ts            # GET|PUT|DELETE /api/versions/{app}
│   │   │       └── [timestamp]/route.ts # GET /api/versions/{app}/{timestamp}
│   │   ├── components/                 # React components (keep as-is)
│   │   │   ├── Editor.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── LogViewer.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── TabBar.tsx
│   │   │   ├── VersionCompare.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── AlertDialog.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Main app entry point
│   │   ├── providers.tsx
│   │   └── globals.css
│   ├── lib/
│   │   ├── file-manager.ts             # File I/O (port to C#)
│   │   ├── home-assistant.ts           # HA API client (port to C#)
│   │   ├── version-control.ts          # Version snapshots (port to C#)
│   │   ├── log-reader.ts               # Log parser (port to C#)
│   │   ├── settings-store.ts           # Editor settings in localStorage (keep in FE)
│   │   ├── templates.ts                # Python code templates (keep in FE or move to C#)
│   │   └── monaco/                     # Monaco editor config (keep in FE)
│   │       ├── completions/
│   │       └── themes.ts
│   ├── hooks/
│   │   └── useEntities.ts              # React hook for HA entities
│   └── types/
│       ├── index.ts                    # Shared types
│       └── entities.ts
├── public/                             # Static assets → becomes wwwroot
├── config.json                         # HA addon manifest
├── next.config.js                      # Next.js config
├── Dockerfile
└── scripts/
    └── start.sh                        # Startup script (replace with .NET entrypoint)
```

---

## Home Assistant Addon & Ingress

### How HA Ingress Works

When running as a HA addon:

1. HA Supervisor assigns the addon a unique ingress path like `/api/hassio_ingress/<token>/`
2. **Every request** from the browser arrives at this dynamic path, e.g.:
   ```
   GET /api/hassio_ingress/abc123/api/apps
   ```
3. HA reverse-proxies it to `http://localhost:3000/api/apps` inside the container, **stripping the ingress prefix**
4. HA injects the `x-ingress-path` header with the current prefix so the app can construct self-referencing URLs

**Critical:** The ingress path changes every time the addon restarts. The app **cannot hardcode any base path**. All asset and API references must be relative.

### How the App Handles Ingress Today (Next.js)

```js
// next.config.js
assetPrefix: './',   // CSS/JS loaded as ./... (relative) — works under any prefix
```

All `fetch()` calls in the React components use relative URLs:
```ts
fetch('api/apps')         // NOT fetch('/api/apps')
fetch('api/entities')
fetch('api/appdaemon-logs')
```

This means the browser resolves these relative to the current page URL, which already has the ingress prefix — so the requests go to the right place without any config.

### Ingress Detection (Health Endpoint)

The health endpoint detects whether the app is running behind HA ingress by checking for the `x-ingress-path` header:

```ts
hasXIngressPath: !!headersList.get('x-ingress-path'),
```

### Addon Manifest (`config.json`)

```json
{
  "ingress": true,
  "ingress_port": 3000,
  "hassio_api": true,
  "homeassistant_api": true,
  "hassio_role": "manager",
  "auth_api": true,
  "map": ["config:rw"]
}
```

Key fields:
- `ingress: true` — enables the HA reverse proxy
- `ingress_port: 3000` — the port the app listens on inside the container
- `hassio_api: true` — enables access to `http://supervisor` API
- `map: ["config:rw"]` — mounts `/config` from the HA host into the container

---

## API Reference

All routes are under `/api/`. The frontend calls them with **relative paths** (no leading `/`).

### `GET /api/health`

Returns diagnostic info about the running environment.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "0.3.33",
  "environment": {
    "hasSupervisorToken": true,
    "hasHassioToken": false,
    "supervisorTokenSource": "env",
    "nodeEnv": "production",
    "hostname": "0.0.0.0",
    "allEnvVars": ["NODE_ENV", "PORT", ...]
  },
  "requestHeaders": {
    "hasXIngressPath": true,
    "hasXRemoteUser": true,
    "hasXHassUserId": false,
    "hasAuthorization": false
  }
}
```

---

### `GET /api/apps`

Lists all AppDaemon apps found in `$APPS_DIR/apps/`.

**Response:**
```json
{
  "apps": [
    {
      "name": "my_app",
      "class_name": "MyApp",
      "description": "My app description",
      "icon": "mdi:application",
      "has_python": true,
      "has_yaml": true,
      "last_modified": "2024-01-01T00:00:00.000Z",
      "version_count": 3
    }
  ],
  "count": 1
}
```

### `POST /api/apps`

Creates a new AppDaemon app.

**Request body:**
```json
{
  "name": "my_app",
  "class_name": "MyApp",
  "description": "Optional description",
  "icon": "mdi:application"
}
```

**Validation:** `name` must match `/^[a-z_][a-z0-9_]*$/`

**Response:** `201` with `AppInfo` object, or `400` with `{ "detail": "..." }`.

---

### `GET /api/entities`

Fetches all Home Assistant entities grouped by domain.

**Response:**
```json
{
  "available": true,
  "count": 150,
  "domains": ["light", "sensor", "switch"],
  "entities": [...],
  "grouped": {
    "light": [{ "entity_id": "light.living_room", "state": "on", "attributes": {...} }],
    "sensor": [...]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

If HA credentials are not available:
```json
{
  "available": false,
  "error": "No Home Assistant credentials...",
  "count": 0,
  "entities": [],
  "grouped": {},
  "domains": []
}
```

---

### `GET /api/appdaemon-logs`

Fetches and parses AppDaemon log entries. Supports three backends:

| Priority | Condition | Source |
|----------|-----------|--------|
| 1 | `SUPERVISOR_TOKEN` or `HASSIO_TOKEN` set | `http://supervisor/addons/{slug}/logs` |
| 2 | `APPDAEMON_LOG_FILE` set | Local file read |
| 3 | `HA_URL` + `HA_TOKEN` set | HA REST API proxy to supervisor |

**Query params:**
- `slug` — override the AppDaemon addon slug (optional, auto-detected otherwise)

**Response:**
```json
{
  "logs": [
    {
      "raw": "2024-01-01 10:00:00.123 INFO my_app: Hello",
      "timestamp": "2024-01-01 10:00:00.123",
      "level": "INFO",
      "source": "my_app",
      "message": "Hello"
    }
  ]
}
```

**Slug auto-discovery:** Queries `http://supervisor/addons` and finds the first addon whose name or slug contains `appdaemon`. Falls back to common slugs: `a0d7b954_appdaemon`, `core_appdaemon`, `appdaemon`.

---

### `GET /api/files/{app}`
### `GET /api/files/{app}/python`

Reads the Python source file for an app.

**Response:**
```json
{
  "content": "import appdaemon.plugins.hass.hassapi as hass\n...",
  "last_modified": "2024-01-01T00:00:00.000Z"
}
```

### `GET /api/files/{app}/yaml`
### `GET /api/files/{app}/yml`

Reads the full `apps.yaml` config file.

### `PUT /api/files/{app}`
### `PUT /api/files/{app}/python`

Updates the Python file. **Automatically creates a version snapshot** of the existing content before overwriting.

**Request body:** `{ "content": "..." }`

### `PUT /api/files/{app}/yaml`

Updates `apps.yaml`.

### `DELETE /api/files/{app}`

Deletes the app's `.py` file and removes its entry from `apps.yaml`. Returns `204 No Content`.

---

### `GET /api/versions/{app}`

Lists all saved versions of an app.

**Response:**
```json
{
  "versions": [
    {
      "version": "20240101100000",
      "timestamp": "2024-01-01T10:00:00.000Z",
      "size": 512,
      "filename": "my_app_20240101100000.py"
    }
  ],
  "count": 1
}
```

### `PUT /api/versions/{app}`

Restores a version.

**Request body:** `{ "versionId": "20240101100000" }`

### `DELETE /api/versions/{app}?versionId={id}`

Deletes a specific version.

### `GET /api/versions/{app}/{timestamp}`

Retrieves the content of a specific version.

**Response:** `{ "content": "...", "last_modified": "..." }`

---

## Core Libraries

### `lib/file-manager.ts`

Handles all filesystem operations. Configuration:

```
APPS_DIR  = $APPS_DIR/apps           (default: /config/apps)
APPS_CONFIG = $APPS_DIR/apps.yaml
VERSIONS_DIR = $APPS_DIR/.versions
```

Key functions:
- `listApps()` — scans for `.py` files, merges with `apps.yaml` config
- `createApp(data)` — writes `.py` template + updates `apps.yaml`
- `deleteApp(name)` — removes `.py` + removes from `apps.yaml`
- `readPythonFile(app)` — returns content + mtime
- `writePythonFile(app, content)` — overwrites `.py`
- `readAppsYaml()` — reads raw `apps.yaml`
- `writeAppsYaml(content)` — overwrites `apps.yaml`

**YAML parser:** Custom hand-rolled parser (no external YAML lib). Handles the specific format:
```yaml
# AppDaemon Apps Configuration
app_name:
  module: app_name
  class: ClassName
  description: Some text
  icon: mdi:application
```

**App name validation:** `/^[a-z_][a-z0-9_]*$/`

---

### `lib/home-assistant.ts`

HA API client with two modes:

```
Addon mode:  SUPERVISOR_TOKEN / HASSIO_TOKEN → http://supervisor/core/api/states
Standalone:  HA_URL + HA_TOKEN             → {HA_URL}/api/states
```

Key functions:
- `fetchHomeAssistantEntities()` → `FetchResult`
- `groupEntitiesByDomain(entities)` → `Record<string, HAEntity[]>` (sorted)

10-second request timeout on all calls.

---

### `lib/version-control.ts`

Stores version snapshots as flat files:

```
/config/apps/.versions/{appName}_{timestamp}.py
```

Timestamp format: `YYYYMMDDHHmmss` (14 digits, UTC)

Key functions:
- `createVersion(app, content)` — writes snapshot file
- `listVersions(app)` — lists sorted newest-first
- `getVersion(app, version)` — reads snapshot
- `restoreVersion(app, version)` — copies snapshot back to `apps/`
- `deleteVersion(app, version)` — removes snapshot file
- `cleanupVersions(app, keepCount)` — prunes old versions

---

### `lib/log-reader.ts`

Parses AppDaemon log lines. Two regex patterns:

```
INFO/WARNING: ^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+) (INFO|WARNING) (\w+): (.*)$
ERROR:        ^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+) ERROR Error: (.*)$
```

Produces `ParsedLogEntry[]` with fields: `raw`, `timestamp`, `level`, `source`, `message`.

---

## Frontend Architecture

### State Management

| State | Where |
|-------|-------|
| App list | React `useState` in `page.tsx` |
| Active app | React `useState` in `page.tsx` |
| Editor settings (theme, font, size) | `localStorage` via `settings-store.ts` |
| Sidebar width | `localStorage` |
| HA entities | `useEntities` hook (fetched from `/api/entities`) |

No Zustand store is actually used currently — state lives in the top-level `page.tsx`.

### Component Tree

```
page.tsx (Home)
├── Sidebar
│   └── App list, create/delete dialogs
├── TabBar (Editor | Logs)
├── Editor (Monaco)
│   └── Python/YAML tabs, save, version compare
├── LogViewer
│   └── Level filter, app filter, live refresh
├── Settings dialog
├── ConfirmDialog
└── AlertDialog
```

### API Calls from Frontend

All calls use **relative URLs** (critical for HA Ingress):

```ts
fetch('api/apps')
fetch('api/apps', { method: 'POST', body: ... })
fetch(`api/files/${app}`)
fetch(`api/files/${app}`, { method: 'PUT', body: ... })
fetch(`api/files/${app}`, { method: 'DELETE' })
fetch(`api/files/${app}/yaml`)
fetch('api/entities')
fetch('api/appdaemon-logs')
fetch(`api/versions/${app}`)
fetch(`api/versions/${app}/${timestamp}`)
```

### Editor (Monaco)

- Language: Python
- Custom completions: AppDaemon methods, patterns, Python stdlib, datetime, json, os, http
- Entity autocomplete: pulls from `/api/entities` and suggests entity IDs
- Multiple themes: vs-dark, one-dark-pro, dracula, github-dark, nord, monokai, etc.
- Font families: Fira Code, JetBrains Mono, Cascadia Code (all bundled via `@fontsource/*`)

---

## Environment Variables

| Variable | Mode | Purpose | Default |
|----------|------|---------|---------|
| `SUPERVISOR_TOKEN` | Addon | HA Supervisor auth token (auto-injected) | — |
| `HASSIO_TOKEN` | Addon | Alternative token name (auto-injected) | — |
| `HA_URL` | Standalone | Home Assistant base URL | — |
| `HA_TOKEN` | Standalone | HA long-lived access token | — |
| `APPS_DIR` | Both | Root config directory | `/config` |
| `APPDAEMON_ADDON_SLUG` | Both | AppDaemon addon slug for logs | auto-detected |
| `APPDAEMON_LOG_FILE` | Both | Path to AppDaemon log file | — |
| `PORT` | Both | HTTP port | `3000` |
| `HOSTNAME` | Both | Bind address | `0.0.0.0` |
| `NODE_ENV` | Both | Runtime mode | `production` |

HA injects addon option values as `ADDON_CONFIG_<OPTION_UPPERCASE>`. The `start.sh` script maps them:
```sh
ADDON_CONFIG_APPDAEMON_ADDON_SLUG → APPDAEMON_ADDON_SLUG
```

---

## Docker & Deployment

### Multi-Stage Build

```
deps        → npm ci (all deps, cached)
builder     → npm run build (Next.js compilation)
prod-deps   → npm ci --only=production
runner      → final image (non-root user nextjs:1001)
```

### Entrypoint

```dockerfile
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/app/start.sh"]
```

`dumb-init` handles PID 1 signal forwarding. `start.sh` detects mode, maps env vars, then runs `next start`.

### Health Check

```dockerfile
HEALTHCHECK CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1))"
```

---

## Migration Plan: Next.js → React + .NET

### Guiding Principles

1. **Frontend is NOT rewritten** — existing React components, hooks, and logic are kept verbatim
2. **Only the backend changes** — Next.js API routes become ASP.NET Core controllers
3. **Ingress handling stays the same** — relative URLs in the frontend remain unchanged
4. **Single deployable artifact** — one Docker image, one process, React served from `wwwroot`

### What Moves Where

| Current (Next.js) | Target (.NET) |
|-------------------|---------------|
| `src/app/api/*/route.ts` | ASP.NET Core controllers |
| `src/lib/file-manager.ts` | `Services/FileManagerService.cs` |
| `src/lib/home-assistant.ts` | `Services/HomeAssistantService.cs` |
| `src/lib/version-control.ts` | `Services/VersionControlService.cs` |
| `src/lib/log-reader.ts` | `Services/LogReaderService.cs` |
| `next.config.js` (assetPrefix) | `UseStaticFiles()` from `wwwroot/` |
| `scripts/start.sh` | Docker `CMD ["dotnet", "AppDaemonStudio.dll"]` |
| Next.js server | Kestrel |
| `Dockerfile` (Node multi-stage) | Node build + .NET runtime stages |

### What Stays in Frontend

- All React components (`src/app/components/`)
- All Monaco editor config and completions (`src/lib/monaco/`)
- Settings store (`src/lib/settings-store.ts`)
- Code templates (`src/lib/templates.ts`)
- Hooks (`src/hooks/useEntities.ts`)
- Types (`src/types/`)

### Ingress Handling in .NET

The .NET app must serve the React SPA with **no hardcoded base path**. ASP.NET Core handles this natively:

```csharp
// Serve static files from wwwroot
app.UseStaticFiles();

// SPA fallback — return index.html for any unmatched route
app.MapFallbackToFile("index.html");
```

React's `fetch('api/apps')` calls are relative to the current page URL. Since HA ingress strips its own prefix before forwarding to the container, the relative URL resolves correctly inside the container at `/api/apps`.

**No `PathBase` configuration is needed** because HA ingress handles the prefix rewriting externally.

### .NET Project Structure

```
AppDaemonStudio/
├── AppDaemonStudio.csproj
├── Program.cs
├── Controllers/
│   ├── HealthController.cs
│   ├── AppsController.cs
│   ├── EntitiesController.cs
│   ├── LogsController.cs
│   ├── FilesController.cs
│   └── VersionsController.cs
├── Services/
│   ├── IFileManagerService.cs
│   ├── FileManagerService.cs
│   ├── IHomeAssistantService.cs
│   ├── HomeAssistantService.cs
│   ├── IVersionControlService.cs
│   ├── VersionControlService.cs
│   ├── ILogReaderService.cs
│   └── LogReaderService.cs
├── Models/
│   ├── AppInfo.cs
│   ├── CreateAppRequest.cs
│   ├── FileContent.cs
│   ├── VersionInfo.cs
│   ├── LogEntry.cs
│   └── HaEntity.cs
├── Configuration/
│   └── AppSettings.cs          # Reads env vars
└── wwwroot/                    # Built React app (populated at Docker build time)
    ├── index.html
    ├── assets/
    └── ...
```

### `Program.cs` Outline

```csharp
var builder = WebApplication.CreateBuilder(args);

// Services
builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddScoped<IFileManagerService, FileManagerService>();
builder.Services.AddScoped<IHomeAssistantService, HomeAssistantService>();
builder.Services.AddScoped<IVersionControlService, VersionControlService>();
builder.Services.AddScoped<ILogReaderService, LogReaderService>();

// .NET 10 — no need for UseRouting/UseEndpoints explicitly, minimal API style

// CORS (mirrors current Next.js CORS headers for /api/*)
builder.Services.AddCors(options => {
    options.AddPolicy("ApiCors", policy => policy
        .AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader());
});

var app = builder.Build();

app.UseCors("ApiCors");
app.UseStaticFiles();       // serves wwwroot
app.MapControllers();
app.MapFallbackToFile("index.html");  // SPA fallback

app.Run();
```

### Environment Variables → .NET Configuration

Map from env var to `appsettings` / direct `Environment.GetEnvironmentVariable`:

```csharp
public class AppSettings
{
    public string AppsDir       => Environment.GetEnvironmentVariable("APPS_DIR") ?? "/config";
    public string? SupervisorToken => Environment.GetEnvironmentVariable("SUPERVISOR_TOKEN")
                                   ?? Environment.GetEnvironmentVariable("HASSIO_TOKEN");
    public string? HaUrl        => Environment.GetEnvironmentVariable("HA_URL");
    public string? HaToken      => Environment.GetEnvironmentVariable("HA_TOKEN");
    public string? AddonSlug    => Environment.GetEnvironmentVariable("APPDAEMON_ADDON_SLUG");
    public string? LogFilePath  => Environment.GetEnvironmentVariable("APPDAEMON_LOG_FILE");
}
```

### New Dockerfile (Multi-Stage: Node + .NET)

```dockerfile
# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build        # outputs to /app/dist (Vite) or /app/out

# Stage 2: Build .NET backend
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS backend-builder
WORKDIR /app
COPY AppDaemonStudio/ .
RUN dotnet publish -c Release -o /publish

# Stage 3: Final image
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runner
WORKDIR /app

COPY --from=backend-builder /publish .
COPY --from=frontend-builder /app/dist ./wwwroot

ENV ASPNETCORE_URLS=http://+:3000
EXPOSE 3000

HEALTHCHECK CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["dotnet", "AppDaemonStudio.dll"]
```

### Vite Config for React (replaces Next.js)

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  // No base path — relative assets work under any HA ingress prefix
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    // Dev proxy: forward API calls to .NET backend
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
```

**Note:** `base: './'` is the equivalent of `assetPrefix: './'` in Next.js — it makes all asset references relative, which is required for HA ingress compatibility.

---

## .NET Backend Design

### Controller: `AppsController`

```
GET    /api/apps          → List all apps
POST   /api/apps          → Create app
```

### Controller: `FilesController`

```
GET    /api/files/{app}           → Read Python file
GET    /api/files/{app}/python    → Read Python file
GET    /api/files/{app}/yaml      → Read apps.yaml
GET    /api/files/{app}/yml       → Read apps.yaml
PUT    /api/files/{app}           → Write Python (auto-versions first)
PUT    /api/files/{app}/python    → Write Python (auto-versions first)
PUT    /api/files/{app}/yaml      → Write apps.yaml
DELETE /api/files/{app}           → Delete app
```

### Controller: `VersionsController`

```
GET    /api/versions/{app}                   → List versions
PUT    /api/versions/{app}                   → Restore version (body: { versionId })
DELETE /api/versions/{app}?versionId={id}    → Delete version
GET    /api/versions/{app}/{timestamp}        → Get version content
```

### Controller: `EntitiesController`

```
GET    /api/entities    → Fetch HA entities grouped by domain
```

### Controller: `LogsController`

```
GET    /api/appdaemon-logs?slug={optional}   → Fetch and parse AppDaemon logs
```

### Controller: `HealthController`

```
GET    /api/health    → Environment diagnostics
```

### Service: `FileManagerService`

Ports `src/lib/file-manager.ts` to C#:
- Uses `IConfiguration` / env vars for `APPS_DIR`
- `apps.yaml` parser (hand-rolled, matches current TypeScript behavior)
- File validation: `^[a-z_][a-z0-9_]*$`

### Service: `HomeAssistantService`

Ports `src/lib/home-assistant.ts` to C#:
- Uses `IHttpClientFactory` for HTTP calls
- Priority: supervisor token → standalone HA URL
- 10-second timeout
- Returns `FetchResult` equivalent

### Service: `LogReaderService`

Ports `src/lib/log-reader.ts` to C#:
- Two regex patterns for INFO/WARNING and ERROR lines
- Returns `List<LogEntry>`

### Service: `VersionControlService`

Ports `src/lib/version-control.ts` to C#:
- File naming: `{appName}_{timestamp}.py` in `.versions/`
- Timestamp: `yyyyMMddHHmmss` (UTC)

---

## Build Pipeline Optimization

### The Problem with the Current Pipeline

The current Next.js build runs **inside the Docker image build**. Because the addon targets both `amd64` and `aarch64`, the CI must either:
- Run separate builds on native ARM and x86 machines, or
- Use QEMU to emulate ARM on an x86 host (very slow — Node/webpack under QEMU is 5–10x slower)

The Next.js server is also a Node.js process, so the final image contains the full Node.js runtime.

### The Opportunity with React + .NET

After migration, the build splits cleanly into two independent parts:

| Part | Architecture-dependent? | Built how? |
|------|------------------------|------------|
| React (Vite) — HTML/CSS/JS | **No** — pure static files | Once on x86, output is universal |
| .NET backend | **Yes** — native binary | Cross-compiled via `dotnet publish -r linux-x64` and `linux-arm64` |

This means:
1. **Build React once** on any x86 machine — the output `dist/` is identical for all platforms
2. **Cross-compile .NET twice** on the same x86 machine (no QEMU needed) — .NET SDK has built-in cross-compilation
3. **No Node.js in the final image** — just the .NET runtime (~200 MB vs current Node Alpine)

### New Multi-Arch Build Pipeline

```
CI Runner (x86 only)
│
├── Step 1: Build React (once)
│     node:20 → npm run build → dist/
│     (same output used for both platforms)
│
├── Step 2a: Build .NET for linux-x64
│     dotnet publish -r linux-x64 --self-contained false
│
├── Step 2b: Build .NET for linux-arm64
│     dotnet publish -r linux-arm64 --self-contained false
│     (cross-compilation, no QEMU needed)
│
├── Step 3a: Assemble amd64 image
│     FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine
│     COPY dist/ wwwroot/
│     COPY publish-linux-x64/ .
│
├── Step 3b: Assemble arm64 image
│     FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine   (arm64 base)
│     COPY dist/ wwwroot/           ← same React files
│     COPY publish-linux-arm64/ .
│
└── Step 4: Push manifest list (multi-arch)
      docker buildx imagetools create ...
```

### Optimized Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.4

# ── Stage 1: Build React frontend (architecture-independent) ──────────────────
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build
# Output: /app/dist (pure static HTML/CSS/JS — no arch dependency)

# ── Stage 2: Build .NET backend ───────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS backend
WORKDIR /src
COPY AppDaemonStudio/ .
# TARGETARCH is injected by docker buildx (amd64 | arm64)
ARG TARGETARCH
RUN dotnet publish -c Release \
    -r linux-${TARGETARCH} \
    --self-contained false \
    -o /publish

# ── Stage 3: Final image ──────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine
WORKDIR /app

RUN addgroup -g 1001 -S appuser && adduser -S appuser -u 1001
USER appuser

# .NET backend binary (arch-specific)
COPY --from=backend --chown=appuser /publish .

# React frontend (same files for all architectures)
COPY --from=frontend --chown=appuser /app/dist ./wwwroot

ENV ASPNETCORE_URLS=http://+:3000 \
    DOTNET_RUNNING_IN_CONTAINER=true

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

ENTRYPOINT ["dotnet", "AppDaemonStudio.dll"]
```

**Key:** `docker buildx` injects `TARGETARCH` automatically when building a multi-arch manifest. The React stage only runs once (BuildKit caches it); only the `dotnet publish` step differs between architectures.

### CI Workflow (GitHub Actions)

```yaml
jobs:
  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@v4
        with: { name: frontend-dist, path: dist/ }

  build-image:
    needs: build-frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with: { name: frontend-dist, path: dist/ }
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ghcr.io/0x414c49/appdaemon-studio:${{ github.ref_name }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Speed Comparison

| Step | Current (Next.js) | After (React + .NET) |
|------|-------------------|----------------------|
| Frontend build | ~2 min (x86) + ~15 min (ARM via QEMU) | ~2 min once, shared |
| Backend build | included in above | ~1 min (x86) + ~1 min (cross-compile ARM) |
| Final image size | ~400 MB (Node + Next.js) | ~150 MB (.NET runtime + static files) |
| Total CI time | ~20 min | ~5 min |

### Live HA Testing

With a dedicated Home Assistant OS instance available:
- E2E tests can run against the real addon (addon mode with real `SUPERVISOR_TOKEN`)
- The test HA instance provides a real `http://supervisor` endpoint and real AppDaemon logs
- Deployment during development: `docker buildx build --load` + `ha addon restart` via REST API
- The HA REST API (`/api/hassio/addons/appdaemon-studio/restart`) can trigger reloads from CI

---

## E2E Testing Strategy

After migration, add Playwright E2E tests with a **mocked .NET API** so tests are:
- Fast (no real HA required)
- Reproducible
- Capable of taking screenshots

### Architecture

```
Playwright tests
    ↓ browser
React (served by .NET from wwwroot)
    ↓ fetch('api/...')
.NET TestServer with mocked services
    (IFileManagerService, IHomeAssistantService, etc. replaced with in-memory mocks)
```

### Test Setup

```csharp
// WebApplicationFactory with mocked services
public class MockedApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.AddScoped<IFileManagerService, InMemoryFileManagerService>();
            services.AddScoped<IHomeAssistantService, MockHomeAssistantService>();
            services.AddScoped<IVersionControlService, InMemoryVersionControlService>();
            services.AddScoped<ILogReaderService, MockLogReaderService>();
        });
    }
}
```

### Playwright Tests

```ts
// tests/e2e/apps.spec.ts
import { test, expect } from '@playwright/test'

test('shows app list', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('my_test_app')).toBeVisible()
  await page.screenshot({ path: 'screenshots/app-list.png' })
})

test('can edit and save a python file', async ({ page }) => {
  await page.goto('/')
  await page.getByText('my_test_app').click()
  await page.getByRole('tab', { name: 'Python' }).click()
  // Monaco editor interaction
  await page.screenshot({ path: 'screenshots/editor.png' })
})

test('shows appdaemon logs', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Logs' }).click()
  await expect(page.getByText('INFO')).toBeVisible()
  await page.screenshot({ path: 'screenshots/logs.png' })
})
```

### Mock Data

The in-memory mocks return static fixture data:

```csharp
public class InMemoryFileManagerService : IFileManagerService
{
    private readonly Dictionary<string, string> _files = new()
    {
        ["my_app"] = "import appdaemon.plugins.hass.hassapi as hass\n\nclass MyApp(hass.Hass):\n    def initialize(self):\n        pass\n"
    };

    public Task<List<AppInfo>> ListAppsAsync() => Task.FromResult(new List<AppInfo>
    {
        new() { Name = "my_app", ClassName = "MyApp", HasPython = true, HasYaml = true }
    });
    // ...
}
```

### Screenshot Captures

Playwright's `page.screenshot()` can capture:
- App list sidebar
- Editor with Python code loaded
- YAML config editor
- Log viewer with sample logs
- Settings dialog
- Version history panel
- Create app dialog

---

## Key Invariants to Preserve in Migration

1. **All API paths match exactly** — frontend uses hardcoded relative paths like `api/apps`, `api/files/{app}`, etc.
2. **All relative URLs stay relative** — `fetch('api/apps')` not `fetch('/api/apps')`. The Vite `base: './'` config ensures built assets also use relative paths.
3. **Error response format matches** — frontend checks for `{ detail: "..." }` on error responses.
4. **CORS headers on `/api/*`** — required for standalone/development mode.
5. **Version auto-creation on PUT** — when a Python file is updated via `PUT /api/files/{app}`, the current content must be versioned first.
6. **AppDaemon slug auto-discovery** — if `APPDAEMON_ADDON_SLUG` is not set, query supervisor for the addon list.
7. **apps.yaml is read/written as raw text** — the YAML editor tab shows and saves the raw file; the C# `writeAppsYaml` method must accept arbitrary YAML string and overwrite the file verbatim (no re-serialization).
