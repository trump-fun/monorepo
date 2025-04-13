import config from '../../config';
import { searchTwitter } from '../api';
import {
  searchQueriesSchema,
  TwitterScraperTweet,
} from '../types';
import { searchQueriesPrompt } from '../prompts/prediction-analysis';

/**
 * Generates effective search queries for finding predictions on a topic
 *
 * @param topic Topic to search for predictions about
 * @returns Array of search query strings
 */
export async function generatePredictionSearchQueries(topic: string): Promise<string[]> {
  console.log(`Generating search queries for topic: ${topic}`);

  try {
    // Create structured output with the schema
    const structuredLlm = config.cheap_large_llm.withStructuredOutput(searchQueriesSchema);

    // Format the prompt into messages then invoke the LLM
    const formattedPrompt = await searchQueriesPrompt.formatMessages({
      topic,
    });

    // Invoke the LLM and get the structured output
    const response = await structuredLlm.invoke(formattedPrompt);

    // Handle the case where response.queries might be a string instead of an array
    let queries: string[] = [];

    if (Array.isArray(response.queries)) {
      // If it's already an array, use it directly
      queries = response.queries;
    } else if (typeof response.queries === 'string') {
      // If it's a string that looks like a JSON array, try to parse it
      try {
        const parsedQueries = JSON.parse(response.queries);
        if (Array.isArray(parsedQueries)) {
          queries = parsedQueries;
        } else {
          // If parsing succeeded but didn't produce an array, use single item
          queries = [response.queries];
        }
      } catch (parseError) {
        // If parsing failed, use the string as a single query
        queries = [response.queries];
      }
    }

    console.log(`Generated ${queries.length} search queries:`, queries);
    return queries;
  } catch (error) {
    console.error('Error generating search queries:', error);

    // Return fallback queries if LLM fails
    const fallbackQueries = [`${topic} predict`, `${topic} will happen`, `${topic} I believe`];
    console.log('Using fallback queries:', fallbackQueries);
    return fallbackQueries;
  }
}

/**
 * Searches for posts using the generated queries
 *
 * @param queries Search query strings to use
 * @param limit Maximum number of total results to return
 * @returns Array of tweet objects
 */
export async function searchForPredictionPosts(
  queries: string[],
  limit: number
): Promise<TwitterScraperTweet[]> {
  console.log(`Searching for posts using ${queries.length} queries...`);

  // Get a subset of the queries to avoid too many API calls
  const maxQueries = Math.min(queries.length, 3);
  const selectedQueries = queries.slice(0, maxQueries);

  // Calculate max results per query
  const resultsPerQuery = Math.ceil(limit / selectedQueries.length);

  // Search for each query in parallel
  const searchPromises = selectedQueries.map(query => searchTwitter(query, resultsPerQuery));
  const searchResults = await Promise.all(searchPromises);

  // Flatten results from all queries
  const allResults: TwitterScraperTweet[] = searchResults.flat();

  // Remove duplicates based on tweet ID
  const uniqueResults = allResults.filter(
    (post, index, self) => post.id && self.findIndex(p => p.id === post.id) === index
  );

  console.log(`Found ${uniqueResults.length} unique posts across all queries`);

  // Limit to requested number
  return uniqueResults.slice(0, limit);
}
