'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isSolanaWallet } from '@dynamic-labs/solana';
import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNetwork } from './useNetwork';

// Define a more comprehensive type for the SolanaWallet
interface SolanaWallet {
  address: string;
  chainId?: string;
  connector?: any;
  sendTransaction: (transaction: Transaction | VersionedTransaction) => Promise<string>;
  signMessage: (message: Uint8Array) => Promise<string>;
  // Add any additional properties required
}

/**
 * Hook for handling Solana wallet functionality with Dynamic
 */
export function useDynamicSolana() {
  const { primaryWallet, user } = useDynamicContext();
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const { networkInfo } = useNetwork();

  // Get the Solana wallet instance from Dynamic
  const solanaWallet = useMemo(() => {
    if (!primaryWallet || !isSolanaWallet(primaryWallet)) {
      return null;
    }
    return primaryWallet as unknown as SolanaWallet;
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

  // Get wallet connection
  const getConnection = useCallback(() => {
    if (solanaWallet?.connector?.provider?.connection) {
      return Promise.resolve(solanaWallet.connector.provider.connection);
    }

    // Fallback to creating a new connection
    return Promise.resolve(new Connection(networkInfo.endpoint, 'confirmed'));
  }, [solanaWallet, networkInfo.endpoint]);

  // Determine if the user is authenticated based on wallet connection
  const isAuthenticated = !!solanaWallet && !!publicKey;

  return {
    publicKey,
    solanaWallet,
    signAndSendTransaction,
    signMessage,
    getConnection,
    userId: user?.userId,
    address: solanaWallet?.address || null,
    isConnected: !!solanaWallet?.address,
    ready: true, // Dynamic is always ready when this hook is used
    isAuthenticated,
  };
}
