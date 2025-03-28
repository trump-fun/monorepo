#!/bin/bash

# Load environment variables
set -a
source .env
set +a

# Check if FREEDOM_ADDRESS is set
if [ -z "$FREEDOM_ADDRESS" ]; then
    echo "Error: FREEDOM_ADDRESS is not set in the .env file"
    echo "Please run deploy-points.sh first and update your .env file"
    exit 1
fi

echo "Deploying BettingContract..."
echo "Using FREEDOM_ADDRESS: $FREEDOM_ADDRESS"
echo "Using USDC_ADDRESS: $USDC_ADDRESS"

# Deploy the BettingContract
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY --verifier-url $VERIFIER_URL --etherscan-api-key $ETHERSCAN_API_KEY --verify

# Optional: Run end-to-end test script
if [ "$RUN_E2E_TEST" = "true" ]; then
    echo "Running end-to-end test script..."
    forge script script/EndToEndTest.s.sol --rpc-url $RPC_URL --broadcast \
        --private-key $PRIVATE_KEY \
        --private-key $ACCOUNT1_PRIVATE_KEY \
        --private-key $ACCOUNT2_PRIVATE_KEY \
        --private-key $ACCOUNT3_PRIVATE_KEY \
        --verifier-url $VERIFIER_URL \
        --etherscan-api-key $ETHERSCAN_API_KEY \
        --verify
    
    echo "End-to-end test completed."
fi 