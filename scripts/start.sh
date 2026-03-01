#!/bin/sh
# Wrapper script to ensure env vars are available to Next.js

# Export all Supervisor env vars explicitly
export SUPERVISOR_TOKEN="${SUPERVISOR_TOKEN}"
export HASSIO_TOKEN="${HASSIO_TOKEN}"

# Debug: print what we have
echo "=== AppDaemon Studio Starting ==="
echo "SUPERVISOR_TOKEN present: $([ -n "$SUPERVISOR_TOKEN" ] && echo 'yes' || echo 'no')"
echo "HASSIO_TOKEN present: $([ -n "$HASSIO_TOKEN" ] && echo 'yes' || echo 'no')"
echo "=================================="

# Start Next.js
exec node server.js
