#!/usr/bin/env bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Installing dependencies in all packages using Bun...${NC}"

# Check if bun is installed
if ! command -v bun &>/dev/null; then
    echo "Error: Bun is not installed. Please install Bun first."
    echo "Visit https://bun.sh for installation instructions."
    exit 1
fi

# Find all package.json files, excluding node_modules
find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/\.*" | while read -r pkg; do
    dir=$(dirname "$pkg")
    echo -e "${GREEN}Installing dependencies in${NC} $dir"
    (cd "$dir" && bun install)
done

echo -e "${BLUE}All dependencies installed successfully!${NC}"
