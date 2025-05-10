import axios from 'axios';
import config from '../../config';
import type { Evidence, TavilySearchResult } from '../types';

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

  // Use multiple search strategies for better coverage
  const searchPromises = [];

  // Search using Tavily with different time ranges
  try {
    // First try: Exact search after prediction date
    searchPromises.push(searchTavily(claim, afterDate));

    // Second try: Broader search with keywords from the claim
    const keywords = extractKeywords(claim);
    if (keywords && keywords.length > 0) {
      searchPromises.push(searchTavily(keywords.join(' '), afterDate));
    }

    // Process all searches in parallel
    const searchResults = await Promise.all(searchPromises);

    // Combine all results
    searchResults.forEach(results => {
      // Filter out duplicates before adding
      const newEvidence = results.filter(
        item => !evidence.some(existingItem => existingItem.url === item.url)
      );
      evidence.push(...newEvidence);
    });
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
/**
 * Extract important keywords from a claim text for more effective searching
 * @param claimText The claim text to extract keywords from
 * @returns Array of important keywords
 */
function extractKeywords(claimText: string): string[] {
  // Remove common words and punctuation
  const cleanText = claimText
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s{2,}/g, ' ');

  // Split into words
  const words = cleanText.split(' ');

  // Filter out common words (stopwords)
  const stopwords = [
    'a',
    'an',
    'the',
    'and',
    'or',
    'but',
    'is',
    'are',
    'was',
    'were',
    'will',
    'would',
    'should',
    'could',
    'has',
    'have',
    'had',
    'be',
    'been',
    'being',
    'in',
    'on',
    'at',
    'to',
    'for',
    'with',
    'by',
    'about',
    'like',
    'through',
    'over',
    'before',
    'after',
    'between',
    'under',
    'during',
    'since',
    'within',
    'throughout',
    'of',
    'that',
    'this',
    'these',
    'those',
    'it',
    'they',
    'them',
    'their',
    'from',
  ];

  const keywords = words.filter(word => word.length > 2 && !stopwords.includes(word));

  // Return unique keywords, prioritizing longer words that may be more specific
  return [...new Set(keywords)].sort((a, b) => b.length - a.length).slice(0, 5); // Return top 5 keywords by length
}

/**
 * Search for evidence using Tavily API
 */
async function searchTavily(query: string, afterDate?: string): Promise<Evidence[]> {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`Searching Tavily for: "${query}"`);

      // Check if API key is configured
      if (!config.tavilyApiKey) {
        console.error('Tavily API key not configured');
        return [];
      }

      // Create request payload based on the Tavily API documentation
      const requestData = {
        query: query,
        search_depth: 'advanced',
        include_domains: [
          'news.google.com',
          'reuters.com',
          'bloomberg.com',
          'ft.com',
          'wsj.com',
          'nytimes.com',
          'apnews.com',
          'bbc.com',
          'cnbc.com',
          'cnn.com',
          'theverge.com',
          'techcrunch.com',
          'economist.com',
          'fortune.com',
        ],
        include_answer: true,
        include_raw_content: true,
        max_results: 15,
        topic: 'news',
        time_range: '' as 'week' | 'month' | 'year' | '', // Add time_range property with valid values
      };

      // Handle date filtering properly according to the API documentation
      if (afterDate) {
        // Use the valid time_range parameter, not 'custom'
        // If the afterDate is recent (within past week), use 'week'
        // If it's within past month, use 'month', otherwise use 'year'
        const today = new Date();
        const afterDateObj = new Date(afterDate);
        const daysDiff = Math.floor(
          (today.getTime() - afterDateObj.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff <= 7) {
          requestData.time_range = 'week';
        } else if (daysDiff <= 30) {
          requestData.time_range = 'month';
        } else {
          requestData.time_range = 'year';
        }
      }

      // Add timeout to prevent hanging requests
      const response = await axios.post('https://api.tavily.com/search', requestData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.tavilyApiKey}`,
        },
        timeout: 30000,
      });

      if (!response.data || !response.data.results) {
        return [];
      }

      // Convert Tavily results to our Evidence format
      return response.data.results.map((result: TavilySearchResult, index: number) => {
        const relevanceScore =
          result.score !== undefined
            ? result.score
            : 1 - index / Math.max(response.data.results.length, 1);

        // Extract domain safely with error handling
        let source = 'Tavily Search';
        try {
          if (result.url) {
            const urlObj = new URL(result.url);
            source = urlObj.hostname;
          }
        } catch (e) {
          console.log(`Failed to parse URL: ${result.url}`);
        }

        return {
          source,
          title: result.title || 'No title',
          url: result.url || '',
          date: new Date().toISOString(),
          snippet: result.content || 'No content available',
          relevance_score: relevanceScore,
          raw_content: result.raw_content || undefined,
        };
      });
    } catch (error) {
      console.log(error);
      // Create safe error message without exposing API key or full error details
      let errorMessage = 'Unknown error';

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with an error status
          errorMessage = `Request failed with status ${error.response.status}`;

          // If rate limited, try backing off and retrying
          if (error.response.status === 429) {
            retries++;
            if (retries < maxRetries) {
              const backoffTime = Math.pow(2, retries) * 1000; // Exponential backoff
              console.log(
                `Rate limited. Retrying in ${backoffTime}ms (attempt ${retries}/${maxRetries})`
              );
              await new Promise(resolve => setTimeout(resolve, backoffTime));
              continue;
            }
          }
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

      // If this was a retry, continue to next attempt
      if (retries < maxRetries - 1) {
        retries++;
        const backoffTime = Math.pow(2, retries) * 1000; // Exponential backoff
        console.log(
          `Search failed. Retrying in ${backoffTime}ms (attempt ${retries}/${maxRetries})`
        );
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }

      return [];
    }

    // If we got here, either the request succeeded or we're out of retries
    break;
  }

  // Return empty array as fallback if all retries failed
  return [];
}
