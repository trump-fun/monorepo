import axios from 'axios';
import config from '../../config';
import type { Evidence } from '../types';

/**
 * Searches for evidence related to prediction claims across multiple sources
 *
 * @param claims Array of claim statements to verify
 * @param predictionDate Date when the prediction was made
 * @returns Array of evidence objects
 */
export async function searchForVerificationEvidence(
  claims: string[],
  predictionDate: string
): Promise<Evidence[]> {
  console.log(`Searching for evidence related to ${claims.length} claims`);
  const allEvidence: Evidence[] = [];

  // Process each claim in parallel
  const searchPromises = claims.map(claim => searchEvidenceForClaim(claim, predictionDate));
  const searchResults = await Promise.all(searchPromises);

  // Flatten results from all claims
  searchResults.forEach(results => {
    allEvidence.push(...results);
  });

  // Sort by relevance score (highest first)
  allEvidence.sort((a, b) => {
    return (b.relevance_score || 0) - (a.relevance_score || 0);
  });

  console.log(`Found ${allEvidence.length} evidence items across all claims`);
  return allEvidence;
}

/**
 * Searches for evidence related to a single claim
 *
 * @param claim Claim to search evidence for
 * @param predictionDate Date when the prediction was made
 * @returns Array of evidence objects
 */
async function searchEvidenceForClaim(claim: string, predictionDate: string): Promise<Evidence[]> {
  const evidence: Evidence[] = [];

  // Convert to Date object
  const predDate = new Date(predictionDate);

  // Skip searches for badly formatted dates
  if (isNaN(predDate.getTime())) {
    console.warn(`Invalid prediction date: ${predictionDate}`);
    return [];
  }

  // Only search for evidence after the prediction date
  const afterDate = predDate.toISOString().split('T')[0];

  // Search using Google News API via Tavily
  try {
    const tavilyResponse = await searchTavily(claim, afterDate);
    evidence.push(...tavilyResponse);
  } catch (error) {
    // Log error message without full error object to prevent API key exposure
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error searching Tavily: ${errorMessage}`);
  }

  return evidence;
}

/**
 * Search for evidence using Tavily API
 */
async function searchTavily(query: string, afterDate: string): Promise<Evidence[]> {
  try {
    console.log(`Searching Tavily for: "${query}" (after: ${afterDate})`);

    // Check if API key is configured
    if (!config.tavilyApiKey) {
      console.error('Tavily API key not configured');
      return [];
    }

    // Add timeout to prevent hanging requests
    const response = await axios.post(
      'https://api.tavily.com/search',
      {
        query: `${query} after:${afterDate}`,
        search_depth: 'advanced',
        include_domains: [
          'news.google.com',
          'reuters.com',
          'bloomberg.com',
          'ft.com',
          'wsj.com',
          'nytimes.com',
        ],
        include_answer: false,
        include_raw: false,
        max_results: 5,
        topic: 'news', // Specify topic as news for better results with dates
      },
      {
        headers: {
          'Content-Type': 'application/json',
          // Use Authorization header with Bearer token as per Tavily API documentation
          Authorization: `Bearer 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`,
        },
        timeout: 10000, // 10 second timeout
      }
    );

    if (!response.data || !response.data.results) {
      return [];
    }

    // Convert Tavily results to our Evidence format
    return response.data.results.map((result: any) => ({
      source: result.source || 'Tavily Search',
      title: result.title || 'No title',
      url: result.url || '',
      date: result.published_date || new Date().toISOString(),
      snippet: result.content || result.snippet || 'No content available',
      relevance_score: result.relevance_score,
    }));
  } catch (error) {
    // Create safe error message without exposing API key or full error details
    let errorMessage = 'Unknown error';

    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with an error status
        errorMessage = `Request failed with status ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response received from server';
      } else {
        // Error in setting up the request
        errorMessage = 'Error setting up the request';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error(`Error searching Tavily API: ${errorMessage}`);
    return [];
  }
}
