'use client';

import { useCallback, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { useNetwork } from './useNetwork';
import { useWalletAddress } from './useWalletAddress';
import { useSolanaTransaction } from './useSolanaTransaction';

/**
 * Interface for token balance information
 */
interface TokenBalanceInfo {
  mint: PublicKey;
  balance: number;
  decimals: number;
  uiBalance: number;
  symbol: string;
}

/**
 * Hook for working with Solana tokens
 */
export function useSolanaTokens() {
  const { publicKey, isConnected } = useWalletAddress();
  const { usdcMint, freedomMint } = useNetwork();
  const { getConnection } = useSolanaTransaction();
  const [isLoading, setIsLoading] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<{ [key: string]: TokenBalanceInfo }>({});

  /**
   * Get token account address for specific mint
   */
  const getTokenAccount = useCallback(
    async (walletAddress: PublicKey, mint: PublicKey): Promise<PublicKey | null> => {
      try {
        // Find associated token account address
        return await getAssociatedTokenAddress(mint, walletAddress, false, TOKEN_PROGRAM_ID);
      } catch (error) {
        console.error('Error getting token account:', error);
        return null;
      }
    },
    []
  );

  /**
   * Fetch balances for all tokens
   */
  const fetchBalances = useCallback(async () => {
    if (!isConnected || !publicKey) return;

    setIsLoading(true);
    try {
      const connection = getConnection();
      const results: { [key: string]: TokenBalanceInfo } = {};

      // Get USDC balance
      const usdcAccount = await getTokenAccount(publicKey, usdcMint);
      if (usdcAccount) {
        try {
          const usdcAccountInfo = await connection.getTokenAccountBalance(usdcAccount);
          results.usdc = {
            mint: usdcMint,
            balance: Number(usdcAccountInfo.value.amount),
            decimals: usdcAccountInfo.value.decimals,
            uiBalance: Number(usdcAccountInfo.value.uiAmount || 0),
            symbol: 'USDC',
          };
        } catch (e) {
          // Likely account doesn't exist yet
          results.usdc = {
            mint: usdcMint,
            balance: 0,
            decimals: 6,
            uiBalance: 0,
            symbol: 'USDC',
          };
        }
      }

      // Get FREEDOM balance
      const freedomAccount = await getTokenAccount(publicKey, freedomMint);
      if (freedomAccount) {
        try {
          const freedomAccountInfo = await connection.getTokenAccountBalance(freedomAccount);
          results.freedom = {
            mint: freedomMint,
            balance: Number(freedomAccountInfo.value.amount),
            decimals: freedomAccountInfo.value.decimals,
            uiBalance: Number(freedomAccountInfo.value.uiAmount || 0),
            symbol: 'FREEDOM',
          };
        } catch (e) {
          // Likely account doesn't exist yet
          results.freedom = {
            mint: freedomMint,
            balance: 0,
            decimals: 9,
            uiBalance: 0,
            symbol: 'FREEDOM',
          };
        }
      }

      setTokenBalances(results);
    } catch (error) {
      console.error('Error fetching token balances:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, publicKey, getTokenAccount, usdcMint, freedomMint, getConnection]);

  return {
    tokenBalances,
    isLoading,
    fetchBalances,
    getTokenAccount,
  };
}
