'use client';

import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { ReactNode, useMemo } from 'react';
import { useNetwork } from '@/hooks/useNetwork';

interface SolanaWalletAdapterProps {
  children: ReactNode;
}

export function SolanaWalletAdapter({ children }: SolanaWalletAdapterProps) {
  const { networkInfo } = useNetwork();
  const { wallets } = useSolanaWallets();

  // Create a connection to the Solana cluster
  const connection = useMemo(
    () => new Connection(networkInfo.endpoint, 'confirmed'),
    [networkInfo.endpoint]
  );

  return (
    <ConnectionProvider endpoint={networkInfo.endpoint} config={{ commitment: 'confirmed' }}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
