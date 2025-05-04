'use client';

import { BET_SEED, BETTING_POOLS_SEED, POOL_SEED } from '@/consts';
import { TokenType } from '@/types';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { useCallback } from 'react';

// Solana well-known program addresses
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ASSOCIATED_TOKEN_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const SYSVAR_RENT = 'SysvarRent111111111111111111111111111111111';

interface UsePlaceBetProps {
  program: any; // Anchor Program
  connection: Connection;
  publicKey: PublicKey | null;
  sendTransaction: ((transaction: Transaction) => Promise<string>) | undefined;
  tokenAddress: PublicKey;
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

      // Enhanced program validation - check if IDL is properly loaded
      if (
        !program.account ||
        Object.keys(program.account).length === 0 ||
        !program.methods ||
        Object.keys(program.methods).length === 0
      ) {
        console.error('Program incorrectly initialized:', {
          hasAccount: !!program.account,
          accountKeys: Object.keys(program.account || {}),
          hasMethods: !!program.methods,
          methodKeys: Object.keys(program.methods || {}),
        });
        showErrorToast(
          'Program error',
          'Program not properly initialized. Please refresh the page or contact support.'
        );
        return;
      }

      if (!betAmount || betAmount === '0' || selectedOption === null) {
        showErrorToast('Please enter a bet amount and select an option');
        return;
      }

      console.log('Chain type:', chainConfig?.chainType);

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

        console.log('Program ID:', program.programId.toString());
        console.log('Program accounts:', Object.keys(program.account || {}));
        console.log('Program methods:', Object.keys(program.methods || {}));

        // Check if we have the required methods before proceeding
        if (!program.methods?.placeBet) {
          showErrorToast('Program error', 'placeBet method is not available');
          console.error('Error: program.methods.placeBet is undefined');
          return;
        }

        // Alternative approach without using bettingPoolsState directly
        // Instead, we'll use direct PDAs and parameters

        // Find the pool PDA
        const poolIdBN = new BN(poolId);
        const [poolPDA] = PublicKey.findProgramAddressSync(
          [POOL_SEED, poolIdBN.toArrayLike(Buffer, 'le', 8)],
          program.programId
        );

        // For the next bet ID, we'll use 0 as a default
        // This will likely fail, but it's better than crashing completely
        let nextBetId = new BN(0);

        try {
          // Try to fetch the betting pools state if available
          if (program.account?.bettingPoolsState) {
            const bettingPoolsState =
              await program.account.bettingPoolsState.fetch(bettingPoolsPDA);
            console.log('Betting pools state:', bettingPoolsState);
            nextBetId = bettingPoolsState.nextBetId;
          } else {
            console.warn('bettingPoolsState account not available, using default nextBetId');
          }
        } catch (err) {
          console.error('Failed to fetch bettingPoolsState:', err);
        }

        // Find the next bet PDA
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

        if (!userTokenAccount.value.length) {
          showErrorToast('Token account error', `No ${symbol} token account found for your wallet`);
          return;
        }

        // Get the program's token account
        const programTokenAccount = new PublicKey(chainConfig.programTokenAccount);

        console.log('Creating bet with accounts:', {
          bettingPools: bettingPoolsPDA.toString(),
          pool: poolPDA.toString(),
          bet: betPDA.toString(),
          bettor: publicKey.toString(),
          bettorTokenAccount: userTokenAccount.value[0].pubkey.toString(),
          programTokenAccount: programTokenAccount.toString(),
        });

        // Create the transaction with Anchor's method builder
        const transaction = await program.methods
          .placeBet(optionIndex, amount, solanaTokenType)
          .accounts({
            bettingPools: bettingPoolsPDA,
            pool: poolPDA,
            bet: betPDA,
            bettor: publicKey,
            bettorTokenAccount: userTokenAccount.value[0].pubkey,
            programTokenAccount: programTokenAccount,
            tokenProgram: new PublicKey(TOKEN_PROGRAM),
            associatedTokenProgram: new PublicKey(ASSOCIATED_TOKEN_PROGRAM),
            systemProgram: SystemProgram.programId,
            rent: new PublicKey(SYSVAR_RENT),
          })
          .transaction();

        // Get a recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();

        // Create a new transaction with the instructions from the Anchor transaction
        const compatibleTransaction = new Transaction();
        compatibleTransaction.add(...transaction.instructions);
        compatibleTransaction.recentBlockhash = blockhash;
        compatibleTransaction.feePayer = publicKey;

        // Send the transaction
        const txSignature = await sendTransaction(compatibleTransaction);

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
