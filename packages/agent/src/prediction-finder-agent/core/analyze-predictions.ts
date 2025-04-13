import config from '../../config';
import { TwitterScraperTweet, PredictionResult, predictionAnalysisSchema } from '../types';
import { predictionAnalysisPrompt } from '../prompts/prediction-analysis';

/**
 * Analyzes posts to identify which ones contain predictions
 *
 * @param posts Array of Twitter posts to analyze
 * @param topic Topic to check for relevance
 * @returns Array of prediction results
 */
export async function analyzePredictionCandidates(
  posts: TwitterScraperTweet[],
  topic: string
): Promise<PredictionResult[]> {
  console.log(`Analyzing ${posts.length} posts for predictions on topic: ${topic}`);
  const predictions: PredictionResult[] = [];

  // Process posts in batches to avoid overwhelming the LLM
  const batchSize = 5;

  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(posts.length / batchSize)}`
    );

    const batchPromises = batch.map(post => analyzeSinglePost(post, topic));
    const batchResults = await Promise.all(batchPromises);

    // Filter out null results (posts that aren't predictions)
    const validResults = batchResults.filter(result => result !== null) as PredictionResult[];
    predictions.push(...validResults);

    // Add a small delay between batches
    if (i + batchSize < posts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Sort by confidence score (highest first)
  predictions.sort((a, b) => b.confidence_score - a.confidence_score);

  console.log(`Found ${predictions.length} posts containing predictions`);
  return predictions;
}

/**
 * Analyzes a single post to determine if it contains a prediction
 * Returns null if the post doesn't contain a prediction
 *
 * @param post Twitter post to analyze
 * @param topic Topic to check for relevance
 * @returns Prediction result or null if not a prediction
 */
export async function analyzeSinglePost(
  post: TwitterScraperTweet,
  topic: string
): Promise<PredictionResult | null> {
  // Extract relevant fields from the post
  const postText = post.text || '';
  const postId = post.id || '';
  const username = post.user?.username || 'unknown';
  const authorName = post.user?.name || username;
  const postDate = post.created_at || new Date().toISOString();
  const postUrl = post.url || `https://x.com/${username}/status/${postId}`;

  console.log(`Analyzing post: ${postText}`);

  try {
    // Create structured output with the schema
    const structuredLlm = config.cheap_large_llm.withStructuredOutput(predictionAnalysisSchema);

    // Format the prompt into messages and then invoke the LLM
    const formattedPrompt = await predictionAnalysisPrompt.formatMessages({
      text: postText,
      topic,
    });

    const result = await structuredLlm.invoke(formattedPrompt);

    // If not a prediction, return null
    if (!result.is_prediction) {
      return null;
    }

    // Return the prediction with metadata
    return {
      is_prediction: result.is_prediction,
      prediction_text: result.prediction_text,
      confidence_score: result.confidence_score,
      implicit: result.implicit,
      topic_relevance: result.topic_relevance,
      timeframe: result.timeframe,
      has_condition: result.has_condition,
      prediction_sentiment: result.prediction_sentiment,
      probability_stated: result.probability_stated,
      post_id: postId,
      post_url: postUrl,
      author_username: username,
      author_name: authorName,
      post_date: postDate,
      topic: topic,
    };
  } catch (error) {
    console.error(`Error analyzing post ${postId}:`, error);
    return null;
  }
}
