#!/bin/bash

source /root/.bashrc
source /root/.profile

echo "Running agent $(date)"
ROOT_DIR="/root/trump-fun-monorepo/packages/agent"

# Load environment variables if .env exists
if [ -f $ROOT_DIR/.env ]; then
  source $ROOT_DIR/.env
fi

# Run the agent
/root/.nvm/versions/node/v23.10.0/bin/bun run $ROOT_DIR/run-pool-creation-agent.ts
#bun run test-trump-agent.ts