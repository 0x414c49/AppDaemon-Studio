# GitLab Runner with Podman on macOS (Most Secure)

Podman is a **daemonless** container engine that doesn't require root privileges or `--privileged` mode. It's the most secure option for running CI/CD builds on your Mac.

## Why Podman Over Docker?

```
┌─────────────────────────────────────────────────────────┐
│  Docker Architecture                                    │
│  ┌─────────────┐    ┌──────────────────────────────┐   │
│  │ Docker CLI  │───▶│ Docker Daemon (runs as root) │   │
│  └─────────────┘    └──────────────────────────────┘   │
│                              │                          │
│                              ▼                          │
│                       ┌──────────────┐                 │
│                       │ Containers   │                 │
│                       └──────────────┘                 │
└─────────────────────────────────────────────────────────┘
         ⚠️ Daemon runs as root = security risk

┌─────────────────────────────────────────────────────────┐
│  Podman Architecture                                    │\n│  ┌─────────────┐                                       │
│  │ Podman CLI  │───▶┌──────────────────────────────┐   │
│  └─────────────┘    │     Fork/Exec Model          │   │
│                     │  (no daemon, direct process) │   │
│                     └──────────────────────────────┘   │
│                              │                          │
│                              ▼                          │
│                       ┌──────────────┐                 │
│                       │ Containers   │                 │
│                       └──────────────┘                 │
└─────────────────────────────────────────────────────────┘
         ✅ No daemon = better security isolation
```

## Key Advantages

✅ **No Daemon**: Runs containers directly as your user (no root daemon)  
✅ **No Privileged Mode**: Works without `--privileged` flag  
✅ **Rootless by Default**: Containers run in user namespace  
✅ **Docker CLI Compatible**: Drop-in replacement for Docker  
✅ **Better Security**: Designed with security first, not added later  

## Installation

### Option 1: Podman Desktop (Recommended)

```bash
# Install via Homebrew
brew install --cask podman-desktop

# Or download from: https://podman-desktop.io/

# Initialize Podman machine (creates Linux VM on macOS)
podman machine init

# Start the machine
podman machine start

# Verify
podman --version
podman info
```

### Option 2: CLI Only (Minimal)

```bash
# Install Podman
brew install podman

# Create and start machine
podman machine init --cpus=4 --memory=8192 --disk-size=50
podman machine start

# Test
podman run hello-world
```

## Setup GitLab Runner with Podman

### Step 1: Create Podman Socket

Podman needs a socket for the runner to communicate:

```bash
# Start Podman system service
# This creates a socket at $XDG_RUNTIME_DIR/podman/podman.sock

# For macOS, we use SSH forwarding to the VM
export PODMAN_SSH="ssh://core@localhost:49273/run/user/501/podman/podman.sock"

# Or start the API service in the VM
podman machine ssh
sudo systemctl enable --now podman.socket
exit

# Forward the socket to your Mac
podman machine ssh -L 8080:/run/user/1000/podman/podman.sock

# Now use: unix:///tmp/podman.sock
```

**Alternative**: Use Podman's Docker compatibility:

```bash
# Create Docker-compatible socket symlink
mkdir -p ~/.config/podman
echo "unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')" > ~/.config/podman/podman.sock

# Or use DOCKER_HOST environment variable
export DOCKER_HOST="unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')"
```

### Step 2: Configure GitLab Runner

```bash
# Create config directory
mkdir -p ~/.gitlab-runner-podman
cd ~/.gitlab-runner-podman

# Create config.toml with Podman support
cat > config.toml << 'EOF'
concurrent = 2
check_interval = 0

[[runners]]
  name = "macos-podman-runner"
  url = "https://gitlab.com/"
  token = "YOUR_REGISTRATION_TOKEN"
  executor = "docker"
  
  [runners.docker]
    # Use Podman instead of Docker
    host = "unix:///var/run/podman/podman.sock"
    tls_verify = false
    image = "docker.io/library/docker:24"
    privileged = false  # ✅ NO PRIVILEGED NEEDED
    
    # Podman-specific security options
    security_opts = [
      "seccomp=unconfined",  # Podman handles this better
      "label=disable"        # Disable SELinux labels (macOS)
    ]
    
    # Volumes
    volumes = [
      "/var/run/podman/podman.sock:/var/run/docker.sock",
      "/Users/$(whoami)/.gitlab-runner-podman/cache:/cache",
      "/tmp:/tmp"
    ]
    
    # Resource limits
    memory = "4g"
    cpus = "2"
    
    # Network
    network_mode = "slirp4netns"  # Rootless networking
    
    # Capabilities (Podman is more restrictive by default)
    cap_drop = ["ALL"]
    cap_add = ["CHOWN", "DAC_OVERRIDE", "SETGID", "SETUID", "NET_ADMIN"]
  
  [runners.environment]
    DOCKER_DRIVER = "overlay2"
    DOCKER_HOST = "unix:///var/run/docker.sock"
EOF
```

### Step 3: Install GitLab Runner

