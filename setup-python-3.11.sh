#!/bin/bash
#
# Setup Python 3.11 with pyenv for local development
# This ensures you use the EXACT same Python version as CI
#

set -e

echo "🐍 Setting up Python 3.11 with pyenv..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if pyenv is installed
if ! command -v pyenv &> /dev/null; then
    echo "${YELLOW}pyenv not found. Installing...${NC}"
    
    # macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install pyenv
        else
            echo "${RED}Homebrew not found. Please install Homebrew first:${NC}"
            echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    # Linux
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl https://pyenv.run | bash
        echo "${YELLOW}Please add pyenv to your shell:${NC}"
        echo 'export PYENV_ROOT="$HOME/.pyenv"'
        echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"'
        echo 'eval "$(pyenv init -)"'
        exit 1
    else
        echo "${RED}Unsupported OS. Please install pyenv manually:${NC}"
        echo "  https://github.com/pyenv/pyenv#installation"
        exit 1
    fi
fi

echo "${GREEN}✓ pyenv is installed${NC}"

# Check if Python 3.11 is installed
PYTHON_VERSION="3.11.11"
if ! pyenv versions | grep -q "$PYTHON_VERSION"; then
    echo "${YELLOW}Installing Python $PYTHON_VERSION...${NC}"
    echo "This may take a few minutes..."
    pyenv install "$PYTHON_VERSION"
else
    echo "${GREEN}✓ Python $PYTHON_VERSION already installed${NC}"
fi

# Set local Python version
echo "${YELLOW}Setting local Python version to $PYTHON_VERSION...${NC}"
pyenv local "$PYTHON_VERSION"
echo "${GREEN}✓ Python version set${NC}"

# Create virtual environment
VENV_PATH="venv"
if [ -d "$VENV_PATH" ]; then
    echo "${YELLOW}Virtual environment already exists. Removing old one...${NC}"
    rm -rf "$VENV_PATH"
fi

echo "${YELLOW}Creating virtual environment...${NC}"
python -m venv "$VENV_PATH"
echo "${GREEN}✓ Virtual environment created${NC}"

# Activate virtual environment
echo "${YELLOW}Activating virtual environment...${NC}"
source "$VENV_PATH/bin/activate"
echo "${GREEN}✓ Virtual environment activated${NC}"

# Upgrade pip
echo "${YELLOW}Upgrading pip...${NC}"
pip install --upgrade pip --quiet

# Install requirements
echo "${YELLOW}Installing project dependencies...${NC}"
if [ -f "app/requirements.txt" ]; then
    pip install -r app/requirements.txt --quiet
    echo "${GREEN}✓ Project dependencies installed${NC}"
else
    echo "${YELLOW}⚠ app/requirements.txt not found${NC}"
fi

# Install development dependencies (matching CI exactly)
echo "${YELLOW}Installing development dependencies...${NC}"
if [ -f "requirements-dev.txt" ]; then
    pip install -r requirements-dev.txt --quiet
    echo "${GREEN}✓ Development dependencies installed${NC}"
else
    echo "${YELLOW}⚠ requirements-dev.txt not found, installing manually...${NC}"
    pip install \
        pytest==8.0.0 \
        pytest-asyncio==0.21.1 \
        pytest-cov \
        httpx \
        types-PyYAML \
        ruff \
        mypy \
        --quiet
    echo "${GREEN}✓ Development dependencies installed${NC}"
fi

echo ""
echo "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "To activate the environment in the future, run:"
echo "  source venv/bin/activate"
echo ""
echo "To verify you're using Python 3.11:"
echo "  python --version"
echo ""
echo "To run tests like CI:"
echo "  cd app"
echo "  ruff check ."
echo "  ruff format --check ."
echo "  mypy . --ignore-missing-imports"
echo "  pytest tests/ -v"
echo ""
echo "Current Python version: $(python --version)"
