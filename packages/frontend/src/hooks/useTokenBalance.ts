'use client';

import { USDC_DECIMALS } from '@/consts';
import { POINTS_ADDRESS } from '@/consts/addresses';
import { TokenType } from '@trump-fun/common';
import { useEffect, useState } from 'react';
import { type Address } from 'viem';
import { useBalance } from 'wagmi';
import { GetBalanceData } from 'wagmi/query';
import { useTokenContext } from './useTokenContext';
import { useWalletAddress } from './useWalletAddress';

interface UseTokenBalanceOptions {
  /** Whether to enable the balance query */
  enabled?: boolean;
}

/**
 * A custom hook to fetch token balances using wagmi with Privy integration
 */
export const useTokenBalance = (tokenAddress?: Address, options: UseTokenBalanceOptions = {}) => {
  const { address, isConnected, chainId } = useWalletAddress();
  const { tokenType, getTokenAddress, tokenSymbol, tokenLogo } = useTokenContext();

  // Store separate balances for each token type to avoid mixing them up
  const [usdcBalance, setUsdcBalance] = useState<GetBalanceData>();
  const [nativeBalance, setNativeBalance] = useState<GetBalanceData>();

  // Track last token type to detect changes
  const [lastTokenType, setLastTokenType] = useState<TokenType | null>(null);

  // Get the correct token address based on token type
  let finalTokenAddress: Address | undefined;
  if (tokenType === TokenType.Points) {
    // For POINTS (native token), use undefined to fetch native balance
    finalTokenAddress = POINTS_ADDRESS;
  } else {
    // For USDC, use provided address or look it up from the token context
    finalTokenAddress = tokenAddress || (chainId ? getTokenAddress() || undefined : undefined);
  }

  // Only fetch if wallet is connected
  const shouldFetch = Boolean(isConnected && address && options.enabled !== false);

  // Get USDC balance
  const usdcBalanceResult = useBalance({
    address: shouldFetch && tokenType === TokenType.Usdc ? address : undefined,
    token: shouldFetch && tokenType === TokenType.Usdc ? finalTokenAddress : undefined,
    chainId: shouldFetch ? chainId : undefined,
  });

  // Get native token balance (ETH/POINTS)
  const nativeBalanceResult = useBalance({
    address: shouldFetch && tokenType === TokenType.Points ? address : undefined,
    token: shouldFetch && tokenType === TokenType.Points ? finalTokenAddress : undefined,
    chainId: shouldFetch ? chainId : undefined,
  });

  // Reset on token type change
  useEffect(() => {
    if (lastTokenType !== null && lastTokenType !== tokenType) {
      // Reset any token-specific state if needed
    }
    setLastTokenType(tokenType);
  }, [tokenType, lastTokenType]);

  // Store successful balances
  useEffect(() => {
    if (usdcBalanceResult.isSuccess && usdcBalanceResult.data) {
      setUsdcBalance(usdcBalanceResult.data);
    }
  }, [usdcBalanceResult.isSuccess, usdcBalanceResult.data]);

  useEffect(() => {
    if (nativeBalanceResult.isSuccess && nativeBalanceResult.data) {
      setNativeBalance(nativeBalanceResult.data);
    }
  }, [nativeBalanceResult.isSuccess, nativeBalanceResult.data]);

  // Get the appropriate balance object based on token type
  const activeResult = tokenType === TokenType.Points ? nativeBalanceResult : usdcBalanceResult;
  const cachedBalance = tokenType === TokenType.Points ? nativeBalance : usdcBalance;

  // Choose current balance or fallback to cached
  const finalBalance = activeResult.data || cachedBalance;

  // Get token decimals (6 for USDC, 18 for native tokens but display only 4 decimals)
  const tokenDecimals = tokenType === TokenType.Usdc ? USDC_DECIMALS : 18;
  // Don't show any decimals in the display (no cents allowed)

  // Format balance with proper decimal precision - no decimals for display
  const formattedBalance = finalBalance?.value
    ? Math.floor(Number(finalBalance.value) / Math.pow(10, finalBalance.decimals)).toString()
    : '0';

  // Determine loading and error states
  const isLoading = activeResult.isLoading;
  const isError = activeResult.isError;
  const refetch = activeResult.refetch;

  return {
    // Balance data
    balance: finalBalance,
    isError,
    isLoading,
    refetch,

    // Enhanced fields
    formattedBalance,
    symbol: tokenSymbol,
    decimals: finalBalance?.decimals || tokenDecimals,
    tokenLogo,
    hasValidWallet: shouldFetch,
  };
};
