import axios from 'axios';
import type { SingleResearchItemState } from '../single-betting-pool-graph';
import config from '../../config';

// Interface for NewsAPI parameters
interface NewsApiParams {
  q: string;
  from?: string;
  to?: string;
  language?: string;
  sortBy?: string;
  pageSize?: number;
  domains?: string;
}

/**
 * Gets default date range for news search (last 7 days)
 */
function getDefaultDates() {
  const currentDate = new Date();
  const pastDate = new Date();
  pastDate.setDate(currentDate.getDate() - 7); // Default to 7 days in the past

  return {
    from: pastDate.toISOString().split('T')[0],
    to: currentDate.toISOString().split('T')[0],
  };
}

export async function newsApiSearchFunctionSingle(
  state: SingleResearchItemState
): Promise<Partial<SingleResearchItemState>> {
  console.log('newsApiSearchFunctionSingle', state.research?.news_search_query);

  const researchItem = state.research;
  if (!researchItem) {
    console.log('No research item to search news for');
    return {
      research: undefined,
    };
  }

  // Check if item should be processed
  if (researchItem.should_process === false) {
    console.log('Item marked as should not process, skipping news search');
    return {
      research: researchItem,
    };
  }

  if (!researchItem.news_search_query) {
    console.log('No search query available for news search');
    return {
      research: {
        ...researchItem,
        should_process: false,
        skip_reason: 'no_news_search_query',
      },
    };
  }

  try {
    const defaultDates = getDefaultDates();

    // Use alternative queries if the main one fails
    const queries = [researchItem.news_search_query];
    if (
      researchItem.alternative_search_queries &&
      Array.isArray(researchItem.alternative_search_queries)
    ) {
      queries.push(...researchItem.alternative_search_queries.slice(0, 2));
    }

    // Add a fallback query that's more general
    if (researchItem.news_search_query.length > 10) {
      const fallbackQuery = researchItem.news_search_query.split(' ').slice(0, 3).join(' ');
      queries.push(fallbackQuery);
    }

    let articles: any[] = [];
    let successfulQuery = '';

    // Try each query in sequence until we get results
    for (const query of queries) {
      try {
        const params: NewsApiParams = {
          q: query,
          from: defaultDates.from,
          to: defaultDates.to,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 10,
        };

        // Add domain restrictions if specified
        if (
          researchItem.search_domains &&
          Array.isArray(researchItem.search_domains) &&
          researchItem.search_domains.length > 0
        ) {
          params.domains = researchItem.search_domains.join(',');
        }

        const response = await axios.get('https://newsapi.org/v2/everything', {
          params: {
            ...params,
            apiKey: config.newsApiKey,
          },
          timeout: 10000, // 10 second timeout
        });

        console.log('newsApiSearch response status:', response.status);

        // Extract article titles from the response
        const responseArticles = response.data.articles || [];
        if (responseArticles.length > 0) {
          articles = responseArticles;
          successfulQuery = query;
          console.log(`Found ${articles.length} articles with query: ${query}`);
          break; // Stop trying more queries
        } else {
          console.log(`No articles found with query: ${query}, trying next query`);
        }
      } catch (queryError) {
        const errorMessage = queryError instanceof Error ? queryError.message : 'Unknown error';
        console.log(`Query "${query}" failed:`, errorMessage);
        // Continue to next query
      }
    }

    // Process the articles
    const articleTitles = articles.map((article: any) => article.title);
    const articleUrls = articles.map((article: any) => article.url);

    // Get article snippets where available
    const articleSnippets = articles.map((article: any) => {
      if (article.description) {
        return `${article.title} - ${article.description}`;
      }
      return article.title;
    });

    console.log('articleTitles', articleTitles);
    return {
      research: {
        ...researchItem,
        related_news: articleTitles,
        related_news_urls: articleUrls,
        related_news_search_results: articleSnippets,
        successful_news_query: successfulQuery || researchItem.news_search_query,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    console.error(`Error calling News API: ${errorMessage}${status ? ` (Status: ${status})` : ''}`);
    return {
      research: {
        ...researchItem, // News api failing is non-fatal.
        // should_process: false,
        // skip_reason: 'news_search_failed',
      },
    };
  }
}
