/**
 * Prediction Analysis Module
 * 
 * Analyzes social media posts to identify predictions and extracts key information.
 * Enhanced with improved error handling, parallel processing, and result filtering.
 */

import { queryStructuredLLM } from '../../common/llm/llm-manager';
import { createAgentErrorHandler, ErrorSeverity, ErrorType } from '../../common/utils/error-handler';
import type { TwitterScraperTweet, PredictionResult } from '../types';
import { PREDICTION_ANALYSIS_OUTPUT_SCHEMA, PREDICTION_ANALYSIS_SYSTEM_PROMPT } from '../prompts/prediction-analysis-prompt';

// Create specialized error handler for prediction finder agent
const errorHandler = createAgentErrorHandler('prediction-finder');

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
  
  try {
    // Skip empty posts array
    if (!posts.length) {
      console.log('No posts to analyze');
      return [];
    }
    
    // Process posts in optimized batches to balance throughput and rate limits
    const batchSize = 5; // Small batch size for better parallelism without overwhelming API limits
    const totalBatches = Math.ceil(posts.length / batchSize);
    
    // Add pre-filtering to improve efficiency
    // Simple heuristic to prioritize posts more likely to contain predictions
    const prioritizedPosts = [...posts].sort((a, b) => {
      const aText = (a.text || '').toLowerCase();
      const bText = (b.text || '').toLowerCase();
      
      // Score posts based on prediction-related keywords
      const predictionKeywords = ['predict', 'will', 'going to', 'expect', 'believe', 'think', 'forecast'];
      const aScore = predictionKeywords.reduce((score, kw) => score + (aText.includes(kw) ? 1 : 0), 0);
      const bScore = predictionKeywords.reduce((score, kw) => score + (bText.includes(kw) ? 1 : 0), 0);
      
      return bScore - aScore; // Sort by descending score
    });
    
    // Process in batches
    for (let i = 0; i < prioritizedPosts.length; i += batchSize) {
      const batch = prioritizedPosts.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1} of ${totalBatches} (${batch.length} posts)`
      );
      
      // Process batch in parallel with error handling for individual posts
      const batchPromises = batch.map(post => analyzeSinglePost(post, topic));
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results, handling both successful and failed analyses
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          predictions.push(result.value);
        } else if (result.status === 'rejected') {
          // Log error but continue processing
          errorHandler.handleError(result.reason, {
            type: ErrorType.LLM_RESPONSE,
            severity: ErrorSeverity.WARNING,
            context: { postId: batch[index]?.id || 'unknown', topic, function: 'analyzePredictionCandidates' },
          });
        }
      });
      
      // Add a small delay between batches to respect rate limits
      if (i + batchSize < prioritizedPosts.length) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Slightly longer delay for better rate limit management
      }
    }
    
    // Sort by confidence score and then by topic relevance for more accurate results
    predictions.sort((a, b) => {
      // First by confidence score
      const confidenceDiff = b.confidence_score - a.confidence_score;
      if (Math.abs(confidenceDiff) > 0.2) return confidenceDiff; // Significant difference in confidence
      
      // Then by topic relevance for similar confidence scores
      return (b.topic_relevance || 0) - (a.topic_relevance || 0);
    });
    
    console.log(`Found ${predictions.length} posts containing predictions related to: ${topic}`);
    return predictions;
  } catch (error: any) {
    // Handle unexpected errors in the overall analysis process
    errorHandler.handleError(error, {
      type: ErrorType.GENERAL,
      severity: ErrorSeverity.ERROR,
      context: { postsCount: posts.length, topic, function: 'analyzePredictionCandidates' },
    });
    return predictions; // Return any predictions we managed to extract before the error
  }
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
  
  // Extract any links mentioned in the post
  const links = post.entities?.urls?.map(u => u.expanded_url).join(', ') || '';
  
  // Skip very short posts that are unlikely to contain predictions
  if (postText.length < 10) {
    return null;
  }

  try {
    // Use our optimized structured LLM utility
    const result = await queryStructuredLLM<PredictionResult>(
      PREDICTION_ANALYSIS_SYSTEM_PROMPT, // Use the exported system prompt string directly
      `Please analyze this post to determine if it contains a prediction related to the topic "${topic}":

Post ID: ${postId}
Author: @${username}
Date: ${postDate}
Content: ${postText}

If links or media are mentioned: ${links}

Analyze this carefully and return the structured JSON response.`,
      PREDICTION_ANALYSIS_OUTPUT_SCHEMA,
      {
        complexity: 'medium', // Most prediction analyses don't need the largest models
        temperature: 0.3, // Lower temperature for more consistent analysis
        taskName: `Analyze prediction in post ${postId}`,
        defaultValue: {
          is_prediction: false,
          prediction_text: '',
          implicit: false,
          confidence_score: 0,
          timeframe: 'uncertain' as const,
          has_condition: false,
          prediction_sentiment: 'neutral' as const,
          topic_relevance: 0,
          post_id: postId,
          post_url: postUrl,
          author_username: username,
          author_name: authorName,
          post_date: postDate, 
          topic: topic,
          source_platform: 'twitter'
        }
      }
    );

    // If not a prediction or low relevance to the topic, return null
    if (!result.is_prediction || (result.topic_relevance || 0) < 0.3) {
      return null;
    }

    // Return the prediction with enhanced metadata
    return {
      ...result,
      post_id: postId,
      post_url: postUrl,
      author_username: username,
      author_name: authorName,
      post_date: postDate,
      topic: topic,
      source_platform: 'twitter',
      full_text: postText,
      verified_status: post.user?.verified || false,
      follower_count: post.user?.followers_count || 0,
      engagement_metrics: {
        likes: post.favorite_count || 0,
        retweets: post.retweet_count || 0,
        replies: post.reply_count || 0
      }
    };
  } catch (error: any) {
    // Use our enhanced error handling system
    errorHandler.handleError(error, {
      type: ErrorType.LLM_REQUEST,
      severity: ErrorSeverity.WARNING,
      context: { postId, username, topic, function: 'analyzeSinglePost' },
    });
    return null;
  }
}
