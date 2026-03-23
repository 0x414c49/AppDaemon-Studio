# AppDaemon Studio — Claude Instructions

Read `AGENTS.md` first — it is the source of truth for project layout, invariants, conventions, and test patterns.
The sections below are Claude Code-specific additions only.

## Hard Rules (Claude-specific)

- **Never add `Co-Authored-By:` trailers** attributing yourself to commits, in any form.
- Never force-push to `main`.
- Never skip hooks (`--no-verify`).

## Behaviour

- Go straight to the point. Lead with the action, not the reasoning.
- Do not summarise what you just did at the end of a response.
- Do not add docstrings, comments, or type annotations to code you did not change.
- Do not over-engineer: no helpers for one-off operations, no abstractions for hypothetical reuse.
- Only add error handling at real system boundaries (user input, external APIs) — not for impossible internal cases.

## Stack Reminder

- **Frontend:** React 19 + Vite — `src/ui/`
- **Backend:** ASP.NET Core .NET 10 — `src/AppDaemonStudio/`
- **Tests:** xUnit (`src/AppDaemonStudio.Tests/`) — use `EnvScope` for env var isolation
- **Runtime:** `mcr.microsoft.com/dotnet/aspnet:10.0-alpine` — do not downgrade
