import { BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getSolanaClientFromConfig } from '../../solana';
import type { SingleResearchItemState } from '../single-betting-pool-graph';
import config from '../../config';

// Pool seed constant - should match the one in your Solana program
const POOL_SEED = Buffer.from('pool_v1');

/**
 * Creates a betting pool for a single research item on Solana
 * Uses Anchor to interact with the Solana smart contract
 */
export async function createBettingPoolSolana(
  state: SingleResearchItemState
): Promise<Partial<SingleResearchItemState>> {
  const { chainId } = state;
  if (!chainId) {
    throw new Error('Chain ID must be set');
  }
  const chainConfig = config.chainConfig[chainId];
  if (!chainConfig || chainConfig.chainType !== 'solana') {
    throw new Error("Chain is not Solana, you shouldn't be here");
  }

  console.log('Creating betting pool for research item on Solana');

  // Get the research item from state
  const researchItem = state.research;

  // If there's no research item, return early
  if (!researchItem) {
    console.log('No research item available');
    return {
      research: researchItem,
    };
  }

  // Check if the item is marked to be processed and has a betting pool idea
  if (researchItem.should_process !== true || !researchItem.betting_pool_idea) {
    console.log('Research item is not marked for processing or has no betting pool idea');
    return {
      research: researchItem,
    };
  }

  // Check if the pool has already been created
  if (researchItem.pool_id || researchItem.transaction_hash) {
    console.log(`Betting pool already created with ID: ${researchItem.pool_id}`);
    return {
      research: researchItem,
    };
  }

  try {
    // Get the Solana client from config
    const { program, payer, bettingPoolsPDA } = getSolanaClientFromConfig(chainConfig);

    // Get the current betting pools state to find the next pool ID
    const bettingPoolsState = await program.account.bettingPoolsState.fetch(bettingPoolsPDA);
    const poolId = bettingPoolsState.nextPoolId;

    // Calculate the pool address
    const [poolAddress] = PublicKey.findProgramAddressSync(
      [POOL_SEED, poolId.toBuffer('le', 8)],
      program.programId
    );

    console.log('Creating Solana pool with:', {
      question: researchItem.betting_pool_idea,
      options: ['Yes', 'No'],
      bettingPoolsPDA: bettingPoolsPDA.toString(),
      poolAddress: poolAddress.toString(),
      authority: payer.publicKey.toString(),
    });

    // Set up betting close time (24 hours from now)
    const betsCloseAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

    // Create a transaction to invoke the createPool function
    const tx = await program.methods
      .createPool(
        researchItem.betting_pool_idea, // question
        ['Yes', 'No'], // options
        new BN(betsCloseAt), // bets_close_at
        researchItem.truth_social_post?.id?.toString() || '', // original_truth_social_post_id
        researchItem.image_url || '' // image_url
      )
      .accounts({
        bettingPools: bettingPoolsPDA,
        pool: poolAddress,
        authority: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
      .rpc();

    console.log(`Transaction sent, hash: ${tx}`);

    // Wait for transaction confirmation
    const latestBlockhash = await program.provider.connection.getLatestBlockhash();
    const confirmation = await program.provider.connection.confirmTransaction({
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature: tx,
    });

    // Check if transaction failed
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
    }

    // Update the research item with transaction hash and pool ID
    const updatedResearchItem = {
      ...researchItem,
      transaction_hash: tx,
      pool_id: poolId.toString(),
    };

    console.log(
      `Research item updated with transaction hash: ${updatedResearchItem.transaction_hash}`
    );
    return {
      research: updatedResearchItem,
    };
  } catch (error) {
    console.error('Error creating betting pool on Solana:', error);

    // Mark the item as should not process with reason for failure
    const updatedResearchItem = {
      ...researchItem,
      should_process: false,
      skip_reason: 'failed_pool_creation',
    };

    return {
      research: updatedResearchItem,
    };
  }
}
