/**
 * Refactored Source Tracing Module
 * 
 * Enhanced implementation of the source tracing functionality using
 * shared utilities for better performance, reliability, and maintainability.
 */

import { v4 as uuidv4 } from 'uuid';
import { queryStructuredLLM } from '../../common/llm/llm-manager';
import { createAgentErrorHandler, ErrorSeverity, ErrorType } from '../../common/utils/error-handler';
import { extractArticleContent } from '../utils/refactored-content-extraction';
import { extractUrlsFromHtml } from '../utils/url-utils';
import { followReferenceChain, calculateChainConfidence } from './reference-chain';
import type { SingleResearchItemState } from '../../pool-generation-agent/single-betting-pool-graph';
import type { ReferenceChain, SourceReference } from '../../types/research-item';

// Create specialized error handler for source tracing agent
const errorHandler = createAgentErrorHandler('source-tracing');

// Schema for source analysis
const SOURCE_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    source_type: {
      type: 'string',
      enum: [
        'primary',
        'secondary',
        'tertiary',
        'social_media',
        'blog',
        'news',
        'official',
        'unknown'
      ]
    },
    content_summary: { type: 'string' },
    contains_original_information: { type: 'boolean' },
    key_claims: { type: 'array', items: { type: 'string' } },
    verification_status: { 
      type: 'string', 
      enum: ['verified', 'partially_verified', 'unverified']
    }
  },
  required: ['source_type', 'content_summary', 'contains_original_information']
};

/**
 * Traces information back to its original source through reference chains
 * Enhanced with improved performance, error handling, and content extraction
 * 
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

  try {
    // Collect starting URLs from various sources
    const startingUrls = collectStartingUrls(researchItem);

    // Extract topic keywords for searching additional sources
    const topicKeywords = extractTopicKeywords(researchItem);

    // Enhance with search if we have topic keywords
    let enhancedUrls: string[] = [...startingUrls];
    if (topicKeywords) {
      console.log('Enhancing source discovery with search APIs');
      try {
        const searchResults = await searchForSources(topicKeywords);
        enhancedUrls = [...new Set([...enhancedUrls, ...searchResults])];
      } catch (error) {
        errorHandler.handleError(error instanceof Error ? error : String(error), {
          type: ErrorType.API_REQUEST,
          severity: ErrorSeverity.WARNING,
          context: { keywords: topicKeywords, function: 'traceSourceChain' }
        });
        // Continue with the URLs we already have
      }
    }

    // Filter URLs to exclude irrelevant document types and prioritize news sources
    const filteredUrls = filterAndPrioritizeUrls(enhancedUrls);
    console.log(`After filtering, ${filteredUrls.length} URLs remain for processing`);

    // Initialize reference chains
    let referenceChains: ReferenceChain[] = researchItem.reference_chains || [];
    let primarySourceFound = researchItem.primary_source_found || false;
    let primarySourceUrl = researchItem.primary_source_url || '';
    let primarySourceSummary = researchItem.primary_source_summary || '';

    // If no chains yet, create one for each starting URL
    if (referenceChains.length === 0) {
      referenceChains = filteredUrls.slice(0, 5).map(url => ({
        chain_id: uuidv4(),
        sources: [],
        confidence_score: 0,
        is_complete: false
      }));
    }

    // Process URLs concurrently for better performance with timeout handling
    console.log(`Processing ${filteredUrls.length} URLs concurrently...`);
    
    // Map URLs to chains for processing
    const processingTasks = [];
    
    for (let i = 0; i < Math.min(filteredUrls.length, 5); i++) {
      const url = filteredUrls[i];
      const chainId = referenceChains[i]?.chain_id || uuidv4();
      
      // Create a new chain if needed
      if (!referenceChains.some(chain => chain.chain_id === chainId)) {
        referenceChains.push({
          chain_id: chainId,
          sources: [],
          confidence_score: 0,
          is_complete: false
        });
      }
      
      // Setup the processing task with timeout
      processingTasks.push(processUrlWithTimeout(url, chainId, 45000));
    }
    
    // Execute all tasks concurrently
    const processingResults = await Promise.allSettled(processingTasks);
    
    // Process successful results
    for (const result of processingResults) {
      if (result.status === 'fulfilled') {
        const { updatedChain, chainId, primarySourceFound: found, primarySourceUrl: url, primarySourceSummary: summary } = result.value;
        
        // Update primary source info if found
        if (found && !primarySourceFound) {
          primarySourceFound = true;
          primarySourceUrl = url || '';
          primarySourceSummary = summary || '';
        }
        
        // Update the chain in our array
        if (updatedChain && chainId) {
          const chainIndex = referenceChains.findIndex(c => c.chain_id === chainId);
          if (chainIndex >= 0) {
            // Update the chain with confidence score
            referenceChains[chainIndex] = {
              ...updatedChain,
              confidence_score: calculateChainConfidence(updatedChain),
            };
          }
        }
      } else {
        // Log rejected promise errors
        errorHandler.handleError(result.reason instanceof Error ? result.reason : String(result.reason), {
          type: ErrorType.GENERAL,
          severity: ErrorSeverity.WARNING,
          context: { function: 'traceSourceChain - Promise processing' }
        });
      }
    }
    
    // Update all chain confidence scores and mark chains as complete if needed
    referenceChains = finalizeReferenceChains(referenceChains);
    
    // Return the updated research item with source tracing results
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
  } catch (error: any) {
    // Handle top-level errors with our standardized error handler
    errorHandler.handleError(error instanceof Error ? error : String(error), {
      type: ErrorType.GENERAL,
      severity: ErrorSeverity.ERROR,
      context: { 
        researchItem: researchItem.truth_social_post?.id,
        function: 'traceSourceChain' 
      }
    });
    
    // Return partially updated item, marking tracing as complete
    return {
      research: {
        ...researchItem,
        reference_chains: researchItem.reference_chains || [],
        source_tracing_complete: true, // Mark as complete even if error occurred
        primary_source_found: false,
      },
    };
  }
}

/**
 * Process a single URL for source tracing with timeout
 * Enhanced with shared content extraction and type safety
 */
