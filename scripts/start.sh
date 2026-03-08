#!/bin/sh
# Wrapper script for Next.js server mode
# init: false means we handle signals ourselves

echo "=== AppDaemon Studio Starting ==="
echo ""
echo "Mode Detection:"
echo "  Add-on mode (SUPERVISOR_TOKEN): $([ -n "$SUPERVISOR_TOKEN" ] && echo 'yes' || echo 'no')"
echo "  Add-on mode (HASSIO_TOKEN): $([ -n "$HASSIO_TOKEN" ] && echo 'yes' || echo 'no')"
echo "  Standalone mode (HA_URL): $([ -n "$HA_URL" ] && echo 'yes' || echo 'no')"
echo "  Standalone mode (HA_TOKEN): $([ -n "$HA_TOKEN" ] && echo 'yes' || echo 'no')"
echo ""

# Determine which mode we're running in
if [ -n "$SUPERVISOR_TOKEN" ] || [ -n "$HASSIO_TOKEN" ]; then
    echo "✅ Running in Home Assistant Add-on mode"
elif [ -n "$HA_URL" ] && [ -n "$HA_TOKEN" ]; then
    echo "✅ Running in Standalone mode"
    echo "   HA URL: $HA_URL"
    echo "   HA Token: ${HA_TOKEN:0:10}..."
else
    echo "⚠️  Warning: No Home Assistant credentials detected"
    echo "   Set SUPERVISOR_TOKEN (add-on) or HA_URL + HA_TOKEN (standalone)"
fi

echo ""
echo "=================================="
echo ""

# Export env vars for the Node.js process
export SUPERVISOR_TOKEN
export HASSIO_TOKEN
export HA_URL
export HA_TOKEN
export NODE_ENV=production
export PORT=3000
export HOSTNAME=0.0.0.0

# Start Next.js directly
# With init: false, this process becomes PID 1 and handles signals
exec ./node_modules/.bin/next start
