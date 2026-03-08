#!/bin/bash

# AppDaemon Studio Debug Script
# Test Home Assistant connection using curl (optional)

set -e

# Get project root (script is in scripts/ subdirectory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "🚀 AppDaemon Studio Debug Mode (curl)"
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
        echo "   You can edit .env.local later to add credentials"
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

# Source the .env.local file
set -a
source .env.local
set +a

echo ""
echo "📋 Configuration:"
echo "   HA URL: ${HA_URL:-<not configured>}"
echo "   HA Token: ${HA_TOKEN:+${HA_TOKEN:0:10}...}${HA_TOKEN:-<not configured>}"
echo ""

# Create test app directory
echo "📁 Setting up test apps directory..."
if [ -n "$APPS_DIR" ]; then
    mkdir -p "$APPS_DIR"
    echo "   Using: $APPS_DIR"
else
    mkdir -p "./test-apps"
    echo "   Using: ./test-apps"
fi
echo ""

# Check if we have HA credentials
if [ -z "$HA_URL" ] || [ -z "$HA_TOKEN" ]; then
    echo "==================================="
    echo "ℹ️  Running in offline/debug mode"
    echo "   Home Assistant API tests skipped"
    echo ""
    echo "✅ Setup completed!"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm run dev"
    echo "2. Open: http://localhost:3000"
    echo ""
    echo "To enable HA integration, edit .env.local"
    echo ""
    exit 0
fi

# Remove trailing slash from URL if present
HA_URL="${HA_URL%/}"

echo "🔍 Testing Home Assistant Connection..."
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Basic API connectivity
echo "Test 1: API Status"
echo "-------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $HA_TOKEN" \
  -H "Content-Type: application/json" \
  "$HA_URL/api/" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ API is accessible (HTTP $HTTP_CODE)"
    ((TESTS_PASSED++))
elif [ "$HTTP_CODE" -eq 401 ]; then
    echo "❌ Unauthorized (HTTP 401)"
    echo "   Your token may be expired or invalid"
    echo "   Generate a new token in Home Assistant:"
    echo "   Profile → Security → Long-Lived Access Tokens"
    ((TESTS_FAILED++))
else
    echo "❌ API returned HTTP $HTTP_CODE"
    echo "   Check your HA_URL: $HA_URL"
    ((TESTS_FAILED++))
fi
echo ""

# Test 2: Get HA config
echo "Test 2: Home Assistant Config"
echo "------------------------------"
CONFIG=$(curl -s -X GET \
  -H "Authorization: Bearer $HA_TOKEN" \
  -H "Content-Type: application/json" \
  "$HA_URL/api/config" 2>/dev/null)
  
if [ -n "$CONFIG" ] && [ ${#CONFIG} -gt 50 ]; then
    echo "$CONFIG" | head -c 300
    echo ""
    echo "... (truncated)"
    ((TESTS_PASSED++))
else
    echo "❌ Failed to fetch config"
    ((TESTS_FAILED++))
fi
echo ""

# Test 3: Count entities
echo "Test 3: Entity Count"
echo "--------------------"
STATES=$(curl -s -X GET \
  -H "Authorization: Bearer $HA_TOKEN" \
  -H "Content-Type: application/json" \
  "$HA_URL/api/states" 2>/dev/null)
  
ENTITY_COUNT=$(echo "$STATES" | grep -o '"entity_id"' | wc -l | tr -d ' ')

if [ "$ENTITY_COUNT" -gt 0 ]; then
    echo "✅ Found $ENTITY_COUNT entities"
    ((TESTS_PASSED++))
else
    echo "⚠️  No entities found or failed to fetch"
    ((TESTS_FAILED++))
fi
echo ""

# Test 4: List first 5 entities
echo "Test 4: Sample Entities (first 5)"
echo "----------------------------------"
if [ "$ENTITY_COUNT" -gt 0 ]; then
    echo "$STATES" | grep -o '"entity_id":"[^"]*"' | head -5 | sed 's/"entity_id":"//g' | sed 's/"//g'
    ((TESTS_PASSED++))
else
    echo "⏭️  Skipped (no entities available)"
fi
echo ""

echo "==================================="

if [ $TESTS_FAILED -eq 0 ] && [ $TESTS_PASSED -gt 0 ]; then
    echo "✅ All tests passed! ($TESTS_PASSED/4)"
    echo ""
    echo "Your Home Assistant connection is working."
else
    echo "❌ Some tests failed (Passed: $TESTS_PASSED, Failed: $TESTS_FAILED)"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check HA_URL is correct: $HA_URL"
    echo "2. Verify token in Home Assistant: Profile → Security"
    echo "3. Generate a new token if expired"
    echo "4. Or run without HA: edit .env.local and clear HA_URL/HA_TOKEN"
fi

echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:3000"
echo ""
