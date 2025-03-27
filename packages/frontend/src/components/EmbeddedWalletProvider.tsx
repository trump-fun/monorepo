'use client';

import { CHAIN_ID } from '@/consts';
import { usePrivy, useWallets, WalletWithMetadata } from '@privy-io/react-auth';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Define EIP1193Provider type
interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

// Define the type for the embedded wallet
type EmbeddedWallet = WalletWithMetadata & {
  switchChain: (chainId: number) => Promise<void>;
  walletClientType: string;
  chainId: string | number;
  address: string;
  getEthereumProvider: () => Promise<EIP1193Provider>;
};

interface EmbeddedWalletContextType {
  embeddedWallet: EmbeddedWallet | null;
  currentChainId: string;
  isLoading: boolean;
  switchChain: (chainId: number) => Promise<void>;
}

const EmbeddedWalletContext = createContext<EmbeddedWalletContextType>({
  embeddedWallet: null,
  currentChainId: '',
  isLoading: true,
  switchChain: async () => {},
});

export const useEmbeddedWallet = () => useContext(EmbeddedWalletContext);

export const EmbeddedWalletProvider = ({ children }: { children: ReactNode }) => {
  const { ready: privyReady } = usePrivy();
  const { ready: readyWallets, wallets } = useWallets();
  const [embeddedWallet, setEmbeddedWallet] = useState<EmbeddedWallet | null>(null);
  const [currentChainId, setCurrentChainId] = useState<number>(CHAIN_ID);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Find the embedded wallet when wallets are ready
  useEffect(() => {
    if (readyWallets) {
      const wallet = wallets.find((wallet) => wallet.walletClientType === 'privy') as
        | EmbeddedWallet
        | undefined;

      setEmbeddedWallet(wallet || null);
    }
  }, [readyWallets, wallets]);

  // Update chain ID and config when embedded wallet changes or its chain ID changes
  useEffect(() => {
    if (privyReady) {
      setCurrentChainId(CHAIN_ID);

      setIsLoading(false);
    }
  }, [embeddedWallet, privyReady]);

  // Function to switch chains
  const switchChain = async (chainId: number) => {
    if (embeddedWallet) {
      try {
        setIsLoading(true);
        await embeddedWallet.switchChain(chainId);
        setCurrentChainId(CHAIN_ID);
      } catch (error) {
        console.error('Error switching chain:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const value = {
    embeddedWallet,
    currentChainId: currentChainId.toString(),
    isLoading,
    switchChain,
  };

  return <EmbeddedWalletContext.Provider value={value}>{children}</EmbeddedWalletContext.Provider>;
};
