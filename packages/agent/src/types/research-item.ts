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
  betting_pool_explanation?: string; // Explanation of the betting pool idea from the LLM
  news_search_query?: string;
  related_news_search_query?: string;
  tavily_search_query?: string;
  related_tavily_search_query?: string;
  transaction_hash?: string | null; // Blockchain transaction hash from creating the betting pool
  pool_id?: string | null; // ID of the betting pool on the smart contract
  should_process?: boolean; // Flag to indicate if this item should be processed further
  skip_reason?: string; // Reason why the item was marked for skipping (e.g., "already_processed", "too_old")
  image_prompt?: string; // Generated prompt for image creation
  image_url?: string | null;

  external_link_content?: string | null;
  external_link_url?: string | null;
  external_link_error?: string | null;
  alternative_search_queries?: string[];
  search_domains?: string[];
  successful_news_query?: string;
  tavily_search_failed?: boolean;

  // New fields for reference chain tracing
  reference_chains?: ReferenceChain[];
  source_tracing_complete?: boolean;
  primary_source_found?: boolean;
  primary_source_url?: string;
  primary_source_summary?: string;
}

// Define the reference chain interface
export interface ReferenceChain {
  chain_id: string;
  sources: SourceReference[];
  confidence_score: number; // 0-1 score indicating confidence in this chain
  is_complete: boolean; // Whether we've reached a primary source
}

export interface SourceReference {
  url: string;
  title?: string;
  // Keep source_type as a descriptor but not the definitive classifier
  source_type:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'social_media'
    | 'blog'
    | 'news'
    | 'official'
    | 'unknown';
  publication_date?: string;
  referenced_urls: string[]; // URLs referenced by this source
  content_summary: string;
  // Replace is_primary_source with contains_original_information
  contains_original_information: boolean; // Whether this contains original information/statements
  // Add chain position markers
  chain_distance_markers: {
    has_no_references: boolean; // Potential chain endpoint (no further references)
    is_directly_cited: boolean; // Whether this source is directly cited by others
    cites_primary_sources: boolean; // Whether this source cites apparent primary sources
  };
  verification_status: 'verified' | 'partially_verified' | 'unverified';
  key_claims: string[];
}
