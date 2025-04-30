'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SUPABASE_BUCKET } from '@trump-fun/common';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

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
        loginMethods: ['email', 'wallet', 'passkey'],
        appearance: {
          theme: privyTheme,
          accentColor: '#ff6d00',
          logo: `${SUPABASE_BUCKET}/logo/trump.svg`,
          walletChainType: 'solana-only',
          showWalletLoginFirst: true,
        },
        embeddedWallets: {
          createOnLogin: 'all-users',
          solana: {
            createOnLogin: 'all-users',
          },
          ethereum: {
            createOnLogin: 'off',
          },
        },
        solanaClusters: [
          {
            name: 'devnet',
          },
        ],
        passkeys: {
          shouldUnlinkOnUnenrollMfa: false,
          shouldUnenrollMfaOnUnlink: false,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </PrivyProvider>
  );
}
