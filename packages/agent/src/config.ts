/**
 * Configuration module for environment variables
 */

import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import type { ChainConfig, Database } from '@trump-fun/common';
import { SOLANA_DEVNET_CONFIG } from '@trump-fun/common/src/config';
import { baseSepolia, type Chain } from 'viem/chains';
import { getSolanaClient, type SolanaClientResult } from './solana';

// Define Solana constants
const BETTING_POOLS_SEED = Buffer.from('betting_pools');
// export const DEFAULT_CHAIN_ID = process.env.CHAIN_ID || baseSepolia.id.toString();
export const DEFAULT_CHAIN_ID = process.env.CHAIN_ID || 'solana-devnet';

export type EvmChainConfig = {
  chainType: 'evm';
  chain: Chain;
  subgraphUrl: string;
  subgraphApiKey: string;
  rpcUrl: string;
  contractAddress: `0x${string}`;
  privateKey: `0x${string}`;
};

export type SolanaChainConfig = {
  chainType: 'solana';
  cluster: 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';
  rpcUrl: string;
  programId: PublicKey;
  appPda: PublicKey;
  privateKey: string;
  freedomMint: PublicKey;
  usdcMint: PublicKey;
  client: SolanaClientResult;
};

// Legacy type for backward compatibility
export type BettingChainConfig = EvmChainConfig | SolanaChainConfig;

export type AppConfig = {
  tavilyApiKey: string;
  newsApiKey: string;
  truthSocialApiUrl: string;
  trumpTruthSocialId: string;
  small_llm: ChatAnthropic | ChatGoogleGenerativeAI | ChatOpenAI;
  cheap_large_llm: ChatAnthropic | ChatGoogleGenerativeAI | ChatOpenAI;
  large_llm: ChatAnthropic | ChatGoogleGenerativeAI | ChatOpenAI;
  imageProvider: string;
  imageModel: string;
  bflApiKey: string; // Need raw API key to make REST requests to image provider, no SDK
  veniceApiKey: string; // Need raw API key to make REST requests to image provider, no SDK
  firecrawlApiKey: string;
  daturaApiKey: string; // Datura API key for X/Twitter and AI search integration
  maxImagesPerRun: number;
  chainConfig: Record<string, ChainConfig>;
};

