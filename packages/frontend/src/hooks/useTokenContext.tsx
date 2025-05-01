'use client';

import { FREEDOM_DECIMALS, USDC_DECIMALS } from '@trump-fun/common';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useNetwork } from './useNetwork';
import { TokenType } from '@/types';

interface TokenContextType {
  tokenType: TokenType;
  tokenSymbol: string;
  tokenLogo: string;
  tokenDecimals: number;
  tokenMint: PublicKey;
  setTokenType: (tokenType: TokenType) => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const TokenProvider = ({ children }: { children: ReactNode }) => {
  const [tokenType, setTokenType] = useState<TokenType>(TokenType.Freedom);
  const { usdcMint, freedomMint } = useNetwork();

  // Get token info based on selected token type
  const tokenInfo = {
    [TokenType.Usdc]: {
      symbol: 'USDC',
      logo: '💵',
      decimals: USDC_DECIMALS,
      mint: usdcMint,
    },
    [TokenType.Freedom]: {
      symbol: 'FREEDOM',
      logo: '🦅',
      decimals: FREEDOM_DECIMALS,
      mint: freedomMint,
    },
  };

  // Get the current token info
  const currentTokenInfo = tokenInfo[tokenType];

  // Handle token type change
  const handleTokenTypeChange = useCallback((newTokenType: TokenType) => {
    setTokenType(newTokenType);

    // Save preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred_token_type', newTokenType);
    }
  }, []);

  // Read from localStorage on mount (handled in component)

  return (
    <TokenContext.Provider
      value={{
        tokenType,
        tokenSymbol: currentTokenInfo.symbol,
        tokenLogo: currentTokenInfo.logo,
        tokenDecimals: currentTokenInfo.decimals,
        tokenMint: currentTokenInfo.mint,
        setTokenType: handleTokenTypeChange,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

export const useTokenContext = () => {
  const context = useContext(TokenContext);

  if (context === undefined) {
    throw new Error('useTokenContext must be used within a TokenProvider');
  }

  return context;
};
