'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';

interface ChainConfig {
  programId: PublicKey;
  freedomMint: PublicKey;
  usdcMint: PublicKey;
  cluster: string; // "devnet", "testnet", "mainnet-beta"
  chainType: string; // "solana"
}

interface ChainConfigContextType {
  chainConfig: ChainConfig | null;
  isLoading: boolean;
}

const ChainConfigContext = createContext<ChainConfigContextType>({
  chainConfig: null,
  isLoading: true,
});

export function ChainConfigProvider({ children }: { children: React.ReactNode }) {
  const [chainConfig, setChainConfig] = useState<ChainConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initialize with Solana devnet configuration
    const solanaConfig: ChainConfig = {
      programId: new PublicKey('5YQ6yLsL3hAZk3rxW3CMgMbhMywADmVG69nS5SJWPstJ'),
      freedomMint: new PublicKey('F1dQHEE2ZDnXzYb6znLY8TwHLdxgkgcUSwCuJmo8Fcp5'),
      usdcMint: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
      cluster: 'devnet',
      chainType: 'solana',
    };

    setChainConfig(solanaConfig);
    setIsLoading(false);
  }, []);

  return (
    <ChainConfigContext.Provider value={{ chainConfig, isLoading }}>
      {children}
    </ChainConfigContext.Provider>
  );
}

export const useChainConfig = () => useContext(ChainConfigContext);
