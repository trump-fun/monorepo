'use client';

import { ReactNode, createContext, useContext, useMemo } from 'react';

import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import idl from '../types/__generated__/idl.json';

type AnchorProviderContextType = {
  provider: AnchorProvider | null;
  program: Program<any> | null;
};

const AnchorProviderContext = createContext<AnchorProviderContextType>({
  provider: null,
  program: null,
});

export const useAnchorProvider = (): AnchorProviderContextType => {
  return useContext(AnchorProviderContext);
};

interface AnchorProviderComponentProps {
  children: ReactNode;
}

export const AnchorProviderComponent = ({ children }: AnchorProviderComponentProps) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const { provider, program } = useMemo(() => {
    if (!wallet) return { provider: null, program: null };

    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });

    const program = new Program(idl, provider);

    return { provider, program };
  }, [connection, wallet]);

  return (
    <AnchorProviderContext.Provider value={{ provider, program }}>
      {children}
    </AnchorProviderContext.Provider>
  );
};

export default AnchorProviderComponent;
