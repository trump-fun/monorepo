'use client';

import { freedomAbi } from '@trump-fun/common';
import { useEffect, useRef, useState } from 'react';
import { type Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { useTokenContext } from './useTokenContext';
import { useWalletAddress } from './useWalletAddress';

interface UseTokenBalanceOptions {
  /** Whether to enable the balance query */
  enabled?: boolean;
  /** Cooldown in milliseconds between balance fetches (default: 15000) */
  cooldownMs?: number;
}

interface TokenBalanceData {
  value: bigint;
  decimals: number;
  symbol: string;
  formatted: string;
}

/**
 * A custom hook to fetch token balances directly using contract reads
 */
export const useTokenBalance = (options: UseTokenBalanceOptions = {}) => {
  const { address, isConnected, chainId } = useWalletAddress();
  const { tokenType, tokenSymbol, tokenLogo, tokenDecimals, tokenAddress } = useTokenContext();
  const publicClient = usePublicClient();

  // Balance state
  const [balance, setBalance] = useState<TokenBalanceData | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Cooldown mechanism
  const lastFetchTimeRef = useRef<number>(0);
  const cooldownMs = options.cooldownMs ?? 5000; // Default 5 second cooldown

  // Only fetch if wallet is connected
  const shouldFetch = Boolean(isConnected && address && options.enabled !== false);

  // Fetch balance from contract
  useEffect(() => {
    // Skip if not ready to fetch
    if (!shouldFetch || !publicClient || !tokenAddress || !address) {
      return;
    }

    const fetchBalance = async () => {
      // Check cooldown
      const now = Date.now();
      if (now - lastFetchTimeRef.current < cooldownMs) {
        return;
      }

      setIsLoading(true);
      setIsError(false);
      lastFetchTimeRef.current = now;

      try {
        const tokenAddressHex = tokenAddress as Address;
        const balanceResult = await publicClient.readContract({
          abi: freedomAbi,
          address: tokenAddressHex,
          functionName: 'balanceOf',
          args: [address],
        });

        // Store result
        const balanceValue = balanceResult as bigint;

        setBalance({
          value: balanceValue,
          decimals: tokenDecimals,
          symbol: tokenSymbol,
          formatted: (balanceValue / BigInt(10 ** tokenDecimals)).toLocaleString(),
        });
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [
    shouldFetch,
    publicClient,
    tokenAddress,
    address,
    tokenType,
    tokenDecimals,
    tokenSymbol,
    chainId,
    cooldownMs,
  ]);

  // Format balance with proper decimal precision - no decimals for display
  const formattedBalance = balance?.value
    ? (balance.value / BigInt(10 ** balance.decimals)).toLocaleString()
    : '0';

  const refetch = async () => {
    // Check cooldown for manual refetches too
    const now = Date.now();
    if (now - lastFetchTimeRef.current < cooldownMs) {
      return;
    }

    // Reset error state
    setIsError(false);

    // Skip if not ready to fetch
    if (!shouldFetch || !publicClient || !tokenAddress || !address) {
      return;
    }

    setIsLoading(true);
    lastFetchTimeRef.current = now;

    try {
      const tokenAddressHex = tokenAddress as Address;
      const balanceResult = await publicClient.readContract({
        abi: freedomAbi,
        address: tokenAddressHex,
        functionName: 'balanceOf',
        args: [address],
      });

      // Store result
      const balanceValue = balanceResult as bigint;

      setBalance({
        value: balanceValue,
        decimals: tokenDecimals,
        symbol: tokenSymbol,
        formatted: (balanceValue / BigInt(10 ** tokenDecimals)).toLocaleString(),
      });
    } catch (error) {
      console.error('Error fetching token balance:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Balance data
    balance,
    isError,
    isLoading,
    refetch,

    // Enhanced fields
    formattedBalance,
    symbol: tokenSymbol,
    decimals: tokenDecimals,
    tokenLogo,
    hasValidWallet: shouldFetch,
  };
};