async function processUrlWithTimeout(
  url: string,
  chainId: string,
  timeoutMs: number = 30000
): Promise<{
  updatedChain?: ReferenceChain;
  chainId?: string;
  primarySourceFound: boolean;
  primarySourceUrl?: string;
  primarySourceSummary?: string;
}> {
  return new Promise(resolve => {
    // Setup timeout to abort long-running operations
    const timeoutId = setTimeout(() => {
      console.log(`Processing of URL ${url} timed out after ${timeoutMs}ms`);
      resolve({ primarySourceFound: false });
    }, timeoutMs);
    
    // Process the URL
    (async () => {
      try {
        console.log(`Processing URL: ${url}`);
        
        // Extract article content using our enhanced utility
        const { articleText, title, author, publishDate, links, error } = await extractArticleContent(url);
        
        if (error || !articleText) {
          console.log(`Error or empty content for ${url}: ${error || 'No content'}`);
          clearTimeout(timeoutId);
          return resolve({ primarySourceFound: false });
        }
        
        // If content is too short, it's probably not useful
        if (articleText.length < 100) {
          console.log(`Content too short for ${url}, skipping`);
          clearTimeout(timeoutId);
          return resolve({ primarySourceFound: false });
        }
        
        // Analyze the source for information quality using LLM
        const analysis = await analyzeSource(articleText, title, url);
        
        // Find existing chain with this ID
        let chain: ReferenceChain = {
          chain_id: chainId,
          sources: [],
          confidence_score: 0,
          is_complete: false
        };
        
        // Create source reference from analysis
        const sourceRef: SourceReference = {
          url,
          title: title || url,
          source_type: analysis.source_type,
          publication_date: publishDate,
          referenced_urls: links,
          content_summary: analysis.content_summary,
          contains_original_information: analysis.contains_original_information,
          chain_distance_markers: {
            has_no_references: links.length === 0,
            is_directly_cited: false, // Will be updated when following references
            cites_primary_sources: false // Will be updated when following references
          },
          verification_status: analysis.verification_status,
          key_claims: analysis.key_claims || []
        };
        
        // Add the source to the chain
        chain.sources.push(sourceRef);
        
        // Check if we've found a primary source
        const isPrimarySource = 
          sourceRef.source_type === 'primary' || 
          sourceRef.contains_original_information;
        
        let primarySourceFound = isPrimarySource;
        let primarySourceUrl = isPrimarySource ? url : undefined;
        let primarySourceSummary = isPrimarySource ? sourceRef.content_summary : undefined;
        
        // Try to follow references if we have links and this isn't already a primary source
        if (links.length > 0 && !isPrimarySource) {
          try {
            const { updatedChain, primarySourceFound: foundInRefs, primarySourceUrl: refUrl, primarySourceSummary: refSummary } = 
              await followReferenceChain(chain, links.slice(0, 3));
            
            chain = updatedChain;
            
            if (foundInRefs) {
              primarySourceFound = true;
              primarySourceUrl = refUrl;
              primarySourceSummary = refSummary;
            }
          } catch (error) {
            console.warn(`Error following reference chain from ${url}:`, error);
            // Continue with what we have
          }
        }
        
        // Calculate confidence score for the chain
        chain.confidence_score = calculateChainConfidence(chain);
        
        // Mark chain as complete if we've found a primary source
        if (primarySourceFound) {
          chain.is_complete = true;
        }
        
        clearTimeout(timeoutId);
        return resolve({
          updatedChain: chain,
          chainId,
          primarySourceFound,
          primarySourceUrl,
          primarySourceSummary
        });
      } catch (error) {
        console.error(`Error processing URL ${url}:`, error);
        clearTimeout(timeoutId);
        return resolve({ primarySourceFound: false });
      }
    })();
  });
}

