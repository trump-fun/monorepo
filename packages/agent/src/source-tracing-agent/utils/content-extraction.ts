import axios from 'axios';
import { load } from 'cheerio';
import { fetchWithPuppeteer } from '../../puppeteer-stealth-request';
import { fetchWithFirecrawl } from '../api/firecrawl-api';
import { extractContentWithDatura } from '../api/datura-api';

// Common user agents for HTTP requests
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
];

/**
 * Fetches content using a direct HTTP request
 * @param url URL to fetch content from
 * @returns Processed content or null if failed
 */
export async function fetchWithDirectRequest(url: string): Promise<string | null> {
  try {
    // Select a random user agent
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    console.log(`Fetching with direct request: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml',
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
 * Fetches content from a URL using available methods with retries and fallbacks
 * Enhanced with Datura API integration for better content extraction
 * @param url URL to fetch content from
 * @returns Content string or error message
 */
export async function fetchContentFromUrl(url: string): Promise<string> {
  console.log(`Fetching content from: ${url}`);

  // Try Datura API first for high-quality content extraction
  const daturaContent = await extractContentWithDatura(url);
  if (daturaContent) {
    return daturaContent;
  }

  // Try Firecrawl API next for JS-rendered content
  const firecrawlContent = await fetchWithFirecrawl(url, 2, 2000);
  if (firecrawlContent) {
    return firecrawlContent;
  }

  // Try direct request
  const directContent = await fetchWithDirectRequest(url);
  if (directContent) {
    return directContent;
  }

  // Try Puppeteer as last resort for complex JS-rendered pages
  try {
    console.log('Attempting to fetch with Puppeteer');
    const puppeteerContent = await fetchWithPuppeteer(url);
    if (puppeteerContent) {
      return puppeteerContent;
    }
  } catch (error: any) {
    console.error('Error with Puppeteer fetch:', error.message);
  }

  return `Failed to fetch content from ${url}`;
}

/**
 * Gets a basic title from HTML content
 * @param content HTML content
 * @returns Extracted title or empty string
 */
export function getBasicTitle(content: string): string {
  try {
    const $ = load(content);
    return $('title').text() || '';
  } catch {
    return '';
  }
}
