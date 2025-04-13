/**
 * Prediction Finder Agent
 *
 * A specialized agent for discovering and analyzing predictions on social media platforms.
 * This agent can search across platforms for explicit and implicit predictions related to
 * specific topics, and analyze their content, confidence, timeframe, and sentiment.
 *
 * Key features:
 * - Smart search query generation for optimal results
 * - Parallel processing with fault tolerance
 * - Structured prediction analysis with metadata enrichment
 * - Result filtering and ranking by confidence and relevance
 * - Enhanced engagement metrics for prediction quality assessment
 */

// Core functionality
export { findPredictions } from './prediction-finder-graph';

// Direct access to core components for custom implementations
export {
  generatePredictionSearchQueries,
  searchForPredictionPosts
} from './core/search-predictions';

export {
  analyzePredictionCandidates,
  analyzeSinglePost
} from './core/analyze-predictions';

// Type definitions
export type {
  PredictionResult,
  TwitterScraperTweet,
  TwitterScraperUser,
  PredictionTimeframe,
  PredictionSentiment
} from './types';

/**
 * Example usage:
 * 
 * ```typescript
 * import { findPredictions } from '@trump-fun/agent/prediction-finder-agent';
 * 
 * async function main() {
 *   const predictions = await findPredictions('Bitcoin price', 5);
 *   console.log(`Found ${predictions.length} predictions about Bitcoin price`);
 *   predictions.forEach(p => {
 *     console.log(`- ${p.prediction_text} (Confidence: ${p.confidence_score})`);
 *   });
 * }
 * ```
 */