/**
 * Analyze source content to determine its type and quality
 */
async function analyzeSource(
  content: string,
  title: string,
  url: string
): Promise<{
  source_type: SourceReference['source_type'];
  content_summary: string;
  contains_original_information: boolean;
  verification_status: SourceReference['verification_status'];
  key_claims?: string[];
}> {
  try {
    // Create a prompt for the LLM to analyze the source
    const systemPrompt = `You are an expert at analyzing information sources and determining their credibility and type. 
Examine the provided content and determine:
1. The type of source (primary, secondary, tertiary, social media, blog, news, official, unknown)
2. Whether it contains original information or primarily cites/references others
3. A concise summary of the main content (1-2 sentences)
4. Key claims made by the source (up to 3)
5. Verification status (verified, partially_verified, unverified) based on presence of citations, references, quotes, etc.

Primary sources contain firsthand, original information. Secondary sources interpret or comment on primary sources.`;

    // Truncate content if too long
    const truncatedContent = content.length > 3000 
      ? content.substring(0, 3000) + '...[content truncated]' 
      : content;
    
    const userPrompt = `Title: ${title || 'No title'}\nURL: ${url}\n\nContent:\n${truncatedContent}`;
    
    // Use the structured LLM utility
    const result = await queryStructuredLLM(
      systemPrompt,
      userPrompt,
      SOURCE_ANALYSIS_SCHEMA,
      {
        complexity: 'medium',
        temperature: 0.3,
        taskName: 'Analyze source content',
        defaultValue: {
          source_type: 'unknown',
          content_summary: 'Could not analyze content',
          contains_original_information: false,
          verification_status: 'unverified',
          key_claims: []
        }
      }
    );
    
    return result;
  } catch (error) {
    errorHandler.handleError(error instanceof Error ? error : String(error), {
      type: ErrorType.LLM_REQUEST,
      severity: ErrorSeverity.WARNING,
      context: { url, function: 'analyzeSource' }
    });
    
    // Return default values on error
    return {
      source_type: 'unknown' as const,
      content_summary: 'Error analyzing source content',
      contains_original_information: false,
      verification_status: 'unverified' as const,
      key_claims: []
    };
  }
}

/**
 * Filter and prioritize URLs for processing
 */
