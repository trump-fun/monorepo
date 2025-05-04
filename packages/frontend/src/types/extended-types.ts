import { Bet, BetPlaced, Pool } from './__generated__/graphql';

// Extend the Pool type with missing properties
export interface ExtendedPool extends Omit<Pool, '__typename'> {
  imageUrl?: string;
  mediaUrl?: string;
  pointsBetTotals?: string[];
  usdcBetTotals?: string[];
  originalTruthSocialPostId?: string;
}

// Extend Bet type with additional required properties
export interface ExtendedBet extends Omit<Bet, '__typename' | 'pool'> {
  pool: ExtendedPool;
}

// Extend BetPlaced type with additional required properties
export interface ExtendedBetPlaced extends Omit<BetPlaced, '__typename'> {
  bet: ExtendedBet;
  createdAt: string;
  pool: ExtendedPool;
  txHash: string;
}

// Type guard to ensure a pool has the extended properties
export function isExtendedPool(pool: Pool | any): pool is ExtendedPool {
  return pool !== null && typeof pool === 'object';
}

// Helper function to cast a Pool to ExtendedPool
export function asExtendedPool(pool: Pool | null): ExtendedPool | null {
  return pool as ExtendedPool | null;
}
