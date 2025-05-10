'use client';

import React, { createContext, useContext, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { SOLANA_DEVNET_CONFIG } from '@trump-fun/common';

// Define the token program address as a constant
// This is the standard Solana SPL Token program address
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

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
  programId: SOLANA_DEVNET_CONFIG.programId,
  freedomMint: SOLANA_DEVNET_CONFIG.freedomMint,
  usdcMint: SOLANA_DEVNET_CONFIG.usdcMint,
  cluster: 'devnet',
  chainType: 'solana',
  programTokenAccount: TOKEN_PROGRAM_ID,
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
