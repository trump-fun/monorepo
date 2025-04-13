/**
 * Search Predictions Module
 * 
 * Handles searching for prediction-related content on social media platforms.
 * Enhanced with improved error handling, caching, and optimized search strategies.
 */

import { searchTwitter } from '../../common/api/datura-api';
import { queryStructuredLLM } from '../../common/llm/llm-manager';
import { createAgentErrorHandler, ErrorSeverity, ErrorType } from '../../common/utils/error-handler';
import type { TwitterScraperTweet } from '../types';
import { SEARCH_QUERY_OUTPUT_SCHEMA, SEARCH_QUERY_SYSTEM_PROMPT } from '../prompts/search-query-prompt';

// Create specialized error handler for prediction finder agent
const errorHandler = createAgentErrorHandler('prediction-finder');

/**
 * Generates effective search queries for finding predictions on a topic
 *
 * @param topic Topic to search for predictions about
 * @returns Array of search query strings
 */
export async function generatePredictionSearchQueries(topic: string): Promise<string[]> {
  console.log(`Generating search queries for topic: ${topic}`);

  try {
    // Use our new structured LLM utility with appropriate schema and complexity
    const response = await queryStructuredLLM<{ queries: string[] }>(
      SEARCH_QUERY_SYSTEM_PROMPT, // Use the direct system prompt string
      `Generate effective search queries to find predictions about: ${topic}`,
      SEARCH_QUERY_OUTPUT_SCHEMA,
      {
        complexity: 'medium',
        temperature: 0.7,
        taskName: `Generate prediction search queries for "${topic}"`,
        defaultValue: { queries: [] }
      }
    );
    
    // Validate and clean the queries
    const queries = (response.queries || []).filter(q => typeof q === 'string' && q.trim().length > 0);
    
    // If we didn't get any valid queries, use fallbacks
    if (queries.length === 0) {
      const fallbackQueries = [`${topic} predict`, `${topic} will happen`, `${topic} I believe`];
      console.log('No valid queries generated, using fallbacks:', fallbackQueries);
      return fallbackQueries;
    }
    
    console.log(`Generated ${queries.length} optimized search queries:`, queries);
    return queries;
  } catch (error: any) {
    // Use our new error handling system
    errorHandler.handleError(error, {
      type: ErrorType.LLM_RESPONSE,
      severity: ErrorSeverity.WARNING,
      context: { topic, function: 'generatePredictionSearchQueries' },
    });

    // Return fallback queries if LLM fails
    const fallbackQueries = [
      `${topic} predict OR prediction OR "will happen" -filter:replies`,
      `${topic} future OR upcoming OR "going to" min_faves:5 -filter:replies`,
      `${topic} forecast OR outlook OR "I think" -filter:replies`
    ];
    console.log('Error occurred, using fallback queries:', fallbackQueries);
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

  try {
    // Get a subset of the queries to avoid too many API calls
    // Smart selection: prefer more specific queries that include prediction terms
    const scoredQueries = queries.map(query => {
      const predictionTerms = ['predict', 'prediction', 'will happen', 'going to', 'expect', 'believe', 'forecast'];
      const score = predictionTerms.reduce((acc, term) => acc + (query.toLowerCase().includes(term) ? 1 : 0), 0);
      return { query, score };
    });
    
    // Sort by score descending and take top 3
    scoredQueries.sort((a, b) => b.score - a.score);
    const selectedQueries = scoredQueries.slice(0, 3).map(sq => sq.query);
    
    console.log('Selected queries for search:', selectedQueries);
    
    // Calculate max results per query with some overlap for better diversity
    const resultsPerQuery = Math.ceil((limit * 1.5) / selectedQueries.length);

    // Search for each query in parallel
    const searchPromises = selectedQueries.map(query => {
      // Add default modifiers for better quality results if not already included
      const enhancedQuery = query.includes('filter:') ? query : `${query} -filter:replies`;
      return searchTwitter(enhancedQuery, resultsPerQuery, false);
    });
    
    // Use Promise.allSettled to handle partial failures
    const searchResults = await Promise.allSettled(searchPromises);
    
    // Process results including partial failures
    const allResults: TwitterScraperTweet[] = [];
    
    searchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      } else {
        // Log error but continue with partial results
        errorHandler.handleError(result.reason, {
          type: ErrorType.API_RESPONSE,
          severity: ErrorSeverity.WARNING,
          context: { query: selectedQueries[index], function: 'searchForPredictionPosts' },
        });
      }
    });

    // Remove duplicates based on tweet ID
    const uniqueResults = allResults.filter(
      (post, index, self) => post.id && self.findIndex(p => p.id === post.id) === index
    );

    console.log(`Found ${uniqueResults.length} unique posts across all queries`);

    // Sort by engagement (likes + retweets) for higher quality results
    const sortedResults = uniqueResults.sort((a, b) => {
      const aEngagement = (a.favorite_count || 0) + (a.retweet_count || 0);
      const bEngagement = (b.favorite_count || 0) + (b.retweet_count || 0);
      return bEngagement - aEngagement;
    });

    // Limit to requested number
    return sortedResults.slice(0, limit);
  } catch (error: any) {
    errorHandler.handleError(error, {
      type: ErrorType.API_REQUEST,
      severity: ErrorSeverity.ERROR,
      context: { queries, limit, function: 'searchForPredictionPosts' },
    });
    
    // Return empty array in case of complete failure
    return [];
  }
}
