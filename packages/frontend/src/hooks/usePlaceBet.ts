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
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { BET_SEED, BETTING_POOLS_SEED, POOL_SEED } from '@trump-fun/common';
import { useCallback } from 'react';
import { useDynamicSolana } from './useDynamicSolana';
import { useTokenContext } from './useTokenContext';

// Solana well-known program addresses
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ASSOCIATED_TOKEN_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const SYSVAR_RENT = 'SysvarRent111111111111111111111111111111111';

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

        console.log('bettingPoolsPDA', bettingPoolsPDA.toString());

        try {
          if (!(program as any).account?.bettingPoolsState) {
            showErrorToast('Program setup error', 'Program interface is not properly loaded');
            return;
          }
          const bettingPoolsState = await (program as any).account.bettingPoolsState.fetch(
            bettingPoolsPDA
          );

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
          const programTokenAccount = new PublicKey(chainConfig.programTokenAccount);

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

          console.log('Placing bet with accounts:', {
            bettingPools: bettingPoolsPDA.toString(),
            pool: poolPDA.toString(),
            bet: betPDA.toString(),
            bettor: publicKey.toString(),
            bettorTokenAccount: userTokenAccountAddress.toString(),
            programTokenAccount: programTokenAccount.toString(),
          });

          // Verify the pool exists before attempting to place a bet
          try {
            const poolAccount = await (program as any).account.pool.fetch(poolPDA);
            if (!poolAccount || !poolAccount.id) {
              showErrorToast('Pool not found', `No betting pool found with ID ${poolId}`);
              return;
            }

            console.log('Found pool:', {
              id: poolAccount.id.toString(),
              status: Object.keys(poolAccount.status)[0],
              options: poolAccount.options,
            });
          } catch (error) {
            console.error('Error fetching pool:', error);
            showErrorToast(
              'Pool not found',
              `The betting pool with ID ${poolId} does not exist or cannot be accessed`
            );
            return;
          }

          // Create and add program instruction
          const anchorTx = await (program as any).methods
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

          // Create and sign transaction
          const { blockhash } = await connection.getLatestBlockhash();
          const tx = new Transaction();
          tx.add(...instructions);
          tx.recentBlockhash = blockhash;
          tx.feePayer = publicKey;

          // Send transaction
          const txSignature = await sendTransaction(tx);

          // Wait for confirmation
          const latestBlockhash = await connection.getLatestBlockhash();
          const confirmation = await connection.confirmTransaction({
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature: txSignature,
          });

          if (confirmation.value.err) {
            const errorMessage = confirmation.value.err.toString();
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
