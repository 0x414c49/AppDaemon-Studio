#!/usr/bin/env bash
set -e

# Configuration
LOG_LEVEL=${LOG_LEVEL:-info}

# AppDaemon Studio needs to access AppDaemon's config
# AppDaemon stores apps in /addon_configs/<slug>_appdaemon
CONFIG_DIR=/addon_configs

# Signal handling for graceful shutdown
cleanup() {
    echo "Shutting down gracefully..."
    kill -TERM "$nginx_pid" 2>/dev/null || true
    kill -TERM "$uvicorn_pid" 2>/dev/null || true
    wait
    echo "Shutdown complete"
    exit 0
}

trap cleanup SIGTERM SIGINT

echo "Starting AppDaemon Studio..."
echo "Log level: $LOG_LEVEL"
echo "Config directory: $CONFIG_DIR"
echo ""
echo "=== Available Directories ==="
echo "Root directories:"
ls -la / 2>/dev/null | head -20 || echo "Cannot list root"
echo ""
echo "Config directory contents:"
ls -la /config 2>/dev/null || echo "/config not accessible"
echo ""
echo "Data directory:"
ls -la /data 2>/dev/null || echo "/data not accessible"
echo ""
echo "Share directory:"
ls -la /share 2>/dev/null || echo "/share not accessible"
echo ""
echo "Addons directory:"
ls -la /addons 2>/dev/null || echo "/addons not accessible"
echo ""
echo "=== Checking AppDaemon location ==="
if [ -d "/addon_configs" ]; then
    echo "Addon configs found at /addon_configs"
    ls -la /addon_configs
else
    echo "/addon_configs not found"
fi
echo ""
echo "=== Current User ==="
id
echo ""

# Create necessary directories
mkdir -p /tmp/logs

# Start nginx (runs as foreground for PID tracking)
echo "Starting nginx..."
nginx -g 'daemon off;' &
nginx_pid=$!

# Start FastAPI backend with uvicorn
echo "Starting FastAPI backend..."
cd /app
python -m uvicorn app.main:app \
    --host 127.0.0.1 \
    --port 8000 \
    --log-level "$LOG_LEVEL" \
    --reload-dir /app/app \
    --reload &
uvicorn_pid=$!

echo "AppDaemon Studio started successfully!"
echo "nginx PID: $nginx_pid"
echo "uvicorn PID: $uvicorn_pid"

# Wait for processes
wait -n
echo "One of the processes exited. Shutting down..."
cleanup
