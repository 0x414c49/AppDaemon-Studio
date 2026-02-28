#!/bin/bash
#
# Install script for git hooks
# Run this after cloning the repository
#

set -e

echo "🚀 Installing AppDaemon Studio git hooks..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -d ".git" ]; then
    echo "${RED}Error: Not a git repository${NC}"
    echo "Please run this script from the root of the repository"
    exit 1
fi

if [ ! -d "hooks" ]; then
    echo "${RED}Error: hooks directory not found${NC}"
    echo "Please run this script from the root of the repository"
    exit 1
fi

# Install pre-commit hook
echo "${YELLOW}▶ Installing pre-commit hook...${NC}"
if [ -f "hooks/pre-commit" ]; then
    cp hooks/pre-commit .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo "${GREEN}✓ pre-commit hook installed${NC}"
else
    echo "${RED}✗ hooks/pre-commit not found${NC}"
    exit 1
fi

# Install post-checkout hook
echo "${YELLOW}▶ Installing post-checkout hook...${NC}"
if [ -f "hooks/post-checkout" ]; then
    cp hooks/post-checkout .git/hooks/post-checkout
    chmod +x .git/hooks/post-checkout
    echo "${GREEN}✓ post-checkout hook installed${NC}"
else
    echo "${YELLOW}⚠ hooks/post-checkout not found (optional)${NC}"
fi

# Install post-merge hook
echo "${YELLOW}▶ Installing post-merge hook...${NC}"
if [ -f "hooks/post-merge" ]; then
    cp hooks/post-merge .git/hooks/post-merge
    chmod +x .git/hooks/post-merge
    echo "${GREEN}✓ post-merge hook installed${NC}"
else
    echo "${YELLOW}⚠ hooks/post-merge not found (optional)${NC}"
fi

echo ""
echo "${GREEN}✅ All hooks installed successfully!${NC}"
echo ""
echo "The hooks will now:"
echo "  • Check Python formatting (ruff)"
echo "  • Check Python linting (ruff)"
echo "  • Check Python types (mypy)"
echo "  • Check TypeScript linting (eslint)"
echo "  • Check TypeScript types (tsc)"
echo ""
echo "Before each commit."
echo ""
echo "To bypass hooks in emergency: git commit --no-verify"
