'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isSolanaWallet } from '@dynamic-labs/solana';
import { PublicKey, Transaction, VersionedTransaction, Connection } from '@solana/web3.js';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Hook for handling Solana wallet functionality with Dynamic
 */
export function useDynamicSolana() {
  const { primaryWallet, user } = useDynamicContext();
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);

  // Get the Solana wallet instance from Dynamic
  const solanaWallet = useMemo(() => {
    if (!primaryWallet || primaryWallet.connector.name !== 'Solana') {
      return null;
    }
    return primaryWallet;
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
      if (!solanaWallet || !isSolanaWallet(solanaWallet)) {
        throw new Error('Solana wallet not connected');
      }

      try {
        const signer = await solanaWallet.getSigner();
        // For versioned transactions
        if (transaction instanceof VersionedTransaction) {
          return await signer.signAndSendTransaction(transaction);
        }

        // For legacy transactions
        return await signer.signAndSendTransaction(transaction as Transaction);
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
        // Keep message as string
        const messageToSign =
          typeof message === 'string' ? message : new TextDecoder().decode(message);

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

    userId: user?.userId,
  };
}

/**
 * Returns a custom Solana connection configured through Dynamic
 */
export function useSolanaConnection(): Connection | null {
  const { primaryWallet } = useDynamicContext();
  const [connection, setConnection] = useState<Connection | null>(null);

  useEffect(() => {
    const initConnection = async () => {
      try {
        if (primaryWallet && isSolanaWallet(primaryWallet)) {
          const newConnection = await primaryWallet.getConnection();
          setConnection(newConnection);
        } else {
          setConnection(null);
        }
      } catch (error) {
        console.error('Failed to initialize Solana connection:', error);
        setConnection(null);
      }
    };

    initConnection();
  }, [primaryWallet]);

  return connection;
}
