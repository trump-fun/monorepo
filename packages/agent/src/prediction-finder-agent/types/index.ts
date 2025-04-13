/**
 * Prediction Finder Agent Types
 * 
 * Enhanced type definitions for prediction analysis and social media interfaces.
 * Updated with more comprehensive prediction metadata and structured analysis results.
 */

import { z } from 'zod';

/**
 * Timeframe categories for predictions
 */
export enum PredictionTimeframe {
  IMMEDIATE = 'immediate',
  DAYS = 'days',
  WEEKS = 'weeks',
  MONTHS = 'months',
  YEARS = 'years',
  DECADES = 'decades',
  UNCERTAIN = 'uncertain',
}

/**
 * Sentiment categories for predictions
 */
export enum PredictionSentiment {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
}

/**
 * Interface for Twitter Scraper Media from Datura API
 */
export interface TwitterScraperMedia {
  media_url: string;
  type: string;
}

/**
 * Interface for Twitter Scraper User from Datura API
 */
export interface TwitterScraperUser {
  id?: string | null;
  url?: string | null;
  name?: string | null;
  username?: string | null;
  created_at?: string | null;
  description?: string | null;
  favourites_count?: number | null;
  followers_count?: number | null;
  listed_count?: number | null;
  media_count?: number | null;
  profile_image_url?: string | null;
  statuses_count?: number | null;
  verified?: boolean | null;
  is_blue_verified?: boolean | null;
  entities?: Record<string, any> | null;
  can_dm?: boolean | null;
  can_media_tag?: boolean | null;
  location?: string | null;
}

/**
 * Interface for Twitter Scraper Tweet URL entity
 */
export interface TwitterUrlEntity {
  url: string;
  expanded_url: string;
  display_url?: string;
  indices?: number[];
}

/**
 * Interface for Twitter Scraper Tweet Entities
 */
export interface TwitterScraperEntities {
  urls?: TwitterUrlEntity[];
  hashtags?: Array<{ text: string; indices?: number[] }>;
  mentions?: Array<{ username: string; indices?: number[] }>;
  media?: Array<{ url: string; media_url: string; type: string; indices?: number[] }>;
}

/**
 * Interface for Twitter Scraper Tweet from Datura API
 */
export interface TwitterScraperTweet {
  user?: TwitterScraperUser | null;
  id?: string | null;
  text?: string | null;
  reply_count?: number | null;
  retweet_count?: number | null;
  like_count?: number | null;
  view_count?: number | null;
  quote_count?: number | null;
  impression_count?: number | null;
  bookmark_count?: number | null;
  url?: string | null;
  created_at?: string | null;
  media?: TwitterScraperMedia[] | null;
  is_quote_tweet?: boolean | null;
  is_retweet?: boolean | null;
  entities?: TwitterScraperEntities;
  favorite_count?: number; // Alternative field name sometimes used
  lang?: string;
  geo?: any;
  possibly_sensitive?: boolean;
}

// Schema for structured output from the LLM
/**
 * Enhanced schema for prediction analysis output
 */
export const predictionAnalysisSchema = z.object({
  is_prediction: z.boolean().describe('Whether the post contains a prediction or not'),
  prediction_text: z
    .string()
    .describe('A short summary describing what the prediction is about'),
  implicit: z.boolean().describe('Whether the prediction is implicit or explicit'),
  confidence_score: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence that this is a genuine prediction (0-1)'),
  timeframe: z
    .enum(['short_term', 'medium_term', 'long_term', 'uncertain'])
    .describe('Predicted timeframe for the event'),
  has_condition: z
    .boolean()
    .describe('Whether the prediction has conditional elements (if X then Y)'),
  prediction_sentiment: z
    .enum(['positive', 'negative', 'neutral'])
    .describe('The sentiment expressed in the prediction'),
  topic_relevance: z
    .number()
    .min(0)
    .max(1)
    .describe('How relevant the prediction is to the given topic (0-1)'),
  probability_stated: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('Explicit probability mentioned in prediction (0-1)'),
  key_entities: z
    .array(z.string())
    .optional()
    .describe('Key entities mentioned in the prediction'),
  reasoning: z
    .string()
    .optional()
    .describe('Any reasoning or evidence provided for the prediction')
});

// Schema for search queries
export const searchQueriesSchema = z.object({
  queries: z.array(z.string()).describe('List of search queries for finding predictions'),
});

/**
 * Enhanced prediction result with rich metadata
 */
export type PredictionResult = z.infer<typeof predictionAnalysisSchema> & {
  // Post metadata
  post_id: string;
  post_url: string;
  full_text?: string;
  post_date: string;
  topic: string;
  source_platform: string;
  
  // Author metadata
  author_username: string;
  author_name: string;
  verified_status?: boolean;
  follower_count?: number;
  
  // Engagement metrics
  engagement_metrics?: {
    likes?: number;
    retweets?: number;
    replies?: number;
    quotes?: number;
  };
  
  // Additional analysis
  predicted_outcome?: string;
  prediction_verified?: boolean;
  verification_evidence?: string;
  related_predictions?: string[];
};
