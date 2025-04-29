import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import axios from 'axios';
import config from '../../config';
import { PredictionTimeframe } from '../../prediction-finder-agent/types';
import type { PredictionResult as BasePredictionResult } from '../../prediction-finder-agent/tools/find-predictions';

// Extend the PredictionResult type to include the outcome property
interface PredictionResult extends BasePredictionResult {
  outcome?: 'correct' | 'partially_correct' | 'incorrect' | 'unverifiable' | 'pending';
}

// Define schema for predictor profile
const _predictorProfileSchema = z.object({
  username: z.string().describe('X/Twitter username of the predictor'),
  display_name: z.string().describe('Display name of the predictor'),
  bio: z.string().describe('User bio/description'),
  follower_count: z.number().describe('Number of followers'),
  prediction_count: z.number().describe('Number of predictions found'),
  expertise_areas: z.array(z.string()).describe('Areas where the user makes predictions'),
  prediction_style: z.object({
    confidence_level: z
      .number()
      .min(0)
      .max(1)
      .describe('How confidently the user states predictions (0-1)'),
    explicitness: z.number().min(0).max(1).describe('How explicit their predictions are (0-1)'),
    evidence_based: z.number().min(0).max(1).describe('How much they cite evidence (0-1)'),
    time_horizon: z.string().describe('Typical timeframe of predictions (short/medium/long term)'),
  }),
  past_predictions: z.array(
    z.object({
      prediction_text: z.string(),
      prediction_date: z.string(),
      post_id: z.string(),
      post_url: z.string(),
      topic: z.string(),
      implicit: z.boolean(),
      outcome: z
        .enum(['correct', 'partially_correct', 'incorrect', 'unverifiable', 'pending'])
        .optional(),
      confidence_score: z.number().min(0).max(1),
    })
  ),
  verified_accuracy: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('Accuracy of verified predictions (0-1)'),
});

export type PredictorProfile = z.infer<typeof _predictorProfileSchema>;

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
      prediction_text: p.prediction_text || 'Unknown prediction', // Ensure not undefined
      prediction_date: p.post_date || new Date().toISOString(),
      post_id: p.post_id || 'unknown-id',
      post_url: p.post_url || '#',
      topic: p.topic || 'general',
      implicit: p.implicit ?? false, // Use nullish coalescing to handle undefined
      confidence_score: p.confidence_score,
      outcome: p.outcome,
    })),
    verified_accuracy: predictionAnalysis.verified_accuracy,
  };
}

/**
 * Gets basic user information from X/Twitter
 */
