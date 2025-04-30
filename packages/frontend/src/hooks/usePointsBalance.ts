import { useSolanaWallets } from '@privy-io/react-auth';
import { FREEDOM_DECIMALS, erc20Abi, TokenType } from '@trump-fun/common';
import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useEmbeddedWallet } from '../components/EmbeddedWalletProvider';
import { useNetwork } from './useNetwork';
import { useTokenContext } from './useTokenContext';
import { PublicKey } from '@solana/web3.js';

export const useBalance = () => {
  const { usdcMint, freedomMint } = useNetwork();
  const { tokenType } = useTokenContext();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { embeddedWallet, isLoading: isWalletLoading } = useEmbeddedWallet();
  const { ready: walletsReady } = useSolanaWallets();

  const tokenAddress = tokenType === TokenType.Usdc ? usdcMint : freedomMint;

  const fetchUsdcBalance = useCallback(async () => {
    // Reset state at the beginning of each fetch attempt
    setError(null);

    // Check if wallet is ready and chain has been initialized
    if (!walletsReady || isWalletLoading) {
      return;
    }

    if (!embeddedWallet) {
      setBalance('0');
      return;
    }

    try {
      setIsLoadingBalance(true);

      // Get the solana wallet connection
      const connection = await embeddedWallet.getSolanaConnection();

      if (!embeddedWallet.address) {
        setError('No wallet address available');
        setBalance('0');
        return;
      }

      // Fetch token accounts for the user
      const publicKey = new PublicKey(embeddedWallet.address);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        mint: new PublicKey(tokenAddress.toString()),
      });

      // Get balance from token account
      if (tokenAccounts.value.length > 0) {
        // Get the token account with the largest balance
        const tokenAccount = tokenAccounts.value.reduce((prev, current) => {
          const prevAmount = prev.account.data.parsed.info.tokenAmount.uiAmount || 0;
          const currentAmount = current.account.data.parsed.info.tokenAmount.uiAmount || 0;
          return prevAmount > currentAmount ? prev : current;
        });

        const formattedBalance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmountString;

        // Remove all decimal places by parsing to float and then to integer
        setBalance(Math.floor(parseFloat(formattedBalance)).toString());
      } else {
        // No token account found, set balance to 0
        setBalance('0');
      }
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('contract not deployed')) {
          setError(`Token contract not deployed at address: ${tokenAddress}`);
        } else if (error.message.includes('network changed')) {
          setError('Network changed during balance fetch. Please try again.');
        } else if (error.message.includes('user rejected')) {
          setError('Request was rejected by the user');
        } else {
          setError(`Error: ${error.message}`);
        }
      } else {
        setError('An unknown error occurred');
      }

      // Always ensure we have a balance value in case of errors
      setBalance((current) => (current === null ? '0' : current));
    } finally {
      setIsLoadingBalance(false);
    }
  }, [walletsReady, isWalletLoading, embeddedWallet, tokenAddress, freedomMint]);

  // Trigger a balance fetch when dependencies change
  useEffect(() => {
    // Only fetch if wallets are ready and wallet loading is complete
    if (walletsReady && !isWalletLoading) {
      fetchUsdcBalance();
    }
  }, [fetchUsdcBalance, walletsReady, isWalletLoading]);

  // Set up polling interval for balance updates
  useEffect(() => {
    // Only set up polling if wallets are ready and wallet loading is complete
    if (!walletsReady || isWalletLoading) return;

    const intervalId = setInterval(fetchUsdcBalance, 5000);
    return () => clearInterval(intervalId);
  }, [fetchUsdcBalance, walletsReady, isWalletLoading]);

  return { usdcBalance: balance, isLoadingBalance, error, refetch: fetchUsdcBalance };
};
