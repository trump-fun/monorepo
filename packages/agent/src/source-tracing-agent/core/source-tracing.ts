import { v4 as uuidv4 } from 'uuid';
import { searchForSourcesWithDatura } from '../api/datura-api';
import { followReferenceChain, calculateChainConfidence } from './reference-chain';
import { extractUrlsFromHtml } from '../utils/url-utils';
import type { SingleResearchItemState } from '../../pool-generation-agent/single-betting-pool-graph';
import type { ReferenceChain } from '../../types/research-item';

/**
 * Traces information back to its original source through reference chains
 * @param state Research item state containing the information to trace
 * @returns Updated research item state with source tracing results
 */
export async function traceSourceChain(
  state: SingleResearchItemState
): Promise<Partial<SingleResearchItemState>> {
  console.log('Tracing information back to primary sources...');

  const researchItem = state.research;
  if (!researchItem) {
    console.log('No research item to trace sources for');
    return { research: undefined };
  }

  // Skip if already processed or marked to not process
  if (researchItem.should_process === false) {
    return { research: researchItem };
  }

  // If source tracing is already complete, return existing item
  if (researchItem.source_tracing_complete === true) {
    console.log('Source tracing already completed for this research item');
    return { research: researchItem };
  }

  // Collect starting URLs from various sources
  const startingUrls = collectStartingUrls(researchItem);

  // Extract topic keywords for searching additional sources
  const topicKeywords = extractTopicKeywords(researchItem);

  // Enhance with Datura API search if we have topic keywords
  let enhancedUrls: string[] = [];
  if (topicKeywords) {
    console.log('Enhancing source discovery with Datura API search');
    enhancedUrls = await searchForSourcesWithDatura(topicKeywords, startingUrls);
  }

  // Use enhanced URLs if they provide more sources, otherwise use original
  let traceUrls = enhancedUrls.length > startingUrls.length ? enhancedUrls : startingUrls;

  // Filter URLs to exclude PDFs and other document files that are likely irrelevant
  traceUrls = traceUrls.filter(url => {
    // Skip PDFs, DOCs, and other document types that are likely to be older materials
    const lowerUrl = url.toLowerCase();
    if (
      lowerUrl.endsWith('.pdf') ||
      lowerUrl.endsWith('.doc') ||
      lowerUrl.endsWith('.docx') ||
      lowerUrl.includes('/publications/') ||
      lowerUrl.includes('/papers/') ||
      lowerUrl.includes('/bitstream/')
    ) {
      console.log(`Skipping document URL: ${url}`);
      return false;
    }

    // Keep news and articles URLs (these are more likely to be recent and relevant)
    if (
      lowerUrl.includes('/article/') ||
      lowerUrl.includes('/news/') ||
      lowerUrl.includes('/business/') ||
      lowerUrl.includes('/politics/')
    ) {
      return true;
    }

    // Default to including URLs unless they match exclusion patterns
    return true;
  });

  console.log(`After filtering, ${traceUrls.length} URLs remain`);

  // Limit the number of URLs to process for better performance
  const MAX_URLS_TO_PROCESS = 10;
  if (traceUrls.length > MAX_URLS_TO_PROCESS) {
    console.log(
      `Limiting processing to ${MAX_URLS_TO_PROCESS} most relevant URLs out of ${traceUrls.length} total`
    );
    traceUrls = traceUrls.slice(0, MAX_URLS_TO_PROCESS);
  }

  // If no URLs to trace, mark tracing as complete but unsuccessful
  if (traceUrls.length === 0) {
    console.log('No URLs found to trace sources from');
    return {
      research: {
        ...researchItem,
        source_tracing_complete: true,
        primary_source_found: false,
      },
    };
  }

  console.log(`Found ${traceUrls.length} starting URLs for source tracing`);

  // Initialize reference chains or use existing ones
  const referenceChains: ReferenceChain[] = researchItem.reference_chains || [];
  let primarySourceFound = false;
  let primarySourceUrl = '';
  let primarySourceSummary = '';

  // Helper function to process a single URL with timeout
  async function processUrlWithTimeout(url: string, timeoutMs: number = 60000) {
    return new Promise<{
      primarySourceFound: boolean;
      primarySourceUrl?: string;
      primarySourceSummary?: string;
      updatedChain?: ReferenceChain;
      chainId?: string;
    }>(async resolve => {
      // Set a timeout to prevent hanging on a single URL
      const timeoutId = setTimeout(() => {
        console.log(`Processing timed out for URL: ${url} after ${timeoutMs}ms`);
        resolve({ primarySourceFound: false });
      }, timeoutMs);

      try {
        // Check if this URL is already part of an existing chain
        const existingChainIndex = referenceChains.findIndex(chain =>
          chain.sources.some(source => source.url === url)
        );

        const chainId =
          existingChainIndex >= 0 && referenceChains[existingChainIndex]
            ? referenceChains[existingChainIndex].chain_id || uuidv4()
            : uuidv4();

        let chain: ReferenceChain;

        // Use existing chain or create new one
        if (existingChainIndex >= 0 && referenceChains[existingChainIndex]) {
          chain = referenceChains[existingChainIndex] as ReferenceChain;
          // Skip if chain is already complete
          if (chain.is_complete) {
            console.log(`Chain ${chainId} is already complete, skipping`);
            clearTimeout(timeoutId);
            resolve({ primarySourceFound: false });
            return;
          }
        } else {
          chain = {
            chain_id: chainId,
            sources: [],
            confidence_score: 0,
            is_complete: false,
          };
          referenceChains.push(chain);
        }

        // Start or continue following the reference chain
        const result = await followReferenceChain(url, chain, 0);

        clearTimeout(timeoutId);
        resolve({
          primarySourceFound: result.primarySourceFound,
          primarySourceUrl: result.primarySourceUrl,
          primarySourceSummary: result.primarySourceSummary,
          updatedChain: result.chain,
          chainId,
        });
      } catch (error) {
        console.error(`Error processing URL ${url}:`, error);
        clearTimeout(timeoutId);
        resolve({ primarySourceFound: false });
      }
    });
  }

  // Process URLs concurrently for better performance
  console.log(`Processing ${traceUrls.length} URLs concurrently...`);
  const processingResults = await Promise.all(traceUrls.map(url => processUrlWithTimeout(url)));

  // Process the results of concurrent URL processing
  for (const result of processingResults) {
    if (result.primarySourceFound && !primarySourceFound) {
      primarySourceFound = true;
      primarySourceUrl = result.primarySourceUrl || '';
      primarySourceSummary = result.primarySourceSummary || '';
    }

    if (result.updatedChain && result.chainId) {
      // Update the chain in our array
      const chainIndex = referenceChains.findIndex(c => c.chain_id === result.chainId);
      if (chainIndex >= 0) {
        // Update confidence score
        referenceChains[chainIndex] = {
          ...result.updatedChain,
          confidence_score: calculateChainConfidence(result.updatedChain),
        };
      }
    }
  }

  // Update all chain confidence scores
  for (let i = 0; i < referenceChains.length; i++) {
    const chain = referenceChains[i];
    if (chain) {
      chain.confidence_score = calculateChainConfidence(chain);
    }
  }

  // Update research item with source tracing results
  return {
    research: {
      ...researchItem,
      reference_chains: referenceChains,
      source_tracing_complete: true,
      primary_source_found: primarySourceFound,
      primary_source_url: primarySourceUrl,
      primary_source_summary: primarySourceSummary,
    },
  };
}

