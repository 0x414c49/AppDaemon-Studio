# Changelog

## [v0.3.68] - 2026-03-27

- fix: remove custom Python completion provider; keep only HA-specific completions


## [v0.3.67] - 2026-03-27

- fix: detect stray lines in YAML validator and prevent tab reset on save


## [v0.3.66] - 2026-03-27

- fix: set vite dev server port to 3000 for CI and Playwright
- ci: add coverage reporting and test/coverage badges to README
- ci: add test job gating release — backend xUnit and frontend Playwright
- docs: update screenshots
- test: add 35 tests for yaml-as-truth, validation, and log parsing
- feat: yaml as source of truth with smart save and inline validation
- fix: log viewer filters to active app by default
- fix: persist template tab content across navigation and page reloads
- docs: use editor screenshot as hero image
- docs: remove standalone mode section


## [v0.3.65] - 2026-03-23

- fix: correct create app dialog screenshot — use exact button title selector


## [v0.3.64] - 2026-03-23

- docs: refresh screenshots, update README with full feature set


## [v0.3.63] - 2026-03-23

- chore: add cosign signing, build attestation, and drop unused auth_api


## [v0.3.62] - 2026-03-23

- chore: add AGENTS.md as agent source of truth; add Copilot and Cursor config
- chore: remove ARCHITECTURE.md


## [v0.3.61] - 2026-03-23

- chore: restructure repository into src/ layout
- test: isolate env vars with EnvScope helper
- fix: handle CRLF line endings in log parser


## [v0.3.60] - 2026-03-22

- fix: default apps_folder to /config/apps; update setup guide in all 21 translations; re-enable arm64 builds


## [v0.3.59] - 2026-03-22

- fix: use [extname] (not [ext]) in assetFileNames — restores dot in .css extension


## [v0.3.58] - 2026-03-22

- fix: add Cache-Control no-store meta tag to index.html


## [v0.3.57] - 2026-03-22

- feat: add translations for 21 languages
- fix: apps_folder default /homeassistant/apps; add option descriptions


## [v0.3.56] - 2026-03-22

- fix: cache-bust on deploy — no-store for index.html, immutable for hashed assets


## [v0.3.55] - 2026-03-22

- fix: apps_folder is the apps dir itself; tabs survive load errors; push builds amd64-only


## [v0.3.54] - 2026-03-22

- fix: ingress guard — use X-Remote-User-Id, not the non-existent X-Ingress-Path


## [v0.3.53] - 2026-03-22

- fix: remove X-Hass-Is-Admin check from ingress guard


## [v0.3.52] - 2026-03-22

- ci: add workflow_dispatch with skip_arm input for faster builds
- fix: ingress guard — loopback bypass for healthcheck, accept X-Hass-Is-Admin: 1


## [v0.3.51] - 2026-03-22

- feat: addon config options — apps_folder and api_password
- feat: ingress security — restrict API to HA admin users
- feat: HA template tester tab
- feat: live log streaming via SSE
- feat: per-app enable/disable toggle and app restart via AppDaemon HTTP API


## [v0.3.50] - 2026-03-21

- fix: add hassapi shorthand import and repair isStartingKeyword regex


## [v0.3.49] - 2026-03-21

- fix: stop completions firing on every space keystroke


## [v0.3.48] - 2026-03-21

- perf: cache resolved addon slug for package sync — discover once, reuse on restart
- fix: auto-discover AppDaemon addon slug in LspService for package sync
- feat: expose package sync status and pip output via health endpoint


## [v0.3.47] - 2026-03-21

- security: remove information disclosure from health endpoint
- perf: build frontend once in CI, inject into both Docker matrix jobs
- refactor: replace anonymous controller return types with named records
- perf: server-side memory and CPU improvements
- feat: prioritise Entity Control methods (turn_on, turn_off, toggle) in self. autocomplete
- fix: LSP stability — zero-alloc proxy, diagnostics badge, pyflakes, pip deadlock
- chore: ignore local dev scripts and env file
- feat: autocomplete overhaul + pylsp LSP integration


## [v0.3.46] - 2026-03-20

- feat: complete AppDaemon autocomplete — full API, context-aware entities, call_service completions, boilerplate snippets


## [v0.3.45] - 2026-03-20

- test: add e2e tests for autocomplete (self., self.turn, entity IDs)


## [v0.3.44] - 2026-03-20

- fix: autocomplete disappears after typing past self. dot


## [v0.3.43] - 2026-03-20

- fix: rename screenshots to bust GitHub CDN cache


## [v0.3.42] - 2026-03-20

- chore: update docs screenshots and README
- fix: apply HA design tokens across all UI components
- fix: migrate UI to Home Assistant design tokens (dark + light themes)


## [v0.3.41] - 2026-03-20

- fix: run container as root so it can write to /config


## [v0.3.40] - 2026-03-20

- chore: add addon icon.png to repo root for HA addon store


## [v0.3.39] - 2026-03-20

- fix: update image name and description in config.json


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


