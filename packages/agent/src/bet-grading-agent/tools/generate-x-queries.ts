import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { config } from '../../config';
import type { GraderState } from '../betting-grader-graph';

/**
 * Generates Twitter/X search queries for all pending pools concurrently
 */
export async function generateXQueries(state: GraderState): Promise<Partial<GraderState>> {
  console.log('Generating Twitter/X search queries for all pending pools...');

  if (Object.keys(state.pendingPools).length === 0) {
    console.error('No pending pools to generate Twitter/X queries for');
    return { pendingPools: {} };
  }

  // Define the expected output schema
  const xQueriesSchema = z.object({
    twitter_search_queries: z.array(z.string()).length(3),
  });

  // Process all pools concurrently
  const pendingPoolsPromises = Object.entries(state.pendingPools).map(
    async ([poolId, pendingPool]) => {
      // Skip already failed pools
      if (pendingPool.failed) {
        return [poolId, pendingPool];
      }

      const twitterSearchPrompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `Your task is to generate 3 Twitter/X search queries to find information about the outcome of a betting pool.
    
          IMPORTANT TWITTER/X QUERY FORMATTING RULES:
          - Each query must use Twitter's search operators correctly
          - Do NOT prefix queries with "twitter" or similar terms
          - Do NOT include explanations within the queries themselves
          - Each query should be a single line in proper Twitter search syntax
          
          USEFUL TWITTER SEARCH OPERATORS:
          - Account targeting: from:username, to:username
          - Content filtering: filter:links, -filter:replies, filter:verified
          - Engagement filters: min_faves:100, min_retweets:10
          - Date ranges: until:YYYY-MM-DD, since:YYYY-MM-DD
          - Combine terms with OR, quotes for exact phrases "like this"
          
          QUERY STRATEGY:
          1. One query targeting official accounts (from:company OR from:CEO)
          2. One query finding expert analysis with high engagement
          3. One query for broad discussion using relevant hashtags and keywords
          
          Example proper formats:
          - from:elonmusk tesla earnings filter:links since:2023-04-01 until:2023-04-30
          - #TSLA earnings Q1 min_faves:50 filter:verified
          - "Tesla Q1 results" (beat OR missed) expectations`,
        ],
        [
          'human',
          `Here is the betting pool information:

          BETTING POOL IDEA:
          {question}

          OPTIONS:
          {options}

          CLOSURE CRITERIA:
          {closureCriteria}

          CLOSURE INSTRUCTIONS:
          {closureInstructions}

          Please generate Twitter/X search queries that will help find evidence about this pool's outcome.`,
        ],
      ]);

      try {
        // Create the structured LLM
        const structuredLlm = config.cheap_large_llm.withStructuredOutput(xQueriesSchema, {
          name: 'generateXQueries',
        });

        // Format the prompt with the pool information
        const formattedPrompt = await twitterSearchPrompt.formatMessages({
          question: pendingPool.pool.question,
          options: pendingPool.pool.options,
          closureCriteria: pendingPool.pool.closureCriteria,
          closureInstructions: pendingPool.pool.closureInstructions,
        });

        // Call the LLM with the formatted prompt
        const result = await structuredLlm.invoke(formattedPrompt);
        console.log(`Generated Twitter/X queries for pool ${poolId}:`, result);

        // Return updated pool with Twitter/X search queries
        return [
          poolId,
          {
            ...pendingPool,
            twitterSearchQueries: result.twitter_search_queries,
          },
        ];
      } catch (error) {
        console.error(`Error generating Twitter/X search queries for pool ${poolId}:`, error);
        return [
          poolId,
          {
            ...pendingPool,
            failed: true,
          },
        ];
      }
    }
  );

  // Wait for all pools to be processed
  const processedPools = await Promise.all(pendingPoolsPromises);

  // Reconstruct the pendingPools object
  const updatedPendingPools = Object.fromEntries(processedPools);

  return { pendingPools: updatedPendingPools };
}
