# Project Overview

## AppDaemon Studio

A Home Assistant add-on that provides a complete IDE for creating, editing, and managing AppDaemon apps with AI-powered assistance.

## Features

- **Visual App Management**: Browse, create, edit, and organize AppDaemon apps
- **Smart Code Editor**: Monaco Editor with Python syntax highlighting and AppDaemon autocomplete
- **Real-time Logs**: Live log streaming via WebSocket
- **AI Assistance**: Integrated AI support for Ollama, Opencode Zen, Claude, and OpenAI
- **App Templates**: Quick-start templates for common automation patterns
- **Configuration Editor**: YAML configuration management
- **One-click Install**: Works as Home Assistant add-on with Ingress support

## Target Users

- Home Assistant power users
- AppDaemon developers
- Automation enthusiasts
- People who want AI-assisted coding for Home Assistant

## Use Cases

1. **Creating New Apps**: Use wizard to generate boilerplate code
2. **Editing Existing Apps**: Modify Python code with full IDE features
3. **Debugging**: Watch logs in real-time as apps run
4. **AI Pair Programming**: Get help writing and improving automations
5. **Learning**: Understand AppDaemon patterns with AI explanations

## Quick Start

```bash
# Add to Home Assistant
1. Add repository to Add-on Store
2. Install "AppDaemon Studio"
3. Start the add-on
4. Access from sidebar

# Create your first app
1. Click "➕ New App"
2. Choose "Motion Sensor" template
3. Configure entities
4. Save and reload
```

## Architecture Highlights

- **Frontend**: React + TypeScript + Vite + Tailwind + Monaco
- **Backend**: FastAPI + WebSocket + Jinja2
- **AI**: Proxy pattern (keys stored server-side)
- **Integration**: Home Assistant Ingress (auto-auth)
- **Container**: Docker with Alpine Linux

## Documentation

- `docs/architecture.md` - System design
- `docs/api-reference.md` - API endpoints
- `docs/ui-design.md` - Interface design
- `docs/deployment.md` - Build and deploy

## Contributing

See individual task files in `tasks/` directory.
