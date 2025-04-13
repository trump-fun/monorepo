import axios from 'axios';
import config from '../../config';
import { TwitterScraperTweet } from '../types';

/**
 * Search for tweets on Twitter using the Datura API
 *
 * @param query Search query string
 * @param maxResults Maximum number of results to return
 * @returns Array of tweet objects
 */
export async function searchTwitter(
  query: string,
  maxResults: number = 100
): Promise<TwitterScraperTweet[]> {
  try {
    console.log(`Searching Twitter for: "${query}" (max results: ${maxResults})`);

    const response = await axios.get('https://apis.datura.ai/twitter/search', {
      params: {
        query,
        max_results: maxResults,
      },
      headers: {
        Authorization: `Bearer ${config.daturaApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.data || !Array.isArray(response.data)) {
      console.warn('Invalid response from Datura API:', response.data);
      return [];
    }

    return response.data as TwitterScraperTweet[];
  } catch (error) {
    console.error('Error searching Twitter via Datura API:', error);
    return [];
  }
}
