'use client';

import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { SolanaWalletConnectors } from '@dynamic-labs/solana';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SUPABASE_BUCKET } from '@trump-fun/common';
import { useTheme } from 'next-themes';
import { ReactNode, useEffect, useState } from 'react';

// Create a QueryClient instance
const queryClient = new QueryClient();

interface DynamicAuthProviderProps {
  children: ReactNode;
}

export function DynamicAuthProvider({ children }: DynamicAuthProviderProps) {
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

    updateTheme();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);

    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', updateTheme);
    };
  }, [resolvedTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <DynamicContextProvider
        settings={{
          environmentId:
            process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID ||
            'ecf64c3a-50ac-44db-a0e3-e74a962dfe02',
          walletConnectors: [SolanaWalletConnectors],

          appLogoUrl: `${SUPABASE_BUCKET}/logo/trump.svg`,
          appName: 'Trump Fun',
        }}
      >
        {children}
      </DynamicContextProvider>
    </QueryClientProvider>
  );
}
