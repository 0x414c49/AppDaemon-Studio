# Self-Hosted GitLab Runner on macOS (Safe & Isolated)

This guide sets up a GitLab CI/CD runner on your Mac for building the AppDaemon Studio Docker images.

## Architecture

```
┌─────────────────────────────────────┐
│           Your Mac                  │
│  ┌─────────────────────────────┐   │
│  │   GitLab Runner (process)   │   │
│  │   - Runs as your user       │   │
│  │   - Limited resource access │   │
│  └──────────────┬──────────────┘   │
│                 │                   │
│  ┌──────────────▼──────────────┐   │
│  │    Docker Desktop/Colima    │   │
│  │    - Container isolation    │   │
│  │    - Resource limits        │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
         │
         ▼
    GitLab.com (triggers builds)
```

## Prerequisites

- macOS 12+ (Monterey or later)
- Docker Desktop or Colima installed
- GitLab account with project access
- ~10GB free disk space

## Step 1: Install Docker

### Option A: Docker Desktop (Recommended for beginners)
```bash
# Download from: https://www.docker.com/products/docker-desktop
# Or use Homebrew:
brew install --cask docker

# Start Docker Desktop
open -a Docker

# Verify
docker --version
```

### Option B: Colima (Lightweight, CLI-only)
```bash
# Install Colima and dependencies
brew install colima docker docker-compose

# Start Colima with resource limits
colima start --cpu 4 --memory 8 --disk 50

# Verify
docker --version
```

## Step 2: Install GitLab Runner

```bash
# Install via Homebrew
brew install gitlab-runner

# Verify installation
gitlab-runner --version
```

## Step 3: Create Isolated User (Recommended)

Create a dedicated user for the runner to limit permissions:

```bash
# Create runner user (requires admin password)
sudo sysadminctl -addUser gitlab-runner -fullName "GitLab Runner" -password "your-secure-password-here"

# Add to docker group for Docker access
sudo dseditgroup -o edit -a gitlab-runner -t user staff

# Switch to runner user
su - gitlab-runner
```

## Step 4: Configure Runner

### 4.1 Create Configuration Directory

```bash
# As gitlab-runner user (or your user)
mkdir -p ~/.gitlab-runner
cd ~/.gitlab-runner

# Create config directory with proper permissions
mkdir -p builds cache
chmod 700 builds cache
```

### 4.2 Create Custom config.toml

```bash
cat > ~/.gitlab-runner/config.toml << 'EOF'
concurrent = 2  # Max parallel jobs
check_interval = 0
log_level = "info"
log_format = "json"

[session_server]
  session_timeout = 1800

# Default runner configuration
[[runners]]
  name = "macos-docker-runner"
  url = "https://gitlab.com/"
  token = "YOUR_REGISTRATION_TOKEN_HERE"  # We'll fill this in Step 5
  executor = "docker"
  
  [runners.custom_build_dir]
  
  [runners.cache]
    [runners.cache.s3]
    [runners.cache.gcs]
    [runners.cache.azure]
  
  # Docker configuration
  [runners.docker]
    tls_verify = false
    image = "docker:24-dind"
    privileged = true  # Required for Docker-in-Docker
    disable_entrypoint_overwrite = false
    oom_kill_disable = false
    disable_cache = false
    volumes = [
      "/var/run/docker.sock:/var/run/docker.sock",  # Share Docker daemon
      "/Users/gitlab-runner/.gitlab-runner/cache:/cache",  # Persistent cache
      "/tmp:/tmp"  # Temp directory
    ]
    
    # Resource limits for safety
    shm_size = 536870912  # 512MB shared memory
    memory = "4g"         # 4GB max per job
    cpus = "2"            # 2 CPUs max per job
    
    # Network isolation
    network_mode = "bridge"
    
    # Security: Drop all capabilities except necessary ones
    cap_drop = ["ALL"]
    cap_add = ["CHOWN", "DAC_OVERRIDE", "SETGID", "SETUID"]
    
  # Environment variables for all jobs
  [runners.environment]
    DOCKER_DRIVER = "overlay2"
    DOCKER_TLS_CERTDIR = ""
EOF
```

## Step 5: Register Runner with GitLab

### 5.1 Get Registration Token

1. Go to your GitLab project: https://gitlab.com/0x414c49/appdaemon-studio
2. **Settings** → **CI/CD** → **Runners** → **Expand**
3. Under "Specific runners", copy the registration token

### 5.2 Register the Runner

```bash
# Register with project-specific runner
gitlab-runner register \
  --non-interactive \
  --url "https://gitlab.com/" \
  --registration-token "YOUR_TOKEN_HERE" \
  --executor "docker" \
  --docker-image "docker:24-dind" \
  --docker-privileged \
  --docker-volumes "/var/run/docker.sock:/var/run/docker.sock" \
  --docker-volumes "/Users/gitlab-runner/.gitlab-runner/cache:/cache" \
  --name "macos-appdaemon-builder" \
  --tag-list "docker,macos,aarch64" \
  --run-untagged="false" \
  --locked="false" \
  --access-level="not_protected"
```

### 5.3 Update config.toml with Token

After registration, the token is automatically added to `config.toml`. Verify:

```bash
grep token ~/.gitlab-runner/config.toml
```

## Step 6: Start the Runner

### Option A: Run Manually (Testing)

```bash
# Start in foreground (good for testing)
gitlab-runner run --config ~/.gitlab-runner/config.toml

# Or start in background
gitlab-runner start
```

