import { z } from 'zod';
import { config } from '../../config';
import { extractSourceMetadataWithDatura } from '../api/datura-api';
import { sourceAnalysisPrompt } from '../prompts/source-analysis';
import { sourceExtractionSchema } from '../types/schema';

/**
 * Extracts source information using an LLM with enhanced API integrations
 * @param url URL of the source
 * @param content Content of the source
 * @returns Structured source information
 */
export async function extractSourceInformation(
  url: string,
  content: string
): Promise<z.infer<typeof sourceExtractionSchema>> {
  // Get additional metadata from Datura API if available
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
    let result = await structuredLlm.invoke(formattedPrompt);
    
    // Ensure all required fields have values and aren't undefined
    result = {
      ...result,
      title: result.title || url.split('/').pop() || url,
      content_summary: result.content_summary || `Content from ${url}`,
      contains_original_information: result.contains_original_information === undefined ? false : result.contains_original_information,
      chain_distance_markers: {
        has_no_references: result.chain_distance_markers?.has_no_references === undefined ? true : result.chain_distance_markers.has_no_references,
        is_directly_cited: result.chain_distance_markers?.is_directly_cited === undefined ? false : result.chain_distance_markers.is_directly_cited,
        cites_primary_sources: result.chain_distance_markers?.cites_primary_sources === undefined ? false : result.chain_distance_markers.cites_primary_sources,
      },
      verification_status: result.verification_status || 'unverified',
      key_claims: result.key_claims || [],
      referenced_urls: result.referenced_urls || [],
    };

    // Use Datura metadata to enhance the classification if available
    if (daturaMetadata?.completion) {
      try {
        // Extract source type from Datura if available
        const summary = daturaMetadata.completion.summary;
        
        if (summary) {
          // Look for indicators of primary source
          const isPrimary = 
            summary.includes('primary source') || 
            summary.includes('official document') ||
            summary.includes('original research') ||
            summary.includes('SEC filing');
            
          if (isPrimary && result.source_type !== 'primary') {
            console.log('Enhancing source type from Datura analysis: primary');
            result.source_type = 'primary';
            result.contains_original_information = true;
          }
          
          // Look for publication date in Datura data
          const dateMatch = summary.match(/published (?:on|in) ([A-Za-z]+ \d{1,2},? \d{4}|\d{1,2} [A-Za-z]+ \d{4}|\d{4}-\d{2}-\d{2})/i);
          if (dateMatch && dateMatch[1] && !result.publication_date) {
            result.publication_date = dateMatch[1];
          }
        }
        
        // Add any links from Datura that weren't found by the LLM
        if (daturaMetadata.completion_links && daturaMetadata.completion_links.length > 0) {
          const existingUrls = new Set(result.referenced_urls);
          for (const url of daturaMetadata.completion_links) {
            if (!existingUrls.has(url)) {
              result.referenced_urls.push(url);
              existingUrls.add(url);
            }
          }
        }
      } catch (enhancementError) {
        console.error('Error enhancing with Datura data:', enhancementError);
      }
    }

    return result;
  } catch (error: any) {
    console.error('Error extracting source information:', error.message);
    
    // Return a fallback object if LLM processing fails
    return {
      title: url,
      source_type: 'unknown',
      referenced_urls: [],
      content_summary: `Failed to analyze content from ${url}`,
      contains_original_information: false,
      chain_distance_markers: {
        has_no_references: true,
        is_directly_cited: false,
        cites_primary_sources: false,
      },
      verification_status: 'unverified',
      key_claims: [],
    };
  }
}

/**
 * Calculate confidence in a specific source
 * @param sourceInfo Source information 
 * @returns Confidence score between 0 and 1
 */
export function calculateSourceConfidence(
  sourceInfo: z.infer<typeof sourceExtractionSchema>
): number {
  let score = 0;

  // Base score by source type
  switch (sourceInfo.source_type) {
    case 'primary':
      score += 0.5;
      break;
    case 'secondary':
      score += 0.3;
      break;
    case 'official':
      score += 0.4;
      break;
    case 'news':
      score += 0.25;
      break;
    case 'social_media':
      score += 0.1;
      break;
    case 'blog':
      score += 0.15;
      break;
    default:
      score += 0.05;
  }

  // Add points for containing original information
  if (sourceInfo.contains_original_information) {
    score += 0.2;
  }

  // Add points for chain position indicators
  if (sourceInfo.chain_distance_markers.has_no_references) {
    score += 0.15; // Potential primary source at end of chain
  }

  if (sourceInfo.chain_distance_markers.cites_primary_sources) {
    score += 0.1; // Directly cites primary sources
  }

  // Add points for verification status
  switch (sourceInfo.verification_status) {
    case 'verified':
      score += 0.15;
      break;
    case 'partially_verified':
      score += 0.1;
      break;
    default:
      break;
  }

  // Cap the score at 0.99
  return Math.min(Math.max(score, 0), 0.99);
}
