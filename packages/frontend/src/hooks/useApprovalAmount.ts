import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useNetwork } from './useNetwork';

export function useApprovalAmount(tokenAddress: string, txSignature?: string) {
  const { appAddress } = useNetwork();
  const [approvedAmount, setApprovedAmount] = useState<bigint>(BigInt(0));
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    const fetchApprovedAmount = async () => {
      if (!publicKey || !connection) return;

      try {
        if (!tokenAddress) return;

        // In Solana, approvals work differently than in Ethereum.
        // We typically use token accounts to track ownership and delegate authorities.
        // Here, we'll check the token balance as a proxy for "approval"
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
  }, [publicKey, connection, tokenAddress, txSignature, appAddress]);

  return approvedAmount;
}
