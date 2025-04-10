import { ChatPromptTemplate } from '@langchain/core/prompts';
import axios from 'axios';
import { load } from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { config } from '../../config';
import type { SingleResearchItemState } from '../../pool-generation-agent/single-betting-pool-graph';
import { fetchWithPuppeteer } from '../../puppeteer-stealth-request';
import type { ReferenceChain } from '../../types/research-item';

// Define schema for source extraction
const sourceExtractionSchema = z.object({
  title: z.string().describe('The title of the article or page'),
  source_type: z
    .enum([
      'primary',
      'secondary',
      'tertiary',
      'social_media',
      'blog',
      'news',
      'official',
      'unknown',
    ])
    .describe('The type of source'),
  referenced_urls: z.array(z.string()).describe('URLs referenced by this source'),
  content_summary: z.string().describe('A brief summary of the content'),
  is_primary_source: z.boolean().describe('Whether this appears to be a primary source'),
  publication_date: z.string().optional().describe('Publication date if available'),
  verification_status: z
    .enum(['verified', 'partially_verified', 'unverified'])
    .describe('How well the information can be verified'),
  key_claims: z.array(z.string()).describe('Key claims made in the source'),
});

// Maximum depth to follow the reference chain
const MAX_CHAIN_DEPTH = 5;

/**
 * Traces information back to its original source through reference chains
 * Follows links from blogs → news → press reports → primary sources
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

  let startingUrls: string[] = [];

  // Collect starting URLs from various sources in the research item
  if (researchItem.external_link_url) {
    startingUrls.push(researchItem.external_link_url);
  }

  if (researchItem.related_news_urls && researchItem.related_news_urls.length > 0) {
    startingUrls = [...startingUrls, ...researchItem.related_news_urls.slice(0, 2)];
  }

  // If no starting URLs found, check if the post has a card with URL
  if (startingUrls.length === 0 && researchItem.truth_social_post.card?.url) {
    startingUrls.push(researchItem.truth_social_post.card.url);
  }

  // If still no starting URLs, extract from HTML content
  if (startingUrls.length === 0 && researchItem.truth_social_post.content) {
    const extractedUrls = extractUrlsFromHtml(researchItem.truth_social_post.content);
    if (extractedUrls.length > 0) {
      startingUrls = [...startingUrls, ...extractedUrls];
    }
  }

  // If no URLs to trace, mark tracing as complete but unsuccessful
  if (startingUrls.length === 0) {
    console.log('No URLs found to trace sources from');
    return {
      research: {
        ...researchItem,
        source_tracing_complete: true,
        primary_source_found: false,
      },
    };
  }

  console.log(`Found ${startingUrls.length} starting URLs for source tracing`);

  // Initialize reference chains or use existing ones
  const referenceChains: ReferenceChain[] = researchItem.reference_chains || [];
  let primarySourceFound = false;
  let primarySourceUrl = '';
  let primarySourceSummary = '';

  // Process each starting URL
  for (const url of startingUrls) {
    try {
      // Check if this URL is already part of an existing chain
      const existingChainIndex = referenceChains.findIndex(chain =>
        chain.sources.some(source => source.url === url)
      );

      const chainId =
        existingChainIndex >= 0
          ? referenceChains[existingChainIndex]?.chain_id || uuidv4()
          : uuidv4();

      let chain: ReferenceChain;

      // Use existing chain or create new one
      if (existingChainIndex >= 0 && referenceChains[existingChainIndex]) {
        chain = referenceChains[existingChainIndex] as ReferenceChain;
        // Skip if chain is already complete
        if (chain.is_complete) {
          console.log(`Chain ${chainId} is already complete, skipping`);
          continue;
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

      // Update primary source info if found
      if (result.primarySourceFound && !primarySourceFound) {
        primarySourceFound = true;
        primarySourceUrl = result.primarySourceUrl || '';
        primarySourceSummary = result.primarySourceSummary || '';
      }

      // Update the chain in our array
      const chainIndex = referenceChains.findIndex(c => c.chain_id === chainId);
      if (chainIndex >= 0) {
        referenceChains[chainIndex] = result.chain;
      }
    } catch (error) {
      console.error(`Error tracing source chain for URL ${url}:`, error);
      // Continue to next URL on error
    }
  }

  // Return the updated research item
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
 * Recursively follows a reference chain from a starting URL
 */
