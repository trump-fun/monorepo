'use client';

import { PublicKey, TokenAmount } from '@solana/web3.js';
import { useCallback, useEffect, useState } from 'react';
import { useTokenContext } from './useTokenContext';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isSolanaWallet } from '@dynamic-labs/solana';

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
  connecting,
  walletPublicKey,
}: {
  connecting: boolean;
  walletPublicKey: PublicKey;
}) => {
  const { tokenMint } = useTokenContext();
  const [tokenBalance, setTokenBalance] = useState<TokenAmount>(emptyTokenAmount);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { primaryWallet } = useDynamicContext();

  // Function to fetch the token balance
  const fetchTokenBalance = useCallback(async () => {
    setError(null);

    // Early returns for invalid states
    if (
      !tokenMint ||
      connecting ||
      !primaryWallet ||
      !isSolanaWallet(primaryWallet) ||
      !walletPublicKey
    ) {
      setTokenBalance(emptyTokenAmount);
      return;
    }

    try {
      setIsLoadingBalance(true);
      const connection = await primaryWallet.getConnection();

      if (!connection) {
        throw new Error('Failed to establish connection');
      }

      const tokenMintAddress = typeof tokenMint === 'string' ? new PublicKey(tokenMint) : tokenMint;
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
        mint: tokenMintAddress,
      });

      if (tokenAccounts.value.length === 0) {
        setTokenBalance(emptyTokenAmount);
        return;
      }

      const accountWithMostTokens = tokenAccounts.value.reduce((prev, current) => {
        const prevAmount = BigInt(prev.account.data.parsed.info.tokenAmount.amount);
        const currAmount = BigInt(current.account.data.parsed.info.tokenAmount.amount);
        return prevAmount > currAmount ? prev : current;
      });

      setTokenBalance(accountWithMostTokens.account.data.parsed.info.tokenAmount);
    } catch (err) {
      console.error('Error fetching token balance:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setTokenBalance(emptyTokenAmount);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [tokenMint, connecting, primaryWallet, walletPublicKey]);

  // Initial fetch when dependencies are ready
  useEffect(() => {
    if (!connecting && walletPublicKey && tokenMint) {
      fetchTokenBalance();
    }
  }, [connecting, walletPublicKey, tokenMint, fetchTokenBalance]);

  // Poll for balance updates
  useEffect(() => {
    if (connecting || !walletPublicKey || !tokenMint) return;

    const intervalId = setInterval(fetchTokenBalance, 10000); // Poll every 10 seconds
    return () => clearInterval(intervalId);
  }, [connecting, walletPublicKey, tokenMint, fetchTokenBalance]);

  return {
    tokenBalance,
    isLoadingBalance,
    error,
    refetch: fetchTokenBalance,
  };
};
