/**
 * Configuration module for environment variables
 */

import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@trump-fun/common';
import { baseSepolia, type Chain } from 'viem/chains';
export const DEFAULT_CHAIN_ID = baseSepolia.id;

export type BettingChainConfig = {
  chain: Chain;
  subgraphUrl: string;
  subgraphApiKey: string;
  rpcUrl: string;
  contractAddress: `0x${string}`;
  privateKey: `0x${string}`;
};

export type AppConfig = {
  tavilyApiKey: string;
  newsApiKey: string;
  truthSocialApiUrl: string;
  trumpTruthSocialId: string;
  small_llm: ChatAnthropic | ChatGoogleGenerativeAI | ChatOpenAI;
  cheap_large_llm: ChatAnthropic | ChatGoogleGenerativeAI | ChatOpenAI;
  large_llm: ChatAnthropic | ChatGoogleGenerativeAI | ChatOpenAI;
  fluxApiKey: string;
  firecrawlApiKey: string;
  maxImagesPerRun: number;
  fluxModel: string;
  chainConfig: {
    [chainId: number]: BettingChainConfig;
  };
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

// Initialize models based on providers
let small_llm;
let openaiApiKey = '';
let anthropicApiKey = '';
let googleGenerativeAiApiKey = '';

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
} else {
  throw new Error(
    `Invalid SMALL_LLM_PROVIDER: ${SMALL_LLM_PROVIDER}. Must be 'anthropic', 'google', or 'openai'`
  );
}

let cheap_large_llm;
if (CHEAP_LARGE_LLM_PROVIDER === 'anthropic') {
  if (!anthropicApiKey) {
    anthropicApiKey = requireEnv('ANTHROPIC_API_KEY');
  }
  cheap_large_llm = new ChatAnthropic({
    modelName: ANTHROPIC_SMALL_LLM, // Using small model for cost efficiency
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
} else {
  throw new Error(
    `Invalid CHEAP_LARGE_LLM_PROVIDER: ${CHEAP_LARGE_LLM_PROVIDER}. Must be 'anthropic', 'google', or 'openai'`
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
} else {
  throw new Error(
    `Invalid LARGE_LLM_PROVIDER: ${LARGE_LLM_PROVIDER}. Must be 'anthropic', 'google', or 'openai'`
  );
}

const fluxModel = process.env.FLUX_MODEL || 'flux-dev';
if (
  fluxModel !== 'flux-dev' &&
  fluxModel !== 'flux-pro-1.1' &&
  fluxModel !== 'flux-pro' &&
  fluxModel !== 'lux-pro-1.1-ultra'
) {
  throw new Error(`Invalid FLUX_MODEL: ${fluxModel}`);
}

// Export config object for convenience
export const config = {
  tavilyApiKey: requireEnv('TAVILY_API_KEY'),
  newsApiKey: requireEnv('NEWS_API_KEY'),
  truthSocialApiUrl: process.env.TRUTH_SOCIAL_API_URL || 'https://truthsocial.com/api/v1',
  trumpTruthSocialId: process.env.TRUMP_TRUTH_SOCIAL_ID || '107780257626128497',
  small_llm,
  cheap_large_llm,
  large_llm,
  fluxApiKey: requireEnv('BFL_API_KEY'),
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY || '',
  maxImagesPerRun: Number(process.env.MAX_IMAGES_PER_RUN || '3'),
  fluxModel,
  chainConfig: {
    [baseSepolia.id]: {
      chain: baseSepolia,
      subgraphUrl: requireEnv('BASE_SEPOLIA_SUBGRAPH_URL'),
      subgraphApiKey: requireEnv('BASE_SEPOLIA_SUBGRAPH_API_KEY'),
      rpcUrl: requireEnv('BASE_SEPOLIA_RPC_URL'),
      contractAddress: requireEnv('BASE_SEPOLIA_BETTING_CONTRACT_ADDRESS') as `0x${string}`,
      privateKey: requireEnv('BASE_SEPOLIA_PRIVATE_KEY') as `0x${string}`,
    } as BettingChainConfig,
  },
};

export const supabase = createClient<Database>(
  requireEnv('SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_KEY')
);

export default config;
