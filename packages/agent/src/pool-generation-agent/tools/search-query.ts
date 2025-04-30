/**
 *
 * IMPORTANT: THIS TOOL IS NOT BEING USED RIGHT NOW, DO NOT MODIFY IF YOU'RE DEALING WITH A PRODUCTION ISSUE
 * IT'S A STARTING POINT TO TRAIN OTHER TEAM MEMBERS ON THE AGENT CODE
 * Learning session scheduled for Mar. 26th.
 * Please remove this comment after the single research subgraph is fully implemented
 */
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import config from '../../config';
import type { SingleResearchItemState } from '../single-betting-pool-graph';

// Define schema for enhanced search query
const searchQuerySchema = z.object({
  searchQuery: z.string().describe('Query optimized for web search'),
  alternativeQueries: z
    .array(z.string())
    .optional()
    .describe('Alternative search queries to try if the main one fails'),
  searchDomains: z
    .array(z.string())
    .optional()
    .describe('Recommended domains to prioritize in search'),
  reasonForQuery: z.string().optional().describe('Explanation of why this query was chosen'),
});

const extractSearchQueryPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an expert at extracting search queries from user input. 
Your job is to take a user's input and extract a concise, clear search query that would best address their information need.

Follow these guidelines:
1. Extract only the essential search terms needed to find relevant information
2. Remove filler words and unnecessary context
3. Focus on the specific question or information being requested
4. Format your response as a concise search query
5. DO NOT explain your reasoning or add any additional text
6. Return ONLY the search query with no additional formatting
7. If the post contains references to external news or events, include those specific terms
8. If the post mentions specific people, include their full names
9. If appropriate, include terms like "latest", "official", "update", or "news" to get recent information
10. Use Boolean operators (AND, OR) when appropriate to refine search

The input will be from Truth Social, a social media platform. Extract the key information need from it.`,
  ],
  ['human', '{input}'],
]);

// Extract search query function using structured output
export async function extractSearchQueryFunctionSingle(
  state: SingleResearchItemState
): Promise<Partial<SingleResearchItemState>> {
  console.log('extracting search query, state', state);
  const researchItem = state.research;
  if (!researchItem) {
    console.log('No research item to extract search query for');
    return {
      research: undefined,
    };
  }

  // Check if item should be processed
  if (researchItem.should_process === false) {
    console.log('Item marked as should not process, skipping search query extraction');
    return {
      research: researchItem,
    };
  }
  console.log('extract_query_single on item', researchItem.truth_social_post.id);

  // Check if the post content is valid
  if (
    !researchItem.truth_social_post.content ||
    researchItem.truth_social_post.content === '<p></p>' ||
    researchItem.truth_social_post.content.trim().length < 5
  ) {
    console.log('Post content is empty or minimal, cannot extract search query');

    // Check if there are media attachments we could use for context
    if (
      researchItem.truth_social_post.media_attachments &&
      researchItem.truth_social_post.media_attachments.length > 0
    ) {
      console.log('Using media metadata for search context instead');
      // Use whatever metadata we can get from media
      const mediaTypes = researchItem.truth_social_post.media_attachments
        .map(m => m.type)
        .join(', ');

      return {
        research: {
          ...researchItem,
          tavily_search_query: `Donald Trump media post ${mediaTypes} ${new Date(researchItem.truth_social_post.created_at).toISOString().split('T')[0]}`,
          news_search_query: `Donald Trump media post ${mediaTypes} ${new Date(researchItem.truth_social_post.created_at).toISOString().split('T')[0]}`,
        },
      };
    }

    // If there's a quoted post, use that instead
    if (researchItem.truth_social_post.quote_id) {
      console.log('Using quoted post content for search context');
      // If quoted post, we can't access its content directly here
      // Skip processing this item as we don't have access to the quote content
      return {
        research: {
          ...researchItem,
          should_process: false,
          skip_reason: 'quoted_post_without_content',
        },
      };
    }

    return {
      research: {
        ...researchItem,
        should_process: false,
        skip_reason: 'empty_content_for_search',
      },
    };
  }

  try {
    const structuredLlm = config.cheap_large_llm.withStructuredOutput(searchQuerySchema, {
      name: 'extractSearchQuery',
    });

    // Format the input with the prompt
    const formattedPrompt = await extractSearchQueryPrompt.formatMessages({
      input: researchItem.truth_social_post.content,
    });

    // Call the LLM with the formatted prompt
    const result = await structuredLlm.invoke(formattedPrompt);
    console.log('result in extract_query_single', result);

    // Handle Google AI special case - sometimes it returns a different structure
    const searchQuery =
      typeof result === 'string' ? result : result.searchQuery || 'Donald Trump recent news';

    // Set the search queries with additional metadata if available
    return {
      research: {
        ...researchItem,
        tavily_search_query: searchQuery,
        news_search_query: searchQuery,
        alternative_search_queries: result.alternativeQueries || [],
        search_domains: result.searchDomains || [],
      },
    };
  } catch (error) {
    console.error('Error in extract_query_single:', error);

    // Fallback to a simple approach if structured output fails
    const content = researchItem.truth_social_post.content;
    const plainText = content
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = plainText
      .split(' ')
      .filter(w => w.length > 3)
      .slice(0, 6)
      .join(' ');
    const fallbackQuery = words || 'Donald Trump recent news';

    console.log('Using fallback query:', fallbackQuery);

    return {
      research: {
        ...researchItem,
        tavily_search_query: fallbackQuery,
        news_search_query: fallbackQuery,
      },
    };
  }
}
