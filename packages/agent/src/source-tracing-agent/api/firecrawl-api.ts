import { config } from '../../config';
import { delay } from '../utils/delay';
import FirecrawlApp from '@mendable/firecrawl-js';

/**
 * Fetches content using Firecrawl API with retries
 * @param url URL to fetch content from
 * @param maxRetries Maximum number of retries
 * @param retryDelayMs Delay between retries in milliseconds
 * @returns Content string or null if failed
 */
export async function fetchWithFirecrawl(
  url: string,
  maxRetries = 3,
  retryDelayMs = 2000
): Promise<string | null> {
  if (!config.firecrawlApiKey) return null;

  let attempts = 0;
  // Initialize the Firecrawl SDK with the API key
  const firecrawl = new FirecrawlApp({ apiKey: config.firecrawlApiKey });

  while (attempts < maxRetries) {
    try {
      console.log(`Fetching with Firecrawl SDK (attempt ${attempts + 1}):`, url);

      // Use the scrapeUrl method to get the content
      // Note: The SDK uses different parameter names than the direct API
      const scrapeResponse = await firecrawl.scrapeUrl(url, {
        formats: ['html', 'markdown']
        // Additional options can be added if supported by the SDK
      });

      // Check if the scrape was successful
      if (!scrapeResponse.success) {
        throw new Error(`Failed to scrape: ${scrapeResponse.error}`);
      }

      // Extract content - type assertion to handle potential type issues
      const response = scrapeResponse as any;
      
      // Check if the content is available directly
      if (response.formats?.html) {
        return response.formats.html;
      } else if (response.formats?.markdown) {
        return response.formats.markdown;
      } else if (response.content && typeof response.content === 'string') {
        return response.content;
      }

      // If we're here, we need to handle asynchronous processing
      if (response.status === 'queued' && response.jobId) {
        const jobId = response.jobId;
        console.log('Firecrawl job queued with ID:', jobId);
        const content = await pollFirecrawlJob(jobId);
        if (content) return content;
      }

      // Delay before retry
      attempts++;
      await delay(retryDelayMs);
    } catch (error: any) {
      console.error('Firecrawl error:', error.message);
      attempts++;
      if (attempts < maxRetries) {
        await delay(retryDelayMs);
      }
    }
  }

  console.log(`Failed to fetch content with Firecrawl SDK after ${maxRetries} attempts`);
  return null;
}

/**
 * Polls a Firecrawl job for results
 * @param jobId The Firecrawl job ID
 * @param maxAttempts Maximum polling attempts
 * @param pollIntervalMs Interval between polling attempts in milliseconds
 * @returns Content if successful, null otherwise
 */
export async function pollFirecrawlJob(
  jobId: string,
  maxAttempts = 10,
  pollIntervalMs = 2000
): Promise<string | null> {
  if (!config.firecrawlApiKey) return null;

  // Initialize the Firecrawl SDK with the API key
  const firecrawl = new FirecrawlApp({ apiKey: config.firecrawlApiKey });
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      console.log(`Polling Firecrawl job (attempt ${attempts + 1}):`, jobId);

      // Use the SDK's checkCrawlStatus method to get the job status
      const statusResponse = await firecrawl.checkCrawlStatus(jobId);
      
      if (!statusResponse.success) {
        throw new Error(`Failed to check crawl status: ${statusResponse.error}`);
      }
      
      // Type assertion to handle potential type issues
      const response = statusResponse as any;
      const jobStatus = response.status;

      if (jobStatus === 'completed' && (response.formats?.html || response.content)) {
        console.log('Firecrawl job completed successfully');
        // Return content in order of preference
        return response.formats?.html || response.formats?.markdown || response.content || null;
      } else if (jobStatus === 'failed') {
        console.log('Firecrawl job failed');
        return null;
      } else if (jobStatus === 'queued' || jobStatus === 'processing') {
        // Still processing, continue polling
        console.log(`Firecrawl job status: ${jobStatus}, continuing to poll...`);
        attempts++;
        await delay(pollIntervalMs);
      } else {
        // Unknown status
        console.log(`Unknown Firecrawl job status: ${jobStatus}`);
        return null;
      }
    } catch (error: any) {
      console.error('Error polling Firecrawl job:', error.message);
      attempts++;
      if (attempts < maxAttempts) {
        await delay(pollIntervalMs);
      }
    }
  }

  console.log(`Firecrawl job polling timed out after ${maxAttempts} attempts`);
  return null;
}
