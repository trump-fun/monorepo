import {
  generatePredictionSearchQueries,
  searchForPredictionPosts,
} from './core/search-predictions';
import { analyzePredictionCandidates } from './core/analyze-predictions';
import { PredictionResult } from './types';

/**
 * Finds X posts containing explicit or implicit predictions related to a topic
 *
 * @param topic Topic to search for predictions about
 * @param limit Maximum number of results to return
 * @returns Array of predictions found on X/Twitter
 */
export async function findPredictions(
  topic: string,
  limit: number = 10
): Promise<PredictionResult[]> {
  console.log(`Finding predictions related to topic: ${topic}`);

  // Step 1: Generate search queries related to the topic
  const searchQueries = await generatePredictionSearchQueries(topic);

  // Step 2: Search for posts using the generated queries
  const posts = await searchForPredictionPosts(searchQueries, limit * 3);

  // Step 3: Analyze each post to determine if it contains a prediction
  const predictions = await analyzePredictionCandidates(posts, topic);

  // Return the top predictions (limited by the requested amount)
  return predictions.slice(0, limit);
}
