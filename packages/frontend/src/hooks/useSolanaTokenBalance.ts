'use client';

import { Connection, PublicKey, TokenAmount } from '@solana/web3.js';
import { useCallback, useEffect, useState } from 'react';
import { useTokenContext } from './useTokenContext';

// Create empty token amount object
const emptyTokenAmount: TokenAmount = {
  amount: '0',
  decimals: 6,
  uiAmount: 0,
  uiAmountString: '0',
};

/**
 * Custom hook to fetch token balance for a connected Solana wallet
 */
export const useSolanaTokenBalance = ({
  connection,
  connecting,
  walletPublicKey,
}: {
  connection: Connection;
  connecting: boolean;
  walletPublicKey: PublicKey;
}) => {
  const { tokenMint } = useTokenContext();
  const [tokenBalance, setTokenBalance] = useState<TokenAmount | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch the token balance
  const fetchTokenBalance = useCallback(async () => {
    // Reset state at the beginning of each fetch attempt
    setError(null);

    // Check prerequisites
    if (!tokenMint) {
      console.debug('No token mint address found when fetching Solana token balance');
      setTokenBalance(emptyTokenAmount);
      return;
    }

    if (connecting) {
      console.debug('Wallet is still connecting when fetching Solana token balance');
      setTokenBalance(emptyTokenAmount);
      return;
    }

    if (!connection) {
      console.debug('No connection found when fetching Solana token balance');
      setTokenBalance(emptyTokenAmount);
      return;
    }

    if (!walletPublicKey) {
      console.debug('No wallet public key found when fetching Solana token balance');
      setTokenBalance(emptyTokenAmount);
      return;
    }

    try {
      setIsLoadingBalance(true);

      // Get the associated token account for the token mint and wallet
      const tokenMintAddress = typeof tokenMint === 'string' ? new PublicKey(tokenMint) : tokenMint;

      // Find all token accounts owned by the wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
        mint: tokenMintAddress,
      });

      // If no accounts found, return zero balance
      if (tokenAccounts.value.length === 0) {
        setTokenBalance(emptyTokenAmount);
        return;
      }

      // Get the account with the most tokens (usually just one)
      const accountWithMostTokens = tokenAccounts.value.reduce((prev, current) => {
        const prevAmount = BigInt(prev.account.data.parsed.info.tokenAmount.amount);
        const currAmount = BigInt(current.account.data.parsed.info.tokenAmount.amount);
        return prevAmount > currAmount ? prev : current;
      });

      const balance: TokenAmount = accountWithMostTokens.account.data.parsed.info.tokenAmount;
      setTokenBalance(balance);
    } catch (err) {
      console.error('Error fetching token balance:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setTokenBalance(emptyTokenAmount);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [tokenMint, connecting, connection, walletPublicKey]);

  // Trigger a balance fetch when dependencies change
  useEffect(() => {
    if (connection && !connecting && walletPublicKey && tokenMint) {
      fetchTokenBalance();
    }
  }, [connection, connecting, walletPublicKey, tokenMint, fetchTokenBalance]);

  // Poll for balance updates
  useEffect(() => {
    if (!connection || !walletPublicKey || !tokenMint) return;

    const intervalId = setInterval(fetchTokenBalance, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [connection, tokenMint, fetchTokenBalance, walletPublicKey]);

  return {
    tokenBalance,
    isLoadingBalance,
    error,
    refetch: fetchTokenBalance,
  };
};
