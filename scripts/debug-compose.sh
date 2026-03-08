#!/bin/bash

# AppDaemon Studio Docker Compose Debug Script
# Simple version using docker-compose

set -e

echo "🐳 AppDaemon Studio - Docker Compose Debug"
echo "============================================"
echo ""

# Check if .env.local exists, if not create it
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
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
    
    cat > .env.local <<EOF
# Home Assistant Connection
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
docker-compose -f scripts/docker-compose.debug.yml up -d --build

echo ""
echo "⏳ Waiting for application to start..."
sleep 5

echo ""
echo "📊 Container Status:"
docker-compose -f scripts/docker-compose.debug.yml ps

echo ""
echo "📋 Logs:"
docker-compose -f scripts/docker-compose.debug.yml logs --tail=20

echo ""
echo "==================================="
echo "✅ AppDaemon Studio is running!"
echo ""
echo "🌐 Open: http://localhost:3000"
echo ""
echo "📝 Commands:"
echo "  View logs:  docker-compose -f scripts/docker-compose.debug.yml logs -f"
echo "  Stop:       docker-compose -f scripts/docker-compose.debug.yml down"
echo "  Restart:    docker-compose -f scripts/docker-compose.debug.yml restart"
echo ""
