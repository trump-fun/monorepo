import { PublicKey } from '@solana/web3.js';
import { arbitrumSepolia, baseSepolia } from 'viem/chains';
export const DEFAULT_CHAIN_ID = baseSepolia.id; // Base chain ID
export const USDC_DECIMALS = 6;
export const FREEDOM_DECIMALS = 6;
export const POLLING_INTERVALS: Record<string, number> = {
  'landing-pools': 3000,
  'pool-listing': 5000,
  'pool-card': 5000,
  'pool-drilldown-main': 2000,
  'pool-drilldown-comments': 5000,
  'explore-pools': 10000,
  'user-profile': 2000,
  'user-bets': 10000,
};
export const TRUMP_FUN_TWITTER_USERNAME = 'realTrumpFun';
export const TRUMP_FUN_TWITTER_URL = 'https://x.com/realTrumpFun';
export const TRUMP_FUN_TRUTH_SOCIAL_URL = 'https://truthsocial.com/@realDonaldTrump';
export const TRUMP_FUN_TG_URL = 'https://t.me/trump_fun_bot';
export const SUPABASE_BUCKET = `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || process.env.SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/trump-fun/`;

// This config contains information that isn't in the viem chain info
// The viem chain info has the block explorer url, native currency, and other basic info if you need it.
export type ChainConfig = {
  freedomAddress: `0x${string}`;
  usdcAddress: `0x${string}`;
  appAddress: `0x${string}`;
};

export type SupportedChainIds = typeof baseSepolia.id | typeof arbitrumSepolia.id;

export const CHAIN_CONFIG: Record<SupportedChainIds, ChainConfig> = {
  [baseSepolia.id]: {
    freedomAddress: '0x634AFEA4d8cbE4C1Deb5b5fDe992f92E92AD4214',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    appAddress: '0xE3092b0FEeD0eEdCD941B98B006b227C3ee924C4',
  },
  [arbitrumSepolia.id]: {
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    freedomAddress: '0x743E76aA58Af8efa0169f5da412975ed84B95CBE',
    appAddress: '0x6104aFE7215de0b7A3c727aC08d71Fa349Ec37C9',
  },
};

export const SOLANA_DEVNET_CONFIG = {
  rpcUrl: 'https://api.devnet.solana.com',
  programId: new PublicKey('i6PRmGAi4rZrvAJeLCskWCE8gTnYmUeoJaHpsu1XUtK'),
  freedomMint: new PublicKey('F1dQHEE2ZDnXzYb6znLY8TwHLdxgkgcUSwCuJmo8Fcp5'),
  usdcMint: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
};

export const BETTING_POOLS_SEED = Buffer.from('betting_pools_v7');
export const POOL_SEED = Buffer.from('pool_v3');
export const BET_SEED = Buffer.from('bet_v1');
