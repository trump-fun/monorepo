import { analyzePredictionCandidates } from './core/analyze-predictions';
import {
  generatePredictionSearchQueries,
  searchForPredictionPosts,
} from './core/search-predictions';
import type { PredictionResult, TwitterScraperTweet } from './types';

/**
 * Finds X posts containing explicit or implicit predictions related to a topic
 *
 * @param topic Topic to search for predictions about
 * @param limit Maximum number of posts to search through
 * @returns Object containing arrays of predictions and non-predictions found on X/Twitter
 */
export async function findPredictions(
  topic: string,
  limit: number = 50
): Promise<{ predictions: PredictionResult[]; not_predictions: TwitterScraperTweet[] }> {
  console.log(`Finding predictions related to topic: ${topic}`);

  // Step 1: Generate search queries related to the topic
  const searchQueries = await generatePredictionSearchQueries(topic);

  // Step 2: Search for posts using the generated queries
  const posts = await searchForPredictionPosts(topic, searchQueries, limit);

  // Step 3: Analyze each post to determine if it contains a prediction
  const result = await analyzePredictionCandidates(posts, topic);

  // Return both predictions and non-predictions
  return result;
}
