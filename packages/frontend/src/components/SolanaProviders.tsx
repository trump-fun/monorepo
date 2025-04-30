'use client';

import { TokenProvider } from '@/hooks/useTokenContext';
import { PrivyProvider } from '@privy-io/react-auth';
import { ReactNode, useEffect, useState } from 'react';
import { AnchorProviderWrapper } from './AnchorProvider';

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

interface SolanaProvidersProps {
  children: ReactNode;
}

export function SolanaProviders({ children }: SolanaProvidersProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#f97316', // orange-500
          logo: '/logo.png',
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
      }}
    >
      <AnchorProviderWrapper>
        <TokenProvider>{children}</TokenProvider>
      </AnchorProviderWrapper>
    </PrivyProvider>
  );
}
