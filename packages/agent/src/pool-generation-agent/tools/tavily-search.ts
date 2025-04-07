import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import config from '../../config';
import type { SingleResearchItemState } from '../single-betting-pool-graph';

/**
 * Uses Tavily to perform a web search based on the search query in the research item
 * This helps gather additional context for betting pool creation
 */
export async function tavilySearchFunction(
  state: SingleResearchItemState
): Promise<Partial<SingleResearchItemState>> {
  // Get the research item from state
  const researchItem = state.research;

  // If there's no research item, return early
  if (!researchItem) {
    console.log('No research item available');
    return {
      research: researchItem,
    };
  }

  // Use the tavily_search_query if available, otherwise fall back to the post content
  const searchQuery = researchItem.tavily_search_query || researchItem.truth_social_post?.content;

  // If there's no search query, return early
  if (!searchQuery) {
    console.log('No search query available in the research item');
    return {
      research: researchItem,
    };
  }

  console.log(`Performing Tavily search for: "${searchQuery}"`);

  const tavilySearchTool = new TavilySearchResults({
    apiKey: config.tavilyApiKey,
    maxResults: 5,
    // searchDepth: "deep",
    includeAnswer: true,
    includeRawContent: true,
  });

  try {
    const results = await tavilySearchTool.invoke({
      input: searchQuery,
    });

    console.log('Tavily search results:', results);

    // Update the research item with the search results
    const updatedResearchItem = {
      ...researchItem,
      related_search_results: results,
    };

    return {
      research: updatedResearchItem,
    };
  } catch (error) {
    console.error('Error performing Tavily search:', error);
    return {
      research: researchItem, // Tavily search is non-fatal.
    };
  }
}
