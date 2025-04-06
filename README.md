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

1. Run `./deploy.sh` to copy the monorepo to the server and install dependencies.

The Agent code is run by a cron job on the server (`crontab -l`), which calls one of the sh scripts in the `agent` directory.
The sh scripts just load the environment and use bun to run one of the following ts files:

- `run-bet-grading-agent.ts`
- `run-bet-pool-agent.ts`
- `run-tweet-scraping-agent.ts`
- `run-tweet-scraping-agent.ts`

The Agent code is run by a cron job on the server (`crontab -l`), which calls one of the sh scripts in the `agent` directory.

The Agent code is run by a cron job on the server (`crontab -l`), which calls one of the sh scripts in the `agent` directory.

The Agent code is run by a cron job on the server (`crontab -l`), which calls one of the sh scripts in the `agent` directory.
