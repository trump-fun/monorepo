/**
 * Configuration module for environment variables
 */

import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
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
  openaiApiKey: string;
  anthropicApiKey: string;
  tavilyApiKey: string;
  newsApiKey: string;
  truthSocialApiUrl: string;
  trumpTruthSocialId: string;
  small_llm: ChatAnthropic;
  cheap_large_llm: ChatGoogleGenerativeAI;
  large_llm: ChatAnthropic;
  fluxApiKey: string;
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

// Required API keys
const openaiApiKey = requireEnv('OPENAI_API_KEY');
const anthropicApiKey = requireEnv('ANTHROPIC_API_KEY');
const googleGenerativeAiApiKey = requireEnv('GOOGLE_GENERATIVE_AI_API_KEY');

// Initialize models
// const small_llm = new ChatAnthropic({
//   modelName: 'claude-3-5-haiku-20241022',
//   anthropicApiKey: anthropicApiKey,
// });
const small_llm = new ChatGoogleGenerativeAI({
  model: 'gemini-2.0-flash', //Can use gemini-2.0-flash-lite too
  apiKey: googleGenerativeAiApiKey,
});

const cheap_large_llm = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-pro-exp-03-25',
  apiKey: googleGenerativeAiApiKey,
});

const large_llm = new ChatAnthropic({
  modelName: 'claude-3-7-sonnet-20250219',
  anthropicApiKey: anthropicApiKey,
});

// const small_llm = new ChatOpenAI({
//   modelName: "gpt-4o-mini",
//   openAIApiKey: openaiApiKey,
// });
// const large_llm = new ChatOpenAI({
//   modelName: "gpt-4o",
//   openAIApiKey: openaiApiKey,
// });

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
  openaiApiKey,
  anthropicApiKey,
  tavilyApiKey: requireEnv('TAVILY_API_KEY'),
  newsApiKey: requireEnv('NEWS_API_KEY'),
  truthSocialApiUrl: process.env.TRUTH_SOCIAL_API_URL || 'https://truthsocial.com/api/v1',
  trumpTruthSocialId: process.env.TRUMP_TRUTH_SOCIAL_ID || '107780257626128497',
  small_llm,
  cheap_large_llm,
  large_llm,
  fluxApiKey: requireEnv('BFL_API_KEY'),
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
