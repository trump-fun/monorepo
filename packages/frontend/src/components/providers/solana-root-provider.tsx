'use client';

import { ReactNode } from 'react';
import { ChainConfigProvider } from '../ChainConfigProvider';
import { AnchorProviderWrapper } from '../AnchorProvider';
import { EmbeddedWalletProvider } from '../EmbeddedWalletProvider';
import { SolanaWalletAdapter } from '../SolanaWalletAdapter';

interface SolanaRootProviderProps {
  children: ReactNode;
}

/**
 * A provider that wraps all Solana-specific providers in the correct order.
 * This ensures all Solana functionality is available throughout the application.
 */
export function SolanaRootProvider({ children }: SolanaRootProviderProps) {
  return (
    <ChainConfigProvider>
      <EmbeddedWalletProvider>
        <SolanaWalletAdapter>
          <AnchorProviderWrapper>{children}</AnchorProviderWrapper>
        </SolanaWalletAdapter>
      </EmbeddedWalletProvider>
    </ChainConfigProvider>
  );
}
