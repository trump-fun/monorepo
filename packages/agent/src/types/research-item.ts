import type { TruthSocialPost } from './truth-social-post';

/**
 * Represents a research item containing a Truth Social post and related data
 * for generating betting pool ideas
 */
export interface ResearchItem {
  truth_social_post: TruthSocialPost;
  related_news?: string[];
  related_news_urls?: string[];
  related_search_results?: string[];
  related_news_search_results?: string[];
  related_tavily_search_results?: string[];
  betting_pool_idea?: string;
  news_search_query?: string;
  related_news_search_query?: string;
  tavily_search_query?: string;
  related_tavily_search_query?: string;
  transaction_hash?: string | null; // Blockchain transaction hash from creating the betting pool
  pool_id?: string | null; // ID of the betting pool on the smart contract
  should_process?: boolean; // Flag to indicate if this item should be processed further
  skip_reason?: string; // Reason why the item was marked for skipping (e.g., "already_processed", "too_old")
  image_prompt?: string; // Generated prompt for image creation
  image_url?: string | null; // URL of the generated image
  external_link_content?: string | null; // Scraped content from any external link in the post
  external_link_url?: string | null; // URL of the external link that was scraped
  external_link_error?: string | null; // Error message if external link scraping failed
  alternative_search_queries?: string[]; // Alternative search queries to try if the main one fails
  search_domains?: string[]; // Recommended domains to prioritize in search
  successful_news_query?: string; // The query that successfully returned news results
  tavily_search_failed?: boolean; // Flag to indicate if the Tavily search failed
}

export interface SingleResearchItem {
  truth_social_post: TruthSocialPost;
  related_news?: string[];
  related_news_urls?: string[];
  related_search_results?: string[];
  betting_pool_idea?: string;
  news_search_query?: string;
  related_news_search_query?: string;
  tavily_search_query?: string;
  related_tavily_search_query?: string;
  related_news_search_results?: string[];
  related_tavily_search_results?: string[];
  transaction_hash?: string | null; // Blockchain transaction hash from creating the betting pool
  pool_id?: string | null; // ID of the betting pool on the smart contract
  should_process?: boolean; // Flag to indicate if this item should be processed further
  skip_reason?: string; // Reason why the item was marked for skipping (e.g., "already_processed", "too_old")
  image_prompt?: string; // Generated prompt for image creation
  image_url?: string | null; // URL of the generated image
  external_link_content?: string | null; // Scraped content from any external link in the post
  external_link_url?: string | null; // URL of the external link that was scraped
  external_link_error?: string | null; // Error message if external link scraping failed
  alternative_search_queries?: string[]; // Alternative search queries to try if the main one fails
  search_domains?: string[]; // Recommended domains to prioritize in search
  successful_news_query?: string; // The query that successfully returned news results
  tavily_search_failed?: boolean; // Flag to indicate if the Tavily search failed
}
