import { ethers } from 'ethers';
import bettingContractAbi from '../../types/BettingContract.json';
import type { SingleResearchItemState } from '../single-betting-pool-graph';
/**
 * Creates a betting pool for a single research item
 * Uses ethers.js to interact with the smart contract
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

  // Set up ethers provider and wallet
  const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
  const wallet = new ethers.Wallet(chainConfig.privateKey, provider);

  // Create contract instance and ensure it has createPool method
  const contract = new ethers.Contract(chainConfig.contractAddress, bettingContractAbi.abi, wallet);

  console.log('Connected to chain ID:', (await provider.getNetwork()).chainId);
  try {
    console.log(`Creating betting pool for research item: ${researchItem.truth_social_post.id}`);

    // Set up the parameters for the betting pool
    const betsCloseAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours from now

    // Prepare pool creation parameters
    const poolParams = {
      question: researchItem.betting_pool_idea,
      options: ['Yes', 'No'],
      betsCloseAt: betsCloseAt,
      originalTruthSocialPostId: researchItem.truth_social_post?.id?.toString() || '',
      imageUrl: researchItem.image_url || '',
    };
    console.log('Params passed to createPool:', poolParams);

    // Check if createPool method exists
    if (typeof contract.createPool !== 'function') {
      throw new Error('createPool method not found on contract');
    }

    // Send the transaction
    const tx = await contract.createPool(poolParams);
    console.log(`Transaction sent, hash: ${tx.hash}`);

    // Wait for transaction receipt
    const receipt = await tx.wait(1); // Wait for 1 confirmation
    console.log(`Transaction confirmed, status: ${receipt?.status}`);

    if (receipt?.status === 1) {
      // 1 means success in ethers.js
      // Always add the transaction hash for successful transactions
      let updatedResearchItem = {
        ...researchItem,
        transaction_hash: tx.hash,
      };

      // Parse the logs to get the poolId
      const eventInterface = new ethers.Interface(bettingContractAbi.abi);
      const log = receipt.logs.find((log: ethers.Log) => {
        try {
          const parsed = eventInterface.parseLog(log);
          return parsed?.name === 'PoolCreated';
        } catch (e) {
          return false;
        }
      });

      if (log) {
        const parsedLog = eventInterface.parseLog(log as ethers.Log);
        if (parsedLog && parsedLog.args && parsedLog.args.poolId) {
          const poolId = parsedLog.args.poolId.toString();
          console.log(`Pool created, poolId: ${poolId}`);

          // Add pool ID to the already updated item
          updatedResearchItem = {
            ...updatedResearchItem,
            pool_id: poolId,
          };
        } else {
          console.log('Pool created but could not parse poolId from logs');
        }
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
