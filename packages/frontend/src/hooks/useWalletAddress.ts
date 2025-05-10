'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isSolanaWallet } from '@dynamic-labs/solana';
import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';

export function useWalletAddress() {
  const { primaryWallet, user, handleLogOut, setShowAuthFlow } = useDynamicContext();

  const publicKey = useMemo(() => {
    if (!primaryWallet?.address || !isSolanaWallet(primaryWallet)) return null;
    try {
      return new PublicKey(primaryWallet.address);
    } catch (error) {
      console.error('Invalid Solana address:', error);
      return null;
    }
  }, [primaryWallet]);

  return {
    address: primaryWallet?.address || null,
    publicKey,
    isConnected: !!primaryWallet?.address,
    ready: true,
    authenticated: !!primaryWallet,
    login: () => setShowAuthFlow(true),
    logout: handleLogOut,
    userId: user?.userId,
  };
}
