# AppDaemon Studio

A Home Assistant add-on providing a complete IDE for creating, editing, and managing AppDaemon apps with a modern web interface.

![Version](https://img.shields.io/badge/version-0.2.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Visual App Management**: Browse, create, edit, and organize AppDaemon apps with an intuitive sidebar
- **Smart Code Editor**: Monaco Editor with Python and YAML syntax highlighting
- **File Version Control**: Automatic backups every time you save, with version history
- **Dual File Support**: Edit both Python (`.py`) and YAML (`.yaml`) configuration files
- **One-click Install**: Works as Home Assistant add-on with Ingress support

## Screenshots

### Main IDE Interface
![Main Interface](docs/screenshots/01-main-interface.png)
*Full IDE with sidebar and Monaco editor*

### App List Sidebar
![Sidebar](docs/screenshots/02-sidebar.png)
*Browse and manage your AppDaemon apps*

### Python Code Editor
![Python Editor](docs/screenshots/03-editor-python.png)
*Full-featured Python editing with syntax highlighting*

### YAML Configuration Editor
![YAML Editor](docs/screenshots/04-editor-yaml.png)
*Edit app configurations in YAML format*

## Quick Start

### Installation

1. Add the repository to your Home Assistant Add-on Store
2. Install "AppDaemon Studio"
3. Start the add-on
4. Access from the sidebar

### Creating Your First App

1. Click "➕ Create App" in the sidebar
2. Enter app name (e.g., `motion_light`)
3. Enter class name (e.g., `MotionLight`)
4. Add a description (optional)
5. Click "Create" - your app is ready to edit!

### Editing Apps

1. Select an app from the sidebar
2. Switch between **Python** and **YAML** tabs
3. Edit your code with full Monaco Editor support:
   - Syntax highlighting
   - Auto-indentation
   - Line numbers
   - Dark theme
4. Click "Save" when done - automatic version backup created!

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## Docker

```bash
# Build image
docker build -t appdaemon-studio .

# Run container
docker run -d -p 3000:3000 -v /path/to/config:/config appdaemon-studio
```

## Documentation

- `docs/architecture.md` - System design
- `docs/api-reference.md` - API endpoints
- `docs/deployment.md` - Build and deploy
- `lessons/` - Development lessons learned

## Contributing

See task files in `tasks/` directory for development roadmap and specifications.

## License

MIT License - see LICENSE file for details

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.
