import { useNetwork } from '@/hooks/useNetwork';
import { useTokenContext } from '@/hooks/useTokenContext';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { TokenType } from '@/types';
import { bettingContractAbi, POINTS_DECIMALS, USDC_DECIMALS } from '@trump-fun/common';
import { useMemo, useState } from 'react';
import { usePublicClient, useReadContract, useWriteContract } from 'wagmi';

export function useWithdraw() {
  const { appAddress } = useNetwork();
  const { tokenType } = useTokenContext();
  const { address } = useWalletAddress();
  const publicClient = usePublicClient();
  const { isPending, writeContract } = useWriteContract();
  const [withdrawAmount, setWithdrawAmount] = useState(0);

  const tokenTypeC = tokenType === TokenType.Usdc ? 0 : 1;

  const { data: balance } = useReadContract({
    address: appAddress,
    abi: bettingContractAbi,
    functionName: 'userBalances',
    args: [address, tokenTypeC],
  });

  const formattedWithdrawableBalance = useMemo((): number => {
    if (!balance) return 0;
    return tokenType === TokenType.Usdc
      ? Number(balance) / USDC_DECIMALS
      : Number(balance) / POINTS_DECIMALS;
  }, [balance, tokenType]);

  const handleWithdraw = async () => {
    if (!address || !publicClient) return;

    if (withdrawAmount <= formattedWithdrawableBalance && withdrawAmount > 0) {
      try {
        const tokenAmount = BigInt(
          Math.floor(
            withdrawAmount * (tokenType === TokenType.Usdc ? USDC_DECIMALS : POINTS_DECIMALS)
          )
        );

        const { request } = await publicClient.simulateContract({
          abi: bettingContractAbi,
          address: appAddress,
          functionName: 'withdraw',
          account: address as `0x${string}`,
          args: [tokenTypeC, tokenAmount],
        });

        writeContract(request);
      } catch (error) {
        console.error('Error withdrawing tokens:', error);
      }
    } else {
      console.error('Invalid withdrawal amount or insufficient balance');
    }
  };

  return {
    formattedWithdrawableBalance,
    withdrawAmount,
    setWithdrawAmount,
    handleWithdraw,
    isPending,
  };
}
