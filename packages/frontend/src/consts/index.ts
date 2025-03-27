export const USDC_DECIMALS = 6; // USDC has 6 decimals
export const POINTS_DECIMALS = USDC_DECIMALS; // Points has 6 decimals
export const CHAIN_ID = 84532; // Base chain ID

export const POLLING_INTERVALS: Record<string, number> = {
  'landing-pools': 3000,
  'pool-listing': 5000,
  'pool-drilldown-main': 2000,
  'pool-drilldown-comments': 5000,
  'explore-pools': 10000,
  'user-profile': 2000,
  'user-bets': 10000,
};
