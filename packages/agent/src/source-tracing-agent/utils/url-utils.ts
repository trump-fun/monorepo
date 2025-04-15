import { load } from 'cheerio';

/**
 * Normalize URL to handle edge cases
 * @param url URL to normalize
 * @returns Normalized URL
 */
export function normalizeUrl(url: string): string {
  try {
    // Handle Twitter t.co links that often point to other domains
    if (url.includes('t.co/') || url.includes('twitter.com/')) {
      // For t.co links, we'll resolve them when we follow them
      return url;
    }

    // Try to parse the URL
    const parsedUrl = new URL(url);

    // Strip unnecessary query parameters which might cause duplication
    // (like UTM tracking parameters, analytics tags, etc.)
    const searchParams = new URLSearchParams(parsedUrl.search);
    const paramsToRemove = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'msclkid',
      'ref',
      'source',
    ];

    paramsToRemove.forEach(param => searchParams.delete(param));

    // Rebuild the URL without the tracking parameters
    parsedUrl.search = searchParams.toString();

    // Return the normalized URL
    return parsedUrl.toString();
  } catch (error) {
    // If URL parsing fails, just return the original
    return url;
  }
}

/**
 * Extract URLs from HTML content
 * @param html HTML content to extract URLs from
 * @returns Array of extracted URLs
 */
export function extractUrlsFromHtml(html: string): string[] {
  const urls: string[] = [];

  try {
    const $ = load(html);

    // Extract URLs from anchor tags
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
 * Extract deep links that may not be in standard <a> tags
 * @param content Content to extract deep links from
 * @returns Array of extracted deep links
 */
export function extractDeepLinksFromContent(content: string): string[] {
  const urls: string[] = [];

  try {
    // Standard URL pattern with capture groups
    const urlRegex = /(https?:\/\/[^\s"'<>()]+)/g;
    const matches = content.match(urlRegex) || [];

    // Add all matches to our result array
    matches.forEach(url => {
      // Clean up/normalize the URL
      const cleanUrl = url.trim().replace(/[.,;:!?)]+$/, '');
      if (!urls.includes(cleanUrl)) {
        urls.push(cleanUrl);
      }
    });

    // Check for special patterns like "available at domain.com" or "see: domain.com"
    const domainRegex =
      /(?:available at|see:|visit:|check out|on|at)\s+([a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z0-9-.]+)/gi;
    const domainMatches = content.matchAll(domainRegex);

    for (const match of domainMatches) {
      const domain = match[1];
      if (domain && !domain.includes(' ')) {
        const url = `https://${domain}`;
        if (!urls.includes(url)) {
          urls.push(url);
        }
      }
    }
  } catch (error) {
    console.error('Error extracting deep links:', error);
  }

  return urls;
}

/**
 * Extract domain from URL
 * @param url URL to extract domain from
 * @returns Domain or empty string if invalid URL
 */
export function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch {
    return '';
  }
}

/**
 * Determine if URLs are from the same domain
 * @param url1 First URL
 * @param url2 Second URL
 * @returns True if URLs are from the same domain
 */
export function isSameDomain(url1: string, url2: string): boolean {
  const domain1 = extractDomain(url1);
  const domain2 = extractDomain(url2);
  return domain1 !== '' && domain1 === domain2;
}
