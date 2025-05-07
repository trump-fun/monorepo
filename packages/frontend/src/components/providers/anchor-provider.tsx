'use client';

import { useDynamicSolana } from '@/hooks/useDynamicSolana';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { TrumpFun } from '@trump-fun/common';
import trumpFunIdl from '@trump-fun/common/src/types/__generated__/trump_fun.json';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface AnchorProviderContextValue {
  program: Program<TrumpFun> | null;
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
  const { publicKey, isConnected, getConnection } = useDynamicSolana();

  const [connection, setConnection] = useState<Connection | null>(null);
  const [provider, setProvider] = useState<AnchorProvider | null>(null);
  const [program, setProgram] = useState<Program<TrumpFun> | null>(null);

  // Initialize Anchor connection when wallet is authenticated
  const initAnchor = useCallback(async () => {
    if (!publicKey || !isConnected) {
      setConnection(null);
      setProvider(null);
      setProgram(null);
      return;
    }

    try {
      const newConnection = await getConnection();
      // Create connection to the network

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

      // Create program with sanitized IDL
      const newProgram = new Program<TrumpFun>(trumpFunIdl, newProvider);
      setConnection(newConnection);
      setProvider(newProvider);
      setProgram(newProgram);
    } catch (error) {
      console.error('Error initializing Anchor provider:', error);
    }
  }, [publicKey, isConnected, getConnection]);

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
