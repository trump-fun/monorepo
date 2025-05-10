import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { useDynamicSolana } from './useDynamicSolana';

export function useApprovalAmount(tokenAddress: string, txSignature?: string) {
  const [approvedAmount, setApprovedAmount] = useState<bigint>(BigInt(0));
  const { publicKey, getConnection } = useDynamicSolana();

  useEffect(() => {
    const fetchApprovedAmount = async () => {
      if (!publicKey || !tokenAddress) return;

      try {
        const connection = await getConnection();

        const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
          mint: new PublicKey(tokenAddress),
        });

        if (tokenAccounts.value.length > 0) {
          const tokenAccountInfo = await connection.getTokenAccountBalance(
            tokenAccounts.value[0].pubkey
          );

          setApprovedAmount(BigInt(tokenAccountInfo.value.amount));
        } else {
          setApprovedAmount(BigInt(0));
        }
      } catch (error) {
        console.error('Error fetching token amount:', error);
        setApprovedAmount(BigInt(0));
      }
    };

    fetchApprovedAmount();
  }, [publicKey, getConnection, tokenAddress, txSignature]);

  return approvedAmount;
}
