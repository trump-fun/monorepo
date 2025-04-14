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
