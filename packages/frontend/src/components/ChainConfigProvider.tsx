'use client';

import React, { createContext, useContext, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
// import { BETTING_POOLS_SEED } from '@/consts';

// Configuration constants
const PROGRAM_ID = '5YQ6yLsL3hAZk3rxW3CMgMbhMywADmVG69nS5SJWPstJ';
const FREEDOM_MINT = 'F1dQHEE2ZDnXzYb6znLY8TwHLdxgkgcUSwCuJmo8Fcp5';
const USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

interface ChainConfig {
  programId: PublicKey;
  freedomMint: PublicKey;
  usdcMint: PublicKey;
  cluster: string; // "devnet", "testnet", "mainnet-beta"
  chainType: string; // "solana"
  programTokenAccount?: string;
}

interface ChainConfigContextType {
  chainConfig: ChainConfig | null;
  isLoading: boolean;
}

// Default configuration
const defaultConfig: ChainConfig = {
  programId: new PublicKey(PROGRAM_ID),
  freedomMint: new PublicKey(FREEDOM_MINT),
  usdcMint: new PublicKey(USDC_MINT),
  cluster: 'devnet',
  chainType: 'solana',
  programTokenAccount: TOKEN_PROGRAM,
  // appPda: PublicKey.findProgramAddressSync([BETTING_POOLS_SEED], PROGRAM_ID)[0],
};

// Create context with a meaningful default value
const ChainConfigContext = createContext<ChainConfigContextType>({
  chainConfig: defaultConfig,
  isLoading: false,
});

export function ChainConfigProvider({ children }: { children: React.ReactNode }) {
  const [chainConfig] = useState<ChainConfig>(defaultConfig);
  const [isLoading] = useState<boolean>(false);

  // Additional configuration could be loaded here if needed in the future
  // For now, we're using the default configuration directly

  return (
    <ChainConfigContext.Provider value={{ chainConfig, isLoading }}>
      {children}
    </ChainConfigContext.Provider>
  );
}

export const useChainConfig = () => useContext(ChainConfigContext);
