import { useWallets } from '@privy-io/react-auth';
import { FREEDOM_DECIMALS, erc20Abi } from '@trump-fun/common';
import { TokenType } from '@/types';
import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useEmbeddedWallet } from '../components/EmbeddedWalletProvider';
import { useNetwork } from './useNetwork';
import { useTokenContext } from './useTokenContext';

export const useBalance = () => {
  const { usdcAddress, freedomAddress } = useNetwork();
  const { tokenType } = useTokenContext();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { embeddedWallet, currentChainId, isLoading: isWalletLoading } = useEmbeddedWallet();
  const { ready: walletsReady } = useWallets();

  const tokenAddress = tokenType === TokenType.Usdc ? usdcAddress : freedomAddress;

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

    if (!currentChainId) {
      setError('No chain ID available');
      setBalance('0');
      return;
    }

    try {
      setIsLoadingBalance(true);

      // Get provider from wallet
      const provider = await embeddedWallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);

      // Create contract instance
      const contract = new ethers.Contract(tokenAddress, erc20Abi, ethersProvider);

      try {
        // Get balance
        const balance = await contract.balanceOf(embeddedWallet.address);

        // Format balance (assuming 6 decimals for USDC)
        const formattedBalance = ethers.formatUnits(balance, FREEDOM_DECIMALS);
        // Remove all decimal places by parsing to float and then to integer
        setBalance(Math.floor(parseFloat(formattedBalance)).toString());
      } catch (contractError) {
        if (
          contractError instanceof Error &&
          (contractError.message.includes('could not decode result data') ||
            contractError.message.includes('BAD_DATA'))
        ) {
          setBalance('0');
        } else {
          // Only log unexpected contract errors
          console.error('Unexpected contract interaction error:', contractError);
          // Rethrow for the outer catch block to handle other contract errors
          throw contractError;
        }
      }
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('contract not deployed')) {
          setError(`USDC contract not deployed at address: ${freedomAddress}`);
        } else if (error.message.includes('network changed')) {
          setError('Network changed during balance fetch. Please try again.');
        } else if (error.message.includes('user rejected')) {
          setError('Request was rejected by the user');
        } else if (error.message.includes('insufficient funds')) {
          setError('Insufficient funds for transaction');
        } else if (
          error.message.includes('could not decode result data') ||
          error.message.includes('BAD_DATA')
        ) {
          // This is now handled in the inner try/catch, but keep as fallback
          setBalance('0');
          // Don't set an error for this case as it's expected when there's no balance
        } else {
          setError(`Failed to fetch USDC balance: ${error.message}`);
        }
      } else {
        setError('Unknown error occurred while fetching USDC balance');
      }

      // Always ensure we have a balance value in case of errors
      setBalance((current) => (current === null ? '0' : current));
    } finally {
      setIsLoadingBalance(false);
    }
  }, [walletsReady, isWalletLoading, embeddedWallet, currentChainId, tokenAddress, freedomAddress]);

  // Trigger a balance fetch when dependencies change
  useEffect(() => {
    // Only fetch if wallets are ready and wallet loading is complete
    if (walletsReady && !isWalletLoading) {
      fetchUsdcBalance();
    }
  }, [fetchUsdcBalance, walletsReady, isWalletLoading, currentChainId]);

  // Set up polling interval for balance updates
  useEffect(() => {
    // Only set up polling if wallets are ready and wallet loading is complete
    if (!walletsReady || isWalletLoading) return;

    const intervalId = setInterval(fetchUsdcBalance, 5000);
    return () => clearInterval(intervalId);
  }, [fetchUsdcBalance, walletsReady, isWalletLoading]);

  return { usdcBalance: balance, isLoadingBalance, error, refetch: fetchUsdcBalance };
};
