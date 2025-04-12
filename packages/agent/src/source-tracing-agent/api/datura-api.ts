import axios from 'axios';
import { config } from '../../config';
import FirecrawlApp from '@mendable/firecrawl-js';

/**
 * Extracts content from a URL using Datura's advanced processing capabilities
 * @param url URL to extract content from
 * @returns Extracted content or null if failed
 */
export async function extractContentWithDatura(url: string): Promise<string | null> {
  if (!config.daturaApiKey) {
    return null;
  }

  try {
    console.log(`Attempting to extract content with Datura API: ${url}`);

    // Using the links/web endpoint with optimized parameters
    try {
      const webResponse = await axios.post(
        'https://apis.datura.ai/desearch/ai/search/links/web',
        {
          model: 'NOVA',
          // Improved prompt based on documentation
          prompt: `Extract the complete, accurate content from this URL: ${url}. Include all text content, headings, and important information while maintaining the original structure and context.`,
          tools: ['web'],
          include_content: true,
        },
        {
          headers: {
            Authorization: `${config.daturaApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      // Check for content in the response structure
      if (webResponse.data?.search_results?.organic_results?.[0]?.content) {
        const content = webResponse.data.search_results.organic_results[0].content;
        console.log(`Successfully extracted ${content.length} chars with Datura web search API`);
        return content;
      } else if (webResponse.data?.search_results?.organic_results?.[0]?.snippet) {
        // Fallback to snippet if full content isn't available
        const snippet = webResponse.data.search_results.organic_results[0].snippet;
        console.log(`Extracted ${snippet.length} chars (snippet only) with Datura web search API`);
        return snippet;
      }
    } catch (webError: any) {
      console.log(`Datura web search API error: ${webError.message}`);
    }

    // Try with main AI search as a last resort
    try {
      console.log(`Attempting to extract content with Datura AI search API: ${url}`);
      const aiResponse = await axios.post(
        'https://apis.datura.ai/desearch/ai/search',
        {
          prompt: `Extract the complete content and information from: ${url}`,
          tools: ['web'],
          model: 'NOVA',
          result_type: 'LINKS_WITH_FINAL_SUMMARY',
          date_filter: 'PAST_YEAR',
          streaming: false,
        },
        {
          headers: {
            Authorization: `${config.daturaApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (aiResponse.data?.completion?.summary) {
        const summary = aiResponse.data.completion.summary;
        console.log(`Retrieved ${summary.length} chars summary with Datura AI search`);
        return summary;
      }
    } catch (aiError: any) {
      console.log(`Datura AI search error: ${aiError.message}`);
    }

    return null;
  } catch (error: any) {
    console.error('Error extracting content with Datura:', error.message);
    return null;
  }
}

/**
 * Extracts metadata about a source using Datura API
 * @param url URL to extract metadata from
 * @returns Metadata object or null if failed
 */
export async function extractSourceMetadataWithDatura(url: string): Promise<any | null> {
  if (!config.daturaApiKey) {
    return null;
  }

  try {
    console.log(`Extracting source metadata using Datura API: ${url}`);

    // Use Datura's AI search to get comprehensive metadata with optimized parameters
    const response = await axios.post(
      'https://apis.datura.ai/desearch/ai/search',
      {
        // Improved prompt based on documentation
        prompt: `Extract metadata from this URL: ${url}. Provide: 1) Title, 2) Author/Publisher, 3) Publication date, 4) Main topic, 5) Content type, 6) Credibility assessment`,
        tools: ['web'],
        model: 'NOVA',
        date_filter: 'PAST_YEAR', // Ensure we get results regardless of when published
        streaming: false,
        result_type: 'LINKS_WITH_FINAL_SUMMARY',
      },
      {
        headers: {
          Authorization: `${config.daturaApiKey}`,
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
  } catch (error: any) {
    console.error('Error extracting source metadata with Datura:', error.message);
    return null;
  }
}

/**
 * Searches for relevant sources using Datura API
 * @param topic Topic to search for
 * @param existingUrls Existing URLs to exclude from results
 * @returns Array of unique relevant URLs
 */
export async function searchForSourcesWithDatura(
  topic: string,
  existingUrls: string[] = []
): Promise<string[]> {
  if (!config.daturaApiKey) {
    return [];
  }

  console.log(`Searching for additional sources related to: ${topic}`);
  const allUrls: string[] = [...existingUrls];
  let uniqueUrls: string[] = [];

  try {
    // Use the webLinksSearch endpoint for the most relevant web search results
    console.log(`Performing web search for: ${topic}`);
    const webSearchResponse = await axios.post(
      'https://apis.datura.ai/desearch/ai/search/links/web',
      {
        model: 'NOVA',
        // Optimized prompt based on documentation
        prompt: `Find authoritative, high-quality sources about: ${topic}. Focus on credible publications, official documentation, scholarly articles, and expert analyses. Prioritize sources with comprehensive information that provide accurate, up-to-date details.`,
        tools: ['web'],
      },
      {
        headers: {
          Authorization: `${config.daturaApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    // Process web search results
    if (webSearchResponse.data?.search_results?.organic_results) {
      const searchResults = webSearchResponse.data.search_results.organic_results;
      console.log(`Found ${searchResults.length} results from web search`);

      for (const result of searchResults) {
        if (result.link && !allUrls.includes(result.link)) {
          allUrls.push(result.link);
          uniqueUrls.push(result.link);
        }
      }
    }

    // Only search Hacker News for tech and science topics
    const techScienceKeywords = ['technology', 'tech', 'software', 'programming', 'code', 'computer', 'data', 
      'ai', 'artificial intelligence', 'machine learning', 'blockchain', 'crypto', 'science', 'research', 'physics', 
      'chemistry', 'biology', 'engineering', 'algorithm', 'hardware', 'network', 'security', 'cyber'];
      
    const isTechOrScience = techScienceKeywords.some(keyword => 
      topic.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (isTechOrScience) {
      try {
        console.log(`Topic is tech/science related. Searching Hacker News for: ${topic}`);
        const hnResponse = await axios.post(
          'https://apis.datura.ai/desearch/ai/search',
          {
            model: 'NOVA',
            prompt: `Find technical discussions and expert insights about ${topic} on Hacker News. Focus on valuable information from credible sources and substantial technical discussions.`,
            tools: ['hackernews'],
            result_type: 'LINKS_WITH_FINAL_SUMMARY',
            date_filter: 'PAST_YEAR',
          },
          {
            headers: {
              Authorization: `${config.daturaApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 20000,
          }
        );

        // Process results from the Hacker News search
        if (hnResponse.data?.search_results?.organic_results) {
          const hnResults = hnResponse.data.search_results.organic_results;
          console.log(`Found ${hnResults.length} results from Hacker News via Datura API`);

          for (const result of hnResults) {
            if (result.link && !allUrls.includes(result.link)) {
              allUrls.push(result.link);
              uniqueUrls.push(result.link);
            }
          }
        }

        // If we didn't get enough results, fallback to Firecrawl
        if (uniqueUrls.length < 3 && config.firecrawlApiKey) {
          console.log(`Using Firecrawl as backup for Hacker News search: ${topic}`);
          const firecrawl = new FirecrawlApp({ apiKey: config.firecrawlApiKey });
          const hnUrl = `https://hn.algolia.com/?q=${encodeURIComponent(topic)}`;
          const scrapeResponse = await firecrawl.scrapeUrl(hnUrl, { formats: ['html', 'markdown'] });

          if (scrapeResponse.success) {
            const response = scrapeResponse as any;
            let content = '';

            if (response.formats?.html) {
              content = response.formats.html;
            } else if (response.formats?.markdown) {
              content = response.formats.markdown;
            } else if (response.content && typeof response.content === 'string') {
              content = response.content;
            }

            if (content) {
              const generalUrlRegex = /https?:\/\/[^\s"'<>()]+/g;
              const allMatches = content.match(generalUrlRegex) || [];

              // Filter out non-relevant URLs
              const filteredUrls = allMatches.filter(
                url => !url.includes('algolia.com') && !url.includes('googleapis.com')
              );

              console.log(
                `Found ${filteredUrls.length} additional results from Hacker News via Firecrawl`
              );

              for (const url of filteredUrls) {
                if (url && !allUrls.includes(url)) {
                  allUrls.push(url);
                  uniqueUrls.push(url);
                }
              }
            }
          }
        }
      } catch (hnError: any) {
        console.log(`Hacker News search failed: ${hnError.message}, continuing with other sources`);
      }
    } else {
      console.log(`Topic is not tech/science related. Skipping Hacker News search for: ${topic}`);
    }

    // ArXiv search removed as requested

    // Comprehensive AI search to find additional high-quality sources
    try {
      console.log(`Performing comprehensive AI search for: ${topic}`);
      const aiResponse = await axios.post(
        'https://apis.datura.ai/desearch/ai/search',
        {
          // Focused prompt that avoids social media noise
          prompt: `Find recent, authoritative and trustworthy news sources about: ${topic}. Focus on primary sources, news articles, and official statements from the past 3 months. Exclude academic papers older than 2024, PDFs, social media opinions, and low-quality sources.`,
          // Include only the most reliable sources
          tools: ['web', 'wikipedia'],
          model: 'NOVA',
          result_type: 'LINKS_WITH_FINAL_SUMMARY',
          date_filter: 'PAST_MONTH', // Stricter date filter to avoid old content
          streaming: false,
        },
        {
          headers: {
            Authorization: `${config.daturaApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      console.log('Datura AI search response received');

      // Extract key sources from the AI completion
      if (aiResponse.data?.completion?.key_sources) {
        const keySources = aiResponse.data.completion.key_sources;
        console.log(`Found ${keySources.length} key sources from AI completion`);

        for (const source of keySources) {
          if (source.url && !allUrls.includes(source.url)) {
            allUrls.push(source.url);
            uniqueUrls.push(source.url);
          }
        }
      }

      // Also check direct links in completion_links
      if (aiResponse.data?.completion_links) {
        const aiLinks = aiResponse.data.completion_links;
        console.log(`Found ${aiLinks.length} links from AI search completion`);

        for (const url of aiLinks) {
          if (url && !allUrls.includes(url)) {
            allUrls.push(url);
            uniqueUrls.push(url);
          }
        }
      }
    } catch (aiError) {
      console.log('AI search failed, continuing with existing results');
    }

    console.log(`Found ${uniqueUrls.length} total unique sources after search`);
    return uniqueUrls;
  } catch (error: any) {
    console.error('Error searching for sources with Datura:', error.message);
    return uniqueUrls;
  }
}
