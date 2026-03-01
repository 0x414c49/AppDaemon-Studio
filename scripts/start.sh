#!/bin/sh
# Wrapper script for Next.js standalone with proper env var handling
# config.json has init: true, so tini is PID 1

echo "=== AppDaemon Studio Starting ==="
echo "Working directory: $(pwd)"
echo "SUPERVISOR_TOKEN present: $([ -n "$SUPERVISOR_TOKEN" ] && echo 'yes' || echo 'no')"
echo "HASSIO_TOKEN present: $([ -n "$HASSIO_TOKEN" ] && echo 'yes' || echo 'no')"

# Write tokens to file for child processes to read
# Next.js creates child processes for API routes that don't inherit env properly
if [ -n "$SUPERVISOR_TOKEN" ]; then
    echo "$SUPERVISOR_TOKEN" > /tmp/.supervisor_token
    chmod 600 /tmp/.supervisor_token
    echo "Written SUPERVISOR_TOKEN to /tmp/.supervisor_token"
    ls -la /tmp/.supervisor_token
else
    echo "No SUPERVISOR_TOKEN to write"
fi

if [ -n "$HASSIO_TOKEN" ]; then
    echo "$HASSIO_TOKEN" > /tmp/.hassio_token
    chmod 600 /tmp/.hassio_token
    echo "Written HASSIO_TOKEN to /tmp/.hassio_token"
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