```bash
# Install GitLab Runner
brew install gitlab-runner

# Register with Podman
gitlab-runner register \
  --non-interactive \
  --url "https://gitlab.com/" \
  --registration-token "YOUR_TOKEN_HERE" \
  --executor "docker" \
  --docker-image "docker.io/library/docker:24" \
  --docker-privileged=false \
  --docker-host "unix:///var/run/podman/podman.sock" \
  --docker-volumes "/var/run/podman/podman.sock:/var/run/docker.sock" \
  --name "macos-podman-builder" \
  --tag-list "podman,macos,aarch64"
```

### Step 4: Start the Runner

```bash
# Get the Podman socket path
PODMAN_SOCK=$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')

# Set environment
export DOCKER_HOST="unix://${PODMAN_SOCK}"

# Run GitLab runner with Podman socket
gitlab-runner run \
  --config ~/.gitlab-runner-podman/config.toml \
  --docker-host "unix://${PODMAN_SOCK}"
```

## Using Podman Directly (No Docker Compatibility)

If you want to use native Podman without Docker emulation:

```bash
# Register with Podman executor (custom executor)
gitlab-runner register \
  --executor "custom" \
  --name "macos-native-podman"

# Create custom executor scripts
mkdir -p ~/.gitlab-runner-podman/custom

# config.toml for custom executor
[[runners]]
  name = "macos-native-podman"
  url = "https://gitlab.com/"
  token = "TOKEN"
  executor = "custom"
  builds_dir = "/Users/$(whoami)/gitlab-builds"
  
  [runners.custom]
    prepare_exec = "/Users/$(whoami)/.gitlab-runner-podman/custom/prepare.sh"
    run_exec = "/Users/$(whoami)/.gitlab-runner-podman/custom/run.sh"
    cleanup_exec = "/Users/$(whoami)/.gitlab-runner-podman/custom/cleanup.sh"
```

### Custom Executor Scripts

**prepare.sh**:
```bash
#!/bin/bash
# Pull the image using Podman
podman pull "$CUSTOM_ENV_CI_JOB_IMAGE"
```

**run.sh**:
```bash
#!/bin/bash
# Run the build container
podman run --rm \
  --memory=4g \
  --cpus=2 \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  -v "$CI_PROJECT_DIR:$CI_PROJECT_DIR" \
  -w "$CI_PROJECT_DIR" \
  "$CI_JOB_IMAGE" \
  /bin/sh -c "$CI_SCRIPT"
```

**cleanup.sh**:
```bash
#!/bin/bash
# Clean up containers
podman container prune -f
podman image prune -f
```

## Comparison: Docker vs Podman

| Feature | Docker | Podman | Winner |
|---------|--------|--------|--------|
| **Privileged Required** | ✅ Yes (for DinD) | ❌ No | Podman |
| **Rootless** | ⚠️ Optional | ✅ Default | Podman |
| **Daemon** | Required | None | Podman |
| **CLI Compatible** | Native | Compatible | Tie |
| **macOS Support** | Native | Via VM | Docker |
| **Security** | Good | Excellent | Podman |
| **Resource Usage** | Lower | Higher (VM) | Docker |

## Troubleshooting

### Issue: "Cannot connect to Podman socket"

```bash
# Check if machine is running
podman machine list

# Start it
podman machine start

# Get correct socket path
podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}'

# Test connection
podman --remote info
```

### Issue: "Permission denied" on socket

```bash
# Fix socket permissions
podman machine ssh
sudo chmod 666 /run/user/1000/podman/podman.sock
exit
```

### Issue: Network problems in builds

```bash
# Podman uses slirp4netns for rootless networking
# If builds need internet, ensure this works:
podman run alpine ping -c 3 google.com

# If not working, restart machine
podman machine stop
podman machine start
```

### Issue: "overlay" filesystem not supported

```bash
# Use vfs driver instead (slower but works)
export STORAGE_DRIVER=vfs

# Or configure in ~/.config/containers/storage.conf
[storage]
driver = "vfs"
```

## Security Benefits Summary

### With Docker (Privileged):
```bash
# Container has full access to host
--privileged
  ├─ Access to /dev/* devices
  ├─ Can modify kernel
  ├─ Root on host filesystem
  └─ Can escape container
```

### With Podman (Rootless):
```bash
# Container runs as your user
podman run
  ├─ User namespace isolation
  ├─ No access to host devices
  ├─ Cannot modify kernel
  ├─ Mapped UID/GID (not root)
  └─ Confined by user permissions
```

## Quick Start Commands

```bash
# Install
brew install podman

# Setup
podman machine init --cpus=4 --memory=8192
podman machine start

# Register runner
gitlab-runner register \
  --url "https://gitlab.com/" \
  --token "TOKEN" \
  --executor docker \
  --docker-image docker:24 \
  --docker-privileged=false \
  --docker-host "unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')"

# Run
export DOCKER_HOST="unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')"
gitlab-runner run
```

## Recommendation

**Use Podman if:**
- ✅ Security is your top priority
- ✅ You want rootless containers
- ✅ You don't mind slightly higher resource usage
- ✅ You're comfortable with newer technology

**Use Docker if:**
- ✅ You need maximum compatibility
- ✅ You want lowest resource usage
- ✅ You prefer mature tooling
- ✅ You're already familiar with Docker

**For AppDaemon Studio builds**: Podman is excellent because:
1. No privileged containers needed
2. Builds run isolated from your Mac
3. Better security model
4. Works perfectly with GitLab CI

Both will work great - Podman just has better security defaults!