async function getUserInfo(username: string): Promise<any> {
  try {
    console.log(`Getting user info for @${username}`);

    // Use Datura API to get user info
    const userResponse = await axios.get('https://apis.datura.ai/twitter/user', {
      params: { user: username },
      headers: {
        Authorization: `Bearer ${config.daturaApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (userResponse.data) {
      return {
        name: userResponse.data.name || username,
        bio: userResponse.data.description || '',
        followers_count: userResponse.data.followers_count || 0,
        verified: userResponse.data.verified || false,
        is_blue_verified: userResponse.data.is_blue_verified || false,
      };
    }

    throw new Error('User not found');
  } catch (error) {
    console.error(`Error getting user info for @${username}:`, error);
    // Return minimal info if API call fails
    return {
      name: username,
      bio: '',
      followers_count: 0,
      verified: false,
      is_blue_verified: false,
    };
  }
}

/**
 * Gets recent posts from a user
 */
async function getUserPosts(username: string, count: number = 20): Promise<any[]> {
  try {
    console.log(`Getting up to ${count} recent posts for @${username}`);

    // Use Datura API to get user posts
    const postsResponse = await axios.get('https://apis.datura.ai/twitter/post/user', {
      params: {
        user: username,
        count: count,
        // Include advanced search query to filter out replies and retweets
        query: '-filter:replies -is:retweet',
      },
      headers: {
        Authorization: `Bearer ${config.daturaApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (Array.isArray(postsResponse.data) && postsResponse.data.length > 0) {
      console.log(`Found ${postsResponse.data.length} posts for @${username}`);
      return postsResponse.data;
    } else if (postsResponse.data && postsResponse.data.search_id) {
      // If response contains a search_id, it's using the async API pattern
      const searchId = postsResponse.data.search_id;
      console.log(`Initiated Twitter/X search with ID: ${searchId}`);

      // Wait for search to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get search results
      const resultsResponse = await axios.get(`https://apis.datura.ai/twitter/${searchId}`, {
        headers: { Authorization: `Bearer ${config.daturaApiKey}` },
      });

      if (resultsResponse.data.status === 'completed' && resultsResponse.data.tweets) {
        console.log(`Retrieved ${resultsResponse.data.tweets.length} tweets for @${username}`);
        return resultsResponse.data.tweets;
      }
    }

    return [];
  } catch (error) {
    console.error(`Error getting posts for @${username}:`, error);
    return [];
  }
}

/**
 * Identifies predictions in user posts
 */
async function identifyUserPredictions(
  posts: any[],
  username: string
): Promise<PredictionResult[]> {
  console.log(`Analyzing ${posts.length} posts from @${username} to identify predictions`);
  const predictions: PredictionResult[] = [];

  // Process posts in batches
  const batchSize = 10;

  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(posts.length / batchSize)}`
    );

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

  console.log(`Found ${predictions.length} predictions from @${username}'s posts`);
  return predictions;
}

/**
 * Identifies if a post contains a prediction
 */
async function identifyPredictionInPost(post: any): Promise<PredictionResult | null> {
  // Extract relevant fields from the post
  const postText = post.text || post.full_text || '';
  const postId = post.id || post.tweet_id;
  const username = post.user?.username || post.username || 'unknown';
  const authorName = post.user?.name || post.name || username;
  const postDate = post.created_at || new Date().toISOString();
  const postUrl = post.url || `https://x.com/${username}/status/${postId}`;

  // Skip very short posts and retweets
  if (postText.length < 30 || postText.startsWith('RT @')) {
    return null;
  }

  // Create a simple prompt without JSON structure references
  const predictionPrompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      "You analyze social media posts to identify predictions. Look for statements about future events, either explicit (using words like 'predict', 'will happen') or implicit ('inevitable', 'bound to'). For posts containing predictions, provide details on topic, explicitness, confidence level (0-1), and timeframe. For posts without predictions, say 'No prediction found'.",
    ],
    [
      'human',
      `I need to analyze this post to see if it contains a prediction:\n\n${postText}\n\nDoes this post contain a prediction about future events?`,
    ],
  ]);

  try {
    // Use raw LLM without structured output to avoid parsing errors
    const formattedPrompt = await predictionPrompt.formatMessages({});
    const rawResponse = await config.cheap_large_llm.invoke(formattedPrompt);
    const responseText = rawResponse.content.toString().toLowerCase();

    // Simple heuristic check to determine if no prediction
    if (
      responseText.includes('no prediction') ||
      responseText.includes('does not contain') ||
      responseText.includes('is not a prediction')
    ) {
      return null; // Not a prediction
    }

    // Extract prediction information using regex patterns
    let topic = 'general';
    const topicMatch =
      responseText.match(/topic[:\s]+(.*?)(?:\.|\n|$)/i) ||
      responseText.match(/about[:\s]+(.*?)(?:\.|\n|$)/i);
    if (topicMatch && topicMatch[1]) {
      topic = topicMatch[1].trim();
    }

    let confidence = 0.7; // Default confidence
    const confidenceMatch = responseText.match(/confidence[:\s]+(0\.\d+|\d+)/i);
    if (confidenceMatch && confidenceMatch[1]) {
      confidence = parseFloat(confidenceMatch[1]);
    }

    const isImplicit = responseText.includes('implicit');

    // Determine timeframe
    let timeframe: any = PredictionTimeframe.UNCERTAIN;
    if (
      responseText.includes('immediate') ||
      responseText.includes('today') ||
      responseText.includes('tomorrow')
    ) {
      timeframe = PredictionTimeframe.DAYS;
    } else if (responseText.includes('day')) {
      timeframe = PredictionTimeframe.DAYS;
    } else if (responseText.includes('week')) {
      timeframe = PredictionTimeframe.WEEKS;
    } else if (responseText.includes('month')) {
      timeframe = PredictionTimeframe.MONTHS;
    } else if (responseText.includes('year')) {
      timeframe = PredictionTimeframe.YEARS;
    } else if (responseText.includes('decade')) {
      timeframe = PredictionTimeframe.YEARS;
    }

    // Check if conditional
    const hasCondition =
      postText.toLowerCase().includes('if ') || responseText.includes('conditional');

    // Extract prediction text if possible
    let predictionText = postText.substring(0, 150); // Default to beginning of post
    const predictTextMatch =
      responseText.match(/prediction text[:\s]+"(.*?)"/i) ||
      responseText.match(/prediction[:\s]+"(.*?)"/i);
    if (predictTextMatch && predictTextMatch[1]) {
      predictionText = predictTextMatch[1];
    }

    // Return the prediction with metadata
    return {
      is_prediction: true,
      prediction_text: predictionText || postText.substring(0, 100),
      implicit: isImplicit,
      post_id: postId,
      post_url: postUrl,
      author_username: username,
      author_name: authorName,
      post_date: postDate,
      topic: topic,
      timeframe: timeframe,
      has_condition: hasCondition,
      confidence_score: confidence,
      topic_relevance: 0.8, // Good default value
    };
  } catch (error) {
    console.error(`Error analyzing post ${postId}:`, error);

    // Simple heuristic fallback
    if (
      postText.toLowerCase().includes('predict') ||
      postText.toLowerCase().includes('will happen') ||
      postText.toLowerCase().includes('expect') ||
      postText.toLowerCase().includes('going to be')
    ) {
      // Basic heuristic detection
      return {
        is_prediction: true,
        prediction_text: postText.substring(0, 100),
        implicit: false,
        post_id: postId,
        post_url: postUrl,
        author_username: username,
        author_name: authorName,
        post_date: postDate,
        topic: 'general',
        timeframe: PredictionTimeframe.UNCERTAIN,
        has_condition: postText.toLowerCase().includes('if '),
        confidence_score: 0.6,
        topic_relevance: 0.5,
      };
    }

    return null;
  }
}

