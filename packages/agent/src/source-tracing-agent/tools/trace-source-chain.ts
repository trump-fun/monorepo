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
  // Keep source_type but clarify it's for scoring purposes only, not definitive classification
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
    .describe('The apparent form/format of the source (used for scoring/heuristics only)'),
  referenced_urls: z.array(z.string()).describe('URLs referenced by this source'),
  content_summary: z.string().describe('A brief summary of the content'),
  // This is now about original information rather than source category
  contains_original_information: z
    .boolean()
    .describe('Whether this contains original information/statements not found in its references'),
  // Track position metrics to determine chain position
  chain_distance_markers: z
    .object({
      has_no_references: z
        .boolean()
        .describe(
          'Whether this source has no references to other sources (potential chain endpoint)'
        ),
      is_directly_cited: z
        .boolean()
        .describe('Whether this source is directly cited by others (middle of chain)'),
      cites_primary_sources: z
        .boolean()
        .describe('Whether this source cites apparent primary/original sources'),
    })
    .describe('Markers to help position this source in the reference chain'),
  publication_date: z.string().optional().describe('Publication date if available'),
  verification_status: z
    .enum(['verified', 'partially_verified', 'unverified'])
    .describe('How well the information can be verified'),
  key_claims: z.array(z.string()).describe('Key claims made in the source'),
});

// Maximum depth to follow the reference chain
const MAX_CHAIN_DEPTH = 5;

/**
 * Searches for relevant sources and references using Datura API
 * This provides a more comprehensive set of starting points for source tracing
 */
