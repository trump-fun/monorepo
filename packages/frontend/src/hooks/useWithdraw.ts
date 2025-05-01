import { useNetwork } from '@/hooks/useNetwork';
import { useTokenContext } from '@/hooks/useTokenContext';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { useSolanaTransaction } from './useSolanaTransaction';
import { TokenType } from '@/types';
import { BN } from '@coral-xyz/anchor';
import { useMemo, useState } from 'react';
import { useAnchorProvider } from '@/components/AnchorProvider';
import { PublicKey } from '@solana/web3.js';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

export function useWithdraw() {
  const { programId } = useNetwork();
  const { tokenType, tokenDecimals } = useTokenContext();
  const { publicKey } = useWalletAddress();
  const { signAndSend } = useSolanaTransaction();
  const { program } = useAnchorProvider();
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [withdrawableBalance, setWithdrawableBalance] = useState<number | null>(null);

  // Fetch user's withdrawable balance from the program
  const fetchWithdrawableBalance = async () => {
    if (!publicKey || !program) return;

    try {
      setIsLoading(true);

      // Get user's balance account from the program
      // Note: This is a placeholder - you'll need to adjust based on your Solana program's actual structure
      const userBalanceAccount = await program.account.userBalances.fetch(
        await getUserBalanceAccountAddress(publicKey, programId)
      );

      // Extract the balance for the selected token type
      const rawBalance =
        tokenType === TokenType.Usdc
          ? userBalanceAccount.usdcBalance
          : userBalanceAccount.freedomBalance;

      // Convert to decimals for display
      const balanceWithDecimals = rawBalance / Math.pow(10, tokenDecimals);
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

      // Convert amount to raw units (lamports)
      const rawAmount = new BN(withdrawAmount * Math.pow(10, tokenDecimals));

      // Create withdrawal transaction
      const tx = await program.methods
        .withdraw(
          rawAmount,
          // Use the appropriate token type for Solana program
          tokenType === TokenType.Usdc ? { usdc: {} } : { freedom: {} }
        )
        .accounts({
          // Include necessary accounts based on your Solana program
          userBalance: await getUserBalanceAccountAddress(publicKey, programId),
          authority: publicKey,
          // Add other required accounts
        })
        .transaction();

      // Send transaction
      const result = await signAndSend(tx);

      if (result) {
        showSuccessToast(
          'Withdrawal successful',
          `You have successfully withdrawn ${withdrawAmount} tokens.`
        );

        // Reset amount and refresh balance
        setWithdrawAmount(0);
        fetchWithdrawableBalance();
      }
    } catch (error: any) {
      console.error('Error withdrawing tokens:', error);
      showErrorToast(
        'Withdrawal failed',
        error.message || 'There was an error processing your withdrawal.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to derive user balance account address
  async function getUserBalanceAccountAddress(user: PublicKey, programId: PublicKey) {
    // This is a placeholder - you'll need to adjust based on your Solana program's PDA derivation
    const [userBalanceAddress] = await PublicKey.findProgramAddress(
      [Buffer.from('user_balance'), user.toBuffer()],
      programId
    );

    return userBalanceAddress;
  }

  return {
    formattedWithdrawableBalance,
    withdrawAmount,
    setWithdrawAmount,
    handleWithdraw,
    isLoading,
    fetchWithdrawableBalance,
  };
}
