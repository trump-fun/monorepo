import { useAnchorProvider } from '@/components/providers/anchor-provider';
import { useTokenContext } from '@/hooks/useTokenContext';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { TokenType } from '@/types';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isSolanaWallet } from '@dynamic-labs/solana';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { BETTING_POOLS_SEED, SOLANA_DEVNET_CONFIG } from '@trump-fun/common';
import { useMemo, useState } from 'react';

export function useWithdraw() {
  const { tokenType, tokenDecimals } = useTokenContext();
  const { publicKey } = useWalletAddress();
  const { program } = useAnchorProvider();
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [withdrawableBalance, setWithdrawableBalance] = useState<number | null>(null);
  const { primaryWallet } = useDynamicContext();

  const fetchWithdrawableBalance = async () => {
    if (!primaryWallet || !isSolanaWallet(primaryWallet)) {
      showErrorToast('Wallet not connected', 'Please connect your wallet to fetch balance.');
      return;
    }

    const connection = await primaryWallet.getConnection();
    if (!publicKey || !program) return;

    try {
      setIsLoading(true);

      const [bettingPoolsPDA] = PublicKey.findProgramAddressSync(
        [BETTING_POOLS_SEED],
        program.programId
      );
      const bettingPoolsState = await program.account.bettingPoolsState.fetch(bettingPoolsPDA);

      const tokenAddress =
        tokenType === TokenType.Usdc ? bettingPoolsState.usdcMint : bettingPoolsState.freedomMint;

      const bettorAta = await getAssociatedTokenAddress(tokenAddress, publicKey, true);
      // @ts-ignore
      const bettorAtaInfo = await getAccount(connection, bettorAta, 'confirmed');

      const balanceWithDecimals = Number(bettorAtaInfo.amount) / Math.pow(10, tokenDecimals);
      setWithdrawableBalance(balanceWithDecimals);
    } catch (error) {
      console.error('Error fetching withdrawable balance:', error);
      setWithdrawableBalance(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Format the withdrawable balance for display
  const formattedWithdrawableBalance = useMemo((): number => {
    return withdrawableBalance || 0;
  }, [withdrawableBalance]);

  const handleWithdraw = async () => {
    if (!publicKey || !program) {
      showErrorToast('Wallet not connected', 'Please connect your wallet to withdraw funds.');
      return;
    }

    if (withdrawAmount <= 0) {
      showErrorToast('Invalid amount', 'Please enter an amount greater than zero.');
      return;
    }

    if (withdrawAmount > formattedWithdrawableBalance) {
      showErrorToast(
        'Insufficient balance',
        'The withdrawal amount exceeds your available balance.'
      );
      return;
    }

    try {
      setIsLoading(true);

      const [bettingPoolsPDA] = PublicKey.findProgramAddressSync(
        [BETTING_POOLS_SEED],
        program.programId
      );
      const bettingPoolsState = await program.account.bettingPoolsState.fetch(bettingPoolsPDA);

      const tokenAddress =
        tokenType === TokenType.Usdc ? bettingPoolsState.usdcMint : bettingPoolsState.freedomMint;

      const bettorAta = await getAssociatedTokenAddress(tokenAddress, publicKey, true);
      const programAta = await getAssociatedTokenAddress(tokenAddress, SOLANA_DEVNET_CONFIG.escrow);

      const tx = await program.methods
        .claimPayout()
        .accounts({
          bettorTokenAccount: bettorAta,
          programTokenAccount: programAta,
          bettor: publicKey,
        })
        .transaction();

      if (!primaryWallet || !isSolanaWallet(primaryWallet)) {
        showErrorToast('Wallet not connected', 'Please connect your wallet to withdraw funds.');
        return;
      }

      const signer = await primaryWallet.getSigner();
      const result = await signer.signAndSendTransaction(tx, {
        maxRetries: 3,
      });

      if (result) {
        showSuccessToast(
          'Withdrawal successful',
          `You have successfully withdrawn ${withdrawAmount} tokens.`
        );

        // Reset amount and refresh balance
        setWithdrawAmount(0);
        fetchWithdrawableBalance();
      }
    } catch (error: unknown) {
      console.error('Error withdrawing tokens:', error);
      showErrorToast(
        'Withdrawal failed',
        error instanceof Error ? error.message : 'There was an error processing your withdrawal.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formattedWithdrawableBalance,
    withdrawAmount,
    setWithdrawAmount,
    handleWithdraw,
    isLoading,
    fetchWithdrawableBalance,
  };
}
