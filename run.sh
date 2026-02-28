#!/usr/bin/env bash
set -e

# Configuration
LOG_LEVEL=${LOG_LEVEL:-info}

# Use /config which is standard for Home Assistant add-ons
# Fallback to /data/config if /config is not available
if [ -d "/config" ]; then
    CONFIG_DIR=/config/appdaemon
elif [ -d "/data" ]; then
    CONFIG_DIR=/data/config
else
    CONFIG_DIR=/tmp/config
fi

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

# Create config directory if it doesn't exist
mkdir -p "$CONFIG_DIR"

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
