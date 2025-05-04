'use client';

import { usePrivy, useSolanaWallets, WalletWithMetadata } from '@privy-io/react-auth';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Cluster, PublicKey } from '@solana/web3.js';

// Define the type for the embedded Solana wallet
type EmbeddedSolanaWallet = {
  walletClientType: string;
  chainId?: string;
  address: string;
  publicKey?: PublicKey;
  cluster?: Cluster;
  // Adding required properties from WalletWithMetadata but making them optional
  verifiedAt?: string;
  firstVerifiedAt?: string;
  latestVerifiedAt?: string;
  chainType?: string;
  delegated?: boolean;
  fund?: (fundWalletConfig?: any) => Promise<void>;
};

interface EmbeddedWalletContextType {
  embeddedWallet: EmbeddedSolanaWallet | null;
  cluster: Cluster;
  isLoading: boolean;
}

const EmbeddedWalletContext = createContext<EmbeddedWalletContextType>({
  embeddedWallet: null,
  cluster: 'devnet',
  isLoading: true,
});

export const useEmbeddedWallet = () => useContext(EmbeddedWalletContext);

export const EmbeddedWalletProvider = ({ children }: { children: ReactNode }) => {
  const { ready: privyReady } = usePrivy();
  const { ready: readySolanaWallets, wallets: solanaWallets } = useSolanaWallets();

  const [embeddedWallet, setEmbeddedWallet] = useState<EmbeddedSolanaWallet | null>(null);
  const [cluster, setCluster] = useState<Cluster>('devnet');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Find the embedded wallet when Solana wallets are ready
  useEffect(() => {
    if (readySolanaWallets && solanaWallets.length > 0) {
      // Use the first wallet in the array instead of searching by walletClientType
      const wallet = solanaWallets[0];

      if (wallet) {
        // Convert string address to PublicKey if needed
        const enhancedWallet: EmbeddedSolanaWallet = {
          ...wallet,
          publicKey: wallet.address ? new PublicKey(wallet.address) : undefined,
          cluster: 'devnet', // Default to devnet
        };

        setEmbeddedWallet(enhancedWallet);
      } else {
        setEmbeddedWallet(null);
      }
    }
  }, [readySolanaWallets, solanaWallets]);

  // Update config when embedded wallet changes
  useEffect(() => {
    if (privyReady) {
      setCluster('devnet');
      setIsLoading(false);
    }
  }, [embeddedWallet, privyReady]);

  const value = {
    embeddedWallet,
    cluster,
    isLoading,
  };

  return <EmbeddedWalletContext.Provider value={value}>{children}</EmbeddedWalletContext.Provider>;
};
