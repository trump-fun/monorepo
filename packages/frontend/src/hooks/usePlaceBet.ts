import { TokenType } from '@/types';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { bettingContractAbi, freedomAbi, USDC_DECIMALS } from '@trump-fun/common';
import { useWriteContract } from 'wagmi';
import { useApprovalAmount } from './useApprovalAmount';
import { useNetwork } from './useNetwork';

interface UsePlaceBetProps {
  writeContract: ReturnType<typeof useWriteContract>['writeContract'];
  ready: boolean;
  publicClient: any; // Using any to avoid version-specific type conflicts
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
      const tokenAmount = BigInt(betAmount) * BigInt(10 ** USDC_DECIMALS);
      const needsApproval = !approvedAmount || approvedAmount < tokenAmount;
      if (needsApproval) {
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

      const { request } = await publicClient.simulateContract({
        abi: bettingContractAbi,
        address: appAddress,
        functionName: 'placeBet',
        account: accountAddress as `0x${string}`,
        args: [
          BigInt(poolId),
          BigInt(selectedOption),
          tokenAmount,
          accountAddress as `0x${string}`,
          tokenTypeC,
        ],
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
