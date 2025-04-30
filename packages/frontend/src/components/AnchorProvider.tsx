'use client';

import { useNetwork } from '@/hooks/useNetwork';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

// Placeholder for the actual IDL - this would be imported from your Solana program

// Simplified IDL interface for placeholder - replace with actual IDL
interface SimplifiedIDL {
  metadata: {
    address: string;
  };
  instructions: any[];
  accounts: any[];
  types: any[];
}

// Simplified placeholder IDL for development
const PlaceholderIDL: SimplifiedIDL = {
  metadata: {
    address: '5YQ6yLsL3hAZk3rxW3CMgMbhMywADmVG69nS5SJWPstJ',
  },
  instructions: [],
  accounts: [],
  types: [],
};

// Create a simple wallet interface for Anchor compatibility
class PrivyAnchorWallet {
  private _publicKey: PublicKey;

  constructor(publicKey: PublicKey) {
    this._publicKey = publicKey;
  }

  async signTransaction(): Promise<any> {
    throw new Error('signTransaction should not be called directly from PrivyAnchorWallet');
  }

  async signAllTransactions(): Promise<any> {
    throw new Error('signAllTransactions should not be called directly from PrivyAnchorWallet');
  }

  get publicKey(): PublicKey {
    return this._publicKey;
  }
}

// Define the context type
interface AnchorProviderContextType {
  provider: AnchorProvider | null;
  program: Program<any> | null;
  ready: boolean;
  error: Error | null;
}

// Create context
const AnchorProviderContext = createContext<AnchorProviderContextType>({
  provider: null,
  program: null,
  ready: false,
  error: null,
});

// Provider component props
interface AnchorProviderWrapperProps {
  children: ReactNode;
}

export function AnchorProviderWrapper({ children }: AnchorProviderWrapperProps) {
  const { publicKey, isConnected } = useWalletAddress();
  const { endpoint, programId } = useNetwork();
  const [provider, setProvider] = useState<AnchorProvider | null>(null);
  const [program, setProgram] = useState<Program<any> | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Set up Anchor provider and program when connection is available
  useEffect(() => {
    if (!isConnected || !publicKey) {
      setReady(false);
      return;
    }

    try {
      // Create Anchor wallet from Privy public key
      const wallet = {
        publicKey,
        signTransaction: async () => {
          throw new Error('signTransaction should be handled by Privy');
        },
        signAllTransactions: async () => {
          throw new Error('signAllTransactions should be handled by Privy');
        },
      };

      // Create connection
      const connection = new Connection(endpoint, 'confirmed');

      // Create AnchorProvider (no real signing needed for read-only operations)
      const newProvider = new AnchorProvider(connection, wallet, {
        preflightCommitment: 'confirmed',
      });

      // Create Program instance
      const newProgram = new Program(PlaceholderIDL as any, programId.toString(), newProvider);

      setProvider(newProvider);
      setProgram(newProgram);
      setReady(true);
      setError(null);
    } catch (err) {
      console.error('Error setting up Anchor provider:', err);
      setError(err instanceof Error ? err : new Error('Unknown error setting up Anchor provider'));
      setReady(false);
    }
  }, [isConnected, publicKey, endpoint, programId]);

  const value = useMemo(
    () => ({
      provider,
      program,
      ready,
      error,
    }),
    [provider, program, ready, error]
  );

  return <AnchorProviderContext.Provider value={value}>{children}</AnchorProviderContext.Provider>;
}

// Hook for consuming the context
export function useAnchorProvider() {
  const context = useContext(AnchorProviderContext);

  if (context === undefined) {
    throw new Error('useAnchorProvider must be used within an AnchorProviderWrapper');
  }

  return context;
}
