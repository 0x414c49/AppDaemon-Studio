#!/bin/sh
# Wrapper script for Next.js standalone with proper env var handling
# config.json has init: true, so tini is PID 1

echo "=== AppDaemon Studio Starting ==="
echo "SUPERVISOR_TOKEN present: $([ -n "$SUPERVISOR_TOKEN" ] && echo 'yes [REDACTED]' || echo 'no')"
echo "HASSIO_TOKEN present: $([ -n "$HASSIO_TOKEN" ] && echo 'yes [REDACTED]' || echo 'no')"
echo "=================================="

# Node.js reads env vars from its parent process
# With init: true, tini passes env vars correctly
# Next.js standalone uses cluster mode, so we ensure vars are exported
export SUPERVISOR_TOKEN
export HASSIO_TOKEN
export HA_URL
export HA_TOKEN
export NODE_ENV=production
export PORT=3000
export HOSTNAME=0.0.0.0

# Exec replaces this process with Node, preserving all env vars
exec node server.js
