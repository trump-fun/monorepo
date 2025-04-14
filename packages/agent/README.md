# Trump.fun AI Agent

![Trump.fun Logo](https://fxewzungnacaxpsnowcu.supabase.co/storage/v1/object/public/trump-fun/logo/trump.fun.logo.jpg)

AI agents for pool creation and bet grading on the Trump.fun prediction market platform.

## Overview

The Trump.fun AI Agent system consists of several primary components:

1. **Pool Creation Agent**: Monitors Trump's Truth Social posts and creates relevant betting pools
2. **Bet Grading Agent**: Monitors news and Trump's activities to automatically resolve bets
3. **Source Tracing Agent**: Traces information back to original sources through reference chains
4. **Prediction Market Intelligence Tools**:
   - **[Prediction Finder](./src/prediction-finder-agent/tools/find-predictions.ts)**: Discovers X posts containing predictions on specific topics
   - **[Predictor Profile Builder](./src/predictor-profile-agent/tools/build-predictor-profile.ts)**: Analyzes X accounts for their prediction history and style
   - **[Prediction Verification](./src/prediction-verification-agent/tools/verify-prediction.ts)**: Verifies predictions against real-world outcomes with evidence
   - **[Prediction Market Agent](./src/prediction-market-agent/prediction-market-agent.ts)**: Aggregates prediction data and provides market insights

These agents power the core functionality of Trump.fun - an AI-powered prediction market platform centered around President Trump's actions and statements, allowing users to place bets using either cryptocurrency (USDC) or our platform's native FREEDOM tokens.

## Key Functionality

- **Pool Creation**: Automatically analyzes Trump's social media posts
- **Market Formation**: Creates betting markets with appropriate options
- **Automated Grading**: Monitors real-world events to determine bet outcomes
- **Trump-Style Responses**: Generates responses to user comments in Trump's distinctive style
- **Source Verification**: Traces information back to primary sources through reference chains
- **Prediction Intelligence**: Finds, profiles, and verifies predictions from social media

### Hackathon Agents

This project includes three specialized agents developed for hackathon bounties:

#### 1. Source Finder Agent

Traces information back to its original source through reference chains (blog → news → press report → primary source).

- Analyzes content recursively through multiple layers
- Identifies primary vs. secondary sources
- Evaluates information credibility through the reference chain
- Provides confidence scores for information pathways

#### 2. Prediction Swarm Agents

A comprehensive prediction intelligence ecosystem that discovers, tracks, analyzes, and verifies predictions across social media:

- **[Prediction Finder](./src/prediction-finder-agent/tools/find-predictions.ts)**: Discovers explicit/implicit predictions on X/Twitter using NLP, filters for relevance, and categorizes by timeframe
- **[Predictor Profile Builder](./src/predictor-profile-agent/tools/build-predictor-profile.ts)**: Analyzes prediction history, identifies expertise areas, grades prediction style/accuracy, and tracks verified predictions
- **[Prediction Verification](./src/prediction-verification-agent/tools/verify-prediction.ts)**: Determines outcomes with supporting evidence, searches multiple sources, and categorizes results
- **[Prediction Market Agent](./src/prediction-market-agent/prediction-market-agent.ts)**: Aggregates prediction data, tracks market trends, and provides insights for prediction market operators

## Tech Stack

- TypeScript + Bun runtime
- LangChain/LangGraph for agent workflows
- LangSmith for tracing and debugging
- Integration with blockchain for market creation and resolution
- Datura API for X/Twitter integration
- Tavily for search and news intelligence
- Commander for command-line interface

## Technical Requirements

- Node.js 22+
- Bun runtime
- 4GB RAM minimum
- API keys for language models
- Blockchain connection details
- Truth Social monitoring credentials
- LangSmith API keys
- Datura API key for X/Twitter integration
- Tavily API key

## Development

## Running the Agents

### Pool Creation Agent

```bash
bun run:pool-creation
```

This agent:

1. Monitors Truth Social for new posts by Trump
2. Analyzes post content for potential betting opportunities
3. Creates appropriate betting markets with options
4. Deploys these markets to the blockchain

### Bet Grading Agent

```bash
bun run:bet-grading
```

This agent:

1. Monitors active betting markets approaching resolution
2. Analyzes news sources and social media for outcome information
3. Determines the winning option based on verifiable events
4. Triggers the resolution process on the blockchain

### Source Tracing Agent

```bash
bun run:source-tracing <url>
```

This agent:

1. Takes a URL as input (news article, blog post, social media, etc.)
2. Follows references and citations through multiple layers
3. Attempts to identify original primary sources
4. Evaluates the credibility of the information chain
5. Provides a confidence score for the source chain

Example:

```bash
# Trace a news article back to primary sources
bun run:source-tracing https://example.com/news-article

# Trace a social media post with an external link
bun run:source-tracing https://twitter.com/username/status/1234567890
```

### Prediction Market Intelligence Tools

```bash
# Find predictions on a topic
bun run:find-predictions --topic "Trump China tariffs"

# Build predictor profile
bun run:build-profile --username "ElonMusk"

# Verify a prediction
bun run run:verify-prediction \
  --prediction "Tesla will double vehicle output in the United States within the next two years" \
  --date "2025-03-12"

# Batch verify predictions from file
bun run:prediction-tools batch-verify --file predictions.json --output results.json
```

These tools work together to form a complete prediction intelligence system:

1. **Find Predictions**: Discovers both explicit and implicit predictions on X/Twitter related to specific topics
2. **Build Predictor Profile**: Analyzes an X/Twitter account's prediction history and generates metrics on style, accuracy, and expertise
3. **Verify Predictions**: Determines if predictions have come true or false with supporting evidence

You can use these tools individually or build workflows that combine them, such as:

- Finding predictions on a topic, then verifying each one
- Building profiles of predictors, then comparing their accuracy scores
- Batch verifying predictions from multiple sources to identify trends

### Running Bounty Agents

To run the specialized bounty agents directly, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/trump-fun/monorepo
```

2. Check out the feature branch containing all bounty agents: (As of writing, the source finder and prediction swarm agents aren't on main)

```bash
git checkout feat/source-finder
```

3. Set up the environment variables in `packages/agent/.env`:
   - Copy the example file: `cp packages/agent/.env.example packages/agent/.env`
   - Required API keys:
     - `TAVILY_API_KEY` (get one from [Tavily](https://tavily.com/))
     - `NEWS_API_KEY` (get one from [NewsAPI](https://newsapi.org/))
     - `FIRECRAWL_API_KEY` (get one from [Firecrawl](https://firecrawl.com/))
   - Configure LLM providers by setting the `<TYPE>_PROVIDER` variables:
     - `SMALL_LLM_PROVIDER` (for classification and search queries)
     - `CHEAP_LLM_PROVIDER` (Anthropic is really expensive)
     - `LARGE_LLM_PROVIDER` (for analysis and text generation)
   - Add the corresponding API key for your chosen provider(s):
     - For example, if using Anthropic, set `ANTHROPIC_API_KEY`
4. Run the specific bounty agent:

```bash
# Source Tracing Agent
bun run:source-tracing

# Prediction Finder
bun run:find-predictions

# Build Predictor Profile
bun run:build-profile

# Prediction Verification
bun run:verify-prediction
```

You can find all available run scripts in the project's `package.json` file.

## Deployment

The agents are deployed to a server and run on a schedule via cron jobs:

```bash
./deploy.sh
```

To check the current cron configuration:

```bash
crontab -e
```

## Log Monitoring

Monitor agent activity logs:

```bash
tail -f /root/trump-fun-agent/run-pool-creation-agent.log
tail -f /root/trump-fun-agent/run-bet-grading-agent.log
```

## Debugging with LangSmith

LangSmith provides tracing that shows inputs and outputs for each node in the agent graph. Credentials for this service are available in the project Notion.

You can also use LangGraph Studio to visualize agent workflows locally, though notebooks may provide better performance for development and testing.

## Agent Architecture

The agents use a directed graph architecture with:

- State management for tracking agent progress
- Multiple specialized tools for different tasks
- Error handling and retry mechanisms
- Blockchain integration for on-chain actions

## Social Media

- X: [@realTrumpFun](https://x.com/realTrumpFun)
- Telegram: [trump_fun_bot](https://t.me/trump_fun_bot)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
