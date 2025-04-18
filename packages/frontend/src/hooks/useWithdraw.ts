import { useNetwork } from '@/hooks/useNetwork';
import { useTokenContext } from '@/hooks/useTokenContext';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { TokenType } from '@/types';
import { bettingContractAbi, toDecimal, toRawAmount } from '@trump-fun/common';
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
    // Explicitly cast balance to a type compatible with toDecimal
    return toDecimal(balance as bigint, tokenType);
  }, [balance, tokenType]);

  const handleWithdraw = async () => {
    if (!address || !publicClient) return;

    if (withdrawAmount <= formattedWithdrawableBalance && withdrawAmount > 0) {
      try {
        const tokenAmount = toRawAmount(withdrawAmount, tokenType);

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
