'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { type Address } from 'viem';
import { useNetwork } from './useNetwork';

/**
 * A custom hook that provides wallet address handling for the application,
 * integrating both Privy and wagmi wallet states.
 */
export const useWalletAddress = () => {
  const { authenticated, ready: privyReady, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { chainId, isNetworkSupported } = useNetwork();

  // Get the wallet address from different possible sources
  const privyWalletAddress =
    walletsReady && wallets?.length > 0 ? (wallets[0]?.address as Address) : undefined;

  const userWalletAddress = user?.wallet?.address as Address;

  // Determine the best address to use (wagmi first, then privy)
  const address = wagmiAddress || privyWalletAddress || userWalletAddress;

  // Check if wallet is connected through any method
  const isConnected = Boolean(
    authenticated &&
      privyReady &&
      (wagmiConnected || (walletsReady && wallets?.length > 0) || Boolean(user?.wallet?.address))
  );

  // Format address for display (e.g., "0x1234...5678")
  const formattedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : undefined;

  return {
    address,
    isConnected,
    formattedAddress,
    chainId,
    isNetworkSupported,
    privyReady,
    walletsReady,
    authenticated,
  };
};