async function followReferenceChain(
  url: string,
  chain: ReferenceChain,
  depth: number
): Promise<{
  chain: ReferenceChain;
  primarySourceFound: boolean;
  primarySourceUrl?: string;
  primarySourceSummary?: string;
}> {
  // Prevent infinite loops and excessive depth
  if (depth >= MAX_CHAIN_DEPTH) {
    console.log(`Reached maximum chain depth (${MAX_CHAIN_DEPTH}) for URL: ${url}`);
    chain.is_complete = true;
    return {
      chain,
      primarySourceFound: false,
    };
  }

  // Check if this URL is already in the chain to prevent cycles
  if (chain.sources.some(source => source.url === url)) {
    console.log(`URL ${url} is already in the chain, skipping to prevent cycles`);
    return {
      chain,
      primarySourceFound: false,
    };
  }

  console.log(`Analyzing source at depth ${depth}: ${url}`);

  try {
    // Fetch and analyze the content
    const content = await fetchContentFromUrl(url);
    if (!content) {
      console.log(`Failed to fetch content from ${url}`);
      return { chain, primarySourceFound: false };
    }

    // Extract source information
    const sourceInfo = await extractSourceInformation(url, content);

    // Add to the chain
    chain.sources.push({
      url,
      title: sourceInfo.title,
      source_type: sourceInfo.source_type,
      referenced_urls: sourceInfo.referenced_urls,
      content_summary: sourceInfo.content_summary,
      is_primary_source: sourceInfo.is_primary_source,
      publication_date: sourceInfo.publication_date,
      verification_status: sourceInfo.verification_status,
    });

    // If this is a primary source, mark the chain as complete
    if (sourceInfo.is_primary_source) {
      console.log(`Found primary source: ${url}`);
      chain.is_complete = true;
      chain.confidence_score = 1.0;
      return {
        chain,
        primarySourceFound: true,
        primarySourceUrl: url,
        primarySourceSummary: sourceInfo.content_summary,
      };
    }

    // Follow references recursively
    let primarySourceFound = false;
    let primarySourceUrl = '';
    let primarySourceSummary = '';

    // Sort referenced URLs to prioritize likely primary sources
    const prioritizedUrls = prioritizeUrls(sourceInfo.referenced_urls);

    // Only follow the first 2 referenced URLs to avoid excessive branching
    for (const refUrl of prioritizedUrls.slice(0, 2)) {
      if (!refUrl) continue;

      const result = await followReferenceChain(refUrl, chain, depth + 1);

      if (result.primarySourceFound) {
        primarySourceFound = true;
        primarySourceUrl = result.primarySourceUrl || '';
        primarySourceSummary = result.primarySourceSummary || '';
        break; // Stop once we've found a primary source
      }
    }

    // Update chain confidence based on how far we got
    if (!chain.is_complete) {
      chain.confidence_score = calculateChainConfidence(chain);
    }

    return {
      chain,
      primarySourceFound,
      primarySourceUrl,
      primarySourceSummary,
    };
  } catch (error) {
    console.error(`Error analyzing source at ${url}:`, error);
    return { chain, primarySourceFound: false };
  }
}

/**
 * Extracts source information using an LLM
 */
