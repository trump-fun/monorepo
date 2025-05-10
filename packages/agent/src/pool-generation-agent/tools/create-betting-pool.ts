import { ethers } from 'ethers';
import config from '../../config';
import { poolGenerationLogger as logger } from '../../logger';
import bettingContractAbi from '../../types/BettingContract.json';
import type { SingleResearchItemState } from '../single-betting-pool-graph';
/**
 * Creates a betting pool for a single research item
 * Uses ethers.js to interact with the smart contract
 */
export async function createBettingPool(
  state: SingleResearchItemState
): Promise<Partial<SingleResearchItemState>> {
  logger.info('Creating betting pool for research item(EVM)');

  const { chainId } = state;
  if (!chainId) {
    throw new Error('Chain ID must be set');
  }
  const chainConfig = config.chainConfig[chainId];
  if (!chainConfig || chainConfig.chainType !== 'evm') {
    throw new Error("Chain is not EVM, you shouldn't be here");
  }

  // Get the research item from state
  const researchItem = state.research;

  // If there's no research item, return early
  if (!researchItem) {
    logger.info('No research item available');
    return {
      research: researchItem,
    };
  }

  // Check if the item is marked to be processed and has a betting pool idea
  if (researchItem.should_process !== true || !researchItem.betting_pool_idea) {
    logger.info('Research item is not marked for processing or has no betting pool idea');
    return {
      research: researchItem,
    };
  }

  // Check if the pool has already been created
  if (researchItem.pool_id || researchItem.transaction_hash) {
    logger.info({ poolId: researchItem.pool_id }, 'Betting pool already created');
    return {
      research: researchItem,
    };
  }

  // Set up ethers provider and wallet
  const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
  const wallet = new ethers.Wallet(chainConfig.privateKey, provider);

  // Create contract instance and ensure it has createPool method
  const contract = new ethers.Contract(chainConfig.contractAddress, bettingContractAbi.abi, wallet);

  const networkInfo = await provider.getNetwork();
  logger.info({ chainId: networkInfo.chainId }, 'Connected to chain');

  try {
    logger.info(
      { postId: researchItem.truth_social_post.id },
      'Creating betting pool for research item'
    );

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
    logger.debug({ params: poolParams }, 'Params passed to createPool');

    // Check if createPool method exists
    if (typeof contract.createPool !== 'function') {
      throw new Error('createPool method not found on contract');
    }

    // Send the transaction
    const tx = await contract.createPool(poolParams);
    logger.info({ txHash: tx.hash }, 'Transaction sent');

    // Wait for transaction receipt
    const receipt = await tx.wait(1); // Wait for 1 confirmation
    logger.info({ txHash: tx.hash, status: receipt?.status }, 'Transaction confirmed');

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
          logger.info({ poolId }, 'Pool created successfully');

          // Add pool ID to the already updated item
          updatedResearchItem = {
            ...updatedResearchItem,
            pool_id: poolId,
          };
        } else {
          logger.warn('Pool created but could not parse poolId from logs');
        }
      } else {
        logger.warn(
          { txHash: tx.hash },
          'No pool ID found in logs, but transaction was successful'
        );
      }

      logger.info(
        { txHash: updatedResearchItem.transaction_hash, poolId: updatedResearchItem.pool_id },
        'Research item updated with transaction hash'
      );
      return {
        research: updatedResearchItem,
      };
    }

    return {
      research: researchItem,
    };
  } catch (error) {
    logger.error({ error }, 'Error creating betting pool');

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
