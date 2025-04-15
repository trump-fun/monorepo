import { CHAIN_CONFIG } from '@trump-fun/common';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const env = process.env.NODE_ENV || 'development';

// Default configuration
const config = {
  env,
  isDev: env === 'development',
  isProd: env === 'production',
  bot: {
    token: process.env.BOT_ID || '',
    webhookUrl: process.env.WEBHOOK_URL || '',
    useWebhook: process.env.USE_WEBHOOK === 'true',
  },
  chain: {
    id: 84532,
    rpcUrl: 'https://sepolia.base.org',
    appAddress: CHAIN_CONFIG[84532].appAddress as `0x${string}`,
    freedomAddress: CHAIN_CONFIG[84532].freedomAddress as `0x${string}`,
    usdcAddress: CHAIN_CONFIG[84532].usdcAddress as `0x${string}`,
    explorerUrl: 'https://sepolia.basescan.org',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_SERVICE_KEY || '',
  },
  privy: {
    appId: process.env.PRIVY_APP_ID || '',
    appSecret: process.env.PRIVY_APP_SECRET || '',
  },
  apollo: {
    uri: process.env.INDEXER_URL || '',
    apiKey: process.env.INDEXER_API_KEY || '',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  pagination: {
    defaultLimit: 5,
    maxLimit: 10,
  },
};

// Validate required config values
if (!config.bot.token) {
  throw new Error('BOT_ID environment variable is required');
}

if (!config.supabase.url || !config.supabase.key) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY environment variables are required');
}

if (!config.privy.appId || !config.privy.appSecret) {
  throw new Error('PRIVY_APP_ID and PRIVY_APP_SECRET environment variables are required');
}

export default config;
