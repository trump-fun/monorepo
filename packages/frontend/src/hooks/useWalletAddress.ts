'use client';

import { usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';

export function useWalletAddress() {
  const { authenticated, ready, login } = usePrivy();
  const { wallets, ready: walletsReady } = useSolanaWallets();

  const embeddedWallet = useMemo(() => {
    if (!authenticated || !walletsReady || !wallets?.length) return null;
    return wallets.find((wallet) => wallet.walletClientType === 'privy');
  }, [authenticated, walletsReady, wallets]);

  const publicKey = useMemo(() => {
    if (!embeddedWallet?.address) return null;
    try {
      return new PublicKey(embeddedWallet.address);
    } catch (error) {
      console.error('Invalid Solana address:', error);
      return null;
    }
  }, [embeddedWallet?.address]);

  return {
    address: embeddedWallet?.address || null,
    publicKey,
    isConnected: !!embeddedWallet?.address && authenticated,
    ready,
    walletsReady,
    authenticated,
    login,
  };
}
