import * as web3 from '@solana/web3.js';
import { BN } from 'bn.js';
import { config } from '../../config';
import type { GraderState, PendingPool } from '../betting-grader-graph';

/**
 * Calls the Solana contract to grade the betting pool
 * This function submits the grading results to the Solana blockchain
 */
export async function callGradePoolContractSolana(
  state: GraderState
): Promise<Partial<GraderState>> {
  console.log('Grading betting pools on Solana blockchain');

  if (Object.keys(state.pendingPools).length === 0) {
    console.log('No pools to grade on Solana');
    return state;
  }

  const { chainId } = state;
  if (!chainId) {
    throw new Error('Chain ID must be set');
  }

  const chainConfig = config.chainConfig[chainId];
  if (!chainConfig || chainConfig.chainType !== 'solana') {
    throw new Error("Chain is not Solana, you shouldn't be here");
  }

  // Process each pool that has a grading result but has not been updated on-chain
  const pendingPoolsPromises = Object.entries(state.pendingPools).map(
    async ([poolId, pendingPool]) => {
      // Skip pools that failed in previous processing
      if (pendingPool.failed) {
        console.log(`Skipping failed pool ${poolId}`);
        return [poolId, pendingPool] as [string, PendingPool];
      }

      // Skip pools that don't have a grading result
      if (!pendingPool.gradingResult) {
        console.log(`Skipping pool ${poolId} - no grading result yet`);
        return [poolId, pendingPool] as [string, PendingPool];
      }

      // Skip pools that have already been updated on contract
      if (pendingPool.contractUpdated) {
        console.log(`Skipping pool ${poolId} - already updated on contract`);
        return [poolId, pendingPool] as [string, PendingPool];
      }

      try {
        // Determine the response option based on the grading result
        let responseOption: number;

        if (pendingPool.gradingResult.result === 'option A') {
          responseOption = 0; // Option A wins
        } else if (pendingPool.gradingResult.result === 'option B') {
          responseOption = 1; // Option B wins
        } else if (pendingPool.gradingResult.result === 'push') {
          responseOption = 2; // Draw
        } else {
          console.log(
            `Skipping pool ${poolId} - not ready or has unrecognized result: ${pendingPool.gradingResult.result}`
          );
          return [poolId, pendingPool] as [string, PendingPool];
        }

        // Create connection to Solana network
        const connection = new web3.Connection(chainConfig.rpcUrl, 'confirmed');

        // Create keypair from private key
        const keypair = web3.Keypair.fromSecretKey(Buffer.from(chainConfig.privateKey, 'hex'));

        const programId = new web3.PublicKey(chainConfig.programId);

        // Derive the betting pools PDA
        const [bettingPoolsPDA] = web3.PublicKey.findProgramAddressSync(
          [Buffer.from('betting_pools_v1')],
          programId
        );

        // Derive pool PDA
        const poolNumber = parseInt(poolId);
        const [poolPDA] = web3.PublicKey.findProgramAddressSync(
          [Buffer.from('pool_v1'), new BN(poolNumber).toArrayLike(Buffer, 'le', 8)],
          programId
        );

        // Create the instruction
        const instruction = new web3.TransactionInstruction({
          keys: [
            {
              pubkey: bettingPoolsPDA,
              isSigner: false,
              isWritable: true,
            },
            {
              pubkey: poolPDA,
              isSigner: false,
              isWritable: true,
            },
            {
              pubkey: keypair.publicKey,
              isSigner: true,
              isWritable: true,
            },
            {
              pubkey: web3.SystemProgram.programId,
              isSigner: false,
              isWritable: false,
            },
          ],
          programId,
          data: Buffer.concat([
            Buffer.from([3]), // grade_bet instruction index
            Buffer.from(new BN(responseOption).toArrayLike(Buffer, 'le', 8)),
          ]),
        });

        // Create transaction
        const transaction = new web3.Transaction().add(instruction);

        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = keypair.publicKey;

        // Sign transaction
        const signedTransaction = await web3.sendAndConfirmTransaction(connection, transaction, [
          keypair,
        ]);

        console.log(`Successfully graded pool ${poolId} on Solana blockchain`, signedTransaction);

        // Update the pool in state
        return [
          poolId,
          {
            ...pendingPool,
            contractUpdated: true,
            txHash: signedTransaction,
          },
        ] as [string, PendingPool];
      } catch (error) {
        console.error(`Error grading pool ${poolId} on Solana:`, error);

        // Mark as failed
        return [
          poolId,
          {
            ...pendingPool,
            failed: true,
          },
        ] as [string, PendingPool];
      }
    }
  );

  // Wait for all pools to be processed
  const processedPools = await Promise.all(pendingPoolsPromises);

  // Reconstruct the pendingPools object
  const updatedPendingPools = Object.fromEntries(processedPools);

  return { pendingPools: updatedPendingPools };
}
