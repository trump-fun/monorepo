import axios from 'axios';
import config from '../../config';
import { daturaAiSearchPrompt } from '../prompts/prediction-analysis';
import type { TwitterScraperTweet } from '../types';

/**
 * Interface for Datura AI X Post Search response
 */
export interface DaturaAIXSearchResponse {
  miner_tweets: TwitterScraperTweet[];
}

/**
 * Available model options for Datura AI search
 */
export type DaturaAIModel = 'NOVA' | 'ORBIT' | 'HORIZON';

/**
 * Search for tweets on Twitter using the Datura API
 *
 * @param query Search query string
 * @param maxResults Maximum number of results to return
 * @returns Array of tweet objects
 */
export async function searchTwitter(
  query: string,
  maxResults: number
): Promise<TwitterScraperTweet[]> {
  try {
    console.log(`Searching Twitter for: "${query}" (max results: ${maxResults})`);

    const response = await axios.get('https://apis.datura.ai/twitter', {
      params: {
        query,
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

/**
 * Search for tweets on Twitter using the Datura AI-powered search API
 *
 * @param prompt Search prompt for AI analysis
 * @param model AI model to use for analysis (default: HORIZON)
 * @returns Object containing array of tweet objects
 */
export async function searchTwitterAI(
  market: string,
  model: DaturaAIModel = 'HORIZON'
): Promise<TwitterScraperTweet[]> {
  try {
    console.log(`Searching Twitter with AI for: "${market}" (model: ${model})`);

    const formattedPrompt = await daturaAiSearchPrompt.format({
      market,
    });

    const response = await axios.post(
      'https://apis.datura.ai/desearch/ai/search/links/twitter',
      {
        formattedPrompt,
        model,
      },
      {
        headers: {
          Authorization: `Bearer ${config.daturaApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (
      !response.data ||
      !response.data.miner_tweets ||
      !Array.isArray(response.data.miner_tweets)
    ) {
      console.warn('Invalid response from Datura AI Search API:', response.data);
      return [];
    }

    return response.data.miner_tweets as TwitterScraperTweet[];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        'Error searching Twitter via Datura AI Search API:',
        error.message || 'Axios request failed'
      );
    } else {
      console.error('Error searching Twitter via Datura AI Search API:', error);
    }
    return [];
  }
}
