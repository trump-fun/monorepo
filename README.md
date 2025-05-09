# trump.fun

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.6. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Deploying

## Server

Run `./deploy.sh` to copy the monorepo to the server and install dependencies, then follow instructions from the next section depending on what you're trying to deploy

### Persistent services

Applies to:

- tg-bot: The telegram bot
- packages/agent/generate-noise.ts: A script that periodically places bets in FREEDOM to keep the frontend alive
- packages/agent/server.ts: A temporary REST API service that we set up so Torus could test the bounty agents. Let's you call the prediction swarm and source tracer agents only, the core trump.fun agents are not exposed to the public.

Note: The frontend and subgraph are persistent services, but they are not served on our server (they're deployed to Vercel and Subgraph Studio respectively).

These services are managed by pm2. Your code is live after running `./deploy.sh`, PM2 should automatically restart. In case it doesn't, run `pm2 list` to list the services, and `pm2 restart <service>` to bounce it. You can also view logs w/ `pm2 logs <service>`

### Jobs

Applies to:

- packages/agent/run-pool-creation-agent.ts: A script that uses an AI agent to generate markets out of Trump's Truth Social posts
- packages/agent/run-bet-grading-agent.ts: A script that uses an AI Agent to grade bets and close markets
- packages/agent/run-trump-reply.ts: A script that uses an AI Agent to reply to comments mentioning @realTrumpFun

These agents are all managed by a cron job on the server (`crontab -l`), which calls one of the above scripts (through a sh script).

If you need to modify timing, `crontab -e`, if you need to modify logic, edit the underlying agent code and run `./deploy.sh`, the next time the job runs it will use your updated code

## Frontend

The frontend is deployed to Vercel, use the Vercel CLI to deploy changes: `vercel --prod` (Note: ad0ll owns the vercel project, we have to pay for pro for the Github integration + complex branch management and opted not to)

## Subgraph

The subgraph is deployed to Subgraph Studio, deploy by running: `graph deploy trump-fun --version-label v0.0.5` (Note: ad0ll temporarily owns the subgraph deployment while we wait for the team to get hardware wallets)

## Contracts

See the [contracts README](./packages/contracts/README.md)

# Trump Fun Agent Service

This repository contains a dockerized version of the agent service.

## Docker Setup

### Prerequisites

- Docker and Docker Compose installed on your system

### Environment Variables

Create a `.env` file in the project root with the required environment variables:

```
REST_API_PORT=3010
REST_API_USERNAME=your_username
REST_API_PASSWORD=your_password
# Add other required environment variables
```

### Running with Docker Compose

Build and start the container:

```bash
docker-compose up -d
```

This will:

- Build the Docker image using Dockerfile.agent
- Start the container
- Expose the agent API on port 3010
- Store logs in a persistent volume

### Accessing Logs

Logs are stored in a Docker volume. You can access them with:

```bash
# List volumes to find the volume name
docker volume ls

# View files in the volume
docker run --rm -v agent-logs:/logs alpine ls -la /logs

# Copy logs to your local machine
docker run --rm -v agent-logs:/logs -v $(pwd)/local-logs:/local alpine cp -r /logs /local
```

### Stopping the Service

```bash
docker-compose down
```
