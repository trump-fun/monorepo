import { TokenType } from '@/types';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { PublicClient } from 'viem';
import { useApprovalAmount } from './useApprovalAmount';
import { useNetwork } from './useNetwork';
import { bettingContractAbi, freedomAbi, USDC_DECIMALS } from '@trump-fun/common';
import { UseWriteContractReturnType } from 'wagmi';

interface UsePlaceBetProps {
  writeContract: UseWriteContractReturnType['writeContract'];
  ready: boolean;
  publicClient: PublicClient | undefined;
  accountAddress: string | undefined;
  tokenAddress: `0x${string}`;
  tokenType: TokenType;
  isConfirmed: boolean;
  resetBettingForm?: () => void;
  symbol: string;
}

interface PlaceBetParams {
  poolId: string | undefined;
  betAmount: string;
  selectedOption: number | null;
  options?: string[];
}

export function usePlaceBet({
  writeContract,
  ready,
  publicClient,
  accountAddress,
  tokenAddress,
  tokenType,
  isConfirmed,
  resetBettingForm,
  symbol,
}: UsePlaceBetProps) {
  const { appAddress } = useNetwork();
  const tokenTypeC = tokenType === TokenType.Usdc ? 0 : 1;
  const approvedAmount = useApprovalAmount(tokenAddress);

  const placeBet = async ({ poolId, betAmount, selectedOption, options }: PlaceBetParams) => {
    if (!writeContract || !ready || !publicClient || !accountAddress) {
      return console.error('Wallet or contract not ready');
    }

    if (!betAmount || betAmount === '0' || selectedOption === null) {
      return console.error('Invalid bet parameters');
    }

    if (!poolId) {
      return console.error('Pool ID is not available');
    }

    try {
      const amount = parseInt(betAmount, 10);
      const tokenAmount = BigInt(amount) * BigInt(10 ** USDC_DECIMALS);

      const needsApproval = !approvedAmount || parseFloat(approvedAmount) < amount;
      if (needsApproval && !isConfirmed) {
        const { request: approveRequest } = await publicClient.simulateContract({
          abi: freedomAbi,
          address: tokenAddress,
          functionName: 'approve',
          account: accountAddress as `0x${string}`,
          args: [appAddress, tokenAmount],
          gas: BigInt(100000),
          maxFeePerGas: BigInt(60000000000),
          maxPriorityFeePerGas: BigInt(50000000000),
          nonce: await publicClient.getTransactionCount({
            address: accountAddress as `0x${string}`,
          }),
        });

        writeContract(approveRequest);

        return showSuccessToast(`Approving ${betAmount} ${symbol}...`);
      }

      const args = [
        BigInt(poolId),
        BigInt(selectedOption),
        tokenAmount,
        accountAddress as `0x${string}`,
        tokenTypeC,
      ] as const;

      const { request } = await publicClient.simulateContract({
        abi: bettingContractAbi,
        address: appAddress,
        functionName: 'placeBet',
        account: accountAddress as `0x${string}`,
        args,
      });

      writeContract(request);

      let successMessage = `Betting ${betAmount} ${symbol}`;
      if (options && options[selectedOption]) {
        successMessage += ` on "${options[selectedOption]}"`;
      }
      successMessage += '...';

      showSuccessToast(successMessage);

      if (resetBettingForm) {
        resetBettingForm();
      }
    } catch (error) {
      console.error('Error placing bet:', error);
      showErrorToast('Failed to place bet. Please try again.');
    }
  };

  return placeBet;
}
