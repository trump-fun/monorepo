'use client';

import { useBalance } from './usePointsBalance';

// Re-export the interface for backwards compatibility
export interface TokenBalances {
  usdcBalance: string;
  freedomBalance: string;
  isLoading: boolean;
  error: Error | null;
}

/**
 * @deprecated Use useBalance from usePointsBalance.ts directly
 * This hook is kept for backwards compatibility
 */
export function useSolanaTokens(): {
  balances: TokenBalances;
  fetchBalances: () => Promise<void>;
} {
  const { usdcBalance, freedomBalance, isLoadingBalance, error, refetch } = useBalance();

  // Format the return object to match the original interface
  const balances: TokenBalances = {
    usdcBalance: usdcBalance || '0',
    freedomBalance: freedomBalance || '0',
    isLoading: isLoadingBalance,
    error: error ? new Error(error) : null,
  };

  return {
    balances,
    fetchBalances: refetch,
  };
}