/**
 * Checks if an environment variable is set and returns its value
 * Throws an error if the variable is not set
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

// Get LLM provider configurations
const SMALL_LLM_PROVIDER = requireEnv('SMALL_LLM_PROVIDER').toLowerCase();
const LARGE_LLM_PROVIDER = requireEnv('LARGE_LLM_PROVIDER').toLowerCase();
const CHEAP_LARGE_LLM_PROVIDER =
  process.env.CHEAP_LARGE_LLM_PROVIDER?.toLowerCase() || LARGE_LLM_PROVIDER;

// LLM model configurations with defaults
const OPENAI_SMALL_LLM = process.env.OPENAI_SMALL_LLM || 'gpt-4o-mini';
const OPENAI_LARGE_LLM = process.env.OPENAI_LARGE_LLM || 'gpt-4o';
const ANTHROPIC_SMALL_LLM = process.env.ANTHROPIC_SMALL_LLM || 'claude-3-5-haiku-20241022';
const ANTHROPIC_LARGE_LLM = process.env.ANTHROPIC_LARGE_LLM || 'claude-3-7-sonnet-20250219';
const GOOGLE_GENERATIVE_AI_SMALL_LLM =
  process.env.GOOGLE_GENERATIVE_AI_SMALL_LLM || 'gemini-2.0-flash-lite';
const GOOGLE_GENERATIVE_AI_LARGE_LLM =
  process.env.GOOGLE_GENERATIVE_AI_LARGE_LLM || 'gemini-2.5-pro-exp-03-25';
const VENICE_SMALL_LLM = process.env.VENICE_SMALL_LLM || 'mistral-31-24b';
const VENICE_LARGE_LLM = process.env.VENICE_LARGE_LLM || 'mistral-31-24b';
const VENICE_BASE_URL = 'https://api.venice.ai/api/v1/'; //TODO This should code from env

// Image provider configuration
const IMAGE_PROVIDER = process.env.IMAGE_PROVIDER?.toLowerCase() || 'bfl';
const BFL_IMAGE_MODEL = process.env.BFL_IMAGE_MODEL || 'flux-dev';
const VENICE_IMAGE_MODEL = process.env.VENICE_IMAGE_MODEL || 'flux-dev-uncensored';

// Initialize models based on providers
let small_llm;
let openaiApiKey = '';
let anthropicApiKey = '';
let googleGenerativeAiApiKey = '';
let veniceApiKey = '';

if (SMALL_LLM_PROVIDER === 'anthropic') {
  small_llm = new ChatAnthropic({
    modelName: ANTHROPIC_SMALL_LLM,
    anthropicApiKey: requireEnv('ANTHROPIC_API_KEY'),
  });
} else if (SMALL_LLM_PROVIDER === 'google') {
  small_llm = new ChatGoogleGenerativeAI({
    model: GOOGLE_GENERATIVE_AI_SMALL_LLM,
    apiKey: requireEnv('GOOGLE_GENERATIVE_AI_API_KEY'),
  });
} else if (SMALL_LLM_PROVIDER === 'openai') {
  small_llm = new ChatOpenAI({
    modelName: OPENAI_SMALL_LLM,
    openAIApiKey: requireEnv('OPENAI_API_KEY'),
  });
} else if (SMALL_LLM_PROVIDER === 'venice') {
  veniceApiKey = requireEnv('VENICE_API_KEY');
  small_llm = new ChatOpenAI({
    modelName: VENICE_SMALL_LLM,
    openAIApiKey: veniceApiKey,
    configuration: {
      baseURL: VENICE_BASE_URL,
    },
  });
} else {
  throw new Error(
    `Invalid SMALL_LLM_PROVIDER: ${SMALL_LLM_PROVIDER}. Must be 'anthropic', 'google', 'openai', or 'venice'`
  );
}

//TODO This config element poorly implemented, should have CHEAP_LARGE_LLM_MODEL envvars for each provider
let cheap_large_llm;
if (CHEAP_LARGE_LLM_PROVIDER === 'anthropic') {
  if (!anthropicApiKey) {
    anthropicApiKey = requireEnv('ANTHROPIC_API_KEY');
  }
  cheap_large_llm = new ChatAnthropic({
    modelName: ANTHROPIC_LARGE_LLM, // The only sarcastic line in this file
    anthropicApiKey,
  });
} else if (CHEAP_LARGE_LLM_PROVIDER === 'google') {
  if (!googleGenerativeAiApiKey) {
    googleGenerativeAiApiKey = requireEnv('GOOGLE_GENERATIVE_AI_API_KEY');
  }
  cheap_large_llm = new ChatGoogleGenerativeAI({
    model: GOOGLE_GENERATIVE_AI_LARGE_LLM,
    apiKey: googleGenerativeAiApiKey,
  });
} else if (CHEAP_LARGE_LLM_PROVIDER === 'openai') {
  if (!openaiApiKey) {
    openaiApiKey = requireEnv('OPENAI_API_KEY');
  }
  cheap_large_llm = new ChatOpenAI({
    modelName: OPENAI_SMALL_LLM, // Using small model for cost efficiency
    openAIApiKey: openaiApiKey,
  });
} else if (CHEAP_LARGE_LLM_PROVIDER === 'venice') {
  if (!veniceApiKey) {
    veniceApiKey = requireEnv('VENICE_API_KEY');
  }
  cheap_large_llm = new ChatOpenAI({
    modelName: VENICE_SMALL_LLM, // Using small model for cost efficiency
    openAIApiKey: veniceApiKey,
    configuration: {
      baseURL: VENICE_BASE_URL,
    },
  });
} else {
  throw new Error(
    `Invalid CHEAP_LARGE_LLM_PROVIDER: ${CHEAP_LARGE_LLM_PROVIDER}. Must be 'anthropic', 'google', 'openai', or 'venice'`
  );
}

let large_llm;
if (LARGE_LLM_PROVIDER === 'anthropic') {
  if (!anthropicApiKey) {
    anthropicApiKey = requireEnv('ANTHROPIC_API_KEY');
  }
  large_llm = new ChatAnthropic({
    modelName: ANTHROPIC_LARGE_LLM,
    anthropicApiKey,
  });
} else if (LARGE_LLM_PROVIDER === 'google') {
  if (!googleGenerativeAiApiKey) {
    googleGenerativeAiApiKey = requireEnv('GOOGLE_GENERATIVE_AI_API_KEY');
  }
  large_llm = new ChatGoogleGenerativeAI({
    model: GOOGLE_GENERATIVE_AI_LARGE_LLM,
    apiKey: googleGenerativeAiApiKey,
  });
} else if (LARGE_LLM_PROVIDER === 'openai') {
  if (!openaiApiKey) {
    openaiApiKey = requireEnv('OPENAI_API_KEY');
  }
  large_llm = new ChatOpenAI({
    modelName: OPENAI_LARGE_LLM,
    openAIApiKey: openaiApiKey,
  });
} else if (LARGE_LLM_PROVIDER === 'venice') {
  if (!veniceApiKey) {
    veniceApiKey = requireEnv('VENICE_API_KEY');
  }
  large_llm = new ChatOpenAI({
    modelName: VENICE_LARGE_LLM,
    openAIApiKey: veniceApiKey,
    configuration: {
      baseURL: VENICE_BASE_URL,
    },
  });
} else {
  throw new Error(
    `Invalid LARGE_LLM_PROVIDER: ${LARGE_LLM_PROVIDER}. Must be 'anthropic', 'google', 'openai', or 'venice'`
  );
}

// Validate image model
if (
  IMAGE_PROVIDER === 'bfl' &&
  BFL_IMAGE_MODEL !== 'flux-dev' &&
  BFL_IMAGE_MODEL !== 'flux-pro-1.1' &&
  BFL_IMAGE_MODEL !== 'flux-pro' &&
  BFL_IMAGE_MODEL !== 'lux-pro-1.1-ultra'
) {
  throw new Error(`Invalid BFL_IMAGE_MODEL: ${BFL_IMAGE_MODEL}`);
}

// Define the initial chain config
const initialChainConfig: Record<string, BettingChainConfig> = {
  [baseSepolia.id]: {
    chainType: 'evm',
    chain: baseSepolia,
    subgraphUrl: requireEnv('BASE_SEPOLIA_SUBGRAPH_URL'),
    subgraphApiKey: requireEnv('BASE_SEPOLIA_SUBGRAPH_API_KEY'),
    rpcUrl: requireEnv('BASE_SEPOLIA_RPC_URL'),
    contractAddress: requireEnv('BASE_SEPOLIA_BETTING_CONTRACT_ADDRESS') as `0x${string}`,
    privateKey: requireEnv('BASE_SEPOLIA_PRIVATE_KEY') as `0x${string}`,
  },
  'solana-devnet': {
    chainType: 'solana',
    cluster: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    programId: SOLANA_DEVNET_CONFIG.programId,
    appPda: PublicKey.findProgramAddressSync(
      [BETTING_POOLS_SEED],
      SOLANA_DEVNET_CONFIG.programId
    )[0],
    privateKey: requireEnv('SOLANA_DEVNET_PRIVATE_KEY'),
    freedomMint: SOLANA_DEVNET_CONFIG.freedomMint,
    usdcMint: SOLANA_DEVNET_CONFIG.usdcMint,
    client: getSolanaClient({
      privateKeyString: requireEnv('SOLANA_DEVNET_PRIVATE_KEY'),
      config: {
        rpcUrl: 'https://api.devnet.solana.com',
        cluster: 'devnet',
        programId: SOLANA_DEVNET_CONFIG.programId,
      },
    }),
  },
};

// Export config object for convenience
export const config = {
  tavilyApiKey: requireEnv('TAVILY_API_KEY'),
  newsApiKey: requireEnv('NEWS_API_KEY'),
  daturaApiKey: requireEnv('DATURA_API_KEY'),
  truthSocialApiUrl: process.env.TRUTH_SOCIAL_API_URL || 'https://truthsocial.com/api/v1',
  trumpTruthSocialId: process.env.TRUMP_TRUTH_SOCIAL_ID || '107780257626128497',
  small_llm,
  cheap_large_llm,
  large_llm,
  imageProvider: IMAGE_PROVIDER,
  imageModel: IMAGE_PROVIDER === 'bfl' ? BFL_IMAGE_MODEL : VENICE_IMAGE_MODEL,
  bflApiKey: requireEnv('BFL_API_KEY'),
  veniceApiKey: veniceApiKey || requireEnv('VENICE_API_KEY'),
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY || '',
  maxImagesPerRun: Number(process.env.MAX_IMAGES_PER_RUN || '3'),
  chainConfig: initialChainConfig,
};

export const supabase = createClient<Database>(
  requireEnv('SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_KEY')
);

export default config;
