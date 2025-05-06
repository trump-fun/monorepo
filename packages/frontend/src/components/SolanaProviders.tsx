'use client';

import { TokenProvider } from '@/hooks/useTokenContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { DynamicAuthProvider } from './DynamicAuthProvider';
import AnchorProviderComponent from './AnchorProvider';

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
      <DynamicAuthProvider>
        <AnchorProviderComponent>
          <TokenProvider>{children}</TokenProvider>
        </AnchorProviderComponent>
      </DynamicAuthProvider>
    </QueryClientProvider>
  );
}
