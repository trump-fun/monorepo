import { erc20Abi } from '@trump-fun/common';
import { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useNetwork } from './useNetwork';
import { Address } from 'viem';

export function useApprovalAmount(tokenAddress: Address, hash?: `0x${string}`) {
  const { appAddress } = useNetwork();
  const [approvedAmount, setApprovedAmount] = useState<string>('0');
  const account = useAccount();
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchApprovedAmount = async () => {
      if (!account.address || !publicClient) return;

      try {
        if (!tokenAddress) return;

        const tokenAddressHex = tokenAddress as `0x${string}`;
        const allowance = await publicClient.readContract({
          abi: erc20Abi,
          address: tokenAddressHex,
          functionName: 'allowance',
          args: [account.address as `0x${string}`, appAddress],
        });

        setApprovedAmount(allowance.toString());
      } catch (error) {
        console.error('Error fetching approved amount:', error);
      }
    };

    fetchApprovedAmount();
  }, [account.address, publicClient, tokenAddress, hash, appAddress]);

  return approvedAmount;
}
