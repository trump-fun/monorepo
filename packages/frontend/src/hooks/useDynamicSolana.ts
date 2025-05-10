'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isSolanaWallet } from '@dynamic-labs/solana';
import { Connection, PublicKey } from '@solana/web3.js';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Hook for handling Solana wallet functionality with Dynamic
 */
export function useDynamicSolana() {
  const { primaryWallet, user } = useDynamicContext();
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);

  // Get the Solana wallet instance from Dynamic
  const solanaWallet = useMemo(() => {
    if (!primaryWallet || !isSolanaWallet(primaryWallet)) {
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

  // Get wallet connection
  const getConnection = useCallback(async () => {
    if (primaryWallet && isSolanaWallet(primaryWallet)) {
      const connection: Connection = await primaryWallet.getConnection();
      return connection;
    }

    // Fallback to creating a new connection
  }, [primaryWallet]);

  // Determine if the user is authenticated based on wallet connection
  const isAuthenticated = !!solanaWallet && !!publicKey;

  return {
    publicKey,
    solanaWallet,
    signMessage,
    getConnection,
    userId: user?.userId,
    address: solanaWallet?.address || null,
    isConnected: !!solanaWallet?.address,
    ready: true, // Dynamic is always ready when this hook is used
    isAuthenticated,
  };
}
