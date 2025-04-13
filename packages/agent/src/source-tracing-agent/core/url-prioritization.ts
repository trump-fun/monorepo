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

    // News organizations
    if (
      domainLower.includes('news') ||
      domainLower.includes('nyt') ||
      domainLower.includes('wsj') ||
      domainLower.includes('reuters') ||
      domainLower.includes('bloomberg') ||
      domainLower.includes('ap.org')
    ) {
      return 2.5;
    }

    // Social media (rarely primary sources)
    if (
      domainLower.includes('twitter') ||
      domainLower.includes('facebook') ||
      domainLower.includes('instagram') ||
      domainLower.includes('tiktok') ||
      domainLower.includes('reddit')
    ) {
      return 1.2;
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
        score: totalScore,
      };
    } catch (error) {
      // If URL parsing fails, give a low score
      return {
        url,
        score: 0.5,
      };
    }
  });

  // Sort by score, descending
  scoredUrls.sort((a, b) => b.score - a.score);

  // Log prioritization results for top URLs
  console.log('URL prioritization results (top ' + Math.min(3, scoredUrls.length) + '):');
  scoredUrls.slice(0, 3).forEach(item => {
    console.log(`  Score ${item.score.toFixed(3)}: ${item.url}`);
  });

  // Return the top URLs
  return scoredUrls.slice(0, maxResults).map(item => item.url);
}
