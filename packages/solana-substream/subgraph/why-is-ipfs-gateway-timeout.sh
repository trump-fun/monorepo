#!/bin/bash

# IPFS gateway routinely times out when doing a subgraph deploy, sick of repeatedly running the command in the terminal.

# 1. Take a version argument
# 2. Call bun run deploy-studio -l <VERSION>
# 3. If you get exit 1, print "IPFS gateway timeout, trying again...", wait 5s, and then try again
# 4. If you get exit 0, print "Deployed successfully" and exit

VERSION=$1

# Check if version is provided
if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

# Deploy the subgraph
while true; do
    bun run deploy-studio -l $VERSION
    if [ $? -eq 0 ]; then
        echo "Deployed successfully"
        exit 0
    fi
    echo "IPFS gateway timeout, trying again..."
    sleep 5
done