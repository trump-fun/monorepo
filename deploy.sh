#!/bin/bash

# Set variables
SERVER="root@159.203.164.23"
REMOTE_DIR="/root/trump-fun-monorepo"
LOCAL_DIR="$(dirname "$0")"

# No need to run a build step since Bun can run TypeScript files directly
echo "Deploying to $SERVER:$REMOTE_DIR..."

# Create the directory on the server if it doesn't exist
ssh $SERVER "mkdir -p $REMOTE_DIR"

# Use rsync to transfer files, excluding those in .gitignore
rsync -avz --exclude-from=.gitignore \
  $LOCAL_DIR/ $SERVER:$REMOTE_DIR/
  # --exclude=".git/" \


echo "Files transferred successfully!"

# SSH into the server and install dependencies selectively using install.sh
# The below don't need to be build on the server because they're deployed elsewhere and the server has limited space
echo "Installing dependencies for required packages (excluding frontend, graph, and contracts)..."
ssh $SERVER "cd $REMOTE_DIR && \
  export SKIP_PACKAGES='frontend graph contracts' && \
  export BUN_PATH='/root/.nvm/versions/node/v23.10.0/bin/bun' && \
  chmod +x ./install.sh && \
  ./install.sh"

# Kill existing server process if running
echo "Checking for running server process..."
ssh $SERVER "pkill -f 'bun run.*server.ts' || true"

# Start the server in background
echo "Starting server in background..."
ssh $SERVER "cd $REMOTE_DIR && cd packages/agent && \
  if [ -f .env ]; then \
    nohup /root/.nvm/versions/node/v23.10.0/bin/bun run server.ts > ../../server.log 2>&1 & \
  else \
    echo 'Error: .env file not found in packages/agent directory'; \
    exit 1; \
  fi"

echo "Deployment completed successfully!"
