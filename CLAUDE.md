# AppDaemon Studio — Claude Instructions

## Hard Rules

- **Never add `Co-Authored-By:` trailers to commits.** Do not sign or attribute commits to yourself in any way.
- Never force-push to `main`.
- Never skip hooks (`--no-verify`).

## Stack

- **Frontend:** React 19 + Vite, served as static files from `AppDaemonStudio/wwwroot/`
- **Backend:** ASP.NET Core (.NET 10) — single project, single process
- **Runtime:** `mcr.microsoft.com/dotnet/aspnet:10.0` — do not downgrade to 8 or 9

## Critical Constraints

### HA Ingress — Paths Must Be Relative
HA assigns a dynamic ingress prefix (e.g. `/api/hassio_ingress/abc123/`) per restart and strips it before forwarding. The container never sees the prefix.
- Vite config: `base: './'` — all built assets use relative paths
- All `fetch()` calls: `fetch('api/apps')` not `fetch('/api/apps')`
- Do NOT add `UsePathBase()` or any base-path config in .NET

### API Contract
The frontend uses hardcoded relative paths — never change the route shapes. Error responses must use `{ "detail": "message" }`. Full contract in `ARCHITECTURE.md`.

### .NET Coding Style
- Prefer `record struct` for small value types, `record` class for API DTOs
- `ILogger<T>` with structured logging; never log tokens or secrets
- No unnecessary allocation in hot paths (avoid LINQ hidden allocs, use spans where sensible)
- Small focused methods, no god classes, no magic strings
- Validate inputs at controller boundary; sanitize all file paths against traversal
- KISS/DRY — three similar lines is fine; abstract only at 3+ genuine reuses

## Architecture Reference
`ARCHITECTURE.md` in the project root has full detail on project structure, API reference, migration plan, Dockerfile, and CI pipeline.
