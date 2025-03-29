import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { bettingContractAbi, freedomAbi, TokenType, USDC_DECIMALS } from '@trump-fun/common';
import { PublicClient } from 'viem';
import { useNetwork } from './useNetwork';

interface UsePlaceBetProps {
  writeContract: any;
  ready: boolean;
  publicClient: PublicClient | undefined;
  accountAddress: string | undefined;
  tokenAddress: `0x${string}`;
  tokenType: TokenType;
  approvedAmount: string | undefined;
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
  approvedAmount,
  isConfirmed,
  resetBettingForm,
  symbol,
}: UsePlaceBetProps) {
  const { appAddress } = useNetwork();
  const tokenTypeC = tokenType === TokenType.Usdc ? 0 : 1;

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
      const tokenAmount = BigInt(Math.floor(amount * 10 ** USDC_DECIMALS));

      const needsApproval = !approvedAmount || parseFloat(approvedAmount) < amount;
      if (needsApproval && !isConfirmed) {
        const { request: approveRequest } = await publicClient.simulateContract({
          abi: freedomAbi,
          address: tokenAddress,
          functionName: 'approve',
          account: accountAddress as `0x${string}`,
          args: [appAddress, tokenAmount],
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
