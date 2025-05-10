'use client';

import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { Cluster } from '@solana/web3.js';
import { SOLANA_DEVNET_CONFIG } from '@trump-fun/common';
/**
 * Network information for Solana
 */
interface SolanaNetworkInfo {
  name: string;
  cluster: Cluster;
  endpoint: string;
  color: string;
  isSupported: boolean;
  programId: PublicKey;
  usdcMint: PublicKey;
  freedomMint: PublicKey;
}

export function useNetwork() {
  const networkInfo = useMemo<SolanaNetworkInfo>(() => {
    return {
      name: 'Solana Devnet',
      cluster: 'devnet',
      endpoint: SOLANA_DEVNET_CONFIG.rpcUrl,
      color: 'bg-purple-500/10 text-purple-500',
      isSupported: true,
      programId: SOLANA_DEVNET_CONFIG.programId,
      usdcMint: SOLANA_DEVNET_CONFIG.usdcMint,
      freedomMint: SOLANA_DEVNET_CONFIG.freedomMint,
    };
  }, []);

  return {
    networkInfo,
    programId: networkInfo.programId,
    usdcMint: networkInfo.usdcMint,
    freedomMint: networkInfo.freedomMint,
    cluster: networkInfo.cluster,
    endpoint: networkInfo.endpoint,
  };
}
