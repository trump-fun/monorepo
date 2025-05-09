'use client';

import { useAnchorProvider } from '@/components/providers/anchor-provider';
import { useChainConfig } from '@/components/providers/chain-config-provider';
import { TokenType } from '@/types';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { BN } from '@coral-xyz/anchor';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { PublicKey, SystemProgram, Transaction, TransactionSignature } from '@solana/web3.js';
import { BET_SEED, BETTING_POOLS_SEED, POOL_SEED, SOLANA_DEVNET_CONFIG } from '@trump-fun/common';
import { useCallback } from 'react';
import { useDynamicSolana } from './useDynamicSolana';
import { useTokenContext } from './useTokenContext';

// Solana well-known program addresses
// change this later on
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ASSOCIATED_TOKEN_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const SYSVAR_RENT = 'SysvarRent111111111111111111111111111111111';

// Retry configuration for transaction submission and confirmation
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 500; // Start with 500ms delay
const MAX_DELAY_MS = 15000; // Maximum delay of 15 seconds

interface UsePlaceBetProps {
  sendTransaction: ((transaction: Transaction) => Promise<string>) | undefined;
  resetBettingForm?: () => void;
}

interface PlaceBetParams {
  poolId: string;
  betAmount: string;
  selectedOption: number | null;
  connection: any;
}

/**
 * Retry utility function with exponential backoff
 * @param operation The async function to retry
 * @param isRetryable Function to determine if an error is retryable
 * @param maxRetries Maximum number of retry attempts
 * @param baseDelayMs Initial delay in milliseconds
 * @param maxDelayMs Maximum delay in milliseconds
 */
