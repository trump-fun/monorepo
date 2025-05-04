import { TokenType } from '@/types';
import { useSolanaWallets } from '@privy-io/react-auth';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useCallback, useEffect, useState } from 'react';
import { useNetwork } from './useNetwork';
import { useTokenContext } from './useTokenContext';

export const useBalance = () => {
  const { usdcMint, freedomMint } = useNetwork();
  const { tokenType } = useTokenContext();
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [freedomBalance, setFreedomBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ready: walletsReady, wallets } = useSolanaWallets();
  const { connection } = useConnection();

  // Get the first wallet from the wallets array
  const embeddedWallet = wallets && wallets.length > 0 ? wallets[0] : null;

  // Helper function to fetch balance for a single token
  const fetchSingleTokenBalance = useCallback(
    async (
      walletPublicKey: PublicKey,
      tokenMintPublicKey: PublicKey,
      setBalance: (balance: string) => void
    ) => {
      try {
        // Find the associated token account address
        const associatedTokenAccountAddress = await getAssociatedTokenAddress(
          tokenMintPublicKey,
          walletPublicKey
        );

        // Fetch the balance directly
        const balanceResponse = await connection.getTokenAccountBalance(
          associatedTokenAccountAddress
        );

        // Set the balance from the response
        const balance = balanceResponse.value.uiAmountString || '0';
        setBalance(balance);
      } catch {
        setBalance('0');
      }
    },
    [connection]
  );

  const fetchTokenBalances = useCallback(async () => {
    // Reset state at the beginning of each fetch attempt
    setError(null);

    // Check if wallet is ready and chain has been initialized
    if (!walletsReady) {
      return;
    }

    if (!embeddedWallet) {
      setUsdcBalance('0');
      setFreedomBalance('0');
      return;
    }

    if (!usdcMint || !freedomMint) {
      setUsdcBalance('0');
      setFreedomBalance('0');
      return;
    }

    if (!connection) {
      setUsdcBalance('0');
      setFreedomBalance('0');
      return;
    }

    try {
      setIsLoadingBalance(true);

      if (!embeddedWallet.address) {
        setError('No wallet address available');
        setUsdcBalance('0');
        setFreedomBalance('0');
        return;
      }

      // Create the wallet public key
      const walletPublicKey = new PublicKey(embeddedWallet.address);

      // Safely convert mint addresses to PublicKey objects
      let usdcMintPublicKey: PublicKey;
      let freedomMintPublicKey: PublicKey;

      try {
        usdcMintPublicKey = new PublicKey(
          typeof usdcMint === 'string' ? usdcMint : usdcMint.toString()
        );
        freedomMintPublicKey = new PublicKey(
          typeof freedomMint === 'string' ? freedomMint : freedomMint.toString()
        );
      } catch (error) {
        console.error('Invalid mint address format:', error);
        setError('Invalid token mint addresses');
        setUsdcBalance('0');
        setFreedomBalance('0');
        setIsLoadingBalance(false);
        return;
      }

      // Fetch both token balances
      await Promise.all([
        fetchSingleTokenBalance(walletPublicKey, usdcMintPublicKey, setUsdcBalance),
        fetchSingleTokenBalance(walletPublicKey, freedomMintPublicKey, setFreedomBalance),
      ]);
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error) {
        if (
          error.message.includes('account not found') ||
          error.message.includes('could not find account')
        ) {
          // This is an expected error when a user has no token account
          setUsdcBalance('0');
          setFreedomBalance('0');
          // Don't set an error for this case
        } else {
          console.error('Error fetching token balances:', error);
          setError(`Failed to fetch token balances: ${error.message}`);
          setUsdcBalance('0');
          setFreedomBalance('0');
        }
      } else {
        setError('An unknown error occurred');
        setUsdcBalance('0');
        setFreedomBalance('0');
      }
    } finally {
      setIsLoadingBalance(false);
    }
  }, [walletsReady, embeddedWallet, usdcMint, freedomMint, connection, fetchSingleTokenBalance]);

  // Trigger a balance fetch when dependencies change
  useEffect(() => {
    if (walletsReady && embeddedWallet && connection && usdcMint && freedomMint) {
      fetchTokenBalances();
    }
  }, [fetchTokenBalances, walletsReady, embeddedWallet, connection, usdcMint, freedomMint]);

  // Set up polling interval for balance updates
  useEffect(() => {
    if (!walletsReady || !connection) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchTokenBalances();
    }, 5000);
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchTokenBalances, walletsReady, connection]);

  // Return balance based on selected token type, plus both balances individually
  const currentBalance = tokenType === TokenType.Usdc ? usdcBalance : freedomBalance;

  return {
    currentBalance: currentBalance || '0',
    // Include both specific token balances
    usdcBalance: usdcBalance || '0',
    freedomBalance: freedomBalance || '0',
    isLoadingBalance,
    error,
    refetch: fetchTokenBalances,
  };
};
