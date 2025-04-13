import { getUserInfo, getUserPosts } from './api';
import { identifyUserPredictions } from './core/prediction-identification';
import { analyzePredictionStyle } from './core/profile-analysis';
import type { PredictorProfile } from './types';

/**
 * Builds a profile of a predictor based on their past predictions on X/Twitter
 *
 * @param username X/Twitter username to analyze
 * @returns Profile with past predictions and analysis
 */
export async function buildPredictorProfile(username: string): Promise<PredictorProfile> {
  console.log(`Building predictor profile for @${username}`);

  // Step 1: Get basic profile info from X/Twitter
  const userInfo = await getUserInfo(username);

  // Step 2: Get recent posts from the user
  const userPosts = await getUserPosts(username);

  // Step 3: Analyze posts to identify predictions
  const predictions = await identifyUserPredictions(userPosts, username);

  // Step 4: Analyze the user's prediction style and expertise areas
  const predictionAnalysis = await analyzePredictionStyle(predictions, userInfo.bio);

  // Step 5: Build and return the full profile
  return {
    username: username,
    display_name: userInfo.name,
    bio: userInfo.bio,
    follower_count: userInfo.followers_count,
    prediction_count: predictions.length,
    expertise_areas: predictionAnalysis.expertise_areas,
    prediction_style: predictionAnalysis.prediction_style,
    past_predictions: predictions.map(p => ({
      prediction_text: p.prediction_text || '',
      prediction_date: p.post_date,
      post_id: p.post_id,
      post_url: p.post_url,
      topic: p.topic,
      implicit: p.implicit || false,
      confidence_score: p.confidence_score,
      outcome: p.outcome,
    })),
    verified_accuracy: predictionAnalysis.verified_accuracy,
  };
}
