#!/bin/sh
# Wrapper script for Next.js server mode
# config.json has init: true, so tini is PID 1

echo "=== AppDaemon Studio Starting ==="
echo "SUPERVISOR_TOKEN present: $([ -n "$SUPERVISOR_TOKEN" ] && echo 'yes' || echo 'no')"
echo "HASSIO_TOKEN present: $([ -n "$HASSIO_TOKEN" ] && echo 'yes' || echo 'no')"
echo "=================================="

# Export env vars for the Node.js process
export SUPERVISOR_TOKEN
export HASSIO_TOKEN
export HA_URL
export HA_TOKEN
export NODE_ENV=production
export PORT=3000
export HOSTNAME=0.0.0.0

# Start Next.js directly (avoid npm which spawns child processes)
# This ensures env vars are inherited by the Node.js process
exec ./node_modules/.bin/next start
