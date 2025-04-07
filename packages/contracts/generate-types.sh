#!/bin/bash

# Check if wagmi CLI is installed globally
if ! command -v wagmi &>/dev/null; then
    echo "wagmi CLI not found, installing..."
    bun install --global @wagmi/cli
fi

# Build contracts first
echo "Building contracts..."
forge build

# Create types directory if it doesn't exist
mkdir -p types

# Generate types using wagmi CLI
echo "Generating types..."
wagmi generate

# Make sure the common/abi directory exists
mkdir -p ../common/abi

ABI_FILE=../common/abi/contract.types.ts
# Copy generated types to frontend, backend, and common
echo "Copying types to $ABI_FILE..."
mv types/generated.ts $ABI_FILE
rm -rf types

echo "✨ Types generated and copied successfully!"
