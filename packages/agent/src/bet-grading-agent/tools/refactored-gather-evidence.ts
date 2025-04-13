/**
 * Refactored Evidence Gathering Module
 * 
 * Enhanced implementation of the evidence gathering functionality using
 * shared utilities for better performance, reliability, and maintainability.
 */

import { z } from 'zod';
import { config } from '../../config';
import { queryStructuredLLM } from '../../common/llm/llm-manager';
import { createAgentErrorHandler, ErrorSeverity, ErrorType } from '../../common/utils/error-handler';
import { fetchContentFromUrl } from '../../common/fetch/content-fetcher';
import type { GraderState, PendingPool } from '../betting-grader-graph';

// Create specialized error handler for bet grading agent
const errorHandler = createAgentErrorHandler('bet-grading');

// Initialize Tavily API (would be better handled through a shared API client)
let tavilyApiKey: string;
try {
  tavilyApiKey = config.tavilyApiKey;
} catch (error) {
  errorHandler.handleError(error instanceof Error ? error : String(error), {
    type: ErrorType.GENERAL, // Using GENERAL instead of CONFIGURATION as it's not defined
    severity: ErrorSeverity.WARNING,
    context: { config: 'tavilyApiKey', function: 'gatherEvidence' }
  });
}

export interface Evidence {
  url: string;
  summary: string;
  search_query: string;
  credibility_score?: number;
  relevance_score?: number;
  source_type?: string;
  key_facts?: string[];
}

// Define evidence schema for LLM structured outputs
const EVIDENCE_SCHEMA = {
  type: 'object',
  properties: {
    url: { type: 'string' },
    summary: { type: 'string' },
    search_query: { type: 'string' },
    credibility_score: { 
      type: 'number', 
      minimum: 0, 
      maximum: 10,
      description: 'Source credibility score (0-10)'
    },
    relevance_score: { 
      type: 'number', 
      minimum: 0,
      maximum: 10,
      description: 'Relevance to betting question (0-10)'
    },
    source_type: {
      type: 'string',
      description: 'Type of source (news, official, blog, social media, etc.)'
    },
    key_facts: {
      type: 'array',
      items: { type: 'string' },
      description: 'Key facts extracted from the source'
    }
  },
  required: ['url', 'summary', 'search_query', 'credibility_score', 'relevance_score', 'source_type']
};

/**
 * Gathers evidence from search queries for all non-failed pools concurrently
 * Enhanced with improved error handling, structured outputs, and content fetching
 * 
 * @param state The current grader state with pending pools
 * @returns Updated grader state with evidence for each pool
 */
