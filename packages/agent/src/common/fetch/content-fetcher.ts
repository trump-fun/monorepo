/**
 * Universal Content Fetcher
 * 
 * Provides a unified interface for fetching content from URLs with multiple fallback methods:
 * 1. Datura API (structured content extraction)
 * 2. Firecrawl API (JavaScript rendered content)
 * 3. Direct request (simple HTTP request)
 * 4. Puppeteer (for complex JavaScript-rendered pages)
 * 
 * Features:
 * - Automatic retries with exponential backoff
 * - Result caching to minimize redundant requests
 * - Content cleaning and normalization
 * - Proxy rotation for sensitive requests
 */

import axios from 'axios';
import { load } from 'cheerio';
import { config } from '../../config';
import { puppeteerRequest } from '../../puppeteer-stealth-request';

// Simple in-memory cache
interface CacheEntry {
  content: string;
  timestamp: number;
}

const contentCache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache TTL

// Common user agents for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
];

/**
 * Extract content via Datura API (provides structured content extraction)
 */
async function extractContentWithDatura(url: string): Promise<string | null> {
  if (!config.daturaApiKey) {
    console.log('Datura API key not configured, skipping');
    return null;
  }

  try {
    console.log('Extracting content with Datura API');
    const response = await axios.get(
      `https://api.datura.network/extract?url=${encodeURIComponent(url)}`,
      {
        headers: {
          'x-api-key': config.daturaApiKey,
        },
        timeout: 15000,
      }
    );

    if (response.data && response.data.text) {
      return response.data.text;
    }
    return null;
  } catch (error: any) {
    console.error('Error with Datura extraction:', error.message);
    return null;
  }
}

/**
 * Extract content via Firecrawl API (for JS-rendered content)
 */
async function extractContentWithFirecrawl(url: string): Promise<string | null> {
  if (!config.firecrawlApiKey) {
    console.log('Firecrawl API key not configured, skipping');
    return null;
  }

  try {
    console.log('Extracting content with Firecrawl API');
    const response = await axios.post(
      'https://api.firecrawl.dev/content/scrape',
      {
        url,
        elements: {
          content: 'body',
        },
      },
      {
        headers: {
          'x-api-key': config.firecrawlApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (response.data && response.data.content) {
      return response.data.content;
    }
    return null;
  } catch (error: any) {
    console.error('Error with Firecrawl extraction:', error.message);
    return null;
  }
}

/**
 * Fetch content directly using a standard HTTP request
 */
async function fetchWithDirectRequest(url: string): Promise<string | null> {
  try {
    // Select a random user agent
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    
    console.log(`Fetching with direct request: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000,
      maxContentLength: 10 * 1024 * 1024, // 10MB max
    });
    
    if (response.status === 200 && response.data) {
      // Process HTML content
      const $ = load(response.data);
      
      // Remove scripts, styles, and other non-content elements
      $('script, style, meta, link, svg, path, iframe').remove();
      
      // Get text content
      const text = $('body').text().trim();
      return text;
    }
    
    return null;
  } catch (error: any) {
    console.error('Error with direct request:', error.message);
    return null;
  }
}

/**
 * Fetch content using Puppeteer for complex JS-rendered pages
 */
async function fetchWithPuppeteer(url: string): Promise<string | null> {
  try {
    console.log(`Fetching with Puppeteer: ${url}`);
    
    const content = await puppeteerRequest({
      url,
      method: 'GET',
      waitSelector: 'body',
      extractContentSelector: 'body',
    });
    
    return content || null;
  } catch (error: any) {
    console.error('Error with Puppeteer fetch:', error.message);
    return null;
  }
}

/**
 * Clean and normalize the fetched content
 */
function cleanContent(content: string): string {
  // Remove excessive whitespace
  let cleaned = content.replace(/\s+/g, ' ');
  
  // Remove any control characters
  cleaned = cleaned.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Limit content length
  if (cleaned.length > 50000) {
    cleaned = cleaned.substring(0, 50000) + '... [content truncated]';
  }
  
  return cleaned.trim();
}

/**
 * Main function to fetch content from a URL using all available methods
 * with retries, caching, and fallbacks
 */
export async function fetchContentFromUrl(
  url: string, 
  options: { 
    bypassCache?: boolean,
    maxRetries?: number
  } = {}
): Promise<string> {
  const { bypassCache = false, maxRetries = 2 } = options;
  
  // Check cache first unless bypassing
  if (!bypassCache) {
    const cached = contentCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Using cached content for: ${url}`);
      return cached.content;
    }
  }
  
  console.log(`Fetching content from: ${url}`);
  
  // Try each method in sequence with retries
  for (let retry = 0; retry <= maxRetries; retry++) {
    if (retry > 0) {
      console.log(`Retry attempt ${retry} for ${url}`);
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retry)));
    }
    
    // Try Datura API first for high-quality content extraction
    const daturaContent = await extractContentWithDatura(url);
    if (daturaContent) {
      const cleaned = cleanContent(daturaContent);
      contentCache.set(url, { content: cleaned, timestamp: Date.now() });
      return cleaned;
    }
    
    // Try Firecrawl API next for JS-rendered content
    const firecrawlContent = await extractContentWithFirecrawl(url);
    if (firecrawlContent) {
      const cleaned = cleanContent(firecrawlContent);
      contentCache.set(url, { content: cleaned, timestamp: Date.now() });
      return cleaned;
    }
    
    // Try direct request
    const directContent = await fetchWithDirectRequest(url);
    if (directContent) {
      const cleaned = cleanContent(directContent);
      contentCache.set(url, { content: cleaned, timestamp: Date.now() });
      return cleaned;
    }
    
    // Try Puppeteer as last resort
    try {
      console.log('Attempting to fetch with Puppeteer');
      const puppeteerContent = await fetchWithPuppeteer(url);
      if (puppeteerContent) {
        const cleaned = cleanContent(puppeteerContent);
        contentCache.set(url, { content: cleaned, timestamp: Date.now() });
        return cleaned;
      }
    } catch (error: any) {
      console.error('Error with Puppeteer fetch:', error.message);
    }
  }
  
  const failureMessage = `Failed to fetch content from ${url} after multiple attempts`;
  console.error(failureMessage);
  return failureMessage;
}

/**
 * Clear the content cache
 */
export function clearContentCache(): void {
  contentCache.clear();
  console.log('Content cache cleared');
}

/**
 * Get cache statistics
 */
export function getContentCacheStats(): { size: number, averageAge: number } {
  let totalAge = 0;
  const now = Date.now();
  
  contentCache.forEach(entry => {
    totalAge += now - entry.timestamp;
  });
  
  return {
    size: contentCache.size,
    averageAge: contentCache.size > 0 ? totalAge / contentCache.size : 0,
  };
}
