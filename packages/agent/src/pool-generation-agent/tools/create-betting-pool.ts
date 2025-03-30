import { bettingContractAbi } from '@trump-fun/common';
import { createPublicClient, createWalletClient, http, parseEventLogs } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { SingleResearchItemState } from '../single-betting-pool-graph';

/**
 * Creates a betting pool for a single research item
 * Uses viem to interact with the smart contract
 */
export async function createBettingPool(
  state: SingleResearchItemState
): Promise<Partial<SingleResearchItemState>> {
  console.log('Creating betting pool for research item');

  // Get the research item from state
  const researchItem = state.research;

  // If there's no research item, return early
  if (!researchItem) {
    console.log('No research item available');
    return {
      research: researchItem,
    };
  }

  // Get chain configuration from state
  const chainConfig = state.chainConfig;
  if (!chainConfig) {
    console.error('Missing chain configuration in state');
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

  // Set up viem clients
  const account = privateKeyToAccount(chainConfig.privateKey);

  const publicClient = createPublicClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
  });

  try {
    console.log(`Creating betting pool for research item: ${researchItem.truth_social_post.id}`);

    // Set up the parameters for the betting pool
    const betsCloseAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours from now
    // Calculate and format the expected resolution date for human readability
    const resolutionDate = new Date(betsCloseAt * 1000);
    const formattedResolutionDate = resolutionDate.toLocaleString();

    // Standard closure criteria and instructions for 7-day window
    const closureCriteria =
      'This pool will be resolved within 7 days based on verifiable public information.';
    const closureInstructions = `This prediction resolves by ${formattedResolutionDate}. Grade as YES if the predicted event occurs by the resolution date, and NO otherwise. Use verifiable public sources to determine the outcome.`;

    const createPoolParams = {
      question: researchItem.betting_pool_idea,
      options: ['Yes', 'No'] as [string, string],
      betsCloseAt: betsCloseAt,
      closureCriteria: closureCriteria,
      closureInstructions: closureInstructions,
      originalTruthSocialPostId: researchItem.truth_social_post?.id?.toString() || '',
    };
    console.log('createPoolParams', createPoolParams);

    // Send the transaction
    const hash = await walletClient.writeContract({
      address: chainConfig.contractAddress,
      abi: bettingContractAbi,
      functionName: 'createPool',
      args: [createPoolParams],
    });

    console.log(`Transaction sent, hash: ${hash}`);

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
      timeout: 60000, // 60 seconds
    });

    console.log(`Transaction confirmed, status: ${receipt.status}`);

    if (receipt.status === 'success') {
      // Always add the transaction hash for successful transactions
      let updatedResearchItem = {
        ...researchItem,
        transaction_hash: hash,
      };

      // Parse the logs to get the poolId
      const logs = parseEventLogs({
        abi: bettingContractAbi,
        eventName: 'PoolCreated',
        logs: receipt.logs,
      });

      if (logs && logs.length > 0) {
        type PoolCreatedEvent = { args: { poolId: bigint } };
        const poolId = (logs[0] as unknown as PoolCreatedEvent).args.poolId;
        console.log(`Pool created, poolId: ${poolId}`);

        // Add pool ID to the already updated item
        updatedResearchItem = {
          ...updatedResearchItem,
          pool_id: poolId.toString(),
        };
      } else {
        console.log(`No pool ID found in logs, but transaction was successful`);
      }

      console.log(
        `Research item updated with transaction hash: ${updatedResearchItem.transaction_hash}`
      );
      return {
        research: updatedResearchItem,
      };
    }

    return {
      research: researchItem,
    };
  } catch (error) {
    console.error('Error creating betting pool:', error);

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