async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  isRetryable: (error: any) => boolean,
  maxRetries: number = MAX_RETRIES,
  baseDelayMs: number = BASE_DELAY_MS,
  maxDelayMs: number = MAX_DELAY_MS
): Promise<T> {
  let retries = 0;
  let delay = baseDelayMs;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (retries >= maxRetries || !isRetryable(error)) {
        throw error;
      }

      console.log(`Retry attempt ${retries + 1}/${maxRetries} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff with jitter to avoid thundering herd
      delay = Math.min(delay * 1.5 + Math.random() * 100, maxDelayMs);
      retries++;
    }
  }
}

export function usePlaceBet({ sendTransaction, resetBettingForm }: UsePlaceBetProps) {
  const { program } = useAnchorProvider();
  const { chainConfig } = useChainConfig();
  const { tokenMint, tokenType } = useTokenContext();
  const { publicKey } = useDynamicSolana();

  const placeBet = useCallback(
    async ({ poolId, betAmount, selectedOption, connection }: PlaceBetParams) => {
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
        showErrorToast('Invalid bet', 'Please enter a bet amount and select an option');
        return;
      }
      if (selectedOption !== 0 && selectedOption !== 1) {
        showErrorToast('Invalid option', 'Please select a valid option (0 or 1)');
        return;
      }
      if (!chainConfig || chainConfig.chainType !== 'solana') {
        showErrorToast('Unsupported chain', 'This chain does not support Solana betting');
        return;
      }
      try {
        const [bettingPoolsPDA] = PublicKey.findProgramAddressSync(
          [BETTING_POOLS_SEED],
          program.programId
        );

        try {
          if (!program.account?.bettingPoolsState) {
            showErrorToast('Program setup error', 'Program interface is not properly loaded');
            return;
          }
          const bettingPoolsState = await program.account.bettingPoolsState.fetch(bettingPoolsPDA);

          if (!bettingPoolsState.isInitialized) {
            showErrorToast(
              'Program error',
              'The betting program has not been properly initialized'
            );
            return;
          }

          // Convert inputs to proper types
          const amount = new BN(parseInt(betAmount));
          const optionIndex = new BN(selectedOption);

          // Parse pool ID from string, if it's a number
          let poolIdBN: BN;
          try {
            // Check if poolId is a valid number string
            if (!/^\d+$/.test(poolId)) {
              showErrorToast('Invalid pool ID', 'Pool ID must be a valid number');
              return;
            }

            poolIdBN = new BN(parseInt(poolId));
          } catch (error) {
            console.error('Error parsing pool ID:', error);
            showErrorToast('Invalid pool ID', 'Could not parse pool ID');
            return;
          }

          // Validate amount
          if (amount.lte(new BN(0))) {
            showErrorToast('Invalid amount', 'Bet amount must be greater than 0');
            return;
          }

          const nextBetId = bettingPoolsState.nextBetId;

          // Get PDAs
          const [poolPDA] = PublicKey.findProgramAddressSync(
            [POOL_SEED, poolIdBN.toArrayLike(Buffer, 'le', 8)],
            program.programId
          );
          const [betPDA] = PublicKey.findProgramAddressSync(
            [
              BET_SEED,
              poolIdBN.toArrayLike(Buffer, 'le', 8),
              nextBetId.toArrayLike(Buffer, 'le', 8),
            ],
            program.programId
          );

          // Set token type
          const solanaTokenType = tokenType === TokenType.Usdc ? { usdc: {} } : { points: {} };

          // Get user's token account
          const userTokenAccountAddress = await getAssociatedTokenAddress(
            new PublicKey(tokenMint),
            publicKey
          );

          // Check program token account
          if (!chainConfig.programTokenAccount) {
            showErrorToast('Configuration error', 'Program token account not configured');
            return;
          }
          const programTokenAccount = await getAssociatedTokenAddress(
            new PublicKey(tokenMint),
            SOLANA_DEVNET_CONFIG.escrow
          );

          // Verify the program token account exists and has the correct ownership
          try {
            const programTokenInfo = await connection.getAccountInfo(programTokenAccount);
            if (!programTokenInfo) {
              showErrorToast('Configuration error', 'Program token account does not exist');
              return;
            }

            // Verify the token account is owned by the TOKEN_PROGRAM
            if (!programTokenInfo.owner.equals(new PublicKey(TOKEN_PROGRAM))) {
              showErrorToast(
                'Configuration error',
                'Program token account is owned by wrong program'
              );
              return;
            }
          } catch (error) {
            console.error('Error verifying program token account:', error);
            showErrorToast('Configuration error', 'Failed to verify program token account');
            return;
          }

          // Create instructions
          const instructions = [];
          instructions.push(
            createAssociatedTokenAccountIdempotentInstruction(
              publicKey, // payer
              userTokenAccountAddress, // ata
              publicKey, // owner
              new PublicKey(tokenMint) // mint
            )
          );

          // Verify the pool exists before attempting to place a bet
          try {
            const poolAccount = await program.account.pool.fetch(poolPDA);
            if (!poolAccount || !poolAccount.id) {
              showErrorToast('Pool not found', `No betting pool found with ID ${poolId}`);
              return;
            }
          } catch (error) {
            console.error('Error fetching pool:', error);
            showErrorToast(
              'Pool not found',
              `The betting pool with ID ${poolId} does not exist or cannot be accessed`
            );
            return;
          }

          // Create and add program instruction
          const anchorTx = await program.methods
            .placeBet(optionIndex, amount, solanaTokenType)
            .accounts({
              bettingPools: bettingPoolsPDA,
              pool: poolPDA,
              bet: betPDA,
              bettor: publicKey,
              bettorTokenAccount: userTokenAccountAddress,
              programTokenAccount: programTokenAccount,
              tokenProgram: new PublicKey(TOKEN_PROGRAM),
              associatedTokenProgram: new PublicKey(ASSOCIATED_TOKEN_PROGRAM),
              systemProgram: SystemProgram.programId,
              rent: new PublicKey(SYSVAR_RENT),
            })
            .transaction();
          instructions.push(...anchorTx.instructions);

          // Get a fresh blockhash before each transaction attempt
          const getNewTransaction = async (): Promise<Transaction> => {
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            const newTx = new Transaction();
            newTx.add(...instructions);
            newTx.recentBlockhash = blockhash;
            newTx.feePayer = publicKey;
            newTx.lastValidBlockHeight = lastValidBlockHeight;
            return newTx;
          };

          // Function to determine if error is retryable
          const isRetryableError = (error: any): boolean => {
            const errorMessage = error?.message || '';
            const retryableErrors = [
              'Network Error',
              'Transaction simulation failed',
              'failed to send transaction',
              'Transaction was not confirmed',
              'Blockhash not found',
              'Timeout',
            ];

            // Check if error message includes any of the retryable errors
            return retryableErrors.some((errMsg) => errorMessage.includes(errMsg));
          };

          // Send transaction with retry logic
          let txSignature: TransactionSignature;
          try {
            txSignature = await retryWithExponentialBackoff(async () => {
              const tx = await getNewTransaction();
              return await sendTransaction(tx);
            }, isRetryableError);
          } catch (error) {
            console.error('Failed to send transaction after retries:', error);
            showErrorToast(
              'Transaction error',
              'Failed to send transaction after several attempts'
            );
            return;
          }

          // Wait for confirmation with retry logic
          try {
            await retryWithExponentialBackoff(
              async () => {
                // Get updated blockhash for confirmation
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

                const confirmation = await connection.confirmTransaction(
                  {
                    blockhash,
                    lastValidBlockHeight,
                    signature: txSignature,
                  },
                  'confirmed'
                );

                if (confirmation.value.err) {
                  const errorMessage = confirmation.value.err.toString();
                  throw new Error(`Transaction confirmation failed: ${errorMessage}`);
                }

                return confirmation;
              },
              (error) => {
                // Only retry network/timeout errors, not transaction validation errors
                const errorMsg = error?.message || '';
                return (
                  errorMsg.includes('Network Error') ||
                  errorMsg.includes('Timeout') ||
                  errorMsg.includes('failed to fetch') ||
                  errorMsg.includes('Connection closed')
                );
              }
            );
          } catch (error) {
            console.error('Transaction confirmation error:', error);

            // Special error handling for known transaction errors
            const errorMessage = error instanceof Error ? error.message : String(error);

            if (errorMessage.includes('BettingPeriodClosed')) {
              showErrorToast('Betting period closed', 'This pool is no longer accepting bets');
            } else if (errorMessage.includes('PoolNotOpen')) {
              showErrorToast('Pool not open', 'This pool is not open for betting');
            } else if (errorMessage.includes('InvalidOptionIndex')) {
              showErrorToast('Invalid option', 'Please select a valid option');
            } else if (errorMessage.includes('ZeroAmount')) {
              showErrorToast('Invalid amount', 'Bet amount must be greater than 0');
            } else {
              showErrorToast('Error placing bet', `Transaction failed: ${errorMessage}`);
            }
            return;
          }

          showSuccessToast(
            'Bet placed successfully',
            `Transaction ID: ${txSignature.substring(0, 8)}...${txSignature.substring(txSignature.length - 8)}`
          );
          if (resetBettingForm) {
            resetBettingForm();
          }
          return txSignature;
        } catch (err) {
          console.error('Error placing bet', err);
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';

          // Check for specific account not found error
          if (errorMsg.includes('Account does not exist') || errorMsg.includes('has no data')) {
            showErrorToast(
              'Program initialization error',
              `The betting program needs to be initialized first. The system encountered: ${errorMsg}`
            );
          } else {
            showErrorToast('Error placing bet', errorMsg);
          }
          return;
        }
      } catch (error) {
        console.error('Error placing bet', error);
        showErrorToast(
          'Error placing bet',
          error instanceof Error ? error.message : 'Unknown error placing bet'
        );
        return;
      }
    },
    [publicKey, sendTransaction, program, chainConfig, tokenType, tokenMint, resetBettingForm]
  );

  return placeBet;
}
