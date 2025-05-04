'use client';

import { useTokenContext } from './useTokenContext';
import { useBalance } from './usePointsBalance';
import { TokenType } from '@/types';

export function useTokenBalance() {
  const { tokenType, tokenSymbol, tokenLogo, tokenDecimals, tokenMint } = useTokenContext();
  const { usdcBalance, freedomBalance, isLoadingBalance, error, refetch } = useBalance();

  // Determine which balance to return based on token type
  const currentBalance = tokenType === TokenType.Usdc ? usdcBalance : freedomBalance;

  return {
    formattedBalance: currentBalance || '0',
    rawBalance: currentBalance ? BigInt(currentBalance) : BigInt(0),
    symbol: tokenSymbol,
    tokenType,
    isLoading: isLoadingBalance,
    error,
    refetch,
    isValid: Boolean(currentBalance) && !isLoadingBalance && !error,
    isUSDC: tokenType === TokenType.Usdc,
    isFreedom: tokenType === TokenType.Freedom,
    tokenLogo,
    tokenDecimals,
    tokenMint,
    tokenAddress: tokenMint,
    // Include both token balances for components that need access to both
    usdcBalance: usdcBalance || '0',
    freedomBalance: freedomBalance || '0',
  };
}
