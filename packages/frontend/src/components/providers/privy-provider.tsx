'use client';

import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { SolanaWalletConnectors } from '@dynamic-labs/solana';
import { WagmiConnector } from '@dynamic-labs/wagmi-connector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SUPABASE_BUCKET } from '@trump-fun/common';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
  baseSepolia as baseSepoliaOriginal,
  arbitrumSepolia as arbitrumSepoliaOriginal,
} from 'viem/chains';

// Create compatible chain objects with type assertions to handle viem version differences
const baseSepolia = baseSepoliaOriginal as any;
const arbitrumSepolia = arbitrumSepoliaOriginal as any;

// Create a QueryClient instance
const queryClient = new QueryClient();

export function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  // Use the theme from next-themes to adapt Dynamic's theme
  const { resolvedTheme } = useTheme();
  const [dynamicTheme, setDynamicTheme] = useState<'light' | 'dark'>('dark'); // Default to dark

  // Update Dynamic theme when system theme changes
  useEffect(() => {
    const updateTheme = (e?: MediaQueryListEvent) => {
      const newTheme = e
        ? e.matches
          ? 'dark'
          : 'light'
        : resolvedTheme === 'dark'
          ? 'dark'
          : 'light';
      setDynamicTheme(newTheme);
    };

    updateTheme(); // Initial call

    // Watch for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);

    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', updateTheme);
    };
  }, [resolvedTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <DynamicContextProvider
        settings={{
          environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || '',
          walletConnectors: [SolanaWalletConnectors, WagmiConnector],
          evmNetworks: [
            {
              chainId: baseSepolia.id,
              name: baseSepolia.name,
              vanityName: 'Base Sepolia',
              chainName: baseSepolia.name,
              rpcUrl: 'https://sepolia.base.org',
              iconUrls: ['https://dynamic-static-assets.com/img/networks/basesepolia.svg'],
              blockExplorerUrls: ['https://sepolia.basescan.org'],
              nativeCurrency: baseSepolia.nativeCurrency,
            },
            {
              chainId: arbitrumSepolia.id,
              name: arbitrumSepolia.name,
              vanityName: 'Arbitrum Sepolia',
              chainName: arbitrumSepolia.name,
              rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
              iconUrls: ['https://dynamic-static-assets.com/img/networks/arbitrumsepolia.svg'],
              blockExplorerUrls: ['https://sepolia.arbiscan.io'],
              nativeCurrency: arbitrumSepolia.nativeCurrency,
            },
          ],
          // Configure Solana network
          solanaNetworks: [
            {
              name: 'devnet',
              endpoint: 'https://api.devnet.solana.com',
              networkType: 'devnet',
            },
          ],
          appLogoUrl: `${SUPABASE_BUCKET}/logo/trump.svg`,
          appName: 'Trump Fun',
          theme: {
            mode: dynamicTheme,
            colors: {
              primary: '#ff6d00',
            },
          },
        }}
      >
        {children}
      </DynamicContextProvider>
    </QueryClientProvider>
  );
}
