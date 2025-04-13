import { v4 as uuidv4 } from 'uuid';
import { extractDeepLinksFromContent } from '../utils/url-utils';
import { fetchContentFromUrl } from '../utils/content-extraction';
import { extractSourceInformation } from './source-extraction';
import { prioritizeUrls } from './url-prioritization';
import { primarySourceSummaryPrompt } from '../prompts/source-analysis';
import { config } from '../../config';
import type { ReferenceChain } from '../../types/research-item';
import { isSameDomain } from '../utils/url-utils';

// Maximum depth to follow the reference chain
const MAX_CHAIN_DEPTH = 4;

/**
 * Recursively follows a reference chain from a starting URL
 * @param url Starting URL
 * @param chain Current reference chain
 * @param depth Current depth in the chain
 * @returns Updated chain and primary source information
 */
export async function followReferenceChain(
  url: string,
  chain: ReferenceChain,
  depth: number
): Promise<{
  chain: ReferenceChain;
  primarySourceFound: boolean;
  primarySourceUrl?: string;
  primarySourceSummary?: string;
}> {
  // Prevent infinite recursion
  if (depth >= MAX_CHAIN_DEPTH) {
    console.log(`Maximum chain depth reached (${MAX_CHAIN_DEPTH}), stopping recursion`);
    return {
      chain,
      primarySourceFound: false,
    };
  }

  // Check if URL is already in the chain
  if (chain.sources.some(source => source.url === url)) {
    console.log(`URL ${url} is already in the chain, skipping to prevent cycles`);
    return {
      chain,
      primarySourceFound: false,
    };
  }

  try {
    console.log(`Analyzing source at depth ${depth}: ${url}`);

    // Fetch content from the URL
    const content = await fetchContentFromUrl(url);
    if (!content || content.includes('Failed to fetch content')) {
      console.log(`Failed to fetch content from ${url}`);
      return {
        chain,
        primarySourceFound: false,
      };
    }

    // Extract source information
    const sourceInfo = await extractSourceInformation(url, content);
    
    // Add URL to the source info
    const sourceWithUrl = {
      ...sourceInfo,
      url,
    };

    // Add to the chain
    chain.sources.push(sourceWithUrl);

    // Check if this is a primary or high-quality source
    const isPrimarySource = 
      sourceInfo.source_type === 'primary' && 
      sourceInfo.contains_original_information;
    
    // Consider quality news sources as semi-primary sources
    const isQualityNewsSource = 
      url.includes('reuters.com') ||
      url.includes('apnews.com') ||
      url.includes('bloomberg.com') ||
      url.includes('washingtonpost.com') ||
      url.includes('nytimes.com') ||
      url.includes('npr.org') ||
      url.includes('bbc.co.uk') ||
      url.includes('bbc.com') ||
      url.includes('theguardian.com');

    // Handle both primary sources and high-quality news sources
    if (isPrimarySource || isQualityNewsSource) {
      // Generate a summary of the source
      let primarySourceSummary = '';
      
      try {
        // Use the primary source summary prompt with the LLM
        const formattedPrompt = await primarySourceSummaryPrompt.formatMessages({
          url,
          content: content.substring(0, 8000), // Limit content length
        });
        
        // Get summarization
        const summaryResult = await config.cheap_large_llm.invoke(formattedPrompt);
        primarySourceSummary = (summaryResult as any).content || '';
      } catch (summaryError) {
        console.error('Error generating source summary:', summaryError);
        primarySourceSummary = sourceInfo.content_summary;
      }

      // Mark chain as complete since we found a primary source or quality news source
      chain.is_complete = true;
      
      // Add special markers for quality sources to help with confidence scoring
      if (isQualityNewsSource && !isPrimarySource) {
        sourceInfo.source_type = 'news';
        sourceInfo.contains_original_information = true;
        sourceInfo.verification_status = 'partially_verified';
        sourceInfo.chain_distance_markers.cites_primary_sources = true;
        
        // Update the source in the chain
        const sourceIndex = chain.sources.findIndex(s => s.url === url);
        if (sourceIndex >= 0) {
          chain.sources[sourceIndex] = {
            ...chain.sources[sourceIndex],
            ...sourceInfo
          };
        }
        
        console.log(`Found high-quality news source: ${url}`);
      } else {
        console.log(`Found valid source chain endpoint: ${url}`);
      }
      
      return {
        chain,
        primarySourceFound: true,
        primarySourceUrl: url,
        primarySourceSummary,
      };
    }

    // Extract referenced URLs
    let referencedUrls = sourceInfo.referenced_urls;
    
    // If we didn't get enough URLs from the source info, try extracting deep links
    if (referencedUrls.length < 3) {
      const deepLinks = extractDeepLinksFromContent(content);
      referencedUrls = [...new Set([...referencedUrls, ...deepLinks])];
    }

    // Filter out URLs that are already in the chain
    const newUrls = referencedUrls.filter(
      refUrl => !chain.sources.some(source => source.url === refUrl)
    );

    // Check if we have any new URLs to follow
    if (newUrls.length === 0) {
      console.log('No new URLs to follow, ending chain');
      
      // If this source has no references, it might be an endpoint
      if (sourceInfo.chain_distance_markers.has_no_references) {
        // Even if it's not explicitly marked as primary, it could be 
        // a terminal node in our chain if it has no references
        console.log(`Source has no references, treating as potential endpoint: ${url}`);
        return {
          chain,
          primarySourceFound: sourceInfo.contains_original_information,
          primarySourceUrl: sourceInfo.contains_original_information ? url : undefined,
          primarySourceSummary: sourceInfo.content_summary,
        };
      }
      
      return {
        chain,
        primarySourceFound: false,
      };
    }

    // Prioritize URLs for further exploration
    const prioritizedUrls = prioritizeUrls(newUrls, 5);
    console.log(`Found ${prioritizedUrls.length} potentially useful referenced URLs`);

    // Recursive exploration of referenced URLs
    let primarySourceFound = false;
    let primarySourceUrl = '';
    let primarySourceSummary = '';

    // Process each URL in order of priority
    for (const refUrl of prioritizedUrls) {
      // Skip URLs from the same domain to prevent cycles
      if (isSameDomain(url, refUrl)) {
        console.log(`URL from same domain ${url} is already in the chain, skipping to prevent cycles`);
        continue;
      }

      // Follow the reference
      const result = await followReferenceChain(refUrl, chain, depth + 1);
      
      // If primary source found, capture it and stop processing
      if (result.primarySourceFound) {
        primarySourceFound = true;
        primarySourceUrl = result.primarySourceUrl || '';
        primarySourceSummary = result.primarySourceSummary || '';
        break;
      }
    }

    return {
      chain,
      primarySourceFound,
      primarySourceUrl,
      primarySourceSummary,
    };
  } catch (error) {
    console.error(`Error following reference chain for ${url}:`, error);
    return {
      chain,
      primarySourceFound: false,
    };
  }
}

