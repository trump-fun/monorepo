'use client';

import { TokenType } from '@/types';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useCallback, useEffect, useState } from 'react';
import { useDynamicSolana } from './useDynamicSolana';
import { useNetwork } from './useNetwork';
import { useTokenContext } from './useTokenContext';

export const useBalance = () => {
  const { usdcMint, freedomMint } = useNetwork();
  const { tokenType } = useTokenContext();
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [freedomBalance, setFreedomBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, publicKey, getConnection } = useDynamicSolana();

  // Fetch both USDC and Freedom token balances
  const fetchTokenBalances = useCallback(async () => {
    // Reset state at the beginning of each fetch attempt
    setError(null);

    // Check if wallet is ready
    if (!isAuthenticated || !publicKey) {
      setUsdcBalance('0');
      setFreedomBalance('0');
      return;
    }

    if (!usdcMint || !freedomMint) {
      setUsdcBalance('0');
      setFreedomBalance('0');
      return;
    }

    try {
      setIsLoadingBalance(true);

      // Get connection
      const conn = await getConnection();

      // Find all token accounts owned by the wallet
      const tokenAccounts = await conn.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      // Convert mint addresses to string format for comparison
      const usdcMintStr = typeof usdcMint === 'string' ? usdcMint : usdcMint.toString();
      const freedomMintStr = typeof freedomMint === 'string' ? freedomMint : freedomMint.toString();

      // Initialize with zero balances
      let usdcAmount = '0';
      let freedomAmount = '0';

      // Find the specific token accounts that match our mint addresses
      for (const tokenAccount of tokenAccounts.value) {
        const accountData = tokenAccount.account.data.parsed.info;
        const mintAddress = accountData.mint;
        const tokenAmount = accountData.tokenAmount;

        if (mintAddress === usdcMintStr) {
          usdcAmount = parseFloat(tokenAmount.uiAmountString || '0').toString();
        } else if (mintAddress === freedomMintStr) {
          freedomAmount = parseFloat(tokenAmount.uiAmountString || '0').toString();
        }
      }

      // Set balances based on what we found
      setUsdcBalance(usdcAmount);
      setFreedomBalance(freedomAmount);
    } catch (error) {
      console.error('[DEBUG] Error fetching token balances:', error);
      setError(
        `Failed to fetch token balances: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      // Don't reset balances on error, keep previous values
    } finally {
      setIsLoadingBalance(false);
    }
  }, [isAuthenticated, publicKey, getConnection, usdcMint, freedomMint]);

  // Trigger a balance fetch when dependencies change
  useEffect(() => {
    if (isAuthenticated && publicKey) {
      fetchTokenBalances();
    }
  }, [fetchTokenBalances, isAuthenticated, publicKey]);

  // Set up polling interval for balance updates
  useEffect(() => {
    if (!isAuthenticated || !publicKey) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchTokenBalances();
    }, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchTokenBalances, isAuthenticated, publicKey]);

  // Return balance based on selected token type, plus both balances individually
  const currentBalance = tokenType === TokenType.Usdc ? usdcBalance : freedomBalance;

  return {
    currentBalance: currentBalance || '0',
    usdcBalance: usdcBalance || '0',
    freedomBalance: freedomBalance || '0',
    isLoadingBalance,
    error,
    refetch: fetchTokenBalances,
  };
};
