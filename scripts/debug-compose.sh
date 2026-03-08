#!/bin/bash

# AppDaemon Studio Docker Compose Debug Script
# Simple version using docker-compose (Home Assistant optional)

set -e

# Get project root (script is in scripts/ subdirectory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "🐳 AppDaemon Studio - Docker Compose Debug"
echo "============================================"
echo ""

# Check if .env.local exists, if not create it
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    echo ""
    
    # Ask if user wants to configure Home Assistant
    read -p "Configure Home Assistant connection? (y/N): " CONFIGURE_HA
    
    if [[ "$CONFIGURE_HA" =~ ^[Yy]$ ]]; then
        echo ""
        echo "Please provide your Home Assistant details:"
        echo ""
        
        read -p "Home Assistant URL (e.g., http://homeassistant.local:8123): " HA_URL
        
        echo ""
        echo "To get a Long-Lived Access Token:"
        echo "1. Open Home Assistant"
        echo "2. Go to Profile → Security"
        echo "3. Scroll to 'Long-Lived Access Tokens'"
        echo "4. Click 'Create Token'"
        echo ""
        read -p "Your Long-Lived Access Token: " HA_TOKEN
    else
        HA_URL=""
        HA_TOKEN=""
        echo ""
        echo "⏭️  Skipping Home Assistant configuration"
        echo "   Running in offline/debug mode"
    fi
    
    cat > .env.local <<EOF
# Home Assistant Connection
# Leave empty to run in offline/debug mode
HA_URL=${HA_URL}
HA_TOKEN=${HA_TOKEN}
EOF
    
    echo ""
    echo "✅ Created .env.local"
fi

# Create test apps directory
mkdir -p ./test-apps

echo ""
echo "🚀 Starting with Docker Compose..."
docker-compose -f "$PROJECT_ROOT/scripts/docker-compose.debug.yml" up -d --build

echo ""
echo "⏳ Waiting for application to start..."
sleep 5

echo ""
echo "📊 Container Status:"
docker-compose -f "$PROJECT_ROOT/scripts/docker-compose.debug.yml" ps

echo ""
echo "📋 Logs:"
docker-compose -f "$PROJECT_ROOT/scripts/docker-compose.debug.yml" logs --tail=20

echo ""
echo "==================================="
echo "✅ AppDaemon Studio is running!"
echo ""
echo "🌐 Open: http://localhost:3000"
echo ""
if grep -q "HA_URL=.\+" .env.local 2>/dev/null; then
    echo "✅ Home Assistant integration enabled"
else
    echo "ℹ️  Running in offline mode (no HA connection)"
fi
echo ""
echo "📝 Commands:"
echo "  View logs:  docker-compose -f scripts/docker-compose.debug.yml logs -f"
echo "  Stop:       docker-compose -f scripts/docker-compose.debug.yml down"
echo "  Restart:    docker-compose -f scripts/docker-compose.debug.yml restart"
echo ""