/**
 * Collect starting URLs from the research item
 * @param researchItem Research item to collect URLs from
 * @returns Array of starting URLs
 */
function collectStartingUrls(researchItem: any): string[] {
  const urls: string[] = [];

  // Collect URLs from external link
  if (researchItem.external_link_url) {
    urls.push(researchItem.external_link_url);
  }

  // Collect URLs from related news
  if (researchItem.related_news_urls && researchItem.related_news_urls.length > 0) {
    urls.push(...researchItem.related_news_urls.slice(0, 2));
  }

  // If no URLs found, check if the post has a card with URL
  if (urls.length === 0 && researchItem.truth_social_post?.card?.url) {
    urls.push(researchItem.truth_social_post.card.url);
  }

  // If still no URLs, extract from HTML content
  if (urls.length === 0 && researchItem.truth_social_post?.content) {
    const extractedUrls = extractUrlsFromHtml(researchItem.truth_social_post.content);
    urls.push(...extractedUrls);
  }

  return urls;
}

/**
 * Extract topic keywords from the research item for source searching
 * @param researchItem Research item to extract keywords from
 * @returns Topic keywords or empty string
 */
function extractTopicKeywords(researchItem: any): string {
  if (!researchItem.truth_social_post?.content) {
    return '';
  }

  // Extract main keywords from the post content
  const content = researchItem.truth_social_post.content.replace(/<[^>]*>/g, ' '); // Remove HTML tags
  return content.substring(0, 200); // Use first 200 chars as topic keywords
}
