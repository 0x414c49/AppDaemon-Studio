# Deployment Guide

## Building the Add-on

### Local Development

```bash
# Clone repository
git clone <repo>
cd appdaemon-studio

# Build Docker image
docker build -t appdaemon-studio .

# Run locally
docker run -p 5000:5000 \
  -v $(pwd)/test_config:/config \
  appdaemon-studio
```

### Directory Structure for HA

```
appdaemon-studio/
├── config.json      # Required
├── Dockerfile       # Required
├── run.sh           # Required
├── app/             # Backend code
└── ui/dist/         # Built frontend (generated)
```

## Installation Methods

### Method 1: Git Repository (Recommended)

1. Add to Home Assistant Add-on Store:
   ```
   Supervisor → Add-on Store → ⋮ → Repositories
   Add: https://github.com/your-username/appdaemon-studio
   ```

2. Install:
   ```
   Find "AppDaemon Studio" → Install
   ```

3. Configure (optional):
   ```yaml
   ai_provider: ollama
   ollama_host: localhost
   ollama_port: 11434
   ```

4. Start and access from sidebar

### Method 2: Local Build

1. Copy to `/addons/appdaemon-studio/`
2. Refresh Add-on Store
3. Install from "Local add-ons"

### Method 3: HACS (Future)

Will be available as HACS integration when published.

## Configuration Options

### config.json Options

```json
{
  "appdaemon_path": "/config/appdaemon",
  "ai_provider": "ollama",
  
  // Ollama
  "ollama_host": "localhost",
  "ollama_port": 11434,
  "ollama_model": "codellama",
  
  // Opencode Zen
  "opencode_api_key": "",
  "opencode_tier": "free",
  
  // Claude
  "claude_api_key": "",
  "claude_model": "claude-3-sonnet-20240229",
  
  // OpenAI
  "openai_api_key": "",
  "openai_model": "gpt-4"
}
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `APPDAEMON_PATH` | Path to appdaemon directory |
| `AI_PROVIDER` | Default AI provider |
| `LOG_LEVEL` | Logging level (debug/info/warning/error) |

## Volume Mappings

```yaml
map:
  - config:rw  # Required for appdaemon files
```

Maps:
- `/config/appdaemon/apps` - App files
- `/config/home-assistant.log` - Logs

## Networking

### Ingress (Default)
- No ports exposed
- Access via Home Assistant sidebar
- Automatic SSL

### Direct Access (Advanced)
```json
{
  "host_network": false,
  "ports": {
    "5000/tcp": 5000
  }
}
```

## Updates

### Automatic Updates
- Check "Watchdog" in add-on settings
- Or enable auto-update in HA

### Manual Update
1. Backup first
2. Uninstall add-on
3. Refresh repository
4. Reinstall

## Troubleshooting

### Common Issues

**1. Add-on won't start**
```bash
# Check logs
ha addons logs appdaemon-studio
```

**2. Can't access UI**
- Check Ingress is enabled
- Verify HA is accessible
- Check browser console for errors

**3. AI not working**
- Verify AI provider configuration
- Test API keys
- Check provider status

**4. File changes not saving**
- Verify write permissions
- Check disk space
- Review file path configuration

### Debug Mode

```json
{
  "options": {
    "log_level": "debug"
  }
}
```

## Backups

### What to Backup
- `/config/appdaemon/apps/*.py`
- `/config/appdaemon/apps/*.yaml`
- Add-on configuration

### Automated Backup
```yaml
# In configuration.yaml
backup:
  include:
    - appdaemon/apps
```

## Security

### Best Practices
1. Use Ingress (no exposed ports)
2. Keep AI API keys secure (stored server-side)
3. Regular updates
4. Backup before updates
5. Monitor logs for unauthorized access

### SSL/TLS
Handled automatically by Home Assistant Ingress.

## Performance

### Resource Usage
- CPU: Low (spikes during AI requests)
- Memory: ~100-200MB
- Disk: ~50MB + apps

### Optimization
- Limit concurrent WebSocket connections
- Use Ollama locally to reduce latency
- Enable editor minimap only if needed

## CI/CD Pipeline

See `.gitlab-ci.yml` for automated builds and deployments.

Pipeline stages:
1. Build frontend
2. Build backend
3. Build Docker image
4. Push to registry
5. Create release

## Support

- GitHub Issues: Bug reports
- Discussions: Feature requests
- Wiki: Documentation
