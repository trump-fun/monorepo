import { extractDomain } from '../utils/url-utils';

/**
 * Score domains based on their likelihood of containing primary sources
 * @param domain Domain to score
 * @returns Score value (higher is better)
 */
function scoreDomain(domain: string): number {
  if (!domain) return 0;
  
  const domainLower = domain.toLowerCase();
  
  // Government domains are likely primary sources
  if (domainLower.endsWith('.gov') || domainLower.includes('.gov.')) {
    return 5.0;
  }
  
  // Educational institutions often host primary research
  if (domainLower.endsWith('.edu') || domainLower.includes('.edu.')) {
    return 4.5;
  }
  
  // International organizations
  if (domainLower.endsWith('.int') || domainLower.includes('.int.')) {
    return 4.0;
  }
  
  // Non-profit organizations may have primary information
  if (domainLower.endsWith('.org') || domainLower.includes('.org.')) {
    return 3.5;
  }
  
  // Official company websites
  if (domainLower.endsWith('.com') || domainLower.includes('.com.')) {
    // Official research repositories
    if (
      domainLower.includes('research') ||
      domainLower.includes('science') ||
      domainLower.includes('data') ||
      domainLower.includes('academic')
    ) {
      return 3.7;
    }
    
    // Financial/business information
    if (
      domainLower.includes('investor') ||
      domainLower.includes('finance') ||
      domainLower.includes('sec.gov') ||
      domainLower.includes('filing')
    ) {
      return 4.0;
    }
    
    // News organizations - primary news sources ranked higher
    if (
      domainLower.includes('reuters.com') ||
      domainLower.includes('apnews.com') ||
      domainLower.includes('bloomberg.com') ||
      domainLower.includes('nytimes.com') ||
      domainLower.includes('washingtonpost.com') ||
      domainLower.includes('bbc.com') ||
      domainLower.includes('bbc.co.uk') ||
      domainLower.includes('ft.com') ||
      domainLower.includes('wsj.com') ||
      domainLower.includes('economist.com') ||
      domainLower.includes('ap.org')
    ) {
      return 4.0; // Higher than generic news
    }
    
    // Secondary news sites
    if (
      domainLower.includes('news') ||
      domainLower.includes('cnn.com') ||
      domainLower.includes('foxnews.com') ||
      domainLower.includes('nbcnews.com') ||
      domainLower.includes('cbsnews.com') ||
      domainLower.includes('abcnews.go.com') ||
      domainLower.includes('theguardian.com') ||
      domainLower.includes('aljazeera.com')
    ) {
      return 3.2;
    }
    
    // Social media (rarely primary sources)
    if (
      domainLower.includes('twitter') ||
      domainLower.includes('facebook') ||
      domainLower.includes('instagram') ||
      domainLower.includes('tiktok') ||
      domainLower.includes('reddit') ||
      domainLower.includes('linkedin') ||
      domainLower.includes('threads') ||
      domainLower.includes('pinterest')
    ) {
      return 0.8; // Lower score for social media
    }
    
    // Technical specification sites - should be avoided
    if (
      domainLower === 'schema.org' ||
      domainLower === 'w3.org' ||
      domainLower.includes('xmlns') ||
      domainLower.includes('jquery') ||
      domainLower.includes('googleapis.com') ||
      domainLower.includes('gstatic.com')
    ) {
      return 0.1; // Strongly downrank technical spec sites
    }
    
    // Default commercial site
    return 2.0;
  }
  
  // Default score for other domains
  return 1.0;
}

/**
 * Score URL path for indicators of primary source content
 * @param path URL path to score
 * @returns Score modifier
 */
