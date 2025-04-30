'use client';

import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { Cluster } from '@solana/web3.js';

/**
 * Network information for Solana
 */
interface SolanaNetworkInfo {
  // Display name of the network
  name: string;
  // Solana cluster (devnet, testnet, or mainnet-beta)
  cluster: Cluster;
  // Endpoint URL for the Solana RPC connection
  endpoint: string;
  // Text/background color for UI display
  color: string;
  // Whether the network is supported by the app
  isSupported: boolean;
  // Program ID for the betting contract
  programId: PublicKey;
  // USDC token mint address
  usdcMint: PublicKey;
  // FREEDOM token mint address
  freedomMint: PublicKey;
}

/**
 * Hook that provides Solana network information
 */
export function useNetwork() {
  // Default to devnet for development
  const networkInfo = useMemo<SolanaNetworkInfo>(() => {
    return {
      name: 'Solana Devnet',
      cluster: 'devnet',
      endpoint: 'https://api.devnet.solana.com',
      color: 'bg-purple-500/10 text-purple-500',
      isSupported: true,
      programId: new PublicKey('5YQ6yLsL3hAZk3rxW3CMgMbhMywADmVG69nS5SJWPstJ'),
      usdcMint: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
      freedomMint: new PublicKey('F1dQHEE2ZDnXzYb6znLY8TwHLdxgkgcUSwCuJmo8Fcp5'),
    };
  }, []);

  return {
    // Network information
    networkInfo,

    // Convenience properties for commonly accessed values
    programId: networkInfo.programId,
    usdcMint: networkInfo.usdcMint,
    freedomMint: networkInfo.freedomMint,
    cluster: networkInfo.cluster,
    endpoint: networkInfo.endpoint,
  };
}