### Option B: Run as Service (Production)

```bash
# Install as LaunchAgent (runs when user logs in)
gitlab-runner install \
  --working-directory ~/.gitlab-runner \
  --config ~/.gitlab-runner/config.toml \
  --service gitlab-runner \
  --user $(whoami)

# Start the service
gitlab-runner start

# Check status
gitlab-runner status
```

To auto-start on boot:
```bash
# Copy plist to LaunchAgents
mkdir -p ~/Library/LaunchAgents
cp ~/Library/LaunchAgents/gitlab-runner.plist ~/Library/LaunchAgents/

# Load the service
launchctl load ~/Library/LaunchAgents/gitlab-runner.plist

# Verify it's running
launchctl list | grep gitlab
```

## Step 7: Verify Setup

### 7.1 Check Runner Status in GitLab

1. Go to **Project** → **Settings** → **CI/CD** → **Runners**
2. Your runner "macos-appdaemon-builder" should show as **green/online**

### 7.2 Test with a Build

Trigger a build by pushing to your repo:

```bash
git commit --allow-empty -m "Test runner"
git push origin main
```

Watch the build:
1. GitLab → **CI/CD** → **Pipelines**
2. Click on the running pipeline
3. You should see it picked up by your runner

### 7.3 Monitor Locally

```bash
# View runner logs
gitlab-runner --debug run

# Or if running as service
tail -f ~/.gitlab-runner/logs/gitlab-runner.log
```

## Security Hardening

### 1. Resource Limits (Already Configured)
- Memory: 4GB per job
- CPUs: 2 per job
- Shared memory: 512MB

### 2. Network Isolation
The runner uses Docker's default bridge network, which isolates containers from your Mac's network.

### 3. Drop Unnecessary Capabilities
Already configured in `config.toml` to drop ALL capabilities and only add required ones.

### 4. Read-Only Volumes
Add to config.toml for extra safety:
```toml
[runners.docker]
  volumes = [
    "/var/run/docker.sock:/var/run/docker.sock:ro",  # Read-only
    "/Users/gitlab-runner/.gitlab-runner/cache:/cache",
    "/tmp:/tmp:noexec"  # No execution from /tmp
  ]
```

### 5. Firewall (Optional)
```bash
# Block incoming connections to runner (outbound only)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/gitlab-runner
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --block /usr/local/bin/gitlab-runner
```

## Maintenance

### Clear Cache
```bash
# Stop runner
gitlab-runner stop

# Clear cache
rm -rf ~/.gitlab-runner/cache/*

# Restart
gitlab-runner start
```

### Update Runner
```bash
brew update
brew upgrade gitlab-runner

# Restart service
gitlab-runner restart
```

### View Logs
```bash
# Real-time logs
tail -f ~/.gitlab-runner/logs/gitlab-runner.log

# System logs (if using service)
log show --predicate 'process == "gitlab-runner"' --last 1h
```

## Troubleshooting

### Issue: "Cannot connect to Docker daemon"
```bash
# Ensure Docker is running
docker ps

# Check permissions
ls -la /var/run/docker.sock

# Add user to docker group (if using Colima)
sudo usermod -aG docker $(whoami)
```

### Issue: Runner shows as offline
```bash
# Check if runner process is running
ps aux | grep gitlab-runner

# Check logs for errors
gitlab-runner verify

# Re-register if needed
gitlab-runner unregister --name "macos-appdaemon-builder"
# Then re-run registration command
```

### Issue: Builds fail with "no space left on device"
```bash
# Clean Docker
docker system prune -a -f

# Clean runner cache
rm -rf ~/.gitlab-runner/cache/*

# Check disk space
df -h
```

### Issue: "privileged mode is not allowed"
Your Docker Desktop may have security settings blocking privileged mode:
1. Docker Desktop → **Settings** → **Advanced**
2. Enable "Allow privileged containers"
3. Restart Docker

## Alternative: Docker-Based Runner (Most Isolated)

For maximum isolation, run the GitLab runner itself in a Docker container:

```bash
# Create runner container
docker run -d --name gitlab-runner \
  --restart always \
  -v ~/.gitlab-runner:/etc/gitlab-runner \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --memory=2g \
  --cpus=2 \
  gitlab/gitlab-runner:latest

# Register (inside container)
docker exec -it gitlab-runner gitlab-runner register \
  --url "https://gitlab.com/" \
  --registration-token "YOUR_TOKEN" \
  --executor "docker" \
  --docker-image "docker:24-dind" \
  --docker-privileged
```

This provides:
- ✅ Complete process isolation
- ✅ Resource limits enforced by Docker
- ✅ Easy cleanup (just delete container)
- ✅ No changes to your Mac's system

## Summary

You now have:
1. ✅ GitLab runner installed on your Mac
2. ✅ Docker-based builds (isolated containers)
3. ✅ Resource limits (4GB RAM, 2 CPUs per job)
4. ✅ Security hardening (capabilities dropped)
5. ✅ Automatic service startup

Your runner will now build AppDaemon Studio whenever you push to GitLab!

## Quick Commands Reference

```bash
# Start/Stop/Restart
gitlab-runner start
gitlab-runner stop
gitlab-runner restart

# Check status
gitlab-runner status
gitlab-runner verify

# View logs
gitlab-runner run --debug  # Foreground with debug

# Unregister
gitlab-runner unregister --name "macos-appdaemon-builder"

# Update
gitlab-runner stop
brew upgrade gitlab-runner
gitlab-runner start
```
