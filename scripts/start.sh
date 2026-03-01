#!/bin/sh
# Wrapper script for Next.js standalone with proper env var handling
# config.json has init: true, so tini is PID 1

echo "=== AppDaemon Studio Starting ==="
echo "SUPERVISOR_TOKEN present: $([ -n "$SUPERVISOR_TOKEN" ] && echo 'yes' || echo 'no')"
echo "HASSIO_TOKEN present: $([ -n "$HASSIO_TOKEN" ] && echo 'yes' || echo 'no')"
echo "=================================="

# Write tokens to file for child processes to read
# Next.js creates child processes for API routes that don't inherit env properly
if [ -n "$SUPERVISOR_TOKEN" ]; then
    echo "$SUPERVISOR_TOKEN" > /tmp/.supervisor_token
    chmod 600 /tmp/.supervisor_token
fi

if [ -n "$HASSIO_TOKEN" ]; then
    echo "$HASSIO_TOKEN" > /tmp/.hassio_token
    chmod 600 /tmp/.hassio_token
fi

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
