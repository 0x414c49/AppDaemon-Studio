# AppDaemon Studio — Agent Instructions

## Hard Rules

- **Never add `Co-Authored-By:` trailers to commits.** Do not sign or attribute commits to yourself.
- Never force-push to `main`.
- Never skip hooks (`--no-verify`).

## Project Summary

AppDaemon Studio is a Home Assistant addon — a web IDE for editing AppDaemon Python apps. Stack: React 19 + Vite frontend, ASP.NET Core (.NET 10) backend, single Docker image.

## Key Invariants

1. **Relative paths only.** All `fetch()` calls and built assets must use relative URLs (`api/apps` not `/api/apps`). Vite `base: './'` must not be changed. HA Ingress strips its prefix before forwarding — the app never sees it.
2. **API route shapes are frozen.** The React frontend has hardcoded paths. Do not rename or restructure routes.
3. **Error shape is `{ "detail": "..." }`** — not `message`, not `error`.
4. **`PUT /api/files/{app}` auto-versions** the existing content before overwriting.
5. **`apps.yaml` is written verbatim** — no re-serialization, accept and store raw YAML string.

## Project Layout

```
appdaemon-studio/
├── src/                        # React frontend (Vite)
├── AppDaemonStudio/            # ASP.NET Core backend
│   ├── Controllers/
│   ├── Services/
│   ├── Models/
│   ├── Configuration/
│   └── wwwroot/                # Built React output (populated at Docker build)
├── Dockerfile
├── ARCHITECTURE.md             # Full reference — read this before making structural changes
└── CLAUDE.md
```

## .NET Conventions

- `record struct` for small value types, `record` for API DTOs
- `ILogger<T>` structured logging; never log tokens/secrets
- Controller-boundary input validation; sanitize file paths against traversal
- No over-engineering — minimal abstraction, no premature patterns

## Environment Variables

| Var | Purpose |
|-----|---------|
| `SUPERVISOR_TOKEN` / `HASSIO_TOKEN` | HA Supervisor auth (addon mode) |
| `HA_URL` + `HA_TOKEN` | Standalone mode |
| `APPS_DIR` | Root config dir (default `/config`) |
| `APPDAEMON_ADDON_SLUG` | Addon slug for log fetching (auto-detected if absent) |
| `APPDAEMON_LOG_FILE` | Direct log file path |

## Full Reference
See `ARCHITECTURE.md` for complete API reference, Dockerfile, CI pipeline, ingress details, and migration history.