/**
 * Calculate confidence score for a reference chain
 * @param chain Reference chain to calculate confidence for
 * @returns Confidence score between 0 and 1
 */
export function calculateChainConfidence(chain: ReferenceChain): number {
  if (chain.sources.length === 0) return 0;

  let score = 0;

  // Chain analysis metrics
  // 1. Chain completeness - has at least one endpoint (source with no references)
  const endpointSources = chain.sources.filter(s => s.chain_distance_markers.has_no_references);
  if (endpointSources.length > 0) {
    score += 0.25; // Increased weight

    // Check if these endpoints contain original information
    const endpointsWithOriginalInfo = endpointSources.filter(s => s.contains_original_information);
    if (endpointsWithOriginalInfo.length > 0) {
      score += 0.35; // Strong indication of reaching original sources
    }
  }

  // 2. Recursive chain quality - sources that cite primary sources
  const sourcesCitingPrimary = chain.sources.filter(
    s => s.chain_distance_markers.cites_primary_sources
  );
  if (sourcesCitingPrimary.length > 0) {
    score += 0.25 * Math.min(sourcesCitingPrimary.length / chain.sources.length, 1);
  }

  // 3. Interconnectedness - sources that are directly cited by others in the chain
  const directlyCitedSources = chain.sources.filter(
    s => s.chain_distance_markers.is_directly_cited
  );
  score += 0.15 * Math.min(directlyCitedSources.length / chain.sources.length, 1);

  // 4. Source type quality
  const qualitySourcesCount = chain.sources.filter(s => 
    s.source_type === 'primary' || 
    s.source_type === 'news' ||
    s.url.includes('reuters.com') ||
    s.url.includes('apnews.com') ||
    s.url.includes('bloomberg.com') ||
    s.url.includes('washingtonpost.com') ||
    s.url.includes('nytimes.com')
  ).length;
  score += 0.2 * Math.min(qualitySourcesCount / chain.sources.length, 1);

  // 5. Verification status for credibility
  const verifiedCount = chain.sources.filter(s => 
    s.verification_status === 'verified' || 
    s.verification_status === 'partially_verified'
  ).length;
  score += (verifiedCount / chain.sources.length) * 0.25;
  
  // Bonus for chains with reliable sources
  if (chain.is_complete && chain.sources.some(s => s.contains_original_information)) {
    score += 0.15;
  }

  // Apply a minimum confidence score for chains with quality sources
  if (chain.sources.length > 0) {
    // Check for quality sources
    const hasQualitySource = chain.sources.some(s => 
      s.source_type === 'primary' || 
      s.source_type === 'news' ||
      s.verification_status === 'verified' ||
      s.verification_status === 'partially_verified' ||
      s.contains_original_information
    );
    
    if (hasQualitySource) {
      score = Math.max(score, 0.40); // Minimum score of 0.40 for chains with quality sources
    } else {
      score = Math.max(score, 0.20); // Minimum score of 0.20 for chains with any sources
    }
  }
  
  return Math.min(Math.max(score, 0), 0.99);
}
