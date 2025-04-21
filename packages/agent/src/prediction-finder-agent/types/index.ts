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
}

// Schema for structured output from the LLM
export const predictionAnalysisSchema = z.object({
  is_prediction: z.boolean().describe('Whether the post contains a prediction or not'),
  prediction_text: z
    .string()
    .optional()
    .describe(
      'Your short summary describing what the user predicted in their post and how it relates to the topic'
    ),
  confidence_score: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence that this is a genuine prediction (0-1)'),
  implicit: z.boolean().optional().describe('Whether the prediction is implicit or explicit'),
  topic_relevance: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('How relevant the prediction is to the given topic (0-1)'),
  timeframe: z
    .nativeEnum(PredictionTimeframe)
    .optional()
    .describe('Predicted timeframe for the event'),
  has_condition: z
    .boolean()
    .optional()
    .describe('Whether the prediction has conditional elements (if X then Y)'),
  prediction_sentiment: z
    .nativeEnum(PredictionSentiment)
    .optional()
    .describe('The sentiment expressed in the prediction'),
  probability_stated: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('Explicit probability mentioned in prediction (0-1)'),
});

// Schema for search queries
export const searchQueriesSchema = z.object({
  queries: z.array(z.string()).describe('List of search queries for finding predictions'),
});

// Type for the result of prediction analysis
export type PredictionResult = z.infer<typeof predictionAnalysisSchema> & {
  source_text: string;
  post_id: string;
  post_url: string;
  author_username: string;
  author_name: string;
  post_date: string;
  topic: string;
};
