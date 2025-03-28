import { arbitrumSepolia, baseSepolia } from 'viem/chains';

export const DEFAULT_CHAIN_ID = baseSepolia.id; // Base chain ID
export const POINTS_ADDRESS = '0xA373482b473E33B96412a6c0cA8B847E6BBB4D0d';
export const APP_ADDRESS = '0x2E180501D3D68241dd0318c68fD9BE0AF1D519a1';
export const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
export const USDC_DECIMALS = 6;
export const POINTS_DECIMALS = 6;
export const POLLING_INTERVALS: Record<string, number> = {
  'landing-pools': 3000,
  'pool-listing': 5000,
  'pool-drilldown-main': 2000,
  'pool-drilldown-comments': 5000,
  'explore-pools': 10000,
  'user-profile': 2000,
  'user-bets': 10000,
};

// This config contains information that isn't in the viem chain info
// The viem chain info has the block explorer url, native currency, and other basic info if you need it.
export type ChainConfig = {
  freedomAddress: `0x${string}`;
  usdcAddress: `0x${string}`;
  appAddress: `0x${string}`;
  subgraphUrl: string;
};

export type SupportedChainIds = typeof baseSepolia.id | typeof arbitrumSepolia.id;

export const CHAIN_CONFIG: Record<SupportedChainIds, ChainConfig> = {
  [baseSepolia.id]: {
    freedomAddress: '0xA373482b473E33B96412a6c0cA8B847E6BBB4D0d',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    appAddress: '0x2E180501D3D68241dd0318c68fD9BE0AF1D519a1',
    subgraphUrl: 'https://api.studio.thegraph.com/query/60440/freedom-base-sepolia/version/latest',
  },
  [arbitrumSepolia.id]: {
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    freedomAddress: '0x743E76aA58Af8efa0169f5da412975ed84B95CBE',
    appAddress: '0x6104aFE7215de0b7A3c727aC08d71Fa349Ec37C9',
    subgraphUrl:
      'https://api.studio.thegraph.com/query/60440/freedom-arbitrum-sepolia/version/latest',
  },
};
