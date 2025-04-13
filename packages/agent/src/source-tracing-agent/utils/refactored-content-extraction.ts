/**
 * Refactored Content Extraction Utilities
 * 
 * Enhanced content extraction for the source tracing agent.
 * Uses the shared content fetcher with caching, retries, and multiple fallback methods.
 */

import { fetchContentFromUrl } from '../../common/fetch/content-fetcher';
import { createAgentErrorHandler, ErrorSeverity, ErrorType } from '../../common/utils/error-handler';
import { load } from 'cheerio';
import { extractLinks } from './url-utils';

// Create specialized error handler for source tracing agent
const errorHandler = createAgentErrorHandler('source-tracing');

/**
 * Enhanced content extraction that handles various content types
 * and provides structured output with metadata and links
 */
export async function extractContentWithMetadata(url: string): Promise<{
  content: string;
  title: string;
  links: string[];
  metadata: Record<string, string>;
  error?: string;
}> {
  try {
    console.log(`Extracting content and metadata from: ${url}`);
    
    // Use the shared content fetcher with fallbacks
    const rawContent = await fetchContentFromUrl(url, {
      maxRetries: 2
    });
    
    // If the content fetcher returns an error message
    if (rawContent.startsWith('Failed to fetch content')) {
      return {
        content: '',
        title: '',
        links: [],
        metadata: {},
        error: rawContent
      };
    }
    
    // Extract metadata using Cheerio if HTML content is available
    let title = '';
    let metadata: Record<string, string> = {};
    let links: string[] = [];
    
    try {
      // Try to parse as HTML to extract structured data
      const $ = load(rawContent);
      
      // Extract title
      title = $('title').text().trim() || $('h1').first().text().trim() || '';
      
      // Extract metadata from meta tags
      $('meta').each((_, element) => {
        const name = $(element).attr('name') || $(element).attr('property') || '';
        const content = $(element).attr('content') || '';
        
        if (name && content) {
          // Clean up name by removing prefixes like 'og:' and 'twitter:'
          const cleanName = name.replace(/^(og:|twitter:|article:|dc:)/, '');
          metadata[cleanName] = content;
        }
      });
      
      // Extract links using the specialized function
      links = extractLinks($);
    } catch (parseError) {
      console.warn('Content is not parseable as HTML, treating as plain text');
      // Use simple regex to extract URLs from the text content
      links = (rawContent.match(/https?:\/\/[^\s"'<>()]+/g) || [])
        .filter(link => link.length > 10);
    }
    
    // Clean content by removing excessive whitespace
    const cleanedContent = rawContent
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 50000); // Limit content length
    
    return {
      content: cleanedContent,
      title,
      links,
      metadata
    };
  } catch (error: any) {
    // Handle errors with our standardized error handler
    errorHandler.handleError(error, {
      type: ErrorType.RESOURCE_NOT_FOUND,
      severity: ErrorSeverity.WARNING,
      context: { url, function: 'extractContentWithMetadata' }
    });
    
    return {
      content: '',
      title: '',
      links: [],
      metadata: {},
      error: `Error extracting content: ${error.message}`
    };
  }
}

/**
 * Extract the main article content from a web page
 * This attempts to identify and extract just the relevant article text
 */
export async function extractArticleContent(url: string): Promise<{
  articleText: string;
  title: string;
  author?: string;
  publishDate?: string;
  links: string[];
  error?: string;
}> {
  try {
    // Get the full content and metadata
    const { content, title, links, metadata, error } = await extractContentWithMetadata(url);
    
    if (error) {
      return {
        articleText: '',
        title: '',
        links: [],
        error
      };
    }
    
    // Get publication information from metadata if available
    const author = metadata.author || metadata.creator || '';
    const publishDate = metadata.publishedTime || metadata.published || metadata.date || '';
    
    // Try to extract just the article content using Cheerio
    let articleText = content;
    
    try {
      const $ = load(content);
      
      // Remove elements that are typically not part of the main content
      $('script, style, nav, footer, header, aside, [role=complementary], .sidebar, .comments, .ad, .advertisement, .banner').remove();
      
      // Look for common article containers
      const articleSelectors = [
        'article',
        '[role=main]',
        '.post-content',
        '.article-content',
        '.entry-content',
        '.content',
        '.post',
        '.story',
        'main'
      ];
      
      let articleElement = null;
      
      // Find the first matching element with substantial content
      for (const selector of articleSelectors) {
        const element = $(selector);
        if (element.length && element.text().trim().length > 100) {
          articleElement = element;
          break;
        }
      }
      
      // If we found a good article container, use its text
      if (articleElement) {
        articleText = articleElement.text().trim();
      } else {
        // Fallback: take the body text but try to be smart about it
        // Look for paragraphs with substantial content
        const paragraphs = $('p').filter((_, el) => $(el).text().trim().length > 50);
        if (paragraphs.length > 0) {
          articleText = paragraphs.map((_, el) => $(el).text().trim()).get().join('\n\n');
        }
      }
    } catch (parseError) {
      console.warn('Error parsing HTML for article extraction, using raw content');
      // Keep the original content
    }
    
    // Clean the article text
    articleText = articleText
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 30000); // Limit article length
    
    return {
      articleText,
      title,
      author,
      publishDate,
      links
    };
  } catch (error: any) {
    errorHandler.handleError(error, {
      type: ErrorType.GENERAL,
      severity: ErrorSeverity.ERROR,
      context: { url, function: 'extractArticleContent' }
    });
    
    return {
      articleText: '',
      title: '',
      links: [],
      error: `Error extracting article: ${error.message}`
    };
  }
}
