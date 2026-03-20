# Changelog

## [v0.3.38] - 2026-03-20

- chore: use appdaemon-studio-addon as GHCR image name


## [v0.3.37] - 2026-03-20

- Remove comment for version bump job in build.yml


## [v0.3.36] - 2026-03-20

- fix: remove invalid paths-ignore negation that prevented workflow from triggering
- Fix image formatting in README
- docs: README, architecture guide, changelog, screenshots
- test: Playwright E2E tests
- feat: Dockerfile and CI pipeline
- feat: ASP.NET Core backend (.NET 10)
- feat: React frontend (Vite + Monaco Editor)
- chore: HA addon manifest
- chore: init project scaffold


## [v0.3.35] - 2026-03-20

- chore: release v0.3.34
- feat: migrate from Next.js to React (Vite) + ASP.NET Core
- chore: release v0.3.33
- chore: update package.json version in CI pipeline alongside config.json
- chore: release v0.3.32
- fix: handle multi-line commit messages in workflow [skip-arm]
- fix: remove incorrect Content-Type header from AppDaemon logs API GET requests


## [v0.3.34] - 2026-03-20

- feat: migrate from Next.js to React (Vite) + ASP.NET Core
- chore: release v0.3.33
- chore: update package.json version in CI pipeline alongside config.json
- chore: release v0.3.32
- fix: handle multi-line commit messages in workflow [skip-arm]
- fix: remove incorrect Content-Type header from AppDaemon logs API GET requests
- chore: release v0.3.31
- fix: update Docker image name handling to use lowercase format
- chore: release v0.3.30
- fix: simplify Docker build strategy to avoid push-by-digest conflict
- chore: release v0.3.29
- chore: remove quality gate from CI pipeline
- chore: release v0.3.28
- perf: optimize CI/CD pipeline and Docker build
- fix: correct version display and improve addon discovery
- chore: release v0.3.27
- chore: clean up startup logs and improve error diagnostics
- chore: release v0.3.26
- fix: rename /api/logs to /api/appdaemon-logs to avoid HA ingress conflict
- chore: release v0.3.25
- chore: add .local.env to gitignore
- chore: release v0.3.24
- fix: use relative path for logs API to work through HA ingress
- chore: release v0.3.23
- fix: change hassio_role to manager and add appdaemon_addon_slug option
- chore: release v0.3.22
- chore: release v0.3.21
- docs: add screenshots and badges to README
- chore: release v0.3.20
- fix: reverse logs to show latest first, remove logo from README
- chore: release v0.3.19
- fix: auto-detect AppDaemon slug by probing common slugs
- chore: release v0.3.18


## [v0.3.33] - 2026-03-19

- chore: update package.json version in CI pipeline alongside config.json


## [v0.3.32] - 2026-03-19

- fix: handle multi-line commit messages in workflow [skip-arm]
- fix: remove incorrect Content-Type header from AppDaemon logs API GET requests


## [v0.3.31] - 2026-03-19

- fix: update Docker image name handling to use lowercase format


## [v0.3.30] - 2026-03-19

- fix: simplify Docker build strategy to avoid push-by-digest conflict


## [v0.3.29] - 2026-03-19

- chore: remove quality gate from CI pipeline


## [v0.3.28] - 2026-03-19

- perf: optimize CI/CD pipeline and Docker build
- fix: correct version display and improve addon discovery


## [v0.3.27] - 2026-03-19

- chore: clean up startup logs and improve error diagnostics


## [v0.3.26] - 2026-03-19

- fix: rename /api/logs to /api/appdaemon-logs to avoid HA ingress conflict


## [v0.3.25] - 2026-03-19

- chore: add .local.env to gitignore


## [v0.3.24] - 2026-03-19

- fix: use relative path for logs API to work through HA ingress


## [v0.3.23] - 2026-03-19

- fix: change hassio_role to manager and add appdaemon_addon_slug option


## [v0.3.22] - 2026-03-19

- docs: update screenshots and README


## [v0.3.21] - 2026-03-19

- docs: add screenshots and badges to README


## [v0.3.20] - 2026-03-19

- fix: reverse logs to show latest first, remove logo from README


## [v0.3.19] - 2026-03-19

- fix: auto-detect AppDaemon slug by probing common slugs


## [v0.3.18] - 2026-03-19

- feat: add log viewer with auto-detect, branding updates, and YAML saves
- feat: add resizable sidebar with drag handle and font size setting
- fix: enforce snake_case module names with auto-conversion


## [v0.3.17] - 2026-03-08

- feat: replace native dialogs with React components and improve UX
- feat: add Ctrl/Cmd+S keyboard shortcut for saving


## [v0.3.16] - 2026-03-08

- docs: simplify documentation and remove unnecessary files


## [v0.3.15] - 2026-03-08

- chore: remove tasks from git tracking
- feat: add editor settings with themes and fonts
- docs: add lesson about CI/CD race condition


## [v0.3.14] - 2026-03-08

- fix(ci): combine version bump and changelog into single commit


