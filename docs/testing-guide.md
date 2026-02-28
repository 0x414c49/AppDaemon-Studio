# Testing AppDaemon Studio in Home Assistant

## Method 1: Local Build (Recommended for Development)

### Step 1: Build the Docker Image Locally

```bash
cd /path/to/appdaemon-studio

# Build the Docker image
docker build -t appdaemon-studio:test .

# Check if it built successfully
docker images | grep appdaemon-studio
```

### Step 2: Test with Local Home Assistant (if you have HA Container)

If you're running Home Assistant Container (not HA OS):

```bash
# Create a test directory structure
mkdir -p /tmp/test_ha/addons/appdaemon-studio
mkdir -p /tmp/test_ha/addon_configs/a0d7b954_appdaemon/apps

# Copy add-on files
cp -r config.json Dockerfile run.sh nginx.conf app ui /tmp/test_ha/addons/appdaemon-studio/

# Run the container manually to test
docker run -d \
  --name appdaemon-studio-test \
  -p 5000:5000 \
  -v /tmp/test_ha/addon_configs/a0d7b954_appdaemon:/addon_configs/a0d7b954_appdaemon \
  appdaemon-studio:test

# Check logs
docker logs appdaemon-studio-test
```

### Step 3: Access the UI

Open browser: `http://localhost:5000`

You should see the AppDaemon Studio interface.

---

## Method 2: Install in Home Assistant OS/Supervised

### Step 1: Prepare Your HA Instance

You need access to the `/addons` directory. There are several ways:

#### Option A: Samba Share (Easiest)

1. Install "Samba share" add-on in HA
2. Share your configuration
3. Navigate to the addons folder via network share
4. Create a new folder: `appdaemon-studio`

#### Option B: SSH Access

1. Install "SSH & Web Terminal" add-on
2. Enable protected mode off temporarily (for testing)
3. SSH into HA: `ssh root@your-ha-ip`
4. Navigate to: `/addons`

#### Option C: File Editor

1. Install "File editor" or "Studio Code Server" add-on
2. Enable access to the `/addons` directory in the add-on configuration

### Step 2: Copy Add-on Files

Create this structure in your HA `/addons` folder:

```
/addons/appdaemon-studio/
├── config.json
├── Dockerfile
├── run.sh
├── nginx.conf
├── requirements.txt
├── app/
│   ├── main.py
│   ├── config.py
│   ├── api/
│   ├── services/
│   └── templates/
└── ui/
    └── dist/  (built frontend)
```

### Step 3: Build Frontend

Before copying, you need to build the frontend:

```bash
cd appdaemon-studio/ui
npm install
npm run build
```

This creates the `ui/dist` folder with compiled assets.

### Step 4: Copy to HA

Copy everything **except**:
- `node_modules/`
- `venv/`
- `.git/`
- `app/tests/` (optional, not needed for runtime)

### Step 5: Install in HA

1. Go to **Settings** → **Add-ons** → **Add-on Store**
2. Click **⋮** (menu) → **Check for updates**
3. You should see "AppDaemon Studio" under "Local add-ons"
4. Click **Install**
5. Wait for build (this takes a few minutes)
6. Click **Start**
7. Check logs for errors

### Step 6: Access via Ingress

1. The add-on should appear in your HA sidebar
2. Click "AppDaemon Studio"
3. You should see the editor interface

---

## Method 3: Repository Installation (Production)

For users to install from your GitLab repository:

### Create a Repository File

Create `repository.json` in the root:

```json
{
  "name": "AppDaemon Studio Repository",
  "url": "https://gitlab.com/0x414c49/appdaemon-studio",
  "maintainer": "Your Name"
}
```

### Users Add Repository

1. In HA: **Settings** → **Add-ons** → **Add-on Store**
2. Click **⋮** → **Repositories**
3. Add: `https://gitlab.com/0x414c49/appdaemon-studio`
4. Click **Add**
5. Find and install "AppDaemon Studio"

---

## Testing Checklist

### Basic Functionality

- [ ] Add-on starts without errors
- [ ] UI loads in browser/sidebar
- [ ] Can create new app
- [ ] Can edit Python file
- [ ] Can save file (auto-backup created)
- [ ] Can view version history
- [ ] Can restore previous version
- [ ] Can delete app

### AppDaemon Integration

- [ ] Created apps appear in AppDaemon
- [ ] Apps execute correctly
- [ ] Logs appear in log viewer
- [ ] WebSocket streams logs in real-time

### Edge Cases

- [ ] Invalid app names rejected
- [ ] Path traversal blocked
- [ ] Large files handled
- [ ] Special characters in filenames
- [ ] Concurrent edits

---

## Troubleshooting

### Add-on Won't Start

```bash
# Check logs in HA
# Settings → Add-ons → AppDaemon Studio → Log

# Common issues:
# 1. Missing ui/dist folder - build frontend first
# 2. Wrong file permissions - should be 644 for config files
# 3. Missing execute permission on run.sh - chmod +x run.sh
```

### UI Not Loading

```bash
# Test backend directly
curl http://localhost:5000/api/apps

# Should return JSON with apps list
# If empty: [] that's OK
```

### Can't Access Files

Check the mapped volume in `config.json`:
```json
"map": ["addon_configs:rw"]
```

Verify AppDaemon is installed and has config in `/addon_configs/`.

---

## Development Workflow

### Quick Iteration

```bash
# 1. Make code changes
# 2. Build frontend (if UI changed)
cd ui && npm run build

# 3. Copy to HA (if using Samba/SSH)
# 4. In HA: Rebuild add-on
# 5. Test changes
```

### Using VS Code Server Add-on

If you have VS Code Server installed in HA:

1. Open VS Code in HA
2. Open folder: `/addons/appdaemon-studio`
3. Edit files directly
4. Rebuild add-on from HA UI

---

## GitLab CI/CD for Testing

The pipeline should:
1. Run tests
2. Build Docker image
3. Push to registry

Then you can use the pre-built image in HA:

```json
{
  "image": "registry.gitlab.com/0x414c49/appdaemon-studio:latest"
}
```

Instead of building locally.
