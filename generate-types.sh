#!/bin/bash
set -e

echo "Building contracts..."
# Check if forge is installed
if ! command -v forge &>/dev/null; then
    echo "Error: forge is not installed. Please install Foundry tools."
    echo "Visit https://book.getfoundry.sh/getting-started/installation for instructions."
    exit 1
fi

# Build contracts
forge build

echo "Generating types..."
# Create directories if they don't exist
mkdir -p types
mkdir -p ../common/abi

# Generate types
npx typechain --target ethers-v5 "./out/**/*.json"

echo "Copying types to ../common/abi/contract.types.ts..."
# Check if files exist before moving/copying
if [ -f "types/generated.ts" ]; then
    mv types/generated.ts ../common/abi/contract.types.ts
else
    echo "Warning: types/generated.ts not found"
fi

if [ -f "out/BettingContract.sol/BettingContract.json" ]; then
    cp out/BettingContract.sol/BettingContract.json ../common/abi/
else
    echo "Warning: BettingContract.json not found"
fi

echo "✨ Types generated and copied successfully!"