function filterAndPrioritizeUrls(urls: string[]): string[] {
  // Filter URLs to exclude PDFs and other document files
  const filteredUrls = urls.filter(url => {
    const lowerUrl = url.toLowerCase();
    
    // Skip document files
    if (
      lowerUrl.endsWith('.pdf') ||
      lowerUrl.endsWith('.doc') ||
      lowerUrl.endsWith('.docx') ||
      lowerUrl.includes('/publications/') ||
      lowerUrl.includes('/papers/') ||
      lowerUrl.includes('/bitstream/')
    ) {
      return false;
    }
    
    return true;
  });
  
  // Sort URLs to prioritize news sources first
  return filteredUrls.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    // Function to score URL priority
    const getScore = (url: string): number => {
      // Prioritize major news outlets
      if (
        url.includes('reuters.com') ||
        url.includes('apnews.com') ||
        url.includes('nytimes.com') ||
        url.includes('washingtonpost.com') ||
        url.includes('theguardian.com') ||
        url.includes('bbc.com') ||
        url.includes('cnn.com') ||
        url.includes('nbcnews.com') ||
        url.includes('wsj.com')
      ) {
        return 100;
      }
      
      // Next priority: news and article paths
      if (
        url.includes('/news/') ||
        url.includes('/article/') ||
        url.includes('/business/') ||
        url.includes('/politics/')
      ) {
        return 75;
      }
      
      // Lower priority: general websites
      return 50;
    };
    
    return getScore(bLower) - getScore(aLower);
  });
}

/**
 * Finalize reference chains by updating confidence scores and completion status
 */
function finalizeReferenceChains(chains: ReferenceChain[]): ReferenceChain[] {
  return chains.map(chain => {
    // If chain isn't explicitly marked complete, consider it complete if it has quality sources
    if (!chain.is_complete && chain.sources.length > 0) {
      const hasQualitySource = chain.sources.some(source => 
        source.source_type === 'primary' || 
        source.source_type === 'news' || 
        source.contains_original_information ||
        source.verification_status === 'verified'
      );
      
      if (hasQualitySource) {
        chain.is_complete = true;
      }
    }
    
    // Calculate confidence score
    chain.confidence_score = calculateChainConfidence(chain);
    
    // Ensure minimum confidence for chains with sources
    if (chain.sources.length > 0 && chain.confidence_score < 0.3) {
      chain.confidence_score = 0.3;
    }
    
    return chain;
  });
}

/**
 * Collect starting URLs from the research item
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
 * Search for additional sources using search APIs
 */
async function searchForSources(keywords: string): Promise<string[]> {
  try {
    // Use structured LLM to generate effective search queries
    const searchQueriesPrompt = `Generate 2-3 effective search queries to find primary sources for the following information:
${keywords}

Focus on queries that will find authoritative sources, original reports, and first-hand accounts.
Return the queries as a JSON array.`;

    const queries = await queryStructuredLLM<{ queries: string[] }>(
      'You are an expert at crafting search queries to find primary information sources.',
      searchQueriesPrompt,
      {
        type: 'object',
        properties: {
          queries: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      {
        complexity: 'low',
        temperature: 0.5,
        taskName: 'Generate search queries',
        defaultValue: { queries: [] }
      }
    );

    // If we couldn't generate queries, use the keywords directly
    if (!queries.queries || queries.queries.length === 0) {
      return [];
    }

    // TODO: Use Tavily search or other search API here
    // For now, we're not implementing the actual search to avoid dependencies
    console.log('Generated search queries:', queries.queries);
    
    // Return empty array for now - this would be replaced with actual search API call
    return [];
  } catch (error) {
    errorHandler.handleError(error, {
      type: ErrorType.LLM_REQUEST,
      severity: ErrorSeverity.WARNING,
      context: { keywords, function: 'searchForSources' }
    });
    return [];
  }
}

/**
 * Extract topic keywords from the research item for source searching
 */
function extractTopicKeywords(researchItem: any): string {
  if (!researchItem.truth_social_post?.content) {
    return '';
  }

  // Extract main keywords from the post content
  const content = researchItem.truth_social_post.content.replace(/<[^>]*>/g, ' '); // Remove HTML tags
  return content.substring(0, 200); // Use first 200 chars as topic keywords
}
