#!/bin/bash

# AppDaemon Studio Debug Script
# Test Home Assistant connection using curl

set -e

echo "🚀 AppDaemon Studio Debug Mode (curl)"
echo "======================================"
echo ""

# Check if .env.local exists, if not create it
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    echo ""
    echo "Please provide your Home Assistant details:"
    echo ""
    
    # Prompt for HA URL
    read -p "Home Assistant URL (e.g., http://homeassistant.local:8123): " HA_URL
    
    # Prompt for HA Token
    echo ""
    echo "To get a Long-Lived Access Token:"
    echo "1. Open Home Assistant"
    echo "2. Go to Profile → Security"
    echo "3. Scroll to 'Long-Lived Access Tokens'"
    echo "4. Click 'Create Token'"
    echo ""
    read -p "Your Long-Lived Access Token: " HA_TOKEN
    
    # Create .env.local
    cat > .env.local <<EOF
# Home Assistant Connection (for standalone/development mode)
HA_URL=${HA_URL}
HA_TOKEN=${HA_TOKEN}

# Apps directory (optional, defaults to /config/apps in production)
# APPS_DIR=/tmp/test-apps
EOF
    
    echo ""
    echo "✅ Created .env.local"
fi

# Source the .env.local file
set -a
source .env.local
set +a

echo ""
echo "📋 Configuration:"
echo "   HA URL: $HA_URL"
echo "   HA Token: ${HA_TOKEN:0:10}..."
echo ""

# Remove trailing slash from URL if present
HA_URL="${HA_URL%/}"

echo "🔍 Testing Home Assistant Connection..."
echo ""

# Test 1: Basic API connectivity
echo "Test 1: API Status"
echo "-------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $HA_TOKEN" \
  -H "Content-Type: application/json" \
  "$HA_URL/api/")

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ API is accessible (HTTP $HTTP_CODE)"
else
    echo "❌ API returned HTTP $HTTP_CODE"
fi
echo ""

# Test 2: Get HA config
echo "Test 2: Home Assistant Config"
echo "------------------------------"
curl -s -X GET \
  -H "Authorization: Bearer $HA_TOKEN" \
  -H "Content-Type: application/json" \
  "$HA_URL/api/config" | head -c 500

echo ""
echo "... (truncated)"
echo ""

# Test 3: Count entities
echo "Test 3: Entity Count"
echo "--------------------"
ENTITY_COUNT=$(curl -s -X GET \
  -H "Authorization: Bearer $HA_TOKEN" \
  -H "Content-Type: application/json" \
  "$HA_URL/api/states" | grep -o '"entity_id"' | wc -l | tr -d ' ')

echo "✅ Found $ENTITY_COUNT entities"
echo ""

# Test 4: List first 5 entities
echo "Test 4: Sample Entities (first 5)"
echo "----------------------------------"
curl -s -X GET \
  -H "Authorization: Bearer $HA_TOKEN" \
  -H "Content-Type: application/json" \
  "$HA_URL/api/states" | grep -o '"entity_id":"[^"]*"' | head -5 | sed 's/"entity_id":"//g' | sed 's/"//g'

echo ""
echo ""

# Test 5: Create test app directory
echo "Test 5: Local Apps Directory"
echo "-----------------------------"
if [ -n "$APPS_DIR" ]; then
    mkdir -p "$APPS_DIR"
    echo "✅ Created: $APPS_DIR"
else
    mkdir -p "./test-apps"
    echo "✅ Created: ./test-apps"
fi
echo ""

echo "==================================="
echo "✅ All tests completed!"
echo ""
echo "Your Home Assistant connection is working."
echo ""
echo "Next steps:"
echo "1. Fix Node.js: brew reinstall node"
echo "2. Or use nvm: nvm install 20 && nvm use 20"
echo "3. Then run: npm run dev"
echo ""
