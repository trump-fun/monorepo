#!/bin/bash

# Load environment variables
set -a
source .env
set +a

echo "Deploying Freedom..." #https://special-ops.org/wp-content/uploads/2022/08/Predator-firing-hellfire-kinetic-missile.jpeg
echo "RPC_URL: $RPC_URL"
echo "ETHERSCAN_API_KEY: $ETHERSCAN_API_KEY"

# Deploy the Freedom contract
forge script script/DeployFreedom.s.sol --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY --verifier-url $VERIFIER_URL --etherscan-api-key $ETHERSCAN_API_KEY --verify
    
echo "Freedom verification attempted. Check Etherscan for confirmation."