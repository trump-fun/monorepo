'use client';

import { usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useCallback, useMemo } from 'react';
import { useNetwork } from './useNetwork';

interface TransactionResult {
  signature: string;
  blockTime?: number;
}

/**
 * Hook for handling Solana transactions with Privy
 */
export function useSolanaTransaction() {
  const { login, authenticated } = usePrivy();
  const { wallets } = useSolanaWallets();
  const { networkInfo } = useNetwork();

  // Get the embedded wallet from Privy
  const embeddedWallet = useMemo(() => {
    return wallets?.find((wallet) => wallet.walletClientType === 'privy');
  }, [wallets]);

  // Create a connection to the Solana network
  const getConnection = useCallback(() => {
    return new Connection(networkInfo.endpoint, 'confirmed');
  }, [networkInfo.endpoint]);

  /**
   * Signs and sends a transaction using the Privy wallet
   */
  const signAndSend = useCallback(
    async (transaction: Transaction | VersionedTransaction): Promise<TransactionResult | null> => {
      if (!authenticated) {
        login();
        return null;
      }

      if (!embeddedWallet) {
        console.error('No embedded wallet found');
        return null;
      }

      try {
        const connection = getConnection();

        // Sign the transaction with the embedded wallet
        const signedTx = await embeddedWallet.signTransaction({
          transaction: Buffer.from(transaction.serialize({ verifySignatures: false })).toString(
            'base64'
          ),
        });

        const txSignature = await connection.sendRawTransaction(
          Buffer.from(signedTx.transaction, 'base64')
        );

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
    [authenticated, embeddedWallet, getConnection, login]
  );

  return {
    signAndSend,
    getConnection,
    isPrivyWalletConnected: !!embeddedWallet,
  };
}
