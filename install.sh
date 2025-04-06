#!/usr/bin/env bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Use explicit path to bun if specified via environment variable, otherwise try the command 'bun'
BUN_PATH=${BUN_PATH:-"/root/.nvm/versions/node/v23.10.0/bin/bun"}
if [ ! -f "$BUN_PATH" ]; then
    BUN_PATH="bun"
fi

echo -e "${BLUE}Installing dependencies in all packages using Bun at $BUN_PATH...${NC}"

# Check if bun is installed and accessible
if ! command -v "$BUN_PATH" &>/dev/null && [ "$BUN_PATH" = "bun" ]; then
    echo "Error: Bun is not installed or not in PATH. Please install Bun first."
    echo "Visit https://bun.sh for installation instructions."
    exit 1
fi

# Get list of packages to skip (if any)
SKIP_PACKAGES=${SKIP_PACKAGES:-""}
if [ -n "$SKIP_PACKAGES" ]; then
    echo -e "${BLUE}Skipping packages: ${SKIP_PACKAGES}${NC}"
fi

# Find all package.json files, excluding node_modules
find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/\.*" | while read -r pkg; do
    dir=$(dirname "$pkg")
    
    # Check if this package should be skipped
    SKIP=0
    for skip_pkg in $SKIP_PACKAGES; do
        if [[ "$dir" == *"/$skip_pkg"* || "$dir" == *"\\$skip_pkg"* ]]; then
            echo -e "${BLUE}Skipping${NC} $dir"
            SKIP=1
            break
        fi
    done
    
    if [ $SKIP -eq 0 ]; then
        echo -e "${GREEN}Installing dependencies in${NC} $dir"
        (cd "$dir" && "$BUN_PATH" install)
    fi
done

echo -e "${BLUE}All dependencies installed successfully!${NC}"
