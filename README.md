# AppDaemon Studio

[![GitHub Release][releases-shield]][releases]
![Project Stage][project-stage-shield]
[![License][license-shield]](LICENSE.md)

![Supports aarch64 Architecture][aarch64-shield]
![Supports amd64 Architecture][amd64-shield]

[![Github Actions][github-actions-shield]][github-actions]
[![Tests][tests-shield]][github-actions]
[![Coverage][coverage-shield]][coverage]
![Project Maintenance][maintenance-shield]
[![GitHub Activity][commits-shield]][commits]

A web-based IDE for writing and managing [AppDaemon](https://appdaemon.readthedocs.io/) apps, built as a Home Assistant add-on. Runs entirely inside Home Assistant — no external services, no configuration required.

![AppDaemon Studio](docs/screenshots/02-python-editor.png)

## Features

- **Monaco Editor** — The same editor as VS Code, with Python and YAML syntax highlighting, bracket matching, and multi-cursor editing
- **Python Language Server** — Full LSP support powered by pylsp: inline error highlighting (pyflakes + pycodestyle), hover docs, go-to-definition, and AppDaemon method completions via `self.`
- **Entity Autocomplete** — Type a quote inside any AppDaemon call to get live entity ID suggestions from your Home Assistant instance
- **Version Control** — Every save snapshots the previous file. Compare any two versions side-by-side in a diff view and restore with one click
- **App Controls** — Restart, start, stop, enable, and disable individual apps directly from the sidebar (requires AppDaemon HTTP API)
- **Log Viewer** — Live AppDaemon logs with INFO / WARNING / ERROR filtering and per-app search
- **Template Evaluator** — Test Jinja2 templates against your live Home Assistant instance from the Template tab
- **Multiple Themes** — VS Light, VS Dark, One Dark Pro, Dracula, GitHub Dark, Nord, Monokai, and more
- **Font Options** — Fira Code, JetBrains Mono, Cascadia Code (all with ligature support)

## Installation

1. In Home Assistant, go to **Settings → Add-ons → Add-on Store**
2. Search for **AppDaemon Studio** and install it
3. Start the add-on
4. Click **Open Web UI** — or find it in your sidebar

No configuration needed. The add-on automatically connects to your Home Assistant instance and detects your AppDaemon apps in `/config/apps/`.

## Requirements

- Home Assistant with Supervisor (OS or Container installs)
- [AppDaemon add-on](https://github.com/hassio-addons/addon-appdaemon) installed and running

## Usage

### Editing apps

Select an app from the sidebar to open it in the editor. Switch between the **Python** and **YAML** tabs to edit the code or the `apps.yaml` config. Press **Save** (or `Ctrl+S`) to save.

![Python editor](docs/screenshots/02-python-editor.png)

### Creating a new app

Click the **+** button in the sidebar. Give it a name (lowercase, underscores only), a class name, an icon, and an optional description. A boilerplate Python file and a `apps.yaml` entry are created automatically.

![Create app](docs/screenshots/04-create-app-dialog.png)

### App controls

Hover over any app in the sidebar to reveal its controls:

- **Enable / Disable** — toggle the app on or off in `apps.yaml` without deleting it
- **Restart** — hot-restart the app via the AppDaemon HTTP API (visible when the API is configured)
- **Delete** — remove the app and its files permanently

### Entity autocomplete

While editing Python, type any quote character to trigger entity ID suggestions pulled live from your Home Assistant instance. Works for `entity_id`, `listen_state`, `turn_on`, etc.

### Python language server

The editor connects to a bundled pylsp instance that has the full AppDaemon source installed. You get:

- Method completions when you type `self.` — all AppDaemon `hass.Hass` methods
- Hover documentation for any AppDaemon method
- Go-to-definition (`F12`)
- Inline pyflakes errors and pycodestyle warnings

### Version history and diff

Every time you save a Python file, the previous version is automatically snapshotted. Click **Compare** to open the diff viewer and select any saved version to see a side-by-side diff against the current file.

![Version Compare](docs/screenshots/07-version-diff.png)

### Log viewer

Click the **Logs** tab to see live AppDaemon output. Filter by level (INFO / WARNING / ERROR) or search by app name.

### Template evaluator

Click the **Template** tab to open a Jinja2 template sandbox. Write any template and evaluate it against your live Home Assistant instance — useful for debugging automations and testing expressions before using them in AppDaemon apps.

### Settings

Customize the editor theme, font family, font size, and ligatures. Switch between light and dark UI themes.

![Settings](docs/screenshots/05-settings-dialog.png)

## Support

Found a bug or have a feature request? [Open an issue](https://github.com/0x414c49/AppDaemon-Studio/issues)

## License

MIT

[releases-shield]: https://img.shields.io/github/release/0x414c49/AppDaemon-Studio.svg?style=for-the-badge
[releases]: https://github.com/0x414c49/AppDaemon-Studio/releases
[project-stage-shield]: https://img.shields.io/badge/project%20stage-production%20ready-brightgreen?style=for-the-badge
[license-shield]: https://img.shields.io/github/license/0x414c49/AppDaemon-Studio.svg?style=for-the-badge
[aarch64-shield]: https://img.shields.io/badge/aarch64-yes-green?style=for-the-badge
[amd64-shield]: https://img.shields.io/badge/amd64-yes-green?style=for-the-badge
[github-actions-shield]: https://img.shields.io/github/actions/workflow/status/0x414c49/AppDaemon-Studio/build.yml?style=for-the-badge
[github-actions]: https://github.com/0x414c49/AppDaemon-Studio/actions
[tests-shield]: https://img.shields.io/github/actions/workflow/status/0x414c49/AppDaemon-Studio/build.yml?style=for-the-badge&label=tests&job=Test
[coverage-shield]: https://codecov.io/gh/0x414c49/AppDaemon-Studio/branch/main/graph/badge.svg?style=for-the-badge
[coverage]: https://codecov.io/gh/0x414c49/AppDaemon-Studio
[maintenance-shield]: https://img.shields.io/maintenance/yes/2026?style=for-the-badge
[commits-shield]: https://img.shields.io/github/commit-activity/y/0x414c49/AppDaemon-Studio.svg?style=for-the-badge
[commits]: https://github.com/0x414c49/AppDaemon-Studio/commits/main
