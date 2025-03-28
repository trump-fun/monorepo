'use client';

import { POINTS_ADDRESS, TokenType, USDC_ADDRESS } from '@trump-fun/common';
import Image from 'next/image';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Address } from 'viem';

// Token logos/symbols
export const TOKEN_SYMBOLS: Record<TokenType, { symbol: string; logo: React.ReactNode }> = {
  [TokenType.Usdc]: {
    symbol: 'USDC',
    logo: <Image src='/usdc.svg' alt='USD' width={16} height={16} style={{ display: 'inline' }} />,
  },
  [TokenType.Points]: {
    symbol: 'FREEDOM',
    logo: (
      <Image src='/points2.png' alt='POINTS' width={16} height={16} style={{ display: 'inline' }} />
    ),
  },
};

interface TokenContextType {
  tokenType: TokenType;
  setTokenType: (type: TokenType) => void;
  getTokenAddress: () => Address | null;
  tokenSymbol: string;
  tokenLogo: React.ReactNode;
}

// Create context with default values
const TokenContext = createContext<TokenContextType>({
  tokenType: TokenType.Usdc,
  setTokenType: () => {},
  getTokenAddress: () => null,
  tokenSymbol: TOKEN_SYMBOLS[TokenType.Usdc].symbol,
  tokenLogo: TOKEN_SYMBOLS[TokenType.Usdc].logo,
});

export const TokenProvider = ({ children }: { children: React.ReactNode }) => {
  const [tokenType, setTokenType] = useState<TokenType>(TokenType.Usdc);

  // Get token information
  const tokenSymbol = TOKEN_SYMBOLS[tokenType].symbol;
  const tokenLogo = TOKEN_SYMBOLS[tokenType].logo;

  // Function to get token address for current chain
  const getTokenAddress = (): Address | null => {
    const address = tokenType === TokenType.Usdc ? USDC_ADDRESS : POINTS_ADDRESS;
    return address ? (address as Address) : null;
  };

  // Load saved preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trump-fun-token-type');
      if (saved !== null) {
        if (saved === TokenType.Usdc || saved === TokenType.Points) {
          setTokenType(saved as TokenType);
        }
      }
    }
  }, []);

  // Save preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('trump-fun-token-type', tokenType);
    }
  }, [tokenType]);

  const value = {
    tokenType,
    setTokenType,
    getTokenAddress,
    tokenSymbol,
    tokenLogo,
  };

  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
};

// Hook for consuming the context
export const useTokenContext = () => useContext(TokenContext);
