# AppDaemon Studio — Copilot Instructions

Full reference: see `AGENTS.md` at the repo root.

## Project

AppDaemon Studio is a Home Assistant addon — a web IDE for AppDaemon Python apps.
Stack: React 19 + Vite (`src/ui/`), ASP.NET Core .NET 10 (`src/AppDaemonStudio/`), single Docker image.

## Hard Rules

- Never add agent/AI attribution to commits.
- Never force-push to `main`. Never skip hooks (`--no-verify`).
- Never log tokens, secrets, or env var values.

## HA Ingress — paths must be relative

- Vite `base: './'` must not change.
- All `fetch()` calls: `fetch('api/apps')` not `fetch('/api/apps')`.
- Do not add `UsePathBase()` in .NET.

## API Contract

- Route shapes are frozen. Error responses: `{ "detail": "message" }`.
- `PUT /api/files/{app}` auto-versions before overwriting.
- `apps.yaml` stored verbatim — no re-serialization.

## .NET Conventions

- `record struct` for value types; `record` for API DTOs.
- `ILogger<T>` structured logging. No LINQ allocs in hot paths.
- Validate at controller boundary; sanitize file paths against traversal.
- KISS — three similar lines is fine; abstract only at 3+ genuine reuses.

## Tests

- Use `EnvScope` (in `src/AppDaemonStudio.Tests/Helpers/`) for env var isolation.
- Integration tests use `TestWebAppFactory`. No `Task.Delay` — use deterministic fixtures.
- Run: `dotnet test src/AppDaemonStudio.slnx`
