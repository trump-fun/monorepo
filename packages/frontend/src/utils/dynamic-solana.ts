'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { SolanaWallet } from '@dynamic-labs/solana';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Hook for handling Solana wallet functionality with Dynamic
 */
export function useDynamicSolana() {
  const { primaryWallet, isAuthenticated, user } = useDynamicContext();
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);

  // Get the Solana wallet instance from Dynamic
  const solanaWallet = useMemo(() => {
    if (!primaryWallet || primaryWallet.connector.name !== 'Solana') {
      return null;
    }
    return primaryWallet as SolanaWallet;
  }, [primaryWallet]);

  // Update public key when wallet changes
  useEffect(() => {
    if (solanaWallet) {
      const pubKey = solanaWallet.address;
      setPublicKey(pubKey ? new PublicKey(pubKey) : null);
    } else {
      setPublicKey(null);
    }
  }, [solanaWallet]);

  // Handle signing and sending transactions
  const signAndSendTransaction = useCallback(
    async (transaction: Transaction | VersionedTransaction) => {
      if (!solanaWallet) {
        throw new Error('Solana wallet not connected');
      }

      try {
        // For versioned transactions
        if (transaction instanceof VersionedTransaction) {
          return await solanaWallet.sendTransaction(transaction);
        }

        // For legacy transactions
        return await solanaWallet.sendTransaction(transaction as Transaction);
      } catch (error) {
        console.error('Transaction error:', error);
        throw error;
      }
    },
    [solanaWallet]
  );

  // Sign a message
  const signMessage = useCallback(
    async (message: string | Uint8Array) => {
      if (!solanaWallet) {
        throw new Error('Solana wallet not connected');
      }

      try {
        // Convert string to Uint8Array if needed
        const messageToSign =
          typeof message === 'string' ? new TextEncoder().encode(message) : message;

        return await solanaWallet.signMessage(messageToSign);
      } catch (error) {
        console.error('Message signing error:', error);
        throw error;
      }
    },
    [solanaWallet]
  );

  return {
    publicKey,
    solanaWallet,
    signAndSendTransaction,
    signMessage,
    isAuthenticated,
    userId: user?.userId,
  };
}

/**
 * Returns a custom Solana connection configured through Dynamic
 */
export function useSolanaConnection() {
  const { primaryWallet } = useDynamicContext();

  const connection = useMemo(() => {
    if (!primaryWallet || primaryWallet.connector.name !== 'Solana') {
      return null;
    }

    const solanaWallet = primaryWallet as SolanaWallet;
    // Gets the configured connection from Dynamic
    return solanaWallet.connector.provider?.connection || null;
  }, [primaryWallet]);

  return connection;
}
