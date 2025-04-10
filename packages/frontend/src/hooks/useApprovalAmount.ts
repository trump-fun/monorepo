import { freedomAbi } from '@trump-fun/common';
import { useEffect, useState } from 'react';
import { Address } from 'viem';
import { useAccount, usePublicClient } from 'wagmi';
import { useNetwork } from './useNetwork';

export function useApprovalAmount(tokenAddress: Address, hash?: `0x${string}`) {
  const { appAddress } = useNetwork();
  const [approvedAmount, setApprovedAmount] = useState<bigint>(BigInt(0));
  const account = useAccount();
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchApprovedAmount = async () => {
      if (!account.address || !publicClient) return;

      try {
        if (!tokenAddress) return;

        const allowance = await publicClient.readContract({
          abi: freedomAbi,
          address: tokenAddress,
          functionName: 'allowance',
          args: [account.address as `0x${string}`, appAddress],
        });

        setApprovedAmount(allowance);
      } catch (error) {
        console.error('Error fetching approved amount:', error);
      }
    };

    fetchApprovedAmount();
  }, [account.address, publicClient, tokenAddress, hash, appAddress]);

  return approvedAmount;
}
