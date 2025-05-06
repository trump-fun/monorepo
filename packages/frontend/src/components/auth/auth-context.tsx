'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { createContext, useContext, ReactNode } from 'react';
import { useDynamicSolana } from '@/hooks/useDynamicSolana';

interface AuthContextValue {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  userId: string | null;
  walletAddress: string | null;
  signOut: () => Promise<void>;
  login: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, handleLogOut, setShowAuthFlow, primaryWallet } = useDynamicContext();
  const { publicKey } = useDynamicSolana();

  const value: AuthContextValue = {
    isAuthenticated: !!primaryWallet,
    isAuthenticating: false,
    userId: user?.userId || null,
    walletAddress: publicKey?.toString() || null,
    signOut: handleLogOut,
    login: () => setShowAuthFlow(true),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
