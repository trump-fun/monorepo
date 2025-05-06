'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isSolanaWallet } from '@dynamic-labs/solana';
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useCallback, useMemo } from 'react';
import { useNetwork } from './useNetwork';
import { useDynamicSolana } from './useDynamicSolana';

interface TransactionResult {
  signature: string;
  blockTime?: number;
}

/**
 * Hook for handling Solana transactions with Dynamic
 */
export function useSolanaTransaction() {
  const { primaryWallet } = useDynamicContext();
  const { signAndSendTransaction, isAuthenticated } = useDynamicSolana();

  const { networkInfo } = useNetwork();

  // Create a connection to the Solana network
  const getConnection = useCallback(() => {
    return new Connection(networkInfo.endpoint, 'confirmed');
  }, [networkInfo.endpoint]);

  // Check if the connected wallet is a Solana wallet
  const isSolanaWalletConnected = useMemo(() => {
    return !!primaryWallet && isSolanaWallet(primaryWallet);
  }, [primaryWallet]);

  /**
   * Signs and sends a transaction using the Dynamic wallet
   */
  const signAndSend = useCallback(
    async (transaction: Transaction | VersionedTransaction): Promise<TransactionResult | null> => {
      if (!isAuthenticated || !isSolanaWalletConnected) {
        throw new Error('Please connect a Solana wallet first');
      }

      try {
        const connection = getConnection();
        const txSignature = await signAndSendTransaction(transaction);

        console.log(`Transaction sent with signature: ${txSignature}`);

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(txSignature, 'confirmed');

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
        }

        // Get transaction time
        const txInfo = await connection.getTransaction(txSignature, {
          maxSupportedTransactionVersion: 0,
        });

        return {
          signature: txSignature,
          blockTime: txInfo?.blockTime || undefined,
        };
      } catch (error) {
        console.error('Error signing and sending transaction:', error);
        throw error;
      }
    },
    [isAuthenticated, isSolanaWalletConnected, getConnection, signAndSendTransaction]
  );

  return {
    signAndSend,
    getConnection,
    isWalletConnected: isSolanaWalletConnected && isAuthenticated,
  };
}
