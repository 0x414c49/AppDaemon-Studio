# AppDaemon Studio — Agent Reference

Source of truth for all AI agents working on this project.
Agent-specific files (CLAUDE.md, .github/copilot-instructions.md, .cursorrules) extend this.

## Project Summary

AppDaemon Studio is a Home Assistant addon — a web IDE for editing AppDaemon Python apps.

- **Frontend:** React 19 + Vite (`src/ui/`)
- **Backend:** ASP.NET Core (.NET 10) (`src/AppDaemonStudio/`)
- **Tests:** xUnit + Playwright (`src/AppDaemonStudio.Tests/`, `src/ui/tests/`)
- **Runtime:** Single Docker image — `mcr.microsoft.com/dotnet/aspnet:10.0-alpine`

## Repository Layout

```
/
├── src/
│   ├── AppDaemonStudio.slnx              # .NET solution
│   ├── AppDaemonStudio/                  # ASP.NET Core backend
│   │   ├── Controllers/
│   │   ├── Services/
│   │   ├── Models/
│   │   ├── Configuration/
│   │   ├── Middleware/
│   │   └── wwwroot/                      # Built frontend (Docker build only, gitignored)
│   ├── AppDaemonStudio.Tests/            # xUnit tests
│   │   ├── Unit/
│   │   ├── Integration/
│   │   └── Helpers/                      # EnvScope, MockHttpMessageHandler
│   └── ui/                               # React 19 + Vite
│       ├── src/                          # Components, hooks, lib
│       ├── public/
│       ├── tests/                        # Playwright e2e
│       └── dist/                         # Build output (gitignored)
├── translations/                         # HA addon translations (must stay at root)
├── config.json                           # HA addon manifest (must stay at root)
├── repository.yaml                       # HA addon repository (must stay at root)
├── CHANGELOG.md                          # HA addon store reads this (must stay at root)
└── Dockerfile
```

## Hard Rules

- **Never** add `Co-Authored-By:` or any agent attribution to commits.
- **Never** force-push to `main`.
- **Never** skip hooks (`--no-verify`).
- **Never** log tokens, secrets, or env var values.

## Critical Invariants

### HA Ingress — all paths must be relative

HA assigns a dynamic ingress prefix per restart and strips it before forwarding. The container never sees the prefix.

- Vite `base: './'` — must not change.
- All `fetch()` calls use relative paths: `fetch('api/apps')` not `fetch('/api/apps')`.
- Do **not** add `UsePathBase()` or any base-path middleware in .NET.

### API Contract

- Route shapes are frozen — the frontend has hardcoded paths. Do not rename or restructure routes.
- Error responses must use `{ "detail": "message" }` — not `message`, not `error`.
- `PUT /api/files/{app}` auto-versions existing content before overwriting.
- `apps.yaml` is stored verbatim — no re-serialization, accept raw YAML string.
- Do not downgrade runtime from .NET 10 or `aspnet:10.0-alpine`.

## .NET Conventions

- `record struct` for small value types; `record` class for API DTOs.
- `ILogger<T>` with structured logging — never log secrets or tokens.
- No unnecessary allocation in hot paths — avoid LINQ hidden allocs, use spans where sensible.
- Small focused methods, no god classes, no magic strings.
- Validate inputs at controller boundary; sanitize all file paths against traversal.
- KISS/DRY — three similar lines is fine; abstract only at 3+ genuine reuses.

## Test Conventions

- Unit tests in `src/AppDaemonStudio.Tests/Unit/`
- Integration tests in `src/AppDaemonStudio.Tests/Integration/` — use `TestWebAppFactory` as the base factory
- Use `EnvScope` from `Helpers/` to set and restore env vars — never call `SetEnvironmentVariable(key, null)` directly
- Tests run sequentially (`DisableTestParallelization = true`) — `AppSettings` reads env vars live on every call
- No `Task.Delay` in tests — write deterministic fixtures instead (e.g. write files with known timestamps)

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `SUPERVISOR_TOKEN` / `HASSIO_TOKEN` | HA Supervisor auth (addon mode) |
| `HA_URL` + `HA_TOKEN` | Direct HA connection (standalone mode) |
| `APPS_DIR` | AppDaemon apps directory (default `/config/apps`) |
| `APPDAEMON_HTTP_URL` | AppDaemon HTTP API URL (manual override) |
| `APPDAEMON_HTTP_TOKEN` | AppDaemon HTTP API token |
| `APPDAEMON_ADDON_SLUG` | Addon slug for log fetching (auto-detected if absent) |

## Local Development

```bash
# Backend
dotnet run --project src/AppDaemonStudio

# Frontend dev server (proxies /api to backend on :5000)
cd src/ui && npm run dev

# All tests
dotnet test src/AppDaemonStudio.slnx
```

## Docker / CI

- Local build: `docker build --build-arg BUILD_VERSION=0.0.1 .`
- Node stage copies from `src/ui/`; .NET stage copies from `src/AppDaemonStudio/`
- CI builds the frontend separately and injects it via `--build-context frontend-dist=./dist`
- `translations/`, `config.json`, `repository.yaml`, `CHANGELOG.md` must remain at repo root — HA reads them there
