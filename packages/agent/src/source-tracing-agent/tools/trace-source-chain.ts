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
 * Fetches content from a URL using available methods
 */
async function fetchContentFromUrl(url: string): Promise<string> {
  try {
    // Normalize URL to handle edge cases
    url = normalizeUrl(url);

    // Try with Firecrawl API if configured
    if (config.firecrawlApiKey) {
      try {
        console.log('Fetching with Firecrawl:', url);

        // Make a direct GET request to the Firecrawl API
        const response = await axios.get(`https://api.firecrawl.dev/v1/crawl`, {
          params: { url: url },
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.firecrawlApiKey}`,
          },
          timeout: 30000, // 30 second timeout
        });

        if (response.data?.content) {
          console.log(
            `Successfully retrieved content from Firecrawl (${response.data.content.length} chars)`
          );
          return response.data.content;
        } else if (response.data?.text) {
          return response.data.text;
        } else if (response.data?.html) {
          return response.data.html;
        }

        // If we get here, we didn't find usable content
        console.log('Firecrawl response had no usable content format.');
      } catch (firecrawlError: any) {
        console.error(`Firecrawl fetch failed for ${url}: ${firecrawlError.message}`);
      }
    }

    // Special handling for common document types
    if (url.match(/\.(pdf|docx?|xlsx?|pptx?|csv)($|\?)/i)) {
      return await fetchDocumentContent(url);
    }

    // Fallback to puppeteer
    console.log('Fetching with Puppeteer:', url);
    const puppeteerResult = await fetchWithPuppeteer(url);

    if (puppeteerResult) {
      if (typeof puppeteerResult === 'object' && puppeteerResult.text) {
        return puppeteerResult.text;
      } else if (typeof puppeteerResult === 'string') {
        return puppeteerResult;
      }
      return JSON.stringify(puppeteerResult);
    }

    throw new Error('Failed to fetch content with all available methods');
  } catch (error) {
    console.error(`Error fetching content from ${url}:`, error);
    return '';
  }
}

/**
 * Fetches and extracts content from document types (PDF, DOC, etc.)
 */
async function fetchDocumentContent(url: string): Promise<string> {
  // This is a placeholder for document extraction
  // In a real implementation, you might use a document parsing service or library
  console.log(`Document URL detected (${url}). This would require special handling.`);

  // For now, we'll use puppeteer as a fallback
  return await fetchWithPuppeteer(url).then(result => {
    if (typeof result === 'object' && result.text) {
      return result.text;
    } else if (typeof result === 'string') {
      return result;
    }
    return `Document at ${url} could not be processed directly.`;
  });
}

/**
 * Normalize URL to handle edge cases
 */
function normalizeUrl(url: string): string {
  try {
    // Try to parse the URL to normalize it
    const parsedUrl = new URL(url);
    return parsedUrl.toString();
  } catch (e) {
    // If URL parsing fails, try to fix common issues
    if (!url.match(/^https?:\/\//)) {
      return `https://${url}`;
    }
    return url;
  }
}

/**
 * Prioritize URLs that are likely to be primary sources
 */
function prioritizeUrls(urls: string[]): string[] {
  // Define patterns that might indicate primary sources
  const primarySourcePatterns = [
    // Government and official sites
    /\.(gov|mil|edu)\//,
    /\/press-release/i,
    /\/statement/i,
    /\/official/i,
    // News organizations
    /\.(reuters|ap|apnews|nytimes|washingtonpost|wsj|bbc)\.com/,
    // Primary research
    /\/research/i,
    /\/publication/i,
    /\/report/i,
    // Document types often containing primary sources
    /\.(pdf|doc|docx)($|\?)/i,
    // Court/legal documents
    /\/court/i,
    /\/legal/i,
    /\/filing/i,
    // Data sources
    /\/data/i,
    /\/statistics/i,
    // Evidence of original content
    /\/original/i,
    /\/source/i,
    /\/primary/i,
  ];

  // Define patterns for unreliable sources
  const unreliableSourcePatterns = [
    /\.(wordpress|blogspot|medium)\.com/,
    /\/blog\//i,
    /\/opinion/i,
    /\/commentary/i,
  ];

  // Score each URL
  const scoredUrls = urls.filter(Boolean).map(url => {
    let score = 0;

    // Start with base score
    score = 5;

    // Check for primary source patterns (boost)
    primarySourcePatterns.forEach(pattern => {
      if (pattern.test(url)) score += 10;
    });

    // Check for unreliable source patterns (reduce)
    unreliableSourcePatterns.forEach(pattern => {
      if (pattern.test(url)) score -= 5;
    });

    // Prefer shorter URLs (often closer to source)
    score -= Math.min(url.length / 100, 5);

    // Prefer URLs with fewer path segments
    const pathSegments = (url.match(/\//g) || []).length - 2;
    score -= Math.min(pathSegments, 3);

    return { url, score };
  });

  // Sort by score (highest first)
  scoredUrls.sort((a, b) => b.score - a.score);

  // Return just the URLs
  return scoredUrls.map(item => item.url);
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
  if (chain.sources.some(source => new URL(source.url).hostname === new URL(url).hostname)) {
    console.log(`URL from same domain ${url} is already in the chain, skipping to prevent cycles`);
    return {
      chain,
      primarySourceFound: false,
    };
  }

  console.log(`Analyzing source at depth ${depth}: ${url}`);

  try {
    // Fetch and analyze the content
    const content = await fetchContentFromUrl(url);
    if (!content || content.length < 100) {
      console.log(`Failed to fetch meaningful content from ${url}`);
      return { chain, primarySourceFound: false };
    }

    // Extract source information
    const sourceInfo = await extractSourceInformation(url, content);

    // Log the source type we found
    console.log(
      `Source type for ${url}: ${sourceInfo.source_type} (primary: ${sourceInfo.is_primary_source})`
    );

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
      key_claims: sourceInfo.key_claims,
    });

    // If this is a primary source, mark the chain as complete
    if (sourceInfo.is_primary_source) {
      console.log(`Found primary source: ${url}`);
      chain.is_complete = true;
      chain.confidence_score = calculateSourceConfidence(sourceInfo);
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
    const prioritizedUrls = prioritizeUrls([
      ...sourceInfo.referenced_urls,
      ...extractDeepLinksFromContent(content),
    ]).slice(0, 5); // Consider up to 5 most promising URLs

    console.log(`Found ${prioritizedUrls.length} potentially useful referenced URLs`);

    // Follow promising paths, but implement a breadth-first approach for level 0
    // This helps us evaluate multiple starting points before going deeper
    const maxUrlsToFollow = depth === 0 ? 3 : 2;

    // Only follow the most promising URLs to avoid excessive branching
    for (const refUrl of prioritizedUrls.slice(0, maxUrlsToFollow)) {
      if (!refUrl) continue;

      try {
        const result = await followReferenceChain(refUrl, chain, depth + 1);

        if (result.primarySourceFound) {
          primarySourceFound = true;
          primarySourceUrl = result.primarySourceUrl || '';
          primarySourceSummary = result.primarySourceSummary || '';
          break; // Stop once we've found a primary source
        }
      } catch (error) {
        console.error(`Error following reference to ${refUrl}:`, error);
        // Continue to next URL on error
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
 * Calculate confidence in a specific source
 */
function calculateSourceConfidence(sourceInfo: z.infer<typeof sourceExtractionSchema>): number {
  let score = 0.5; // Base score

  // Adjust based on source type
  switch (sourceInfo.source_type) {
    case 'primary':
      score += 0.3;
      break;
    case 'official':
      score += 0.25;
      break;
    case 'news':
      score += 0.2;
      break;
    case 'secondary':
      score += 0.1;
      break;
    case 'blog':
    case 'social_media':
      score -= 0.1;
      break;
  }

  // Adjust based on verification status
  switch (sourceInfo.verification_status) {
    case 'verified':
      score += 0.2;
      break;
    case 'partially_verified':
      score += 0.1;
      break;
    case 'unverified':
      score -= 0.1;
      break;
  }

  // Date recency could be considered
  if (sourceInfo.publication_date) {
    try {
      const pubDate = new Date(sourceInfo.publication_date);
      const now = new Date();
      const monthsAgo = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      // Newer information gets a small boost, but not too much
      if (monthsAgo < 1) score += 0.05;
      else if (monthsAgo > 36) score -= 0.05; // Very old info gets a small penalty
    } catch (e) {
      // Ignore date parsing errors
    }
  }

  return Math.min(Math.max(score, 0.1), 1.0);
}

/**
 * Extract deep links that may not be in standard <a> tags
 */
function extractDeepLinksFromContent(content: string): string[] {
  const urls: string[] = [];

  // Look for URLs in text with regex - different patterns
  const urlPatterns = [
    /https?:\/\/[^\s"'<>()]+/g, // Basic URL pattern
    /Source:\s+(?:https?:\/\/)?[^\s"'<>()]+/gi, // Following "Source:" text
    /Reference:\s+(?:https?:\/\/)?[^\s"'<>()]+/gi, // Following "Reference:" text
    /from\s+(?:https?:\/\/)?[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}[^\s]*/gi, // "from domain.com" pattern
  ];

  urlPatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    matches.forEach(match => {
      // Clean up the match to extract just the URL
      let url = match;
      if (!url.startsWith('http')) {
        // Try to extract domain from patterns like "from example.com/page"
        const domainMatch = url.match(
          /(?:from\s+)?((?:https?:\/\/)?[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}[^\s]*)/i
        );
        if (domainMatch && domainMatch[1]) {
          url = domainMatch[1];
          if (!url.startsWith('http')) {
            url = 'https://' + url;
          }
        }
      }

      try {
        // Validate it's really a URL
        new URL(url);
        if (!urls.includes(url)) {
          urls.push(url);
        }
      } catch (e) {
        // Invalid URL, ignore
      }
    });
  });

  return urls;
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
