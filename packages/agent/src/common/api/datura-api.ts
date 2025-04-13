/**
 * Datura API Client
 * 
 * Centralized client for interacting with Datura API for:
 * - Social media searching (Twitter/X)
 * - Information extraction
 * - Content analysis
 * 
 * Features:
 * - Automatic rate limiting
 * - Response caching
 * - Error handling with retries
 */

import axios from 'axios';
import { config } from '../../config';

// Simple in-memory cache
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 250; // ms between requests

/**
 * Ensures requests are properly spaced for rate limiting
 */
async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeElapsed = now - lastRequestTime;
  
  if (timeElapsed < MIN_REQUEST_INTERVAL) {
    const delay = MIN_REQUEST_INTERVAL - timeElapsed;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Base Datura API request with error handling and retries
 */
async function daturaApiRequest<T>(
  endpoint: string,
  params: any,
  options: {
    method?: 'GET' | 'POST';
    bypassCache?: boolean;
    maxRetries?: number;
  } = {}
): Promise<T> {
  const {
    method = 'GET',
    bypassCache = false,
    maxRetries = 2,
  } = options;
  
  const apiKey = config.daturaApiKey;
  if (!apiKey) {
    throw new Error('Datura API key not configured');
  }
  
  // Create cache key from endpoint and sorted params
  const cacheKey = endpoint + JSON.stringify(
    Object.entries(params).sort((a, b) => a[0].localeCompare(b[0]))
  );
  
  // Check cache first unless bypassing
  if (!bypassCache) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Using cached Datura API response for: ${endpoint}`);
      return cached.data;
    }
  }
  
  let lastError: Error | null = null;
  
  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      if (retry > 0) {
        console.log(`Datura API retry ${retry} for ${endpoint}`);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retry)));
      }
      
      // Enforce rate limiting
      await enforceRateLimit();
      
      const url = `https://api.datura.network/${endpoint}`;
      const config = {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      };
      
      let response;
      if (method === 'GET') {
        response = await axios.get(url, { ...config, params });
      } else {
        response = await axios.post(url, params, config);
      }
      
      if (response.status === 200 && response.data) {
        // Update cache
        apiCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
        return response.data;
      }
      
      throw new Error(`Datura API returned status ${response.status}`);
    } catch (error: any) {
      console.error(`Datura API error (retry ${retry}/${maxRetries}):`, error.message);
      lastError = error;
    }
  }
  
  throw lastError || new Error(`Unknown error with Datura API: ${endpoint}`);
}

/**
 * Search Twitter/X for posts
 */
export async function searchTwitter(
  query: string,
  limit: number = 10,
  includeReplies: boolean = false
): Promise<any[]> {
  console.log(`Searching Twitter for: "${query}" (limit: ${limit})`);
  
  const params = {
    query: query + (includeReplies ? '' : ' -filter:replies'),
    limit,
  };
  
  try {
    const response = await daturaApiRequest<{ tweets: any[] }>(
      'twitter/search',
      params
    );
    
    return response.tweets || [];
  } catch (error: any) {
    console.error('Twitter search error:', error.message);
    return [];
  }
}

/**
 * Get Twitter user information and tweets
 */
export async function getTwitterUser(
  username: string,
  includeTweets: boolean = false,
  tweetLimit: number = 20
): Promise<any> {
  console.log(`Getting Twitter user data for: @${username}`);
  
  const params = {
    username,
    include_tweets: includeTweets,
    tweet_limit: tweetLimit,
  };
  
  try {
    const response = await daturaApiRequest<{ user: any; tweets?: any[] }>(
      'twitter/user',
      params
    );
    
    return response;
  } catch (error: any) {
    console.error('Twitter user fetch error:', error.message);
    throw error;
  }
}

/**
 * Clear the API cache
 */
export function clearApiCache(): void {
  apiCache.clear();
  console.log('Datura API cache cleared');
}

/**
 * Get cache statistics
 */
export function getApiCacheStats(): { size: number; averageAge: number } {
  let totalAge = 0;
  const now = Date.now();
  
  apiCache.forEach(entry => {
    totalAge += now - entry.timestamp;
  });
  
  return {
    size: apiCache.size,
    averageAge: apiCache.size > 0 ? totalAge / apiCache.size : 0,
  };
}