async function searchForSources(topic: string, existingUrls: string[] = []): Promise<string[]> {
  console.log(`Searching for additional sources related to: ${topic}`);
  const allSources: string[] = [...existingUrls];

  try {
    // Use Datura API to find relevant sources across multiple platforms
    if (config.daturaApiKey) {
      // 1. Web link search for primary sources
      try {
        const webSearchResponse = await axios.post(
          'https://apis.datura.ai/desearch/ai/search/links/web',
          {
            prompt: `${topic} primary source official document evidence verification`,
            tools: ['web', 'wikipedia', 'hackernews', 'arxiv'],
            model: 'NOVA',
          },
          {
            headers: {
              Authorization: `Bearer ${config.daturaApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // Process web search results
        const sourceTypes = [
          'search_results',
          'wikipedia_search_results',
          'arxiv_search_results',
          'hacker_news_search_results',
        ];

        // Extract URLs from each source type
        for (const sourceType of sourceTypes) {
          if (webSearchResponse.data?.[sourceType]?.organic_results) {
            const results = webSearchResponse.data[sourceType].organic_results;
            console.log(`Found ${results.length} results from ${sourceType}`);

            for (const result of results) {
              if (result.link) {
                allSources.push(result.link);
              }
            }
          }
        }
      } catch (webSearchError) {
        console.error('Error using Datura web search API:', webSearchError);
      }

      // 2. Comprehensive AI search for deeper context
      try {
        const aiSearchResponse = await axios.post(
          'https://apis.datura.ai/desearch/ai/search',
          {
            prompt: `${topic} original source official statement press release`,
            tools: ['web', 'wikipedia', 'hackernews', 'arxiv', 'youtube'],
            model: 'NOVA',
            date_filter: 'PAST_YEAR',
            streaming: false,
            result_type: 'LINKS_WITH_SUMMARIES',
          },
          {
            headers: {
              Authorization: `Bearer ${config.daturaApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // Extract both completion links and any links found in text chunks
        if (aiSearchResponse.data?.completion_links) {
          const links = aiSearchResponse.data.completion_links;
          console.log(`Found ${links.length} links from AI search completion`);
          allSources.push(...links);
        }

        // Handle links found in each source type
        const sourceTypes = [
          'wikipedia_search_results',
          'youtube_search_results',
          'arxiv_search_results',
          'reddit_search_results',
          'hacker_news_search_results',
        ];

        for (const sourceType of sourceTypes) {
          if (aiSearchResponse.data?.[sourceType]) {
            const results = aiSearchResponse.data[sourceType];
            if (Array.isArray(results) && results.length > 0) {
              for (const result of results) {
                if (result.organic_results) {
                  for (const orgResult of result.organic_results) {
                    if (orgResult.url || orgResult.link) {
                      allSources.push(orgResult.url || orgResult.link);
                    }
                  }
                }
              }
            }
          }
        }
      } catch (aiSearchError) {
        console.error('Error using Datura AI search API:', aiSearchError);
      }
    }
  } catch (error) {
    console.error('Error searching for additional sources:', error);
  }

  // Remove duplicates and normalize URLs
  const uniqueUrls = [...new Set(allSources)].map(url => {
    try {
      return normalizeUrl(url);
    } catch (e) {
      return url;
    }
  });

  console.log(`Found ${uniqueUrls.length} total unique sources after search`);
  return uniqueUrls;
}

/**
 * Traces information back to its original source through reference chains
 * Follows links from blogs → news → press reports → primary sources
 * Enhanced with Datura API for more comprehensive source discovery
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

  // Extract topic keywords for searching additional sources
  let topicKeywords = '';
  if (researchItem.truth_social_post.content) {
    // Extract main keywords from the post content
    const content = researchItem.truth_social_post.content.replace(/<[^>]*>/g, ' '); // Remove HTML tags
    topicKeywords = content.substring(0, 200); // Use first 200 chars as topic keywords
  }

  // If we have a topic but no URLs, or even with some URLs, enhance with Datura API search
  if (topicKeywords) {
    console.log('Enhancing source discovery with Datura API search');
    const enhancedUrls = await searchForSources(topicKeywords, startingUrls);
    // Only replace our starting URLs if we found better ones
    if (enhancedUrls.length > startingUrls.length) {
      startingUrls = enhancedUrls;
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
 * Extracts content from a URL using Datura's advanced processing capabilities
 * This provides higher quality content extraction for better source analysis
 */
async function extractContentWithDatura(url: string): Promise<string | null> {
  if (!config.daturaApiKey) {
    return null;
  }

  console.log(`Attempting to extract content with Datura API: ${url}`);

  try {
    // Use Datura's AI search to get high-quality content extraction
    const response = await axios.post(
      'https://apis.datura.ai/desearch/ai/search',
      {
        prompt: `Extract and summarize the main content from this page: ${url}`,
        tools: ['web'], // Only web tool needed for content extraction
        model: 'NOVA', // Using their more powerful model for better extraction
        streaming: false,
        result_type: 'LINKS_WITH_SUMMARIES',
      },
      {
        headers: {
          Authorization: `Bearer ${config.daturaApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 45000, // 45 second timeout
      }
    );

    let extractedContent = '';

    // Try to get content from completion first (usually has the best summary)
    if (response.data?.completion?.summary) {
      extractedContent += response.data.completion.summary + '\n\n';
    }

    // Get content from text chunks if available
    if (response.data?.text_chunks) {
      const chunks = response.data.text_chunks;
      if (Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (typeof chunk === 'string') {
            extractedContent += chunk + '\n';
          } else if (chunk.twitter_summary && Array.isArray(chunk.twitter_summary)) {
            extractedContent += chunk.twitter_summary.join('\n') + '\n';
          }
        }
      } else if (typeof chunks === 'string') {
        extractedContent += chunks;
      }
    }

    // Look for search results that match our URL
    if (response.data?.search_results?.organic_results) {
      const results = response.data.search_results.organic_results;
      for (const result of results) {
        if ((result.link === url || url.includes(result.link)) && result.snippet) {
          extractedContent += '\n' + result.snippet;
          if (result.summary_description) {
            extractedContent += '\n' + result.summary_description;
          }
        }
      }
    }

    if (extractedContent.length > 200) {
      console.log(`Successfully extracted ${extractedContent.length} chars with Datura API`);
      return extractedContent;
    } else {
      console.log('Datura API extraction returned insufficient content');
      return null;
    }
  } catch (error: unknown) {
    const err = error as { message: string };
    console.error(`Error extracting content with Datura:`, err.message);
    return null;
  }
}

/**
 * Fetches content from a URL using available methods with retries and fallbacks
 * Enhanced with Datura API integration for better content extraction
 */
async function fetchContentFromUrl(url: string): Promise<string> {
  // Maximum number of retries for Firecrawl API
  const MAX_FIRECRAWL_RETRIES = 3;
  // Backoff delay for retries (ms)
  const RETRY_DELAY_MS = 2000;
  // Different user agents to rotate through for requests that need them
  const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  ];

  // Helper function to delay execution
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // Normalize URL to handle edge cases
    url = normalizeUrl(url);
    let content = '';

    // First try: Datura API for high-quality content extraction
    // This is preferred because it gives the most readable and useful content
    if (config.daturaApiKey) {
      const daturaContent = await extractContentWithDatura(url);
      if (daturaContent) {
        return daturaContent; // Return immediately if we got good content
      }
    }

    // Second try: Firecrawl API if configured
    if (config.firecrawlApiKey) {
      let attempts = 0;
      let firecrawlSucceeded = false;

      while (attempts < MAX_FIRECRAWL_RETRIES && !firecrawlSucceeded) {
        try {
          console.log(`Fetching with Firecrawl (attempt ${attempts + 1}):`, url);

          // Make a direct GET request to the Firecrawl API
          const response = await axios.get(`https://api.firecrawl.dev/v1/crawl`, {
            params: {
              url: url,
              // Request LLM-friendly markdown format when available
              format: 'markdown',
            },
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${config.firecrawlApiKey}`,
            },
            timeout: 45000, // 45 second timeout (increased from 30s)
          });

          if (response.data?.content) {
            console.log(
              `Successfully retrieved content from Firecrawl (${response.data.content.length} chars)`
            );
            content = response.data.content;
            firecrawlSucceeded = true;
          } else if (response.data?.text) {
            content = response.data.text;
            firecrawlSucceeded = true;
          } else if (response.data?.html) {
            content = response.data.html;
            firecrawlSucceeded = true;
          } else {
            // If we get here, we didn't find usable content
            console.log('Firecrawl response had no usable content format.');
            attempts++;
            if (attempts < MAX_FIRECRAWL_RETRIES) {
              console.log(`Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
              await delay(RETRY_DELAY_MS);
            }
          }
        } catch (firecrawlError: any) {
          console.error(`Firecrawl fetch failed for ${url}: ${firecrawlError.message}`);
          attempts++;

          // Check if we should retry based on error type
          const shouldRetry =
            firecrawlError.response?.status === 429 || // Rate limiting
            firecrawlError.response?.status === 503 || // Service unavailable
            firecrawlError.code === 'ECONNRESET' ||
            firecrawlError.code === 'ETIMEDOUT';

          if (shouldRetry && attempts < MAX_FIRECRAWL_RETRIES) {
            const backoffTime = RETRY_DELAY_MS * attempts; // Exponential backoff
            console.log(`Retrying in ${backoffTime / 1000} seconds...`);
            await delay(backoffTime);
          } else {
            console.log('Moving to fallback methods after Firecrawl failures');
            break;
          }
        }
      }

      if (firecrawlSucceeded && content) {
        return content;
      }
    }

    // Special handling for common document types
    if (url.match(/\.(pdf|docx?|xlsx?|pptx?|csv)($|\?)/i)) {
      const docContent = await fetchDocumentContent(url);
      if (docContent && docContent.length > 100) {
        return docContent;
      }
      // If document extraction failed, continue to other methods
    }

    // Fallback to puppeteer
    console.log('Fetching with Puppeteer:', url);
    // Note: Update this based on the actual function signature of fetchWithPuppeteer
    // If it doesn't accept options, pass only the URL
    const puppeteerResult = await fetchWithPuppeteer(url);

    if (puppeteerResult) {
      if (typeof puppeteerResult === 'object' && puppeteerResult.text) {
        return puppeteerResult.text;
      } else if (typeof puppeteerResult === 'string') {
        return puppeteerResult;
      }
      return JSON.stringify(puppeteerResult);
    }

    // Final fallback: try a direct axios get request
    try {
      console.log('Attempting direct HTTP request as last resort:', url);
      const response = await axios.get(url, {
        headers: {
          'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 20000,
      });

      if (response.data) {
        // If we got HTML, parse with Cheerio to extract text
        const $ = load(response.data);
        // Remove script and style elements
        $('script, style, meta, link').remove();
        let text = $('body').text();
        // Clean up whitespace
        text = text.replace(/\s+/g, ' ').trim();
        return text || response.data;
      }
    } catch (error: unknown) {
      const axiosError = error as { message: string };
      console.error('Final direct HTTP request also failed:', axiosError.message);
    }

    throw new Error('Failed to fetch content with all available methods');
  } catch (error) {
    console.error(`Error fetching content from ${url}:`, error);
    return '';
  }
}

/**
 * Fetches and extracts content from document types (PDF, DOC, etc.)
 * Uses a multi-layered approach to document extraction
 */
async function fetchDocumentContent(url: string): Promise<string> {
  console.log(`Document URL detected: ${url}`);

  // Document extraction options to try, in order of preference
  const documentExtractors = [
    tryDocumentAI, // Try Document AI service if configured
    tryDirectDownload, // Try direct download and parsing
    tryPuppeteerView, // Use puppeteer as last resort
  ];

  // Try each method in sequence until one works
  for (const extractMethod of documentExtractors) {
    try {
      const content = await extractMethod(url);
      if (content && content.length > 100) {
        return content;
      }
    } catch (error: unknown) {
      const err = error as { message: string };
      console.error(`Document extraction method failed: ${err.message}`);
      // Continue to next method
    }
  }

  return `Document at ${url} could not be processed with any available method.`;

  // Document AI API extraction (placeholder - replace with actual service)
  async function tryDocumentAI(documentUrl: string): Promise<string> {
    // This would integrate with a document parsing API like Google Document AI,
    // Azure Form Recognizer, or similar service

    // Check if document AI is enabled (add this property to config when implementing)
    if (!(config as any).documentAiEnabled) {
      throw new Error('Document AI service not configured');
    }

    console.log('Attempting to extract document using Document AI service');

    // This is where you'd make the API call to the document processing service
    // For now we'll just throw since this is a placeholder
    throw new Error('Document AI integration not implemented yet');
  }

  // Direct download and extraction approach
  async function tryDirectDownload(documentUrl: string): Promise<string> {
    console.log('Attempting direct download and parsing of document');

    // For real implementation, you would:
    // 1. Download the file using axios with responseType: 'arraybuffer'
    // 2. Use appropriate library based on file type (pdf-parse for PDFs, etc.)
    // 3. Extract text content from the downloaded document

    const fileExtension = documentUrl.split('.').pop()?.toLowerCase();

    try {
      // Download the file
      const response = await axios.get(documentUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      // For this placeholder implementation, we'll just convert to text
      // In a real implementation, you'd use libraries specific to each document type
      const decoder = new TextDecoder('utf-8');
      try {
        const text = decoder.decode(response.data);
        // Basic check if we got textual content
        if (text && !text.includes('�') && text.length > 100) {
          return text;
        }
      } catch (decodeError) {
        console.error('Error decoding document content:', decodeError);
      }

      throw new Error('Document content could not be extracted');
    } catch (error: unknown) {
      const err = error as { message: string };
      console.error(`Error downloading document: ${err.message}`);
      throw error;
    }
  }

  // Puppeteer fallback approach
  async function tryPuppeteerView(documentUrl: string): Promise<string> {
    console.log('Attempting document extraction via Puppeteer');

    // Note: Update this based on the actual function signature of fetchWithPuppeteer
    // Simplified call without options object
    const result = await fetchWithPuppeteer(documentUrl);

    if (typeof result === 'object' && result.text) {
      return result.text;
    } else if (typeof result === 'string') {
      return result;
    }

    throw new Error('Puppeteer extraction failed to get document content');
  }
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
 * Uses a comprehensive scoring system to rank URLs by their likelihood of containing primary source material
 */
function prioritizeUrls(urls: string[]): string[] {
  // Only process valid URLs
  const validUrls = urls.filter(Boolean).map(url => {
    try {
      // Normalize URL to handle edge cases
      return normalizeUrl(url);
    } catch (error) {
      return url; // Keep original if normalization fails
    }
  });

  // Remove duplicates
  const uniqueUrls = [...new Set(validUrls)];

  if (uniqueUrls.length === 0) {
    return [];
  }

  // Define comprehensive URL categorization system
  const urlCategories = {
    // === PRIMARY SOURCE INDICATORS === //

    // Government domains by country and type
    government: [
      // US Government
      { pattern: /\.gov($|\/)/i, score: 35 },
      { pattern: /whitehouse\.gov/i, score: 40 },
      { pattern: /congress\.gov/i, score: 40 },
      { pattern: /senate\.gov/i, score: 40 },
      { pattern: /house\.gov/i, score: 40 },
      { pattern: /supremecourt\.gov/i, score: 40 },
      { pattern: /uscourts\.gov/i, score: 40 },
      { pattern: /justice\.gov/i, score: 40 },
      { pattern: /state\.gov/i, score: 40 },
      { pattern: /treasury\.gov/i, score: 40 },
      { pattern: /defense\.gov/i, score: 40 },
      { pattern: /ed\.gov/i, score: 35 },
      { pattern: /epa\.gov/i, score: 35 },
      { pattern: /nih\.gov/i, score: 35 },
      { pattern: /cdc\.gov/i, score: 35 },
      { pattern: /fbi\.gov/i, score: 35 },

      // Military domains
      { pattern: /\.mil($|\/)/i, score: 35 },

      // International government domains
      { pattern: /\.gc\.ca/i, score: 30 }, // Canada
      { pattern: /\.gov\.uk/i, score: 30 }, // UK
      { pattern: /\.gouv\.fr/i, score: 30 }, // France
      { pattern: /\.gov\.au/i, score: 30 }, // Australia
      { pattern: /\.gob\.(es|mx)/i, score: 30 }, // Spain/Mexico
      { pattern: /\.gov\.(de|br|in|ru|cn|it)/i, score: 30 }, // Other major countries
      { pattern: /parliament\./i, score: 30 }, // Generic parliament sites
    ],

    // International organizations
    international: [
      { pattern: /un\.org/i, score: 30 }, // United Nations
      { pattern: /who\.int/i, score: 30 }, // World Health Organization
      { pattern: /imf\.org/i, score: 30 }, // International Monetary Fund
      { pattern: /worldbank\.org/i, score: 30 }, // World Bank
      { pattern: /wto\.org/i, score: 30 }, // World Trade Organization
      { pattern: /europa\.eu/i, score: 30 }, // European Union
      { pattern: /nato\.int/i, score: 30 }, // NATO
      { pattern: /oecd\.org/i, score: 30 }, // OECD
      { pattern: /icc-cpi\.int/i, score: 30 }, // International Criminal Court
    ],

    // Educational institutions
    educational: [
      { pattern: /\.edu($|\/)/i, score: 25 }, // US educational
      { pattern: /\.ac\.(uk|jp|nz|in)/i, score: 25 }, // UK/Japan/NZ/India academic
      { pattern: /\.edu\.(au|cn)/i, score: 25 }, // Australia/China educational
      { pattern: /university\./i, score: 20 }, // University sites
      { pattern: /\.university/i, score: 20 }, // University sites
    ],

    // Legal and judicial sources
    legal: [
      { pattern: /\/court/i, score: 25 },
      { pattern: /\/legal/i, score: 25 },
      { pattern: /\/law/i, score: 25 },
      { pattern: /\/filing/i, score: 25 },
      { pattern: /\/case/i, score: 25 },
      { pattern: /\/docket/i, score: 25 },
      { pattern: /\/opinion/i, score: 20 }, // Court opinions, not editorial opinions
      { pattern: /\/ruling/i, score: 25 },
      { pattern: /\/legislation/i, score: 25 },
      { pattern: /\/statute/i, score: 25 },
      { pattern: /courtlistener\.com/i, score: 25 },
      { pattern: /justia\.com/i, score: 20 },
    ],

    // Primary document indicators
    primaryDocumentIndicators: [
      { pattern: /\/press-release/i, score: 30 },
      { pattern: /\/statement/i, score: 30 },
      { pattern: /\/official/i, score: 30 },
      { pattern: /\/release\/|releases/i, score: 25 },
      { pattern: /\/announcement/i, score: 25 },
      { pattern: /\/testimony/i, score: 30 },
      { pattern: /\/transcript/i, score: 30 },
      { pattern: /\/speech/i, score: 25 },
      { pattern: /\/source/i, score: 20 },
      { pattern: /\/primary/i, score: 20 },
      { pattern: /\/original/i, score: 20 },
      { pattern: /\/document/i, score: 20 },
      { pattern: /\/publication/i, score: 20 },
      { pattern: /\/report/i, score: 20 },
    ],

    // Research and data
    researchAndData: [
      { pattern: /\/research/i, score: 20 },
      { pattern: /\/study/i, score: 20 },
      { pattern: /\/data/i, score: 20 },
      { pattern: /\/statistics/i, score: 20 },
      { pattern: /\/survey/i, score: 20 },
      { pattern: /\/census/i, score: 20 },
      { pattern: /\/analysis/i, score: 15 },
      { pattern: /\/findings/i, score: 15 },
      { pattern: /\/facts/i, score: 15 },
    ],

    // Document file types
    documentTypes: [
      { pattern: /\.pdf($|\?)/i, score: 25 },
      { pattern: /\.(doc|docx)($|\?)/i, score: 20 },
      { pattern: /\.(xls|xlsx|csv)($|\?)/i, score: 20 },
      { pattern: /\.txt($|\?)/i, score: 15 },
    ],

    // === SECONDARY SOURCE INDICATORS === //

    // Major news organizations
    majorNews: [
      { pattern: /reuters\.com/i, score: 15 },
      { pattern: /ap\.org|apnews\.com/i, score: 15 },
      { pattern: /afp\.com/i, score: 15 },
      { pattern: /bloomberg\.com/i, score: 15 },
      { pattern: /ft\.com/i, score: 15 },
      { pattern: /wsj\.com/i, score: 15 },
      { pattern: /washingtonpost\.com/i, score: 10 },
      { pattern: /bbc\.(co\.uk|com)/i, score: 10 },
      { pattern: /nytimes\.com/i, score: 10 },
      { pattern: /guardian\.(co\.uk|com)/i, score: 10 },
      { pattern: /cnn\.com/i, score: 5 },
      { pattern: /usatoday\.com/i, score: 5 },
    ],

    // Archive sites
    archives: [
      { pattern: /archive\.org/i, score: 20 },
      { pattern: /web\.archive\.org/i, score: 20 },
      { pattern: /archives\.gov/i, score: 25 },
      { pattern: /nationalarchives/i, score: 20 },
      { pattern: /library\.(gov|edu)/i, score: 20 },
    ],

    // === NEGATIVE INDICATORS === //

    // Shopping/e-commerce sites (strongly deprioritize)
    shopping: [
      { pattern: /shop\./i, score: -80 },
      { pattern: /store\./i, score: -80 },
      { pattern: /\/shop($|\?|\/)/i, score: -80 },
      { pattern: /\/store($|\?|\/)/i, score: -80 },
      { pattern: /\/product($|\?|\/)/i, score: -80 },
      { pattern: /\/cart($|\?|\/)/i, score: -100 },
      { pattern: /\/checkout($|\?|\/)/i, score: -100 },
      { pattern: /\/merchandise($|\?|\/)/i, score: -80 },
      { pattern: /\/buy($|\?|\/)/i, score: -80 },
      { pattern: /\/purchase($|\?|\/)/i, score: -80 },
      { pattern: /amazon\./i, score: -100 },
      { pattern: /ebay\./i, score: -100 },
      { pattern: /etsy\./i, score: -100 },
      { pattern: /walmart\./i, score: -100 },
      { pattern: /target\./i, score: -100 },
      { pattern: /bestbuy\./i, score: -100 },
      { pattern: /shopify\./i, score: -100 },
      { pattern: /aliexpress\./i, score: -100 },
      { pattern: /alibaba\./i, score: -100 },
    ],

    // Social media (deprioritize)
    socialMedia: [
      { pattern: /twitter\.com|x\.com/i, score: -30 },
      { pattern: /facebook\.com|fb\.com/i, score: -30 },
      { pattern: /instagram\.com/i, score: -40 },
      { pattern: /tiktok\.com/i, score: -50 },
      { pattern: /pinterest\.com/i, score: -40 },
      { pattern: /reddit\.com/i, score: -20 }, // Reddit can sometimes have valuable links
      { pattern: /tumblr\.com/i, score: -40 },
      { pattern: /linkedin\.com/i, score: -30 },
      { pattern: /youtube\.com|youtu\.be/i, score: -20 }, // YouTube can have press conferences
      { pattern: /snapchat\.com/i, score: -50 },
    ],

    // Content farms, opinion sites
    lowValueContent: [
      { pattern: /\.wordpress\.com/i, score: -20 },
      { pattern: /\.blogspot\.com/i, score: -20 },
      { pattern: /medium\.com/i, score: -15 },
      { pattern: /\/blog\//i, score: -15 },
      { pattern: /\/opinion\//i, score: -25 },
      { pattern: /\/commentary\//i, score: -25 },
      { pattern: /\/editorial\//i, score: -25 },
      { pattern: /buzzfeed\.com/i, score: -20 },
    ],

    // Irrelevant utility pages
    utilityPages: [
      { pattern: /\/account/i, score: -80 },
      { pattern: /\/login/i, score: -80 },
      { pattern: /\/signup/i, score: -80 },
      { pattern: /\/register/i, score: -80 },
      { pattern: /\/subscription/i, score: -60 },
      { pattern: /\/cdn-cgi\//i, score: -90 },
      { pattern: /\/wp-content\//i, score: -70 },
      { pattern: /\/wp-includes\//i, score: -70 },
      { pattern: /\/(contact|about|faq|help|support)/i, score: -50 },
      { pattern: /\/privacy-policy/i, score: -60 },
      { pattern: /\/terms-of-service/i, score: -60 },
      { pattern: /\/404/i, score: -100 },
    ],
  };

  // Score each URL based on comprehensive categorization
  const scoredUrls = uniqueUrls.map(url => {
    // Start with neutral base score
    let score = 0;

    try {
      // Parse URL for domain-level checks
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();

      // Apply scoring from all categories
      for (const [category, patterns] of Object.entries(urlCategories)) {
        for (const { pattern, score: patternScore } of patterns) {
          if (pattern.test(url) || pattern.test(domain)) {
            score += patternScore;
          }
        }
      }

      // URL structure heuristics

      // Prefer shorter URLs (often closer to source)
      score -= Math.min(url.length / 200, 5);

      // Prefer URLs with fewer path segments (closer to source)
      const pathSegments = urlObj.pathname.split('/').filter(Boolean).length;
      if (pathSegments <= 1) {
        score += 5; // Bonus for root-level pages
      } else if (pathSegments >= 5) {
        score -= Math.min((pathSegments - 4) * 2, 10); // Penalty for deep paths
      }

      // Penalize excessive query parameters (often tracking/analytics)
      const queryParams = urlObj.search.split('&').length - 1;
      score -= Math.min(queryParams * 2, 10);

      // Slight bonus for secure (https) URLs
      if (url.startsWith('https://')) {
        score += 2;
      }
    } catch (error) {
      // If URL parsing fails, give it a low score
      score -= 20;
    }

    return { url, score };
  });

  // Filter out extremely low-scoring URLs
  const filteredUrls = scoredUrls.filter(item => item.score > -50);

  // If no URLs remain after filtering, return at least the top 3 URLs
  if (filteredUrls.length === 0 && scoredUrls.length > 0) {
    scoredUrls.sort((a, b) => b.score - a.score);
    return scoredUrls.slice(0, Math.min(3, scoredUrls.length)).map(item => item.url);
  }

  // Sort by score (highest first)
  filteredUrls.sort((a, b) => b.score - a.score);

  // Log top results for debugging
  if (filteredUrls.length > 0) {
    console.log(`URL prioritization results (top ${Math.min(3, filteredUrls.length)}):`);
    filteredUrls.slice(0, 3).forEach(({ url, score }) => {
      console.log(`  Score ${score}: ${url}`);
    });
  }

  return filteredUrls.map(item => item.url);
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

    // Log the source type and chain position markers
    console.log(
      `Source for ${url}: ${sourceInfo.source_type} (Original info: ${sourceInfo.contains_original_information}, No refs: ${sourceInfo.chain_distance_markers.has_no_references})`
    );

    // Add to the chain
    chain.sources.push({
      url,
      title: sourceInfo.title,
      source_type: sourceInfo.source_type,
      referenced_urls: sourceInfo.referenced_urls,
      content_summary: sourceInfo.content_summary,
      contains_original_information: sourceInfo.contains_original_information,
      chain_distance_markers: sourceInfo.chain_distance_markers,
      publication_date: sourceInfo.publication_date,
      verification_status: sourceInfo.verification_status,
      key_claims: sourceInfo.key_claims,
    });

    // Check for e-commerce sites which shouldn't be treated as reliable endpoints
    const isPotentialEcommerce =
      url.includes('/shop') ||
      url.includes('/store') ||
      url.includes('/product') ||
      url.includes('/merchandise') ||
      url.includes('/cart') ||
      url.includes('/checkout') ||
      url.includes('shop.') ||
      url.includes('store.') ||
      sourceInfo.content_summary.toLowerCase().includes('shop') ||
      sourceInfo.content_summary.toLowerCase().includes('buy') ||
      sourceInfo.content_summary.toLowerCase().includes('product') ||
      sourceInfo.content_summary.toLowerCase().includes('merchandise');

    // Determine if this is a valid source chain endpoint based on chain_distance_markers
    // A source is considered a valid endpoint if it contains original information AND
    // either has no references or is the earliest in the publication timeline
    const isValidEndpoint =
      sourceInfo.contains_original_information &&
      (sourceInfo.chain_distance_markers.has_no_references ||
        sourceInfo.source_type === 'primary') &&
      !isPotentialEcommerce;

    if (isValidEndpoint) {
      console.log(`Found valid source chain endpoint: ${url}`);
      chain.is_complete = true;
      chain.confidence_score = calculateSourceConfidence(sourceInfo);
      return {
        chain,
        primarySourceFound: true,
        primarySourceUrl: url,
        primarySourceSummary: sourceInfo.content_summary,
      };
    } else if (sourceInfo.contains_original_information && isPotentialEcommerce) {
      // If it was incorrectly classified but is actually e-commerce
      console.log(`E-commerce site detected, continuing search for better sources: ${url}`);
      // Update the entry to correct the classification
      if (chain.sources.length > 0) {
        const lastSource = chain.sources[chain.sources.length - 1];
        if (lastSource) {
          lastSource.contains_original_information = false;
          // E-commerce sites generally don't cite external sources
          lastSource.chain_distance_markers.has_no_references = true;
          lastSource.chain_distance_markers.cites_primary_sources = false;
        }
      }
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
 * Calculate confidence in a specific source based on chain position and information quality
 */
function calculateSourceConfidence(sourceInfo: z.infer<typeof sourceExtractionSchema>): number {
  let score = 0.4; // Base score

  // Original information is the most important factor
  if (sourceInfo.contains_original_information) {
    score += 0.3;
  }

  // Chain position markers provide key indicators of source position
  if (sourceInfo.chain_distance_markers.has_no_references) {
    // End of chain sources (potential primary) get a bonus if they contain original info
    score += sourceInfo.contains_original_information ? 0.2 : 0.05;
  }

  if (sourceInfo.chain_distance_markers.cites_primary_sources) {
    // Sources that cite primary sources are more reliable
    score += 0.15;
  }

  if (sourceInfo.chain_distance_markers.is_directly_cited) {
    // Sources that are cited by others have some credibility
    score += 0.1;
  }

  // Source format still provides some contextual clues
  // but with reduced importance compared to chain position
  switch (sourceInfo.source_type) {
    case 'primary':
      score += 0.15; // Reduced bonus compared to original approach
      break;
    case 'official':
      score += 0.1;
      break;
    case 'news':
      score += 0.05;
      break;
    case 'secondary':
      score += 0.03;
      break;
    case 'blog':
    case 'social_media':
      // No adjustment for blog/social media - evaluate on content, not format
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
 * Extracts metadata about a source using Datura API
 * This provides rich metadata about the content to aid in source classification
 */
async function extractSourceMetadataWithDatura(url: string): Promise<any | null> {
  if (!config.daturaApiKey) {
    return null;
  }

  try {
    console.log(`Extracting source metadata using Datura API: ${url}`);

    // Use Datura's AI search to get comprehensive metadata
    const response = await axios.post(
      'https://apis.datura.ai/desearch/ai/search',
      {
        prompt: `Analyze this content: ${url}. Identify source type, publisher, publication date, and key topics.`,
        tools: ['web'],
        model: 'NOVA',
        streaming: false,
        result_type: 'LINKS_WITH_FINAL_SUMMARY',
      },
      {
        headers: {
          Authorization: `Bearer ${config.daturaApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (response.data?.completion) {
      console.log('Successfully retrieved source metadata from Datura');
      return response.data;
    }

    return null;
  } catch (error: unknown) {
    const err = error as { message: string };
    console.error('Error extracting source metadata with Datura:', err.message);
    return null;
  }
}

/**
 * Extracts source information using an LLM
 * Enhanced with Datura API integration for better source classification
 */
async function extractSourceInformation(
  url: string,
  content: string
): Promise<z.infer<typeof sourceExtractionSchema>> {
  // First try to get rich metadata from Datura API if available
  let daturaMetadata = null;
  let additionalContext = '';

  if (config.daturaApiKey) {
    daturaMetadata = await extractSourceMetadataWithDatura(url);

    if (daturaMetadata) {
      // Format metadata as additional context for the LLM
      if (daturaMetadata.completion?.summary) {
        additionalContext += `\n\nDATURA CONTENT ANALYSIS:\n${daturaMetadata.completion.summary}`;
      }

      // Add information about linked sources if available
      if (daturaMetadata.completion_links && daturaMetadata.completion_links.length > 0) {
        additionalContext += `\n\nRELATED LINKS:\n${daturaMetadata.completion_links.join('\n')}`;
      }
    }
  }

  const sourceAnalysisPrompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are an expert source analyst tasked with evaluating web content and identifying its role in information chains.
      For the given URL and content, determine:
      
      PRIMARY SOURCES - Contains direct, firsthand accounts or original information:
      - Government documents, official statements, press releases (.gov domains)
      - Original research papers, scientific studies, or datasets
      - Court documents, legal filings, official regulations
      - Financial reports, SEC filings, shareholder communications
      - Congressional/parliamentary records, official testimonies
      - Original survey data, census information, or statistics
      - Direct records of events by participants/witnesses
      - Corporate press releases or official announcements
      - Patents, trademarks, or other official intellectual property documents
      - Original speeches, interviews, or direct quotations from key figures
      
      SECONDARY SOURCES - Analyzes, interprets, or summarizes primary sources:
      - News articles reporting on events/announcements (unless containing extensive primary material)
      - Analysis of research findings or data
      - Reviews of primary works
      - Historical accounts not written by participants
      - Textbooks or educational resources
      - Encyclopedias or reference works
      
      TERTIARY SOURCES - Compiles or summarizes secondary sources:
      - Bibliographies
      - Directories
      - Fact books
      - Guides to literature
      - Meta-analyses of multiple studies
      
      IMPORTANT RULES:
      - E-commerce/shopping sites are NEVER primary sources and should be classified as 'official' type but NOT as primary sources
      - If the content is primarily about selling products, merchandise, or services, it is NOT a primary source
      - Only mark something as a primary source if it contains direct information, statements, data, or official documents
      - Government sites (.gov), official statements, press releases, and original research papers are examples of primary sources
      - Check for indicators in both the URL and content - terms like 'shop', 'store', 'product', 'cart', 'checkout', 'buy' indicate an e-commerce site
      - News articles should generally be classified as 'news' type and not as primary sources unless they contain direct quotes or data
      - Carefully extract the publication date if present in any format (even embedded in the content)
      - Identify all URLs that might lead to additional sources, especially more authoritative ones
      
      Your goal is to help trace information back to its original source.`,
    ],
    [
      'human',
      `URL: {url}
      
      CONTENT:
      {content}
      
      ADDITIONAL CONTEXT:
      {additional_context}
      
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
      additional_context: additionalContext, // Add metadata from Datura if available
    });

    // Call the LLM
    const result = await structuredLlm.invoke(formattedPrompt);

    // Post-process the result to improve source type classification accuracy
    // Detect if the source appears to be e-commerce despite classification
    const isPotentialEcommerce =
      url.includes('/shop') ||
      url.includes('/store') ||
      url.includes('/product') ||
      url.includes('/merchandise') ||
      url.includes('/cart') ||
      url.includes('/checkout') ||
      url.includes('shop.') ||
      url.includes('store.') ||
      (result.content_summary && result.content_summary.toLowerCase().includes('shop')) ||
      (result.content_summary && result.content_summary.toLowerCase().includes('buy')) ||
      (result.content_summary && result.content_summary.toLowerCase().includes('product')) ||
      (result.content_summary && result.content_summary.toLowerCase().includes('merchandise'));

    // If it's an e-commerce site but was classified as containing original information, fix it
    if (result.contains_original_information && isPotentialEcommerce) {
      console.log(
        `Reclassifying e-commerce site incorrectly marked as containing original information: ${url}`
      );
      result.contains_original_information = false;
      result.source_type = 'official';
      // E-commerce sites rarely cite sources properly
      result.chain_distance_markers.cites_primary_sources = false;
    }

    return result;
  } catch (error) {
    console.error('Error extracting source information:', error);

    // Return basic fallback information
    return {
      title: getBasicTitle(content) || url,
      source_type: 'unknown',
      referenced_urls: extractUrlsFromHtml(content),
      content_summary: content.substring(0, 200) + '...',
      contains_original_information: false,
      chain_distance_markers: {
        has_no_references: extractUrlsFromHtml(content).length === 0,
        is_directly_cited: false,
        cites_primary_sources: false,
      },
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
 * Calculate confidence score for a reference chain based on the recursive relationships
 * between sources and their chain positions rather than rigid source types
 */
function calculateChainConfidence(chain: ReferenceChain): number {
  if (chain.sources.length === 0) return 0;

  let score = 0;

  // Chain analysis metrics
  // 1. Chain completeness - has at least one endpoint (source with no references)
  const endpointSources = chain.sources.filter(s => s.chain_distance_markers.has_no_references);
  if (endpointSources.length > 0) {
    score += 0.2;

    // Check if these endpoints contain original information
    const endpointsWithOriginalInfo = endpointSources.filter(s => s.contains_original_information);
    if (endpointsWithOriginalInfo.length > 0) {
      score += 0.3; // Strong indication of reaching original sources
    }
  }

  // 2. Recursive chain quality - sources that cite primary sources
  const sourcesCitingPrimary = chain.sources.filter(
    s => s.chain_distance_markers.cites_primary_sources
  );
  if (sourcesCitingPrimary.length > 0) {
    score += 0.2 * Math.min(sourcesCitingPrimary.length / chain.sources.length, 1);
  }

  // 3. Interconnectedness - sources that are directly cited by others in the chain
  const directlyCitedSources = chain.sources.filter(
    s => s.chain_distance_markers.is_directly_cited
  );
  score += 0.1 * Math.min(directlyCitedSources.length / chain.sources.length, 1);

  // 4. Length-based metrics (with lower weight than before)
  // More sources = better evidence of recursive tracing, up to a point
  score += Math.min(chain.sources.length / 4, 0.2);

  // 5. Verification status still matters for credibility
  const verifiedCount = chain.sources.filter(s => s.verification_status === 'verified').length;
  score += (verifiedCount / chain.sources.length) * 0.2;

  // 6. Time-based analysis - if we have publication dates, check for chronological consistency
  const sourcesWithDates = chain.sources.filter(s => s.publication_date);
  if (sourcesWithDates.length >= 2 && sourcesWithDates.length === chain.sources.length) {
    // Sort by publication date
    try {
      const dateOrdered = [...sourcesWithDates].sort((a, b) => {
        return new Date(a.publication_date!).getTime() - new Date(b.publication_date!).getTime();
      });

      // If the chain shows a clear progression in time (older sources cited by newer ones),
      // this is a good sign of proper reference tracing
      let chronologicallySound = true;
      for (let i = 0; i < dateOrdered.length - 1; i++) {
        const currentSource = dateOrdered[i];
        const nextSource = dateOrdered[i + 1];
        // Make sure both sources exist before checking references
        if (currentSource && nextSource && currentSource.referenced_urls.includes(nextSource.url)) {
          // This is not chronologically sound - newer source referenced by older one
          chronologicallySound = false;
          break;
        }
      }

      if (chronologicallySound) {
        score += 0.1;
      }
    } catch (e) {
      // Ignore date parsing errors
    }
  }

  return Math.min(Math.max(score, 0), 0.99);
}
