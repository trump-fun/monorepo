import FirecrawlApp from '@mendable/firecrawl-js';
import type { SingleResearchItemState } from '../single-betting-pool-graph';

/**
 * Extracts a URL from a Truth Social post content and scrapes it using Firecrawl
 */
export async function extractAndScrapeExternalLink(
  state: SingleResearchItemState
): Promise<Partial<SingleResearchItemState>> {
  console.log('Checking for external links in Truth Social post');

  // Get the research item from state
  const researchItem = state.research;

  // If there's no research item, return early
  if (!researchItem) {
    console.log('No research item available');
    return {
      research: researchItem,
    };
  }

  // Check if the item is marked to be processed
  if (researchItem.should_process !== true) {
    console.log('Research item is not marked for processing');
    return {
      research: researchItem,
    };
  }

  try {
    console.log(`Checking for links in post: ${researchItem.truth_social_post.id}`);

    // Extract content from the post
    const postContent = researchItem.truth_social_post.content;

    // Check for URLs in the content using regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = postContent.match(urlRegex);

    if (!matches || matches.length === 0) {
      console.log('No external links found in post');
      return {
        research: {
          ...researchItem,
          external_link_content: null,
        },
      };
    }

    // Use the first URL found
    const url = matches[0];
    console.log(`Found external link: ${url}`);

    try {
      const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
      if (!firecrawlApiKey) {
        console.error('FIRECRAWL_API_KEY is not set in environment variables');
        return {
          research: {
            ...researchItem,
            external_link_content: null,
          },
        };
      }

      const app = new FirecrawlApp({ apiKey: firecrawlApiKey });
      const scrapeResult = await app.scrapeUrl(url, {
        formats: ['markdown', 'html'],
      });

      if (!scrapeResult.success) {
        console.error(`Failed to scrape: ${scrapeResult.error}`);
        return {
          research: {
            ...researchItem,
            external_link_content: null,
          },
        };
      }

      console.log(`Successfully scraped content from: ${url}`);

      // Get the markdown content from the data object
      const scrapedContent = scrapeResult.markdown || '';

      // Limit the content to a reasonable size if needed
      const truncatedContent =
        scrapedContent.length > 5000 ? scrapedContent.substring(0, 5000) + '...' : scrapedContent;

      console.log(`Scraped content: ${truncatedContent}`);

      return {
        research: {
          ...researchItem,
          external_link_content: truncatedContent,
          external_link_url: url,
        },
      };
    } catch (error) {
      console.error('Error scraping external link:', error);
      return {
        research: {
          ...researchItem,
          external_link_content: null,
        },
      };
    }
  } catch (error) {
    console.error('Error processing external link:', error);
    return {
      research: researchItem,
    };
  }
}

/**
 * Check if a Truth Social post contains an external link
 */
export function hasExternalLink(state: SingleResearchItemState): 'scrape' | 'skip' {
  if (!state.research) return 'skip';

  // If the item is explicitly marked as should not process, skip
  if (state.research.should_process === false) return 'skip';

  // If the item already has external link content, skip
  if (state.research.external_link_content) return 'skip';

  // Check the content for URLs
  const postContent = state.research.truth_social_post.content;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = postContent.match(urlRegex);

  if (!matches || matches.length === 0) {
    return 'skip';
  }

  return 'scrape';
}
