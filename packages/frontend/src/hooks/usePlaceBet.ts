'use client';

import { BET_SEED, BETTING_POOLS_SEED, POOL_SEED } from '@/consts';
import { TokenType } from '@/types';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { useCallback } from 'react';

interface UsePlaceBetProps {
  program: any; // Anchor Program
  connection: Connection;
  publicKey: PublicKey | null;
  sendTransaction: ((transaction: Transaction) => Promise<string>) | undefined;
  tokenAddress: string;
  tokenType: TokenType;
  chainConfig: any;
  resetBettingForm?: () => void;
  symbol: string;
}

interface PlaceBetParams {
  poolId: string;
  betAmount: string;
  selectedOption: number | null;
  options?: string[];
}

export function usePlaceBet({
  program,
  connection,
  publicKey,
  sendTransaction,
  tokenAddress,
  tokenType,
  chainConfig,
  resetBettingForm,
  symbol,
}: UsePlaceBetProps) {
  const placeBet = useCallback(
    async ({ poolId, betAmount, selectedOption, options }: PlaceBetParams) => {
      // Early checks for wallet connection and support
      if (!publicKey || !sendTransaction) {
        showErrorToast('Wallet not connected', 'Please connect your wallet first');
        return;
      }

      if (!program) {
        showErrorToast('Program error', 'Program not initialized');
        return;
      }

      if (!betAmount || betAmount === '0' || selectedOption === null) {
        showErrorToast('Please enter a bet amount and select an option');
        return;
      }

      if (!chainConfig || chainConfig.chainType !== 'solana') {
        showErrorToast('Unsupported chain', 'This chain does not support Solana betting');
        return;
      }

      try {
        const amount = new BN(parseInt(betAmount));
        const optionIndex = new BN(selectedOption);

        // Get current betting pools state
        const [bettingPoolsPDA] = PublicKey.findProgramAddressSync(
          [BETTING_POOLS_SEED],
          program.programId
        );

        const bettingPoolsState = await program.account.bettingPoolsState.fetch(bettingPoolsPDA);

        // Find the pool PDA
        const poolIdBN = new BN(poolId);
        const [poolPDA] = PublicKey.findProgramAddressSync(
          [POOL_SEED, poolIdBN.toArrayLike(Buffer, 'le', 8)],
          program.programId
        );

        // Find the next bet PDA
        const nextBetId = bettingPoolsState.nextBetId;
        const [betPDA] = PublicKey.findProgramAddressSync(
          [BET_SEED, poolIdBN.toArrayLike(Buffer, 'le', 8), nextBetId.toArrayLike(Buffer, 'le', 8)],
          program.programId
        );

        // Determine token type for Solana (maps to the TokenType enum in the contract)
        const solanaTokenType = tokenType === TokenType.Usdc ? { usdc: {} } : { points: {} };

        // Get the user's token account
        const userTokenAccount = await connection.getTokenAccountsByOwner(publicKey, {
          mint: new PublicKey(tokenAddress),
        });

        // Get the program's token account
        // This would typically be a PDA derived in a similar way to the betting pools PDA
        const programTokenAccount = new PublicKey(chainConfig.programTokenAccount);

        // Create a transaction to invoke the placeBet function
        const transaction = await program.methods
          .placeBet(optionIndex, amount, solanaTokenType)
          .accounts({
            bettingPools: bettingPoolsPDA,
            pool: poolPDA,
            bet: betPDA,
            bettor: publicKey,
            bettorTokenAccount: userTokenAccount.value[0]?.pubkey,
            programTokenAccount: programTokenAccount,
            tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Solana Token Program
            associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'), // Solana Associated Token Program
            systemProgram: PublicKey.default, // Solana System Program
            rent: new PublicKey('SysvarRent111111111111111111111111111111111'), // Solana Rent Sysvar
          })
          .transaction();

        // Get a recent blockchash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        // Send the transaction
        const txSignature = await sendTransaction(transaction);

        // Wait for transaction confirmation
        const latestBlockhash = await connection.getLatestBlockhash();
        const confirmation = await connection.confirmTransaction({
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          signature: txSignature,
        });

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
        }

        let successMessage = `Betting ${betAmount} ${symbol}`;
        if (options && options[selectedOption]) {
          successMessage += ` on "${options[selectedOption]}"`;
        }

        showSuccessToast(
          'Bet placed successfully',
          `Transaction ID: ${txSignature.substring(0, 8)}...${txSignature.substring(txSignature.length - 8)}`
        );

        console.log(
          `View placeBet TX on explorer: https://solana.fm/tx/${txSignature}?cluster=${chainConfig.cluster}`
        );

        if (resetBettingForm) {
          resetBettingForm();
        }
      } catch (error) {
        console.error('Error placing bet:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error placing bet';
        showErrorToast('Error placing bet', errorMessage);
      }
    },
    [
      program,
      connection,
      publicKey,
      sendTransaction,
      tokenAddress,
      tokenType,
      chainConfig,
      resetBettingForm,
      symbol,
    ]
  );

  return placeBet;
}