/**
 * Analyzes prediction style and expertise areas
 */
async function analyzePredictionStyle(
  predictions: PredictionResult[],
  userBio: string
): Promise<any> {
  // If no predictions found, return default values
  if (predictions.length === 0) {
    return {
      expertise_areas: [],
      prediction_style: {
        confidence_level: 0.5,
        explicitness: 0.5,
        evidence_based: 0.5,
        time_horizon: 'medium',
      },
      verified_accuracy: null,
    };
  }

  // Prepare prediction texts for analysis
  const predictionTexts = predictions
    .map(
      (p, i) =>
        `Prediction ${i + 1}: "${p.prediction_text}" (Topic: ${p.topic}, Date: ${p.post_date})`
    )
    .join('\n\n');

  const analysisPrompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are an expert at analyzing prediction patterns and styles.
      
      Analyze the given predictions from a single user to determine:
      
      1. Expertise areas: What topics does this user frequently make predictions about?
      2. Prediction style:
         - Confidence level: How confidently does the user state predictions? (0-1 scale)
         - Explicitness: Are predictions mostly explicit or implicit? (0-1 scale where 1 is fully explicit)
         - Evidence-based: Do they cite evidence or reasoning for predictions? (0-1 scale)
         - Time horizon: What's their typical prediction timeframe? (short/medium/long term)
      
      Also consider the user's bio when determining their expertise areas.`,
    ],
    [
      'human',
      `User Bio: "${userBio}"
      
      Predictions:
      ${predictionTexts}
      
      Please analyze this predictor's style and expertise areas.`,
    ],
  ]);

  try {
    // Create structured output
    const structuredLlm = config.cheap_large_llm.withStructuredOutput({
      expertise_areas: z.array(z.string()),
      prediction_style: z.object({
        confidence_level: z.number().min(0).max(1),
        explicitness: z.number().min(0).max(1),
        evidence_based: z.number().min(0).max(1),
        time_horizon: z.string(),
      }),
    });
    // Format the messages and call the LLM
    const formattedPrompt = await analysisPrompt.formatMessages({
      userBio,
      predictionTexts,
    });
    const result = await structuredLlm.invoke(formattedPrompt);

    // Calculate verified accuracy if available
    let verifiedAccuracy = null;
    const verifiedPredictions = predictions.filter(
      p => p.outcome === 'correct' || p.outcome === 'partially_correct' || p.outcome === 'incorrect'
    );

    if (verifiedPredictions.length > 0) {
      const correctCount = verifiedPredictions.filter(p => p.outcome === 'correct').length;
      const partialCount = verifiedPredictions.filter(
        p => p.outcome === 'partially_correct'
      ).length;
      verifiedAccuracy = (correctCount + partialCount * 0.5) / verifiedPredictions.length;
    }

    return {
      ...result,
      verified_accuracy: verifiedAccuracy,
    };
  } catch (error) {
    console.error('Error analyzing prediction style:', error);

    // Return basic analysis based on raw stats
    const implicitCount = predictions.filter(p => p.implicit).length;
    const explicitness = 1 - implicitCount / predictions.length;

    // Extract topics
    const topics = predictions.map(p => p.topic);
    const uniqueTopics = Array.from(new Set(topics));

    return {
      expertise_areas: uniqueTopics.slice(0, 5),
      prediction_style: {
        confidence_level: 0.5,
        explicitness: explicitness,
        evidence_based: 0.5,
        time_horizon: 'medium',
      },
      verified_accuracy: null,
    };
  }
}
