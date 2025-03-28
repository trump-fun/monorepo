import { APP_ADDRESS, erc20Abi } from '@trump-fun/common';
import { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';

export function useApprovalAmount(
  getTokenAddress: () => string | `0x${string}` | null,
  hash?: `0x${string}`
) {
  const [approvedAmount, setApprovedAmount] = useState<string>('0');
  const account = useAccount();
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchApprovedAmount = async () => {
      if (!account.address || !publicClient) return;

      try {
        const tokenAddress = getTokenAddress();
        if (!tokenAddress) return;

        const tokenAddressHex = tokenAddress as `0x${string}`;
        const allowance = await publicClient.readContract({
          abi: erc20Abi,
          address: tokenAddressHex,
          functionName: 'allowance',
          args: [account.address as `0x${string}`, APP_ADDRESS],
        });

        setApprovedAmount(allowance.toString());
      } catch (error) {
        console.error('Error fetching approved amount:', error);
      }
    };

    fetchApprovedAmount();
  }, [account.address, publicClient, getTokenAddress, hash]);

  return approvedAmount;
}
