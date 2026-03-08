#!/bin/bash

# AppDaemon Studio Docker Debug Script
# Run the full application in Docker (Home Assistant optional)

set -e

# Get project root (script is in scripts/ subdirectory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "🐳 AppDaemon Studio Docker Debug Mode"
echo "======================================"
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
    
    # Create .env.local
    cat > .env.local <<EOF
# Home Assistant Connection (for standalone/development mode)
# Leave empty to run in offline/debug mode
HA_URL=${HA_URL}
HA_TOKEN=${HA_TOKEN}

# Apps directory (optional, defaults to /config/apps in production)
# APPS_DIR=/tmp/test-apps
EOF
    
    echo ""
    echo "✅ Created .env.local"
fi

echo ""
echo "🔨 Building Docker image..."
docker build -t appdaemon-studio:debug .

echo ""
echo "🧹 Cleaning up old containers..."
docker rm -f appdaemon-studio-debug 2>/dev/null || true

echo ""
echo "🚀 Starting AppDaemon Studio in Docker..."
echo ""

# Create test apps directory
mkdir -p ./test-apps

# Run container with environment variables
docker run -d \
  --name appdaemon-studio-debug \
  -p 3000:3000 \
  --env-file .env.local \
  -v $(pwd)/test-apps:/config/apps \
  -e NODE_ENV=production \
  appdaemon-studio:debug

echo ""
echo "⏳ Waiting for container to start..."
sleep 3

echo ""
echo "📋 Container Status:"
docker ps | grep appdaemon-studio-debug || echo "Container not running!"

echo ""
echo "📊 Container Logs (last 20 lines):"
docker logs --tail 20 appdaemon-studio-debug

echo ""
echo "==================================="
echo "✅ AppDaemon Studio is running!"
echo ""
echo "🌐 Access the application:"
echo "   http://localhost:3000"
echo ""
echo "🔍 Test endpoints:"
echo "   curl http://localhost:3000/api/health"
echo "   curl http://localhost:3000/api/apps"
if grep -q "HA_URL=.\+" .env.local 2>/dev/null; then
    echo "   curl http://localhost:3000/api/entities"
else
    echo "   (Entity API requires HA configuration in .env.local)"
fi
echo ""
echo "📝 View logs:"
echo "   docker logs -f appdaemon-studio-debug"
echo ""
echo "🛑 Stop container:"
echo "   docker stop appdaemon-studio-debug"
echo ""
echo "📂 Apps directory:"
echo "   $(pwd)/test-apps"
echo ""
