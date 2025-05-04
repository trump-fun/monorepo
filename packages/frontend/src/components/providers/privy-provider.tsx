'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SUPABASE_BUCKET } from '@trump-fun/common';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
  arbitrumSepolia as arbitrumSepoliaOriginal,
  baseSepolia as baseSepoliaOriginal,
} from 'viem/chains';
import { http } from 'wagmi';

// Create compatible chain objects with type assertions to handle viem version differences
const baseSepolia = baseSepoliaOriginal as any;
const arbitrumSepolia = arbitrumSepoliaOriginal as any;

// Create a Wagmi config - ensure we're importing createConfig from @privy-io/wagmi
const wagmiConfig = createConfig({
  chains: [baseSepolia, arbitrumSepolia], //Make sure this matches SupportedNetworks from common/consts
  transports: {
    //The first chain that appears below is the default chain
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
});

// Create a QueryClient instance
const queryClient = new QueryClient();

export function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  // Use the theme from next-themes to adapt Privy's theme
  const { resolvedTheme } = useTheme();
  const [privyTheme, setPrivyTheme] = useState<'light' | 'dark'>('dark'); // Default to dark

  // Update Privy theme when system theme changes
  useEffect(() => {
    const updateTheme = (e?: MediaQueryListEvent) => {
      const newTheme = e
        ? e.matches
          ? 'dark'
          : 'light'
        : resolvedTheme === 'dark'
          ? 'dark'
          : 'light';
      setPrivyTheme(newTheme);
    };

    updateTheme(); // Initial call

    // Watch for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);

    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', updateTheme);
    };
  }, [resolvedTheme]);

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        loginMethods: [
          'email',
          'wallet',
          'twitter',
          'google',
          'discord',
          'apple',
          'farcaster',
          'passkey',
        ],
        appearance: {
          theme: privyTheme, // Use our tracked theme state
          accentColor: '#ff6d00',
          logo: `${SUPABASE_BUCKET}/logo/trump.svg`,
          walletList: ['phantom', 'backpack', 'metamask'],
          walletChainType: 'solana-only', // Updated to support both
          showWalletLoginFirst: true,
        },
        embeddedWallets: {
          createOnLogin: 'all-users',
        },
        solanaClusters: [
          {
            name: 'devnet',
          },
        ],
        loginMethodsAndOrder: {
          primary: ['phantom', 'google', 'email'],
        },

        passkeys: {
          shouldUnlinkOnUnenrollMfa: false,
          shouldUnenrollMfaOnUnlink: false,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