export async function gatherEvidence(state: GraderState): Promise<Partial<GraderState>> {
  console.log('Gathering evidence from search queries for all pools concurrently');

  if (Object.keys(state.pendingPools).length === 0) {
    console.error('No pending pools to gather evidence for');
    return { pendingPools: {} };
  }

  const updatedPendingPools: Record<string, PendingPool> = {};

  // Define which pools to process in parallel (improves efficiency)
  const poolEntries = Object.entries(state.pendingPools);
  const poolBatches = [];
  const batchSize = 3; // Process 3 pools at a time to avoid rate limiting

  for (let i = 0; i < poolEntries.length; i += batchSize) {
    poolBatches.push(poolEntries.slice(i, i + batchSize));
  }

  // Process pool batches sequentially but pools within each batch concurrently
  for (const poolBatch of poolBatches) {
    try {
      const batchResults = await Promise.allSettled(
        poolBatch.map(async ([poolId, pendingPool]) => {
          try {
            // Skip pools that have failed or don't have search queries
            if (pendingPool.failed || pendingPool.evidenceSearchQueries.length === 0) {
              console.log(`Skipping pool ${poolId} - failed or no search queries`);
              return [
                poolId,
                {
                  ...pendingPool,
                  failed: pendingPool.failed || pendingPool.evidenceSearchQueries.length === 0,
                },
              ];
            }

            const evidenceList: Evidence[] = [];
            const processedUrls = new Set<string>(); // Track already processed URLs to avoid duplicates

            // Process each search query
            for (const query of pendingPool.evidenceSearchQueries) {
              try {
                console.log(`Processing search query for pool ${poolId}: "${query}"`);
                
                // Get search results using Tavily or fallback search method
                const searchResults = await performSearch(query);
                
                if (!searchResults || searchResults.length === 0) {
                  console.log(`No results found for query: ${query}`);
                  continue;
                }

                // Process each search result
                for (const result of searchResults) {
                  try {
                    // Skip if we've already processed this URL
                    if (processedUrls.has(result.url)) {
                      continue;
                    }

                    // Get content from URL using our shared content fetcher
                    const content = await fetchContentFromUrl(result.url, {
                      maxRetries: 1,
                      cacheKey: `bet-grading-${result.url}`
                    });

                    // If fetching failed, skip this result
                    if (!content || content.startsWith('Failed to fetch content')) {
                      console.log(`Failed to fetch content from ${result.url}`);
                      continue;
                    }

                    // Analyze content with LLM
                    // Extract question and options from the pool data
                    const question = pendingPool.pool?.title || 'Unknown question';
                    const options = pendingPool.pool?.options?.map((opt: any) => opt.text) || ['Yes', 'No'];
                    
                    const evidence = await analyzeEvidenceContent(
                      content,
                      result.url,
                      query,
                      question,
                      options
                    );

                    console.log(
                      `Search result from ${evidence.url}: ${evidence.summary.substring(0, 100)}...`
                    );

                    // Only add evidence if it's relevant enough
                    if (evidence.relevance_score === undefined || evidence.relevance_score >= 5) {
                      evidenceList.push(evidence);
                      processedUrls.add(result.url);
                    } else {
                      console.log(
                        `Skipping low-relevance evidence (score: ${evidence.relevance_score})`
                      );
                    }
                  } catch (resultError) {
                    // Handle error for individual search result
                    errorHandler.handleError(resultError, {
                      type: ErrorType.GENERAL,
                      severity: ErrorSeverity.WARNING,
                      context: { url: result.url, query, poolId, function: 'gatherEvidence - process result' }
                    });
                    continue; // Continue to next result
                  }
                }
              } catch (queryError) {
                // Handle error for individual query
                errorHandler.handleError(queryError, {
                  type: ErrorType.API_REQUEST,
                  severity: ErrorSeverity.WARNING,
                  context: { query, poolId, function: 'gatherEvidence - process query' }
                });
                continue; // Continue to next query
              }
            }

            // Sort evidence by relevance if available
            const sortedEvidence = evidenceList.sort((a, b) => {
              if (a.relevance_score !== undefined && b.relevance_score !== undefined) {
                return b.relevance_score - a.relevance_score;
              }
              return 0;
            });

            console.log(`Gathered ${sortedEvidence.length} pieces of evidence for pool ${poolId}`);

            // Return updated pool with evidence
            return [
              poolId,
              {
                ...pendingPool,
                evidence: sortedEvidence,
              },
            ];
          } catch (poolError) {
            // Handle error for the entire pool
            errorHandler.handleError(poolError instanceof Error ? poolError : String(poolError), {
              type: ErrorType.GENERAL,
              severity: ErrorSeverity.ERROR,
              context: { poolId, function: 'gatherEvidence - process pool' }
            });
            
            // Return the pool with failed status
            return [
              poolId,
              {
                ...pendingPool,
                failed: true,
                failureReason: `Error gathering evidence: ${poolError instanceof Error ? poolError.message : String(poolError)}`,
              },
            ];
          }
        })
      );

      // Process batch results, handling both fulfilled and rejected promises
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          const [poolId, updatedPool] = result.value;
          updatedPendingPools[poolId as string] = updatedPool as PendingPool;
        } else {
          console.error(`Error in batch processing:`, result.reason);
          // We can't update the specific pool since we don't know which one failed
        }
      });

      // Add a slight delay between batches to avoid rate limits
      if (poolBatches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (batchError) {
      // Handle batch-level errors
      errorHandler.handleError(batchError instanceof Error ? batchError : String(batchError), {
        type: ErrorType.GENERAL,
        severity: ErrorSeverity.ERROR,
        context: { function: 'gatherEvidence - process batch' }
      });
      
      // Continue to next batch
    }
  }

  return { pendingPools: updatedPendingPools };
}

