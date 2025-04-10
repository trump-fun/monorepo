import axios from 'axios';
import { load } from 'cheerio';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { SingleResearchItemState } from '../single-betting-pool-graph';
import config from '../../config';
import { fetchWithPuppeteer } from '../../puppeteer-stealth-request';

/**
 * Extracts a URL from HTML content
 * Looks for standard <a> tags and other common URL formats
 */
function extractUrls(html: string): string[] {
  const urls: string[] = [];

  try {
    // Load HTML into cheerio
    const $ = load(html);

    // Find all a tags and extract hrefs
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:') && href !== '/') {
        urls.push(href);
      }
    });

    // Look for additional URL formats in the text with regex
    const urlRegex = /https?:\/\/[^\s"'<>()]+/g;
    const textContent = $('body').text();
    const regexMatches = textContent.match(urlRegex) || [];

    regexMatches.forEach(url => {
      if (!urls.includes(url)) {
        urls.push(url);
      }
    });
  } catch (error) {
    console.error('Error extracting URLs:', error);
  }

  return urls;
}

/**
 * Extracts external link URL from a Truth Social post
 */
function extractExternalLink(post: any): string | null {
  // Check if there's a card with URL
  if (post.card?.url) {
    return post.card.url;
  }

  // Check directly in the content for links
  if (post.content) {
    const urls = extractUrls(post.content);
    if (urls.length > 0) {
      return urls[0] || null; // Return first found URL or null if undefined
    }
  }

  return null;
}

/**
 * Checks if a post has an external link that should be scraped
 */
export function hasExternalLink(state: SingleResearchItemState): 'scrape' | 'skip' {
  const researchItem = state.research;

  // If the post doesn't exist or shouldn't be processed, skip
  if (!researchItem || researchItem.should_process === false) {
    return 'skip';
  }

  // Check if there's a card with URL or content has links
  if (
    researchItem.truth_social_post.card?.url ||
    (researchItem.truth_social_post.content &&
      extractUrls(researchItem.truth_social_post.content).length > 0)
  ) {
    return 'scrape';
  }

  return 'skip';
}

/**
 * Combines extraction and scraping of external links in a single function
 * for use in the research graph
 */
export async function extractAndScrapeExternalLink(
  state: SingleResearchItemState
): Promise<Partial<SingleResearchItemState>> {
  console.log('Checking for external links in post');

  const researchItem = state.research;
  if (!researchItem) {
    console.log('No research item to process');
    return { research: undefined };
  }

  // Skip if already processed or marked to not process
  if (researchItem.should_process === false) {
    return { research: researchItem };
  }

  // Extract external link
  const externalLink = extractExternalLink(researchItem.truth_social_post);
  if (!externalLink) {
    console.log('No external links found in post');
    return { research: researchItem };
  }

  console.log(`Found external link: ${externalLink}`);

  try {
    let content: string;

    // First try with Firecrawl API if configured
    if (config.firecrawlApiKey) {
      try {
        console.log('Attempting to fetch URL with Firecrawl');
        const response = await axios.post(
          'https://api.firecrawl.dev/v1/crawl',
          { url: externalLink },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${config.firecrawlApiKey}`,
            },
          }
        );

        if (response.data.content) {
          content = response.data.content;
          console.log('Successfully fetched content with Firecrawl');
        } else {
          throw new Error('No content returned from Firecrawl');
        }
      } catch (firecrawlError) {
        console.error('Firecrawl fetch failed:', firecrawlError);
        // Fall back to puppeteer
        const puppeteerResult = await fetchWithPuppeteer(externalLink);
        if (puppeteerResult && typeof puppeteerResult === 'object') {
          if (puppeteerResult.text) {
            content = puppeteerResult.text;
          } else {
            content = JSON.stringify(puppeteerResult);
          }
        } else {
          content = String(puppeteerResult);
        }
      }
    } else {
      // Use puppeteer directly if Firecrawl not configured
      console.log('Attempting to fetch URL with Puppeteer');
      const puppeteerResult = await fetchWithPuppeteer(externalLink);
      if (puppeteerResult && typeof puppeteerResult === 'object') {
        if (puppeteerResult.text) {
          content = puppeteerResult.text;
        } else {
          content = JSON.stringify(puppeteerResult);
        }
      } else {
        content = String(puppeteerResult);
      }
    }

    // Summarize the content with an LLM
    const summarizePrompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are an AI assistant that summarizes web content. 
        Summarize the provided content in a concise but informative way, focusing on key facts and information.
        If the content is very long, prioritize information that seems most relevant to the topic.
        Remove any redundant information, ads, navigation elements, etc.
        Format the summary as plain text with appropriate paragraph breaks.
        Maximum summary length should be 2000 characters.`,
      ],
      [
        'human',
        `Here is web content from ${externalLink} that needs to be summarized:
        
        ${content}`,
      ],
    ]);

    // Get the formatted prompt
    const formattedPrompt = await summarizePrompt.formatMessages({});

    // Get summary from LLM
    const summaryResponse = await config.cheap_large_llm.invoke(formattedPrompt);
    const summary = String(summaryResponse.content);

    console.log(`Generated summary of external content (${summary.length} chars)`);

    // Return the updated research item with external link content
    return {
      research: {
        ...researchItem,
        external_link_url: externalLink,
        external_link_content: summary,
      },
    };
  } catch (error) {
    console.error(`Error scraping external link: ${error}`);
    return {
      research: {
        ...researchItem,
        external_link_url: externalLink,
        external_link_error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
