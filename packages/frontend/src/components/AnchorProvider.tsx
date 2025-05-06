'use client';

import { useNetwork } from '@/hooks/useNetwork';
import { useDynamicSolana } from '@/hooks/useDynamicSolana';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import IDL from '@/types/__generated__/trump_fun_idl.json';

interface AnchorProviderContextValue {
  program: Program<any> | null;
  connection: Connection | null;
  provider: AnchorProvider | null;
  publicKey: PublicKey | null;
}

const AnchorProviderContext = createContext<AnchorProviderContextValue>({
  program: null,
  connection: null,
  provider: null,
  publicKey: null,
});

export function useAnchorProvider() {
  return useContext(AnchorProviderContext);
}

interface AnchorProviderComponentProps {
  children: ReactNode;
}

export default function AnchorProviderComponent({ children }: AnchorProviderComponentProps) {
  const { publicKey, isConnected } = useDynamicSolana();
  const { networkInfo } = useNetwork();

  const [connection, setConnection] = useState<Connection | null>(null);
  const [provider, setProvider] = useState<AnchorProvider | null>(null);
  const [program, setProgram] = useState<Program<any> | null>(null);

  // Initialize Anchor connection when wallet is authenticated
  const initAnchor = useCallback(async () => {
    if (!publicKey || !isConnected) {
      setConnection(null);
      setProvider(null);
      setProgram(null);
      return;
    }

    try {
      // Create connection to the network
      const newConnection = new Connection(networkInfo.endpoint, 'confirmed');
      setConnection(newConnection);

      // Create Anchor provider
      const newProvider = new AnchorProvider(
        newConnection,
        {
          publicKey,
          signTransaction: async (tx) => tx,
          signAllTransactions: async (txs) => txs,
        },
        { commitment: 'confirmed', skipPreflight: true }
      );
      setProvider(newProvider);

      // Setup program
      try {
        const programId = new PublicKey(networkInfo.programId);

        // Ensure the IDL is properly formatted before passing to Program constructor
        const sanitizedIDL = JSON.parse(JSON.stringify(IDL));

        // Create program with sanitized IDL
        const newProgram = new Program(sanitizedIDL, programId, newProvider);

        setProgram(newProgram);
      } catch (err) {
        console.error('Failed to initialize program:', err);
        setProgram(null);
      }
    } catch (error) {
      console.error('Error initializing Anchor provider:', error);
      setConnection(null);
      setProvider(null);
      setProgram(null);
    }
  }, [publicKey, isConnected, networkInfo]);

  useEffect(() => {
    initAnchor();
  }, [initAnchor]);

  const contextValue = useMemo(
    () => ({
      program,
      connection,
      provider,
      publicKey,
    }),
    [program, connection, provider, publicKey]
  );

  return (
    <AnchorProviderContext.Provider value={contextValue}>{children}</AnchorProviderContext.Provider>
  );
}