/**
 * Perform a search using the Tavily API or fallback search method
 */
async function performSearch(query: string): Promise<Array<{ url: string, title?: string, snippet?: string }>> {
  try {
    // If we don't have a Tavily API key, use a fallback method
    if (!tavilyApiKey) {
      console.log('No Tavily API key available, using fallback search method');
      return fallbackSearch(query);
    }
    
    // Implement Tavily search - this would ideally be moved to a shared API client
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tavilyApiKey}`
      },
      body: JSON.stringify({
        query,
        search_depth: 'basic',
        include_domains: [],
        exclude_domains: [],
        max_results: 5
      })
    });
    
    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    // Transform Tavily results to our format
    return (data?.results || []).map((result: any) => ({
      url: result.url,
      title: result.title,
      snippet: result.content
    }));
  } catch (error) {
    errorHandler.handleError(error instanceof Error ? error : String(error), {
      type: ErrorType.API_REQUEST,
      severity: ErrorSeverity.WARNING,
      context: { query, function: 'performSearch' }
    });
    
    // Fallback to basic search
    return fallbackSearch(query);
  }
}

/**
 * Fallback search method when Tavily is not available
 * This is a placeholder and would need to be replaced with an actual implementation
 */
async function fallbackSearch(query: string): Promise<Array<{ url: string, title?: string, snippet?: string }>> {
  console.log(`Using fallback search for query: ${query}`);
  
  // This is a placeholder - in a real implementation, you might:
  // 1. Use a different search API
  // 2. Use a web scraping approach
  // 3. Have a cache of common search results
  
  // For now, return an empty array to indicate no results
  return [];
}

/**
 * Analyze evidence content using structured LLM output
 */
async function analyzeEvidenceContent(
  content: string,
  url: string,
  searchQuery: string,
  question: string,
  options: string[]
): Promise<Evidence> {
  try {
    // Truncate content if it's too long
    const truncatedContent = content.length > 3000 
      ? content.substring(0, 3000) + '...[content truncated]' 
      : content;
    
    // Create system prompt for evidence analysis
    const systemPrompt = `You are a search assistant that finds and summarizes relevant evidence.
For the given search query, extract high-quality information from reliable sources.

BETTING CONTEXT:
What users are betting on: ${question}

Options: ${options.join(', ')}

Guidelines:
- Focus on information that directly addresses whether the betting question can be answered
- Evaluate the source credibility (major news outlets, official sources score higher)
- Summarize key points in 2-3 concise, informative sentences
- Extract specific facts, data, or quotes that are relevant to the betting outcome
- Identify the type of source (news article, official statement, analysis, social media, etc.)
- Prioritize recent information from reliable sources

Each evidence piece should help determine the most likely outcome of the bet.`;

    const userPrompt = `Search Query: "${searchQuery}"
URL: ${url}

Content to analyze:
${truncatedContent}

Based on this content, provide a structured analysis of its relevance and credibility for the betting question.`;

    // Use our shared LLM utility for structured output
    const result = await queryStructuredLLM<Evidence>(
      systemPrompt,
      userPrompt,
      EVIDENCE_SCHEMA,
      {
        complexity: 'medium',
        temperature: 0.3,
        // Note: cacheKey removed as it's not in the interface
        taskName: 'Analyze betting evidence',
        defaultValue: {
          url,
          summary: 'Failed to analyze content.',
          search_query: searchQuery,
          credibility_score: 3,
          relevance_score: 3,
          source_type: 'unknown'
        }
      }
    );
    
    return result;
  } catch (error) {
    errorHandler.handleError(error instanceof Error ? error : String(error), {
      type: ErrorType.LLM_REQUEST,
      severity: ErrorSeverity.WARNING,
      context: { url, searchQuery, function: 'analyzeEvidenceContent' }
    });
    
    // Return a default evidence object on error
    return {
      url,
      summary: 'Error analyzing content.',
      search_query: searchQuery,
      credibility_score: 2,
      relevance_score: 2,
      source_type: 'unknown'
    };
  }
}
