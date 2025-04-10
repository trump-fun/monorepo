import { tavily } from '@tavily/core';
import type { SingleResearchItemState } from '../single-betting-pool-graph';
import config from '../../config';

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
  console.log('tavilySearchFunctionSingle', state.research?.tavily_search_query);

  const researchItem = state.research;
  if (!researchItem) {
    console.log('No research item to search for');
    return {
      research: undefined,
    };
  }

  // Check if item should be processed
  if (researchItem.should_process === false) {
    console.log('Item marked as should not process, skipping Tavily search');
    return {
      research: researchItem,
    };
  }

  if (!researchItem.tavily_search_query) {
    console.log('No search query available for Tavily search');
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

    console.log('Searching Tavily with query:', researchItem.tavily_search_query);
    const response = await tavilyClient.search(researchItem.tavily_search_query, searchParams);
    console.log('Tavily search response:', response);

    const searchResults = response.results;

    // Extract readable search results
    const formattedResults = searchResults.map(result => {
      return `${result.title}\nURL: ${result.url}\nSnippet: ${result.content.substring(0, 200)}...`;
    });

    console.log(`Found ${formattedResults.length} search results from Tavily`);

    return {
      research: {
        ...researchItem,
        related_tavily_search_results: formattedResults,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error calling Tavily API: ${errorMessage}`);

    // Retry with a more generalized query if error seems to be query-related
    if (errorMessage.includes('query') || errorMessage.includes('invalid')) {
      try {
        const generalizedQuery = researchItem.tavily_search_query
          .replace(/"/g, '') // Remove quotes that might cause issues
          .split(' ')
          .slice(0, 5) // Take just the first 5 words
          .join(' ');

        console.log(`Retrying Tavily search with generalized query: ${generalizedQuery}`);
        const retryResponse = await tavilyClient.search(generalizedQuery, {
          max_results: 3,
        });

        const retryResults = retryResponse.results.map(result => {
          return `${result.title}\nURL: ${result.url}\nSnippet: ${result.content.substring(0, 200)}...`;
        });

        if (retryResults.length > 0) {
          console.log(`Retry successful, found ${retryResults.length} results`);
          return {
            research: {
              ...researchItem,
              related_tavily_search_results: retryResults,
            },
          };
        }
      } catch (retryError) {
        console.error('Retry also failed:', retryError);
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
