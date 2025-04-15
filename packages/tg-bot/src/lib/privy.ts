import { PrivyClient } from '@privy-io/server-auth';
import config from '../config';

// Initialize Privy client with proper error handling
export const privy = new PrivyClient(config.privy.appId, config.privy.appSecret, {});

/**
 * Create a new wallet for a user
 * @param userId A unique identifier for the user
 * @returns The created wallet or null if error
 */
export async function createPrivyWallet(userId: string): Promise<any | null> {
  try {
    // Create a wallet using Privy's embedded wallet service
    const embeddedWallet = await privy.walletApi.create({
      chainType: 'ethereum',
      idempotencyKey: userId,
    });

    if (!embeddedWallet || !embeddedWallet.id) {
      console.error('Failed to create wallet - missing ID or data');
      return null;
    }

    return embeddedWallet;
  } catch (error) {
    console.error('Error creating wallet with Privy:', error);
    return null;
  }
}

/**
 * Get a wallet for a user, creating one if it doesn't exist
 * @param userId A unique identifier for the user
 * @returns The user's wallet or null if error
 */
export async function getOrCreatePrivyWallet(userId: string): Promise<any | null> {
  try {
    // First try to get existing wallets
    const wallets = await privy.walletApi.getWallet({
      id: userId,
    });

    // If no wallets found, create a new one
    return createPrivyWallet(userId);
  } catch (error) {
    console.error('Error getting or creating wallet with Privy:', error);
    return null;
  }
}

/**
 * Sign a transaction with a user's wallet
 * @param walletId The ID of the wallet to use
 * @param transaction The transaction to sign
 * @returns The signed transaction or null if error
 */
export async function signTransaction(walletId: string, transaction: any): Promise<any | null> {
  try {
    const result = await privy.walletApi.ethereum.sendTransaction({
      walletId,
      transaction,
      caip2: 'eip155:84532', // Base Sepolia
    });

    return result;
  } catch (error) {
    console.error('Error signing transaction with Privy:', error);
    return null;
  }
}
