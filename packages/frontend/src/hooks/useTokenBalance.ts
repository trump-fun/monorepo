'use client';

import { useTokenContext } from './useTokenContext';
import { useBalance as usePrivyBalance } from './usePointsBalance';
import { TokenType } from '@/types';

export function useTokenBalance() {
  const { tokenType, tokenSymbol, tokenLogo, tokenDecimals, tokenMint } = useTokenContext();
  const { usdcBalance, isLoadingBalance, error, refetch } = usePrivyBalance();

  return {
    formattedBalance: usdcBalance || '0',
    rawBalance: usdcBalance ? BigInt(usdcBalance) : BigInt(0),
    symbol: tokenSymbol,
    tokenType,
    isLoading: isLoadingBalance,
    error,
    refetch,
    isValid: Boolean(usdcBalance) && !isLoadingBalance && !error,
    isUSDC: tokenType === TokenType.Usdc,
    isFreedom: tokenType === TokenType.Freedom,
    tokenLogo,
    tokenDecimals,
    tokenMint,
    tokenAddress: tokenMint,
  };
}
