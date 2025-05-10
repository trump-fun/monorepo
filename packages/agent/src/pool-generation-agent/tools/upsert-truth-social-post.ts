/**
 *
 * IMPORTANT: THIS TOOL IS NOT BEING USED RIGHT NOW, DO NOT MODIFY IF YOU'RE DEALING WITH A PRODUCTION ISSUE
 * IT'S A STARTING POINT TO TRAIN OTHER TEAM MEMBERS ON THE AGENT CODE
 * Learning session scheduled for Mar. 26th.
 * Please remove this comment after the single research subgraph is fully implemented
 */
import type { Database, Json } from '@trump-fun/common';
import { supabase } from '../../config';
import { poolGenerationLogger as logger } from '../../logger';
import type { SingleResearchItemState } from '../single-betting-pool-graph';

/**
 * Upserts a single Truth Social post into the database
 * This stores the post content and metadata for future reference and betting pool creation
 */
export async function upsertTruthSocialPost(
  state: SingleResearchItemState
): Promise<Partial<SingleResearchItemState>> {
  logger.info('Upserting Truth Social post to database');

  const researchItem = state.research;

  if (!researchItem) {
    logger.info('No research item to upsert');
    return {
      research: undefined,
    };
  }

  try {
    logger.info(
      { postId: researchItem.truth_social_post.id },
      'Upserting Truth Social post to database'
    );

    // Check if item should be processed
    if (researchItem.should_process === false) {
      logger.info('Item marked as should not process, skipping upsert');
      return {
        research: researchItem,
      };
    }

    // Add detailed debugging for the research item
    logger.debug(
      {
        id: researchItem.truth_social_post?.id,
        pool_id: researchItem.pool_id,
        transaction_hash: researchItem.transaction_hash,
        should_process: researchItem.should_process,
      },
      'Detailed research item'
    );

    // Prepare the record for upsert
    const record: Database['public']['Tables']['truth_social_posts']['Insert'] = {
      post_id: researchItem.truth_social_post.id,
      pool_id: researchItem.pool_id,
      string_content: JSON.stringify(researchItem.truth_social_post),
      json_content: JSON.parse(JSON.stringify(researchItem.truth_social_post)) as Json,
      transaction_hash: researchItem.transaction_hash || null,
      created_at: new Date().toISOString(),
      image_url: researchItem.image_url || null,
      prompt_data: JSON.parse(JSON.stringify(researchItem)) as Json,
    };

    logger.info('Upserting record to database');

    const { data, error } = await supabase.from('truth_social_posts').upsert(record, {
      onConflict: 'post_id',
      ignoreDuplicates: false,
    });

    if (error) {
      logger.error({ error }, 'Error upserting Truth Social post');
      throw error;
    }

    logger.info(
      { postId: researchItem.truth_social_post.id },
      'Successfully upserted Truth Social post'
    );

    return {
      research: researchItem,
    };
  } catch (error) {
    logger.error({ error }, 'Error upserting Truth Social post');
    return {
      research: researchItem,
    };
  }
}
