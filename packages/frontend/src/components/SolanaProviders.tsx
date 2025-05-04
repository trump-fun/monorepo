'use client';

import { TokenProvider } from '@/hooks/useTokenContext';
import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { SolanaWalletProvider } from './providers/solana-provider';
import AnchorProviderComponent from './AnchorProvider';

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

interface SolanaProvidersProps {
  children: ReactNode;
}

export function SolanaProviders({ children }: SolanaProvidersProps) {
  const [isMounted, setIsMounted] = useState(false);
  const queryClient = new QueryClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={privyAppId}
        config={{
          appearance: {
            theme: 'light',
            accentColor: '#f97316', // orange-500
            logo: '/logo.png',
            walletChainType: 'ethereum-and-solana', // Enable both chain types
          },
          embeddedWallets: {
            solana: {
              createOnLogin: 'all-users',
            },
            ethereum: {
              createOnLogin: 'off',
            },
          },
          loginMethods: ['email', 'wallet', 'passkey'],
          solanaClusters: [
            {
              name: 'devnet',
            },
          ],
          externalWallets: {
            solana: {
              // Add Solana wallet connectors
              // connectors: ['phantom', 'solflare', 'backpack', 'coinbase_wallet', 'brave', 'glow'],
            },
          },
        }}
      >
        <SolanaWalletProvider>
          <AnchorProviderComponent>
            <TokenProvider>{children}</TokenProvider>
          </AnchorProviderComponent>
        </SolanaWalletProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}
