#!/usr/bin/env bash
set -e

# Configuration
LOG_LEVEL=${LOG_LEVEL:-info}

# AppDaemon stores apps in /config/apps
# This matches AppDaemon's default configuration
APPDIR=/config/apps

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
echo "App Directory: $APPDIR"

# Config directory is provided by Home Assistant at /config
# Each add-on is isolated and cannot access other add-ons' configs

# Create necessary directories
mkdir -p /tmp/logs
mkdir -p /tmp/nginx-client-body
mkdir -p /tmp/nginx-proxy
mkdir -p /tmp/nginx-fastcgi
mkdir -p /tmp/nginx-uwsgi
mkdir -p /tmp/nginx-scgi

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