async function extractSourceInformation(
  url: string,
  content: string
): Promise<z.infer<typeof sourceExtractionSchema>> {
  const sourceAnalysisPrompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are an expert source analyst tasked with evaluating web content and identifying its role in information chains.
      For the given URL and content, determine:
      
      1. If it's a PRIMARY source (original documents, direct statements from involved parties, raw data)
      2. If it's a SECONDARY source (news articles, analysis of primary sources)
      3. If it's a TERTIARY source (blog posts, commentaries on news articles)
      4. The type of publication (official, news, blog, social media)
      5. All URLs referenced in the content that could lead to more primary sources
      6. A concise summary of the main information
      7. The reliability/verification status of the information
      8. The publication date if available
      
      Your goal is to help trace information back to its original source.`,
    ],
    [
      'human',
      `URL: {url}
      
      CONTENT:
      {content}
      
      Analyze this content to determine its source type, referenced URLs, and whether it appears to be a primary source.`,
    ],
  ]);

  try {
    // Create structured LLM
    const structuredLlm = config.cheap_large_llm.withStructuredOutput(sourceExtractionSchema, {
      name: 'extractSourceInformation',
    });

    // Format the prompt
    const formattedPrompt = await sourceAnalysisPrompt.formatMessages({
      url,
      content: content.substring(0, 8000), // Limit content length
    });

    // Call the LLM
    const result = await structuredLlm.invoke(formattedPrompt);

    return result;
  } catch (error) {
    console.error('Error extracting source information:', error);

    // Return basic fallback information
    return {
      title: getBasicTitle(content) || url,
      source_type: 'unknown',
      referenced_urls: extractUrlsFromHtml(content),
      content_summary: content.substring(0, 200) + '...',
      is_primary_source: false,
      verification_status: 'unverified',
      key_claims: [],
    };
  }
}

/**
 * Fetches content from a URL using available methods
 */
async function fetchContentFromUrl(url: string): Promise<string> {
  try {
    // Try with Firecrawl API if configured
    if (config.firecrawlApiKey) {
      try {
        console.log('Fetching with Firecrawl:', url);
        const response = await axios.post(
          'https://api.firecrawl.dev/v1/crawl',
          { url },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${config.firecrawlApiKey}`,
            },
          }
        );

        if (response.data && response.data.content) {
          return response.data.content;
        }
        throw new Error('No content returned from Firecrawl');
      } catch (firecrawlError) {
        console.error('Firecrawl fetch failed:', firecrawlError);
      }
    }

    // Fallback to puppeteer
    console.log('Fetching with Puppeteer:', url);
    const puppeteerResult = await fetchWithPuppeteer(url);

    if (puppeteerResult) {
      if (typeof puppeteerResult === 'object' && puppeteerResult.text) {
        return puppeteerResult.text;
      }
      return JSON.stringify(puppeteerResult);
    }

    throw new Error('Failed to fetch content with puppeteer');
  } catch (error) {
    console.error(`Error fetching content from ${url}:`, error);
    return '';
  }
}

/**
 * Extract URLs from HTML content
 */
function extractUrlsFromHtml(html: string): string[] {
  const urls: string[] = [];

  try {
    const $ = load(html);

    // Find all a tags and extract hrefs
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:') && href !== '/') {
        // Handle relative URLs
        try {
          const url = new URL(href, 'https://example.com').toString();
          urls.push(url);
        } catch {
          urls.push(href);
        }
      }
    });

    // Look for URLs in text with regex
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
 * Gets a basic title from HTML content
 */
function getBasicTitle(content: string): string {
  try {
    const $ = load(content);
    return $('title').text() || '';
  } catch {
    return '';
  }
}

/**
 * Prioritize URLs that are likely to be primary sources
 */
function prioritizeUrls(urls: string[]): string[] {
  // Define patterns that might indicate primary sources
  const primarySourcePatterns = [
    /gov\//,
    /\.gov\//, // Government sites
    /\/press-release\//,
    /\/statement\//, // Press releases
    /\/official\//,
    /\/primary\//, // Official/primary indicators
    /\/original\//,
    /\/source\//, // Original source indicators
    /pdf$/,
    /\.pdf\?/, // PDF documents often contain primary info
  ];

  // Score each URL
  const scoredUrls = urls.map(url => {
    let score = 0;

    // Check for primary source patterns
    primarySourcePatterns.forEach(pattern => {
      if (pattern.test(url)) score += 5;
    });

    // Prefer shorter URLs (often closer to source)
    score -= url.length / 100;

    return { url, score };
  });

  // Sort by score (highest first)
  scoredUrls.sort((a, b) => b.score - a.score);

  // Return just the URLs
  return scoredUrls.map(item => item.url);
}

/**
 * Calculate confidence score for a reference chain
 */
function calculateChainConfidence(chain: ReferenceChain): number {
  if (chain.sources.length === 0) return 0;

  // Calculate based on source types and verification status
  let score = 0;

  // More sources = better, up to a point
  score += Math.min(chain.sources.length / 3, 0.5);

  // Reward verified sources
  const verifiedCount = chain.sources.filter(s => s.verification_status === 'verified').length;
  score += (verifiedCount / chain.sources.length) * 0.3;

  // Reward sources closer to primary
  const primaryLikeCount = chain.sources.filter(
    s => s.source_type === 'primary' || s.source_type === 'official' || s.source_type === 'news'
  ).length;
  score += (primaryLikeCount / chain.sources.length) * 0.2;

  return Math.min(Math.max(score, 0), 0.99); // Never 1.0 unless is_primary_source is true
}
