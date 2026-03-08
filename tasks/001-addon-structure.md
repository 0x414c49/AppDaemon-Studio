# Task 001: Add-on Structure and Configuration

## Objective

Create the base Home Assistant add-on structure with Ingress support.

## Requirements

### Files to Create

1. **config.json** - Add-on metadata and configuration schema
2. **Dockerfile** - Multi-stage build (Python + Node.js)
3. **run.sh** - Startup script
4. **requirements.txt** - Python dependencies
5. **nginx.conf** - Reverse proxy configuration
6. **app/templates/empty.py.j2** - Empty app template

### Specifications

#### config.json
- Ingress enabled (port 5000)
- Map addon_configs directory (rw)
- Panel icon: mdi:code-braces
- Panel title: "AppDaemon Studio"
- Slug: appdaemon-studio

#### Dockerfile
- Python 3.11 Alpine base
- Install Node.js and npm
- Multi-stage build for UI
- Copy all app code
- Expose port 5000
- HEALTHCHECK instruction

#### run.sh
- Start nginx
- Start FastAPI backend (uvicorn)
- Handle signals gracefully (SIGTERM)

#### requirements.txt
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
websockets==12.0
aiofiles==23.2.1
jinja2==3.1.3
pydantic==2.5.3
pydantic-settings==2.1.0
watchdog==3.0.0
pyyaml==6.0.1
pytest==8.0.0
pytest-asyncio==0.23.0
httpx==0.26.0
```

#### nginx.conf
```nginx
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 5000;
        
        location / {
            root /app/ui/dist;
            try_files $uri $uri/ /index.html;
        }
        
        location /api/ {
            proxy_pass http://localhost:8000/api/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }
        
        location /ws/ {
            proxy_pass http://localhost:8000/ws/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

#### empty.py.j2
```python
import appdaemon.plugins.hass.hassapi as hass


class {{ class_name }}(hass.Hass):
    """
    {{ description }}
    """

    def initialize(self):
        """Initialize the app."""
        self.log(f"Initializing {{ class_name }}")
        
    def terminate(self):
        """Clean up when app is terminated."""
        self.log(f"Terminating {{ class_name }}")
```

## Acceptance Criteria

- [ ] config.json valid for HA add-on
- [ ] Dockerfile builds successfully
- [ ] All dependencies install without errors
- [ ] Nginx serves UI and proxies API correctly
- [ ] Container starts without errors
- [ ] Accessible via Home Assistant Ingress
- [ ] Can access /addon_configs directory
- [ ] Health check endpoint works

## Notes

- Keep image size small (< 200MB)
- Pin all dependency versions
- Use non-root user if possible (adduser -S appuser)
- AppDaemon config is in /addon_configs/*_appdaemon
- Empty template only (no complex templates needed now)

## Time Estimate

2-3 hours