function scorePath(path: string): number {
  if (!path) return 0;
  
  const pathLower = path.toLowerCase();
  let score = 0;
  
  // Document indicators
  if (
    pathLower.includes('document') ||
    pathLower.includes('pdf') ||
    pathLower.includes('report') ||
    pathLower.includes('filing') ||
    pathLower.includes('publication')
  ) {
    score += 0.5;
  }
  
  // Official content indicators
  if (
    pathLower.includes('official') ||
    pathLower.includes('press-release') ||
    pathLower.includes('statement') ||
    pathLower.includes('announcement')
  ) {
    score += 0.7;
  }
  
  // Research indicators
  if (
    pathLower.includes('research') ||
    pathLower.includes('study') ||
    pathLower.includes('data') ||
    pathLower.includes('statistics')
  ) {
    score += 0.6;
  }
  
  // Legal/regulatory indicators
  if (
    pathLower.includes('regulation') ||
    pathLower.includes('law') ||
    pathLower.includes('legal') ||
    pathLower.includes('statute') ||
    pathLower.includes('rule')
  ) {
    score += 0.65;
  }
  
  // Financial indicators
  if (
    pathLower.includes('financial') ||
    pathLower.includes('earnings') ||
    pathLower.includes('quarterly') ||
    pathLower.includes('annual-report')
  ) {
    score += 0.55;
  }
  
  // Negative indicators (less likely to be primary sources)
  if (
    pathLower.includes('blog') ||
    pathLower.includes('opinion') ||
    pathLower.includes('comment') ||
    pathLower.includes('discussion')
  ) {
    score -= 0.3;
  }
  
  return score;
}

/**
 * Prioritize URLs that are likely to be primary sources
 * @param urls Array of URLs to prioritize
 * @param maxResults Maximum number of results to return
 * @returns Sorted array of URLs
 */
export function prioritizeUrls(urls: string[], maxResults: number = 10): string[] {
  if (!urls || urls.length === 0) {
    return [];
  }
  
  // Score and sort the URLs
  const scoredUrls = urls.map(url => {
    try {
      const parsedUrl = new URL(url);
      const domain = parsedUrl.hostname;
      const path = parsedUrl.pathname;
      
      // Calculate domain score
      const domainScore = scoreDomain(domain);
      
      // Calculate path score
      const pathScore = scorePath(path);
      
      // Calculate total score
      const totalScore = domainScore + pathScore;
      
      return {
        url,
        score: totalScore
      };
    } catch (error) {
      // If URL parsing fails, give a low score
      return {
        url,
        score: 0.5
      };
    }
  });
  
  // Filter out utility URLs that aren't useful for source tracing
  const filteredUrls = scoredUrls.filter(item => {
    const url = item.url.toLowerCase();
    // Filter out privacy policies, terms of service, schema.org, etc.
    if (
      url.includes('schema.org') ||
      url.includes('w3.org') ||
      url.includes('privacy') ||
      url.includes('terms') ||
      url.includes('cookies') ||
      url.includes('javascript:') ||
      url.includes('cdn.') ||
      url.includes('assets.') ||
      url.includes('favicon') ||
      url.includes('sitemap') ||
      url.includes('logo') ||
      url.includes('analytics') ||
      url.includes('tracking')
    ) {
      return false;
    }
    return true;
  });

  // Sort by score, descending
  filteredUrls.sort((a, b) => b.score - a.score);
  
  // Log prioritization results for top URLs
  console.log('URL prioritization results (top ' + Math.min(3, filteredUrls.length) + '):');
  filteredUrls.slice(0, 3).forEach(item => {
    console.log(`  Score ${item.score.toFixed(3)}: ${item.url}`);
  });
  
  // Return the top URLs, with at least 60% being news sources if possible
  const newsUrls = filteredUrls.filter(item => {
    const domain = new URL(item.url).hostname.toLowerCase();
    return (
      domain.includes('news') ||
      domain.includes('reuters') ||
      domain.includes('ap.org') ||
      domain.includes('bloomberg') ||
      domain.includes('nytimes') ||
      domain.includes('wsj') ||
      domain.includes('washingtonpost') ||
      domain.includes('bbc') ||
      domain.includes('cnn') ||
      domain.includes('nbcnews') ||
      domain.includes('theguardian')
    );
  });
  
  // If we have enough news URLs, ensure they make up at least 60% of results
  if (newsUrls.length >= maxResults * 0.6) {
    const newsCount = Math.ceil(maxResults * 0.6);
    const otherCount = maxResults - newsCount;
    
    // Get top news URLs
    const topNewsUrls = newsUrls.slice(0, newsCount);
    
    // Get top non-news URLs (excluding ones already selected)
    const nonNewsUrls = filteredUrls
      .filter(item => !topNewsUrls.some(newsItem => newsItem.url === item.url))
      .slice(0, otherCount);
    
    // Combine and return URLs
    return [...topNewsUrls, ...nonNewsUrls].map(item => item.url);
  }
  
  // Otherwise, just return top filtered URLs
  return filteredUrls.slice(0, maxResults).map(item => item.url);
}
