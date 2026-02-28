# Lesson 001: Project Setup and Home Assistant Add-on Structure

## What I Learned

### Home Assistant Add-on Basics

An add-on is a Docker container with specific configuration:

1. **config.json** defines metadata and options
2. **Dockerfile** builds the container
3. **run.sh** starts the services
4. Must expose port 5000 for Ingress
5. Use `map` to access Home Assistant files

### Key Configuration Options

```json
{
  "ingress": true,        // Access via HA sidebar
  "ingress_port": 5000,   // Internal port
  "homeassistant_api": true,  // Access HA API
  "map": ["config:rw"]    // Mount HA config directory
}
```

### File Permissions

- Add-on runs as root by default
- Mapped volumes respect HA permissions
- App files need 644 permissions

### Development Workflow

1. Make changes locally
2. Build Docker image
3. Copy to HA `/addons/`
4. Install/Update in HA UI
5. Check logs for errors

## Common Pitfalls

- **Ingress base path**: All routes must work under `/hassio/ingress/slug/`
- **Static files**: Must be built and copied in Dockerfile
- **Dependencies**: Pin versions in requirements.txt
- **Logging**: Use HA's logging format

## Resources

- https://developers.home-assistant.io/docs/add-ons
- https://developers.home-assistant.io/docs/add-ons/tutorial
