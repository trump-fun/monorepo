# Trump.fun Frontend

![Trump.fun Logo](https://fxewzungnacaxpsnowcu.supabase.co/storage/v1/object/public/trump-fun/logo/trump.fun.logo.jpg)

A prediction market platform for betting on Trump's social media posts and public actions.

## Overview

Trump.fun is an AI-powered prediction market platform centered around President Trump's actions and statements. Our system automatically creates betting pools based on Trump's Truth Social posts, allowing users to place bets using either cryptocurrency (USDC) or our platform's native FREEDOM tokens.

The frontend provides a seamless user experience for connecting wallets, browsing betting pools, and placing bets on outcomes.

## Features

- Browse AI-generated betting pools based on Trump's Truth Social posts
- Connect wallet easily with Privy's embedded wallet solution
- Place bets using USDC or native FREEDOM tokens
- View and participate in ongoing prediction markets
- Interact through comments and receive AI-generated Trump-style responses
- View historical bets and outcomes
- Responsive design with dark mode support

## Tech Stack

- NextJS 15 with App Router
- React 19
- TailwindCSS with shadcn/ui components
- Privy for authentication and embedded wallets
- Base network for blockchain transactions

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/trump-fun.git
cd trump-fun
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

Copy the `.env.example` file to `.env.local` and add your Privy App ID.

```bash
cp .env.example .env.local
```

4. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
/trump-fun-frontend
  /public           # Static assets
  /src
    /abi            # Blockchain contract ABIs
    /app            # Next.js App Router pages and layouts
      /api          # API routes
      /(routes)     # Various app routes/pages
    /components     # Reusable UI components
    /consts         # Constants and configuration values
    /hooks          # Custom React hooks
    /lib            # Utility functions and shared logic
    /server         # Utility for server
    /services       # API and blockchain interaction services
    /types          # TypeScript type definitions
    /utils          # Helper utilities
  /.env.example     # Environment variables example
  /.gitignore       # Git ignore file
  /next.config.ts   # Next.js configuration
  /package.json     # Project dependencies
  /tsconfig.json    # TypeScript configuration
  /README.md        # Project documentation
```

## Connecting to Other Services

The frontend interacts with:

- Blockchain contracts deployed on Base network
- AI agent for Trump-style responses
- Telegram bot integration

## Social Media

- Twitter: [@realTrumpFun](https://x.com/realTrumpFun)
- Truth Social: [@realDonaldTrump](https://truthsocial.com/@realDonaldTrump)
- Telegram: [trump_fun_bot](https://t.me/trump_fun_bot)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
