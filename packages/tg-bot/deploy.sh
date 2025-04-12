#!/bin/bash

# Set variables
SERVER="root@159.203.164.23"
REMOTE_DIR="/root/trump-tg-bot"
LOCAL_DIR="$(dirname "$0")"
MONOREPO_ROOT="$(realpath "$LOCAL_DIR/../..")"
COMMON_DIR="$MONOREPO_ROOT/packages/common"

# Make sure common package is built
echo "Building common package..."
cd "$COMMON_DIR" && bun run build

# No need to run a build step for the bot since Bun can run TypeScript files directly
echo "Deploying to $SERVER:$REMOTE_DIR..."

# Create the directories on the server
ssh $SERVER "mkdir -p $REMOTE_DIR $REMOTE_DIR/node_modules/@trump-fun"

# Use rsync to transfer tg-bot files, excluding those in .gitignore
rsync -avz --exclude-from=.gitignore \
  --exclude=".git/" \
  $LOCAL_DIR/ $SERVER:$REMOTE_DIR/

# Create common package directory on the server
ssh $SERVER "mkdir -p $REMOTE_DIR/node_modules/@trump-fun/common"

# Transfer the common package (just the dist folder and package.json)
rsync -avz "$COMMON_DIR/dist/" "$SERVER:$REMOTE_DIR/node_modules/@trump-fun/common/dist/"
rsync -avz "$COMMON_DIR/package.json" "$SERVER:$REMOTE_DIR/node_modules/@trump-fun/common/"

echo "Files transferred successfully!"

# SSH into the server and install dependencies
echo "Installing dependencies on the server..."
ssh $SERVER "cd $REMOTE_DIR && /root/.nvm/versions/node/v23.10.0/bin/bun install --no-save"


# echo "Installing puppeteer dependencies..."

# # Install additional packages
# apt-get install -y \
#     ca-certificates \
#     fonts-liberation \
#     libasound2t64 \
#     libatk-bridge2.0-0t64 \
#     libatk1.0-0t64 \
#     libc6 \
#     libcairo2 \
#     libcups2t64 \
#     libdbus-1-3 \
#     libexpat1 \
#     libfontconfig1 \
#     libgbm1 \
#     libgcc-s1 \
#     libglib2.0-0t64 \
#     libgtk-3-0t64 \
#     libnspr4 \
#     libnss3 \
#     libpango-1.0-0 \
#     libpangocairo-1.0-0 \
#     libstdc++6 \
#     libx11-6 \
#     libx11-xcb1 \
#     libxcb1 \
#     libxcomposite1 \
#     libxcursor1 \
#     libxdamage1 \
#     libxext6 \
#     libxfixes3 \
#     libxi6 \
#     libxrandr2 \
#     libxrender1 \
#     libxss1 \
#     libxtst6 \
#     lsb-release \
#     wget \
#     xdg-utils

# Install PM2 globally
npm install -g pm2

# Start your bot with PM2
pm2 start index.ts --interpreter=bun

# Make it auto-restart on server reboot
pm2 startup
pm2 save

echo "Deployment completed successfully!" 