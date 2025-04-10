import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import axios from 'axios';
import config from '../../config';
import { PredictionResult as BasePredictionResult } from '../../prediction-finder-agent/tools/find-predictions';

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
      prediction_text: p.prediction_text,
      prediction_date: p.post_date,
      post_id: p.post_id,
      post_url: p.post_url,
      topic: p.topic,
      implicit: p.implicit,
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
async function getUserPosts(username: string, count: number = 100): Promise<any[]> {
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

  // Skip very short posts as they're unlikely to contain predictions
  if (postText.length < 30) {
    return null;
  }

  const predictionPrompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are an expert at identifying predictions in social media posts.
      
      Analyze the given post to determine if it contains a prediction.
      A prediction is a statement about future events or outcomes. It can be:
      - Explicit: "I predict X will happen"
      - Implicit: "X is inevitable" or "X won't last long"
      
      If the post does NOT contain a prediction, respond with: { "is_prediction": false }
      
      If the post DOES contain a prediction:
      1. Extract the specific prediction text
      2. Determine if it's implicit or explicit
      3. Identify the topic area of the prediction
      4. Assess the timeframe (immediate, days, weeks, months, years)
      5. Note if it has conditional elements ("if X then Y")
      6. Rate your confidence that this is a genuine prediction (0-1)
      
      Focus on finding genuine forecasts about the future, not just opinions.`,
    ],
    [
      'human',
      `Post: "{post_text}"
      
      Does this post contain a prediction? If so, analyze it.`,
    ],
  ]);

  try {
    // Create structured output
    const structuredLlm = config.cheap_large_llm.withStructuredOutput(
      z.union([
        z.object({
          is_prediction: z.literal(false),
        }),
        z.object({
          is_prediction: z.literal(true),
          prediction_text: z.string(),
          implicit: z.boolean(),
          topic: z.string(),
          timeframe: z.string(),
          has_condition: z.boolean(),
          confidence_score: z.number().min(0).max(1),
        }),
      ])
    );

    // Format the messages and call the LLM
    const formattedPrompt = await predictionPrompt.formatMessages({ post_text: postText });
    const result = await structuredLlm.invoke(formattedPrompt);

    // If not a prediction, return null
    if (!result.is_prediction) {
      return null;
    }

    // Return the prediction with metadata
    return {
      prediction_text: result.prediction_text,
      implicit: result.implicit,
      post_id: postId,
      post_url: postUrl,
      author_username: username,
      author_name: authorName,
      post_date: postDate,
      topic: result.topic,
      timeframe: result.timeframe,
      has_condition: result.has_condition,
      confidence_score: result.confidence_score,
      topic_relevance: 1.0, // Always relevant since we're extracting the topic from the prediction itself
    };
  } catch (error) {
    console.error(`Error analyzing post ${postId}:`, error);
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
