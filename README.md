# AppDaemon Studio

A proper IDE for writing AppDaemon apps in Home Assistant. Built with Next.js and Monaco Editor (the same editor as VS Code).

## Features

- **Monaco Editor** - Full syntax highlighting for Python and YAML
- **Version Control** - Automatic backups every time you save
- **Entity Autocomplete** - Auto-suggests Home Assistant entities as you type
- **AppDaemon API Autocomplete** - Intelligent code completion for AppDaemon methods
- **Direct Integration** - Access from Home Assistant sidebar via Ingress
- **Clean Interface** - All your apps organized in one place

## Installation

1. Add the repository to your Home Assistant Add-on Store
2. Install "AppDaemon Studio"
3. Start the add-on
4. Access from your Home Assistant sidebar

No configuration required.

## Requirements

- Home Assistant
- AppDaemon add-on installed

## Usage

**Create a new app:**
- Click the "+" button in the sidebar
- Enter app name and class name
- Start coding

**Edit an app:**
- Click any app in the sidebar
- Switch between Python and YAML tabs
- Save changes (version backed up automatically)

**Compare versions:**
- Click "Compare" button to see previous versions
- Restore or compare code changes

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Support

Found a bug or have a feature request? [Open an issue](https://github.com/0x414c49/AppDaemon-Studio/issues)

## License

MIT
