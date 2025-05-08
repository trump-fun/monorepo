import { z } from 'zod';
import config from '../../config';
import { PredictionSentiment, PredictionTimeframe } from '../../prediction-finder-agent/types';
import { predictionIdentificationPrompt } from '../prompts/profile-analysis';
import type { PredictionResult } from '../types';

/**
 * Identifies predictions in user posts
 *
 * @param posts Array of user posts to analyze
 * @param username Username of the predictor
 * @returns Array of identified predictions
 */
export async function identifyUserPredictions(
  posts: any[],
  username: string
): Promise<PredictionResult[]> {
  console.log(`Analyzing ${posts.length} posts for predictions by @${username}`);

  // Store identified predictions
  const predictions: PredictionResult[] = [];

  // Process posts in batches to avoid overwhelming the LLM
  const batchSize = 5;

  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(posts.length / batchSize)}`
    );

    // Process each post in the batch in parallel
    const batchPromises = batch.map(post => identifyPredictionInPost(post));
    const batchResults = await Promise.all(batchPromises);

    // Filter out null results (posts that aren't predictions)
    const validResults = batchResults.filter(result => result !== null) as PredictionResult[];
    predictions.push(...validResults);

    // Add a small delay between batches
    if (i + batchSize < posts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`Found ${predictions.length} predictions in posts by @${username}`);
  return predictions;
}

/**
 * Identifies if a post contains a prediction
 *
 * @param post Social media post to analyze
 * @returns Prediction result or null if not a prediction
 */
export async function identifyPredictionInPost(post: any): Promise<PredictionResult | null> {
  // Extract post information
  const postId = post.id || '';
  const postText = post.text || post.full_text || '';
  const postDate = post.created_at || new Date().toISOString();
  const postUrl = post.url || `https://x.com/i/status/${postId}`;
  const username = post.user?.username || 'unknown';
  const authorName = post.user?.name || username;

  // Skip posts that are too short or likely not containing predictions
  if (postText.length < 30 || postText.startsWith('RT @') || postText.startsWith('@')) {
    return null;
  }

  // Skip additional checking for very short posts or retweets
  if (postText.length < 30 || postText.startsWith('RT @')) {
    return null;
  }

  // Define a simpler schema that matches our new prompt format
  const predictionSchema = z.object({
    is_prediction: z.boolean().describe('Whether the post contains a prediction'),
    prediction_text: z.string().optional().describe('Summary of the prediction'),
    topic: z.string().optional().describe('Topic of the prediction'),
    confidence_score: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Confidence this is a prediction (0-1)'),
    implicit: z.boolean().optional().describe('Whether the prediction is implicit'),
    timeframe: z.nativeEnum(PredictionTimeframe).optional().describe('Timeframe of the prediction'),
  });

  // Try using regular LLM call first - more reliable than structured output for this case
  try {
    // Format the prompt with post information
    const formattedPrompt = await predictionIdentificationPrompt.formatMessages({
      postId,
      postDate,
      postUrl,
      postText: postText.replace(/"/g, '\"'), // Escape quotes to avoid breaking the prompt
    });

    // First try with raw LLM to avoid parsing errors
    const rawResponse = await config.cheap_large_llm.invoke(formattedPrompt);
    const responseText = rawResponse.content.toString().toLowerCase();

    // Simple heuristic check on the raw response
    if (
      responseText.includes('no prediction') ||
      responseText.includes('does not contain a prediction') ||
      responseText.includes('is not a prediction')
    ) {
      return null; // Not a prediction
    }

    // Extract prediction information using regex patterns
    let topic = 'general';
    const topicMatch = responseText.match(/topic[:\s]+(.*?)(?:\.|\n|$)/i);
    if (topicMatch && topicMatch[1]) {
      topic = topicMatch[1].trim();
    }

    let confidence = 0.7; // Default confidence
    const confidenceMatch = responseText.match(/confidence[:\s]+(0\.\d+|\d+)/i);
    if (confidenceMatch && confidenceMatch[1]) {
      confidence = parseFloat(confidenceMatch[1]);
    }

    const isImplicit = responseText.includes('implicit');

    let timeframe = PredictionTimeframe.UNCERTAIN;
    if (
      responseText.includes('day') ||
      responseText.includes('week') ||
      responseText.includes('month')
    ) {
      if (responseText.includes('day')) timeframe = PredictionTimeframe.DAYS;
      else if (responseText.includes('week')) timeframe = PredictionTimeframe.WEEKS;
      else if (responseText.includes('month')) timeframe = PredictionTimeframe.MONTHS;
    } else if (responseText.includes('year')) {
      timeframe = PredictionTimeframe.YEARS;
    }

    // Construct a prediction result from the extracted information
    return {
      is_prediction: true,
      prediction_text: postText.substring(0, 150), // Use the first 150 chars of post as prediction text
      source_text: postText,
      implicit: isImplicit,
      confidence_score: confidence,
      timeframe: timeframe,
      has_condition: postText.toLowerCase().includes('if '),
      prediction_sentiment: responseText.includes('negative')
        ? PredictionSentiment.NEGATIVE
        : responseText.includes('positive')
          ? PredictionSentiment.POSITIVE
          : PredictionSentiment.NEUTRAL,
      post_id: postId,
      post_url: postUrl,
      author_username: username,
      author_name: authorName,
      post_date: postDate,
      topic: topic,
      topic_relevance: 0.8,
    };
  } catch (error) {
    console.error(`Error analyzing post ${postId}:`, error);

    // Simple heuristic fallback if all else fails
    if (
      postText.toLowerCase().includes('predict') ||
      postText.toLowerCase().includes('will happen') ||
      postText.toLowerCase().includes('expect') ||
      postText.toLowerCase().includes('going to be')
    ) {
      return {
        is_prediction: true,
        prediction_text: postText.substring(0, 100),
        source_text: postText,
        implicit: false,
        confidence_score: 0.6,
        timeframe: PredictionTimeframe.UNCERTAIN,
        has_condition: postText.toLowerCase().includes('if '),
        prediction_sentiment: PredictionSentiment.NEUTRAL,
        post_id: postId,
        post_url: postUrl,
        author_username: username,
        author_name: authorName,
        post_date: postDate,
        topic: 'general',
        topic_relevance: 0.5,
      };
    }

    return null;
  }
}
