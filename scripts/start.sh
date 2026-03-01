#!/bin/sh
# Wrapper script for Next.js standalone with proper env var handling
# config.json has init: true, so tini is PID 1

echo "=== AppDaemon Studio Starting ==="
echo "Working directory: $(pwd)"
echo "SUPERVISOR_TOKEN present: $([ -n "$SUPERVISOR_TOKEN" ] && echo 'yes' || echo 'no')"
echo "HASSIO_TOKEN present: $([ -n "$HASSIO_TOKEN" ] && echo 'yes' || echo 'no')"

# Write tokens to WORKING DIRECTORY for child processes to read
# /tmp may not be shared between parent and child processes
if [ -n "$SUPERVISOR_TOKEN" ]; then
    echo "$SUPERVISOR_TOKEN" > /app/.supervisor_token
    chmod 600 /app/.supervisor_token
    echo "Written SUPERVISOR_TOKEN to /app/.supervisor_token"
    ls -la /app/.supervisor_token
else
    echo "No SUPERVISOR_TOKEN to write"
fi

if [ -n "$HASSIO_TOKEN" ]; then
    echo "$HASSIO_TOKEN" > /app/.hassio_token
    chmod 600 /app/.hassio_token
    echo "Written HASSIO_TOKEN to /app/.hassio_token"
fi

echo "=================================="

# Export env vars for parent process
export SUPERVISOR_TOKEN
export HASSIO_TOKEN
export HA_URL
export HA_TOKEN
export NODE_ENV=production
export PORT=3000
export HOSTNAME=0.0.0.0

# Exec replaces this process with Node
exec node server.js
