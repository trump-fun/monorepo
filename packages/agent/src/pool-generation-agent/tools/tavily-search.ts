import { tavily } from '@tavily/core';
import config from '../../config';
import { poolGenerationLogger as logger } from '../../logger';
import type { SingleResearchItemState } from '../single-betting-pool-graph';

// Initialize tavily client
const tavilyClient = tavily({
  apiKey: config.tavilyApiKey,
});

/**
 * Performs a search using Tavily API to gather relevant information
 * Enhanced with error handling and search optimization
 */
export async function tavilySearchFunctionSingle(
  state: SingleResearchItemState
): Promise<Partial<SingleResearchItemState>> {
  logger.info({ query: state.research?.tavily_search_query }, 'Running Tavily search');

  const researchItem = state.research;
  if (!researchItem) {
    logger.info('No research item to search for');
    return {
      research: undefined,
    };
  }

  // Check if item should be processed
  if (researchItem.should_process === false) {
    logger.info('Item marked as should not process, skipping Tavily search');
    return {
      research: researchItem,
    };
  }

  if (!researchItem.tavily_search_query) {
    logger.info('No search query available for Tavily search');
    return {
      research: {
        ...researchItem,
        should_process: false,
        skip_reason: 'no_tavily_search_query',
      },
    };
  }

  try {
    // Enhanced search parameters for better results
    const searchParams = {
      query: researchItem.tavily_search_query,
      search_depth: 'advanced',
      max_results: 5,
      include_domains: [
        'cnn.com',
        'foxnews.com',
        'bbc.com',
        'nytimes.com',
        'wsj.com',
        'reuters.com',
        'apnews.com',
        'bloomberg.com',
        'cnbc.com',
        'politico.com',
      ],
      include_answer: false,
      include_raw_content: false,
    };

    logger.info({ query: researchItem.tavily_search_query }, 'Searching Tavily');
    const response = await tavilyClient.search(researchItem.tavily_search_query, searchParams);
    logger.debug({ response }, 'Tavily search response');

    const searchResults = response.results;

    // Extract readable search results
    const formattedResults = searchResults.map(result => {
      return `${result.title}\nURL: ${result.url}\nSnippet: ${result.content.substring(0, 200)}...`;
    });

    logger.info(`Found ${formattedResults.length} search results from Tavily`);

    return {
      research: {
        ...researchItem,
        related_tavily_search_results: formattedResults,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error, errorMessage }, 'Error calling Tavily API');

    // Retry with a more generalized query if error seems to be query-related
    if (errorMessage.includes('query') || errorMessage.includes('invalid')) {
      try {
        const generalizedQuery = researchItem.tavily_search_query
          .replace(/"/g, '') // Remove quotes that might cause issues
          .split(' ')
          .slice(0, 5) // Take just the first 5 words
          .join(' ');

        logger.info({ generalizedQuery }, 'Retrying Tavily search with generalized query');
        const retryResponse = await tavilyClient.search(generalizedQuery, {
          max_results: 3,
        });

        const retryResults = retryResponse.results.map(result => {
          return `${result.title}\nURL: ${result.url}\nSnippet: ${result.content.substring(0, 200)}...`;
        });

        if (retryResults.length > 0) {
          logger.info(`Retry successful, found ${retryResults.length} results`);
          return {
            research: {
              ...researchItem,
              related_tavily_search_results: retryResults,
            },
          };
        }
      } catch (retryError) {
        logger.error({ error: retryError }, 'Retry also failed');
      }
    }

    // Search failed, but we can continue with the process
    return {
      research: {
        ...researchItem,
        tavily_search_failed: true,
      },
    };
  }
}
