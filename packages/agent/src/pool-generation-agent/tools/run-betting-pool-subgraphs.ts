import { DEFAULT_CHAIN_ID } from '../../config';
import { poolGenerationLogger as logger } from '../../logger';
import type { ResearchItem } from '../../types/research-item';
import type { AgentState } from '../betting-pool-graph';
import { singleBettingPoolGraph } from '../single-betting-pool-graph';

/**
 * Process each Truth Social post through the single betting pool graph
 * This replaces the previous approach of generating ideas in batch
 */
export async function runBettingPoolSubgraphs(state: AgentState): Promise<Partial<AgentState>> {
  logger.info('Processing research items through single betting pool graph');

  const researchItems = state.research || [];

  if (researchItems.length === 0) {
    logger.info('No research items to process');
    return {
      research: [],
    };
  }

  try {
    // Filter research items to only process those marked with shouldProcess: true
    const itemsToProcess = researchItems.filter(item => item.should_process === true);

    logger.info(
      `Processing ${itemsToProcess.length} out of ${researchItems.length} total research items`
    );

    if (itemsToProcess.length === 0) {
      logger.info('No items to process after filtering');
      return {
        research: researchItems,
      };
    }

    // Process each research item sequentially through the single betting pool graph
    const updatedResearch = [...researchItems]; // Start with a copy to preserve all items

    for (let i = 0; i < itemsToProcess.length; i++) {
      const currentItem = itemsToProcess[i];

      // Skip if item is undefined (shouldn't happen, but TypeScript needs this check)
      if (!currentItem) {
        logger.warn(`Item at index ${i} is undefined, skipping`);
        continue;
      }

      // Find the index of this item in the original array
      const itemIndex = researchItems.findIndex(
        item => item.truth_social_post.id === currentItem.truth_social_post.id
      );

      if (itemIndex === -1) {
        logger.warn(
          `Could not find item with ID ${currentItem.truth_social_post.id} in original array, skipping`
        );
        continue;
      }

      logger.info(
        `Processing item ${i + 1}/${itemsToProcess.length}: ${currentItem.truth_social_post.id}`
      );

      try {
        // Run the single betting pool graph for this item
        const result = await singleBettingPoolGraph.invoke({
          research: currentItem,
          chainId: state.chainId || DEFAULT_CHAIN_ID,
          targetTruthSocialAccountId: state.targetTruthSocialAccountId || '',
          messages: [],
        });

        if (result.research) {
          // Update the specific item in our copy of the array
          updatedResearch[itemIndex] = result.research as ResearchItem;
          logger.info(`Item ${i + 1} successfully processed through single betting pool graph`);

          // Log transaction hash and pool ID if available
          if (result.research.transaction_hash) {
            logger.info({ txHash: result.research.transaction_hash }, 'Transaction hash');
          }

          if (result.research.pool_id) {
            logger.info({ poolId: result.research.pool_id }, 'Pool ID');
          }
        }
      } catch (error) {
        logger.error({ error }, `Error processing item ${i + 1}`);
        // Mark the item as should not process with reason for failure - ensure we have all required properties
        updatedResearch[itemIndex] = {
          ...currentItem,
          should_process: false,
          skip_reason: 'single_graph_processing_failed',
        };
      }

      // Add a small delay between processing items to prevent rate limiting
      if (i < itemsToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    logger.info(
      `Processed ${itemsToProcess.length} research items through single betting pool graph`
    );

    return {
      research: updatedResearch,
    };
  } catch (error) {
    logger.error({ error }, 'Error processing items through single betting pool graph');
    return {
      research: researchItems,
    };
  }
}
