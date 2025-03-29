'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SUPABASE_BUCKET } from '@trump-fun/common';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { arbitrumSepolia, baseSepolia } from 'viem/chains';
import { http } from 'wagmi';

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
  // Use resolvedTheme for more consistent theme detection
  const { resolvedTheme } = useTheme();
  const [privyTheme, setPrivyTheme] = useState<'light' | 'dark'>('light');

  // Set up proper theme detection
  useEffect(() => {
    // Use system preference initially
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setPrivyTheme(prefersDark ? 'dark' : 'light');

    // Listen for theme changes
    const updateTheme = () => {
      if (resolvedTheme === 'dark') {
        setPrivyTheme('dark');
        document.documentElement.classList.add('dark-privy');
      } else {
        setPrivyTheme('light');
        document.documentElement.classList.remove('dark-privy');
      }
    };

    updateTheme();

    // Add event listener for theme changes
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
          walletList: ['metamask', 'coinbase_wallet', 'rainbow', 'wallet_connect'],
          walletChainType: 'ethereum-only',
          showWalletLoginFirst: true,
        },
        embeddedWallets: {
          createOnLogin: 'all-users',
        },
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia, arbitrumSepolia],
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
