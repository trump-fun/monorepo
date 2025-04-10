import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { config } from '../../config';
import type { GraderState } from '../betting-grader-graph';

/**
 * Generates optimized Twitter/X search queries for all pending pools concurrently
 * Enhanced to produce more effective queries leveraging Twitter/X search operators
 */
export async function generateXQueries(state: GraderState): Promise<Partial<GraderState>> {
  console.log('Generating optimized Twitter/X search queries for all pending pools...');

  if (Object.keys(state.pendingPools).length === 0) {
    console.error('No pending pools to generate Twitter/X queries for');
    return { pendingPools: {} };
  }

  // Define the expected output schema with improved structure
  const xQueriesSchema = z.object({
    twitter_search_queries: z.array(z.string()).min(3).max(5),
    query_explanations: z.array(z.string()).min(3).max(5),
    advanced_query: z
      .string()
      .describe('A single advanced query combining multiple search operators'),
    expected_grading_relevance: z
      .string()
      .describe('How these queries will help determine the bet outcome'),
    search_strategy: z.object({
      primary_sources: z
        .array(z.string())
        .describe('Official accounts or primary information sources'),
      fallback_keywords: z
        .array(z.string())
        .describe('Keywords for AI search if standard search fails'),
    }),
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
          `You are an expert at crafting targeted Twitter/X search queries to find definitive information about specific outcomes. Your task is to generate search queries that will help determine the outcome of a betting pool.
    
          IMPORTANT TWITTER/X QUERY FORMATTING RULES:
          - Each query must use Twitter's search operators correctly
          - Do NOT prefix queries with "x" or similar terms
          - Do NOT include explanations within the queries themselves
          - Each query should be a single line in proper Twitter search syntax
          - Queries should focus on finding content that can DETERMINE THE BET OUTCOME, not just discuss the topic
          - Target authoritative sources or high-engagement content about definitive outcomes
          
          USEFUL TWITTER SEARCH OPERATORS:
          - Account targeting: from:username, to:username
          - Content filtering: filter:links, -filter:replies, filter:verified
          - Engagement filters: min_faves:100, min_retweets:10
          - Date ranges: until:YYYY-MM-DD, since:YYYY-MM-DD (use last 2-3 months for recency)
          - Combine terms with OR, quotes for exact phrases "like this"
          - Use (parentheses) to group logical operators
          - Keyword exclusion with minus sign: -keyword
          
          QUERY STRATEGY:
          1. Official sources: Target accounts of relevant organizations, officials, or authoritative figures
          2. Expert verification: Find expert analysis with high engagement that addresses the specific outcome
          3. News confirmation: Identify news coverage or verified announcements about the result
          4. Keyword optimization: Include specific terms that would be used when announcing a definitive outcome
          5. Advanced combination: Create one advanced query that combines multiple operators for precision
          
          Also provide:
          - A list of primary sources (official accounts) relevant to this bet
          - A list of fallback keywords that would be effective for AI-powered search if standard search fails
          
          Example proper formats:
          - from:elonmusk tesla earnings (confirmed OR announced OR reported) filter:links since:2023-04-01
          - #TSLA earnings Q1 (beat OR missed OR met) expectations min_faves:50 filter:verified
          - "Tesla Q1 results" officially (announced OR confirmed OR released) min_retweets:20 -is:retweet`,
        ],
        [
          'human',
          `Here is the betting pool information:

          BETTING POOL QUESTION:
          {question}

          OPTIONS:
          {options}

          IMPORTANT: Focus on finding tweets that contain DEFINITIVE INFORMATION that can be used to determine which option is correct.
          
          Current date: ${new Date().toISOString().split('T')[0]}
          
          Please generate Twitter/X search queries that will find evidence specifically useful for GRADING this bet's outcome.`,
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
        });

        // Call the LLM with the formatted prompt
        const result = await structuredLlm.invoke(formattedPrompt);

        // Validate and clean up queries
        const cleanedQueries = result.twitter_search_queries.map(query => {
          // Remove any common prefixes that aren't part of Twitter search syntax
          return query.replace(/^(twitter|x|search|query):\s*/i, '').trim();
        });

        // Log the results with explanations
        console.log(`Generated ${cleanedQueries.length} Twitter/X queries for pool ${poolId}:`);
        cleanedQueries.forEach((query, index) => {
          console.log(`  Query ${index + 1}: ${query}`);
          if (index < result.query_explanations.length) {
            console.log(`    Explanation: ${result.query_explanations[index]}`);
          }
        });
        console.log(`  Advanced query: ${result.advanced_query}`);
        console.log(`  Expected relevance: ${result.expected_grading_relevance}`);
        console.log(`  Primary sources: ${result.search_strategy.primary_sources.join(', ')}`);
        console.log(`  Fallback keywords: ${result.search_strategy.fallback_keywords.join(', ')}`);

        // Return updated pool with Twitter/X search queries and enhanced metadata
        return [
          poolId,
          {
            ...pendingPool,
            xSearchQueries: [...cleanedQueries, result.advanced_query],
            xQueryExplanations: result.query_explanations,
            xQueryGradingRelevance: result.expected_grading_relevance,
            xSearchStrategy: {
              primarySources: result.search_strategy.primary_sources,
              fallbackKeywords: result.search_strategy.fallback_keywords,
            },
            xQueryGeneratedAt: new Date().toISOString(),
          },
        ];
      } catch (error) {
        // If the first attempt fails, try a simpler fallback prompt
        try {
          console.warn(
            `Error with full query generation for pool ${poolId}, attempting fallback method...`
          );

          // Create a simpler schema for fallback
          const fallbackSchema = z.object({
            twitter_search_queries: z.array(z.string()).min(3).max(3),
          });

          const fallbackLlm = config.cheap_large_llm.withStructuredOutput(fallbackSchema, {
            name: 'fallbackXQueries',
          });

          const fallbackPrompt = ChatPromptTemplate.fromMessages([
            [
              'system',
              `Generate 3 Twitter search queries to find information about a betting outcome.
              Use proper Twitter search syntax. Focus on finding definitive answers.`,
            ],
            [
              'human',
              `Betting question: ${pendingPool.pool.question}
              Options: ${pendingPool.pool.options}
              
              Generate 3 simple but effective Twitter search queries.`,
            ],
          ]);

          const fallbackResult = await fallbackLlm.invoke(await fallbackPrompt.formatMessages({}));

          console.log(
            `Generated fallback queries for pool ${poolId}:`,
            fallbackResult.twitter_search_queries
          );

          return [
            poolId,
            {
              ...pendingPool,
              xSearchQueries: fallbackResult.twitter_search_queries,
              xQueryExplanations: [
                'Fallback query - basic search terms for finding relevant information',
                'Fallback query - alternative phrasing to capture different terminology',
                'Fallback query - simplified search for direct mentions of the outcome',
              ],
              xQueryGeneratedAt: new Date().toISOString(),
              xUsedFallbackQueries: true,
            },
          ];
        } catch (fallbackError) {
          console.error(
            `Both primary and fallback query generation failed for pool ${poolId}:`,
            fallbackError
          );
          return [
            poolId,
            {
              ...pendingPool,
              xQueryCreationFailed: true,
              failed: true, // Mark the pool as failed if we can't generate queries
              failureReason: `Failed to generate Twitter/X queries: ${error}`,
            },
          ];
        }
      }
    }
  );

  // Wait for all pools to be processed
  const processedPools = await Promise.all(pendingPoolsPromises);

  // Reconstruct the pendingPools object
  const updatedPendingPools = Object.fromEntries(processedPools);

  return { pendingPools: updatedPendingPools };
}
