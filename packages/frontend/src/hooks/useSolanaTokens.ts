'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  getMint,
} from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { useNetwork } from './useNetwork';
import { useDynamicSolana } from './useDynamicSolana';

interface TokenBalances {
  usdcBalance: string;
  freedomBalance: string;
  isLoading: boolean;
  error: Error | null;
}

export function useSolanaTokens(): {
  balances: TokenBalances;
  fetchBalances: () => Promise<void>;
} {
  const [balances, setBalances] = useState<TokenBalances>({
    usdcBalance: '0',
    freedomBalance: '0',
    isLoading: false,
    error: null,
  });
  const { publicKey, getConnection } = useDynamicSolana();
  const { usdcMint, freedomMint } = useNetwork();

  const fetchBalances = useCallback(async () => {
    if (!publicKey) {
      return;
    }

    setBalances((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const connection = await getConnection();

      // Convert mint addresses to PublicKeys if they are strings
      const usdcMintPubkey = typeof usdcMint === 'string' ? new PublicKey(usdcMint) : usdcMint;
      const freedomMintPubkey =
        typeof freedomMint === 'string' ? new PublicKey(freedomMint) : freedomMint;

      // Get the associated token accounts for both tokens
      const usdcTokenAddress = await getAssociatedTokenAddress(
        usdcMintPubkey,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const freedomTokenAddress = await getAssociatedTokenAddress(
        freedomMintPubkey,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Fetch the token accounts in parallel
      const [usdcAccount, freedomAccount, usdcMintInfo, freedomMintInfo] = await Promise.all([
        getAccount(connection, usdcTokenAddress, 'confirmed', TOKEN_PROGRAM_ID).catch(() => null),
        getAccount(connection, freedomTokenAddress, 'confirmed', TOKEN_PROGRAM_ID).catch(
          () => null
        ),
        getMint(connection, usdcMintPubkey, 'confirmed', TOKEN_PROGRAM_ID),
        getMint(connection, freedomMintPubkey, 'confirmed', TOKEN_PROGRAM_ID),
      ]);

      // Format the token balances with proper decimals
      const usdcBalance = usdcAccount
        ? (Number(usdcAccount.amount) / 10 ** usdcMintInfo.decimals).toString()
        : '0';

      const freedomBalance = freedomAccount
        ? (Number(freedomAccount.amount) / 10 ** freedomMintInfo.decimals).toString()
        : '0';

      setBalances({
        usdcBalance,
        freedomBalance,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching token balances:', error);
      setBalances((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error fetching balances'),
      }));
    }
  }, [publicKey, usdcMint, freedomMint, getConnection]);

  // Fetch balances when the wallet changes
  useEffect(() => {
    if (publicKey) {
      fetchBalances();
    } else {
      setBalances({
        usdcBalance: '0',
        freedomBalance: '0',
        isLoading: false,
        error: null,
      });
    }
  }, [publicKey, fetchBalances]);

  return { balances, fetchBalances };
}
