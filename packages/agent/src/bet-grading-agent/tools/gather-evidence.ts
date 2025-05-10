import { ChatPromptTemplate } from '@langchain/core/prompts';
import { tavily } from '@tavily/core';
import { z } from 'zod';
import { config } from '../../config';
import { logger } from '../../logger';
import type { GraderState, PendingPool } from '../betting-grader-graph';
/**
 * Gathers evidence from search queries for all non-failed pools concurrently
 */

const tavilyClient = tavily({
  apiKey: config.tavilyApiKey,
});
export interface Evidence {
  url: string;
  summary: string;
  search_query: string;
  credibility_score?: number;
  relevance_score?: number;
  source_type?: string;
}

export async function gatherEvidence(state: GraderState): Promise<Partial<GraderState>> {
  logger.info('Gathering evidence from search queries for all pools concurrently');

  if (Object.keys(state.pendingPools).length === 0) {
    logger.error('No pending pools to gather evidence for');
    return { pendingPools: {} };
  }

  // Define the enhanced output schema for better evidence quality
  const evidenceSchema = z.object({
    url: z.string(),
    summary: z.string(),
    search_query: z.string(),
    credibility_score: z.number().min(0).max(10).describe('Source credibility score (0-10)'),
    relevance_score: z.number().min(0).max(10).describe('Relevance to betting question (0-10)'),
    source_type: z.string().describe('Type of source (news, official, blog, social media, etc.)'),
    key_facts: z.array(z.string()).optional().describe('Key facts extracted from the source'),
  });

  // Set up Tavily search with improved parameters
  // const tavilySearch = new TavilySearchResults({
  //   apiKey: config.tavilyApiKey,
  //   maxResults: 5, // Increased from 3 for better coverage
  //   includeRawContent: true,
  //   searchDepth: 'deep', // More comprehensive search
  // });

  const updatedPendingPools: Record<string, PendingPool> = {};

  // Define which pools to process in parallel (improves efficiency)
  const poolEntries = Object.entries(state.pendingPools);
  const poolBatches = [];
  const batchSize = 3; // Process 3 pools at a time to avoid rate limiting

  for (let i = 0; i < poolEntries.length; i += batchSize) {
    poolBatches.push(poolEntries.slice(i, i + batchSize));
  }

  // Process pool batches sequentially but pools within each batch concurrently
  for (const poolBatch of poolBatches) {
    const batchResults = await Promise.all(
      poolBatch.map(async ([poolId, pendingPool]) => {
        // Skip pools that have failed or don't have search queries
        if (pendingPool.failed || pendingPool.evidenceSearchQueries.length === 0) {
          logger.info(`Skipping pool ${poolId} - failed or no search queries`);
          return [
            poolId,
            {
              ...pendingPool,
              failed: pendingPool.failed || pendingPool.evidenceSearchQueries.length === 0,
            },
          ];
        }

        const evidenceList: Evidence[] = [];
        const processedUrls = new Set<string>(); // Track already processed URLs to avoid duplicates

        const evidencePrompt = ChatPromptTemplate.fromMessages([
          [
            'system',
            `You are a search assistant that finds and summarizes relevant evidence.
          For the given search query, extract high-quality information from reliable sources.
          
          BETTING CONTEXT:
          What users are betting on: {question}
          
          Options: {options}

          Guidelines:
          - Focus on information that directly addresses whether the betting question can be answered
          - Evaluate the source credibility (major news outlets, official sources score higher)
          - Summarize key points in 2-3 concise, informative sentences
          - Extract specific facts, data, or quotes that are relevant to the betting outcome
          - Identify the type of source (news article, official statement, analysis, social media, etc.)
          - Prioritize recent information from reliable sources
          
          Each evidence piece should help determine the most likely outcome of the bet.`,
          ],
          [
            'human',
            `SEARCH QUERY: {query}

          SOURCE URL: {url}
          
          CONTENT: 
          {content}
          
          Analyze this source to determine its value for grading the bet.`,
          ],
        ]);

        // Process search queries for this pool with enhanced search parameters
        for (const query of pendingPool.evidenceSearchQueries) {
          try {
            // Add context to the query for better results
            const enhancedQuery = `${query} ${pendingPool.pool.question.includes('?') ? '' : pendingPool.pool.question}`;
            logger.info(`Searching for evidence for pool ${poolId} with query: ${enhancedQuery}`);

            // Use Tavily to gather evidence with improved parameters
            const searchDocsRaw = await tavilyClient.search(enhancedQuery, {
              maxResults: 4,
              searchDepth: 'advanced',
              includeRawContent: true,
              includeImages: false,
            });
            const searchDocs = searchDocsRaw.results;

            logger.info(`Found ${searchDocs.length} search results for query: ${enhancedQuery}`);

            // Process each search result
            for (const doc of searchDocs) {
              // Skip if URL already processed
              if (processedUrls.has(doc.url)) {
                logger.debug(`Skipping duplicate URL: ${doc.url}`);
                continue;
              }

              try {
                // Create structured LLM
                const structuredLlm = config.cheap_large_llm.withStructuredOutput(evidenceSchema, {
                  name: 'gatherEvidence',
                });

                // Format the prompt with the search and document information
                const formattedPrompt = await evidencePrompt.formatMessages({
                  question: pendingPool.pool.question,
                  options: pendingPool.pool.options,
                  query: query,
                  url: doc.url || '',
                  content: doc.content || '',
                });

                // Call the LLM with the formatted prompt
                const evidence = await structuredLlm.invoke(formattedPrompt);

                logger.info(
                  `Search result from ${evidence.url}: ${evidence.summary.substring(0, 100)}...`
                );

                // Only add high-quality evidence
                if (evidence.relevance_score === undefined || evidence.relevance_score >= 5) {
                  evidenceList.push(evidence);
                  processedUrls.add(doc.url);
                } else {
                  logger.debug(
                    `Skipping low-relevance evidence (score: ${evidence.relevance_score})`
                  );
                }
              } catch (docError) {
                logger.error({ error: docError, url: doc.url }, `Error processing document`);
                continue;
              }
            }
          } catch (error) {
            logger.error({ error, query, poolId }, `Error processing query`);
            // Continue to next query rather than failing the whole pool
            continue;
          }
        }

        // Sort evidence by relevance if available, otherwise keep as-is
        const sortedEvidence = evidenceList.sort((a, b) => {
          if (a.relevance_score !== undefined && b.relevance_score !== undefined) {
            return b.relevance_score - a.relevance_score;
          }
          return 0;
        });

        logger.info(`Gathered ${sortedEvidence.length} pieces of evidence for pool ${poolId}`);

        // Return updated pool with evidence
        return [
          poolId,
          {
            ...pendingPool,
            evidence: sortedEvidence,
          },
        ];
      })
    );

    // Merge batch results back into the updated pools
    batchResults.forEach(([poolId, updatedPool]) => {
      updatedPendingPools[poolId as string] = updatedPool as PendingPool;
    });

    // Add a slight delay between batches to avoid rate limits
    if (poolBatches.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { pendingPools: updatedPendingPools };
}
