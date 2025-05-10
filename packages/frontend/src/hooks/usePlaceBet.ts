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
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { BET_SEED, BETTING_POOLS_SEED, POOL_SEED, SOLANA_DEVNET_CONFIG } from '@trump-fun/common';
import { useCallback } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isSolanaWallet } from '@dynamic-labs/solana';
import { useDynamicSolana } from './useDynamicSolana';
import { useTokenContext } from './useTokenContext';

// Solana well-known program addresses
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ASSOCIATED_TOKEN_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const SYSVAR_RENT = 'SysvarRent111111111111111111111111111111111';

// Retry configuration for transaction submission and confirmation
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 5000;

interface UsePlaceBetProps {
  resetBettingForm?: () => void;
}

interface PlaceBetParams {
  poolId: string;
  betAmount: string;
  selectedOption: number | null;
}

/**
 * Retry utility function with exponential backoff
 */
async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  // Use Error | unknown type instead of any
  isRetryable: (error: Error | unknown) => boolean,
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

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5 + Math.random() * 100, maxDelayMs);
      retries++;
    }
  }
}

/**
 * Custom hook for placing bets using the Solana blockchain
 *
 * NOTE ABOUT TYPE ASSERTIONS:
 * There are multiple type assertions (using 'as unknown as ...') throughout this file.
 * These are necessary because we're dealing with version mismatches between different
 * Solana web3.js libraries. The Dynamic SDK uses its own version of @solana/web3.js
 * which conflicts with the version imported at the top of this file. These type assertions
 * allow us to bypass TypeScript's checks while maintaining runtime compatibility.
 */
export function usePlaceBet({ resetBettingForm }: UsePlaceBetProps) {
  const { program } = useAnchorProvider();
  const { chainConfig } = useChainConfig();
  const { tokenMint, tokenType } = useTokenContext();
  const { publicKey } = useDynamicSolana();
  const { primaryWallet } = useDynamicContext();

  const placeBet = useCallback(
    async ({ poolId, betAmount, selectedOption }: PlaceBetParams) => {
      // Early checks for wallet connection and support
      if (!publicKey || !primaryWallet) {
        showErrorToast('Wallet not connected', 'Please connect your wallet first');
        return;
      }

      // Validate wallet is a Solana wallet
      if (!isSolanaWallet(primaryWallet)) {
        showErrorToast('Wallet error', 'Please connect a Solana wallet');
        return;
      } // Get connection from wallet
      const connection = await primaryWallet.getConnection();

      // Get the Solana signer for transaction signing
      const signer = await primaryWallet.getSigner();

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
          const amount = new BN(parseInt(betAmount) * 10 ** 6);
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
          const instructions: TransactionInstruction[] = [];
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

          // Create the Anchor transaction instruction directly
          // Using the Anchor program to create the instruction
          const ixResult = await program.methods
            .placeBet(optionIndex, amount, solanaTokenType)
            .accounts({
              // Include all required accounts here using TypeScript comments to bypass type checking
              // @ts-expect-error: Anchor accounts type mismatch due to version conflicts
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
            .instruction();

          // Create a transaction and add the instruction
          const anchorTx = new Transaction();
          anchorTx.add(ixResult);
          instructions.push(...anchorTx.instructions);

          // Function to determine if error is retryable
          const isRetryableError = (error: Error | unknown): boolean => {
            const errorMessage = error instanceof Error ? error.message : String(error);
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
          let txSignature: string;
          try {
            const signResult = await retryWithExponentialBackoff(async () => {
              // Get a fresh blockhash for each attempt
              const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

              // Create a new transaction
              const tx = new Transaction();
              tx.add(...instructions);
              tx.recentBlockhash = blockhash;
              tx.feePayer = publicKey;
              tx.lastValidBlockHeight = lastValidBlockHeight;

              // Skip simulation since it's causing compatibility issues
              // The transaction will be validated by the network when sent

              // Send the transaction using Dynamic SDK's signer directly
              try {
                // Use a more direct approach to sign and send the transaction
                // This avoids the header issues seen in the error message
                // Cast transaction to resolve compatibility issues between different @solana/web3.js versions
                const signedTx = await signer.signTransaction(tx as any);

                // Send the signed transaction
                const signature = await connection.sendRawTransaction(signedTx.serialize());

                // Return result in format expected by the rest of the code
                return {
                  signature,
                };
              } catch (e) {
                console.error('Error preparing transaction:', e);
                throw e;
              }
            }, isRetryableError);

            txSignature = signResult.signature;

            console.log('Transaction sent:', txSignature);
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
              (error: Error | unknown) => {
                // Only retry network/timeout errors, not transaction validation errors
                const errorMsg = error instanceof Error ? error.message : String(error);
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
    [publicKey, primaryWallet, program, chainConfig, tokenType, tokenMint, resetBettingForm]
  );

  return placeBet;
}
