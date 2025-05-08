'use client';

import { useTokenContext } from './useTokenContext';
import { useBalance } from './usePointsBalance';
import { TokenType } from '@/types';

export function useTokenBalance() {
  const { tokenType, tokenSymbol, tokenLogo, tokenDecimals, tokenMint } = useTokenContext();
  const { usdcBalance, freedomBalance, isLoadingBalance, error, refetch } = useBalance();

  // Determine which balance to return based on token type
  const currentBalance = tokenType === TokenType.Usdc ? usdcBalance : freedomBalance;

  // Handle the balance parsing safely - ensure we work with valid numbers
  const safeCurrentBalance = currentBalance ? currentBalance : '0';
  let rawBalance = BigInt(0);

  try {
    // Convert to BigInt safely, handling any potential formatting issues
    const numericBalance = parseFloat(safeCurrentBalance);
    if (!isNaN(numericBalance)) {
      rawBalance = BigInt(Math.floor(numericBalance));
    }
  } catch (e) {
    console.error('Error parsing balance to BigInt:', e);
  }

  return {
    formattedBalance: safeCurrentBalance,
    rawBalance,
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
