import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import axios from 'axios';
import config from '../../config';

// Define schema for prediction detection
const _predictionSchema = z.object({
  prediction_text: z.string().describe('The text of the prediction'),
  confidence_score: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence that this is a genuine prediction (0-1)'),
  implicit: z.boolean().describe('Whether the prediction is implicit or explicit'),
  topic_relevance: z
    .number()
    .min(0)
    .max(1)
    .describe('How relevant the prediction is to the given topic (0-1)'),
  timeframe: z
    .enum(['immediate', 'days', 'weeks', 'months', 'years', 'decades', 'uncertain'])
    .describe('Predicted timeframe for the event'),
  has_condition: z
    .boolean()
    .describe('Whether the prediction has conditional elements (if X then Y)'),
  prediction_sentiment: z
    .enum(['positive', 'negative', 'neutral'])
    .optional()
    .describe('The sentiment expressed in the prediction'),
  probability_stated: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('Explicit probability mentioned in prediction (0-1)'),
});

export type PredictionResult = z.infer<typeof _predictionSchema> & {
  post_id: string;
  post_url: string;
  author_username: string;
  author_name: string;
  post_date: string;
  topic: string;
};

/**
 * Finds X posts containing explicit or implicit predictions related to a Polymarket topic
 *
 * @param topic Polymarket topic to search for predictions about
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

  // Step 2: Search for posts using the search queries through Datura API
  const rawResults = await searchForPredictionPosts(searchQueries, limit);

  // Step 3: Filter and analyze posts to identify predictions
  const predictions = await analyzePredictionCandidates(rawResults, topic);

  return predictions;
}

/**
 * Generates effective search queries for finding predictions on a topic
 */
async function generatePredictionSearchQueries(topic: string): Promise<string[]> {
  const searchQueryPrompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are an expert at generating effective search queries to find predictions on social media platforms like X/Twitter.
      Given a topic from the prediction market Polymarket, generate 3-5 search queries that would find posts containing predictions related to this topic.
      
      For each query:
      1. Include common prediction phrases like "I predict", "will happen", "going to be", "bet that", etc.
      2. Include relevant keywords from the topic
      3. Consider both explicit predictions ("I predict X") and implicit predictions ("X is inevitable")
      4. Format as proper Twitter search syntax with operators like OR, AND, -filter:replies where appropriate
      
      Return ONLY a JSON array of strings, with each string being a search query.`,
    ],
    ['human', `Polymarket Topic: ${topic}`],
  ]);

  try {
    const formattedPrompt = await searchQueryPrompt.formatMessages({ topic });
    const result = await config.cheap_large_llm.invoke(formattedPrompt);
    let queries: string[] = [];

    // Parse the result, which should be a JSON array of strings
    try {
      const content = result.content.toString().trim();
      // Strip any markdown formatting
      const jsonString = content.replace(/```json|```/g, '').trim();
      queries = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Error parsing search queries from LLM response:', parseError);
      // Fallback to basic queries
      queries = [
        `${topic} predict OR prediction OR "will happen" OR "going to" -filter:replies`,
        `${topic} forecast OR outlook OR future -filter:replies`,
      ];
    }

    console.log(`Generated ${queries.length} search queries for topic "${topic}":`, queries);
    return queries;
  } catch (error) {
    console.error('Error generating search queries:', error);
    // Fallback to a basic query
    return [`${topic} predict OR prediction OR "will happen" OR "going to" -filter:replies`];
  }
}

/**
 * Interface for Twitter Scraper Media from Datura API
 */
interface TwitterScraperMedia {
  media_url: string;
  type: string;
}

/**
 * Interface for Twitter Scraper User from Datura API
 */
interface TwitterScraperUser {
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
interface TwitterScraperTweet {
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

/**
 * Searches for posts using the generated queries
 */
async function searchForPredictionPosts(
  queries: string[],
  limit: number
): Promise<TwitterScraperTweet[]> {
  const allResults: TwitterScraperTweet[] = [];
  const postsPerQuery = Math.ceil(limit / queries.length);

  for (const query of queries) {
    try {
      console.log(`Searching X/Twitter with query: ${query}`);

      // Modified API call to match the OpenAPI spec exactly
      const searchResponse = await axios.get('https://apis.datura.ai/twitter', {
        params: {
          query: query,
          count: Math.min(postsPerQuery, 100), // API maximum is 100
          sort: 'Top', // Must be 'Top' or 'Latest' according to API spec
          lang: 'en', // Language code for English
        },
        headers: {
          Authorization: `Bearer ${config.daturaApiKey}`,
          'Content-Type': 'application/json',
        },
        validateStatus: status => status < 500, // Handle HTTP errors gracefully
      });

      if (searchResponse.status === 200) {
        // Success - process the returned tweets
        if (Array.isArray(searchResponse.data) && searchResponse.data.length > 0) {
          console.log(`Found ${searchResponse.data.length} results for query "${query}"`);
          allResults.push(...searchResponse.data);
        }
      } else if (searchResponse.status === 422) {
        // Validation error - simplify the query and try again
        console.error(`Validation error for query "${query}":`, searchResponse.data.detail);

        // Create a simplified version of the query without special operators
        const simplifiedQuery = query
          .split(' ')
          .filter(term => !term.includes(':') && !term.includes('"'))
          .slice(0, 3)
          .join(' ');

        console.log(`Trying simplified query: ${simplifiedQuery}`);

        // Try the simplified query
        try {
          const retryResponse = await axios.get('https://apis.datura.ai/twitter', {
            params: {
              query: simplifiedQuery,
              count: Math.min(postsPerQuery, 100),
              sort: 'Top',
            },
            headers: {
              Authorization: `Bearer ${config.daturaApiKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (Array.isArray(retryResponse.data) && retryResponse.data.length > 0) {
            console.log(`Found ${retryResponse.data.length} results for simplified query`);
            allResults.push(...retryResponse.data);
          }
        } catch (retryError) {
          console.error(`Error with simplified query:`, retryError);
        }
      } else if (searchResponse.status === 429) {
        // Rate limiting - wait before trying next query
        const retryAfter = searchResponse.data.detail?.retry_after || 60;
        console.warn(`Rate limited. Waiting ${retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      } else {
        console.error(
          `API error ${searchResponse.status} for query "${query}":`,
          searchResponse.data
        );
      }
    } catch (error: any) {
      console.error(`Error searching with query "${query}":`, error.message || error);
    }

    // Small delay between queries to avoid rate limiting
    if (queries.indexOf(query) < queries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Remove duplicates based on tweet ID
  const uniqueResults = allResults.filter(
    (post, index, self) => post.id && index === self.findIndex(p => p.id === post.id)
  );

  console.log(`Found ${uniqueResults.length} unique posts across all queries`);
  return uniqueResults.slice(0, limit);
}

/**
 * Analyzes posts to identify which ones contain predictions
 */
async function analyzePredictionCandidates(
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
 */
async function analyzeSinglePost(
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

  const predictionPrompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are an expert at identifying predictions in social media posts.
      
      Analyze the given post to determine if it contains a prediction related to the specified topic.
      
      A prediction is a statement about future events or outcomes. It can be:
      - Explicit: "I predict X will happen"
      - Implicit: "X is inevitable" or "X won't last long"
      
      Consider:
      1. Does the post make a claim about a future event or outcome?
      2. Is the prediction related to the given topic?
      3. How confident are you that this is a genuine prediction?
      4. What timeframe does the prediction cover?
      
      If the post does NOT contain a prediction, respond with: { "is_prediction": false }
      
      If the post DOES contain a prediction, analyze it according to the specified structure.`,
    ],
    [
      'human',
      `Post: "${postText}"
      Topic: ${topic}
      
      Does this post contain a prediction related to the topic? If so, analyze it.`,
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
          confidence_score: z.number().min(0).max(1),
          implicit: z.boolean(),
          topic_relevance: z.number().min(0).max(1),
          timeframe: z.string(),
          has_condition: z.boolean(),
        }),
      ])
    );

    // Format the prompt into messages and then invoke the LLM
    const formattedPrompt = await predictionPrompt.formatMessages({
      postText: postText,
      topic: topic,
    });
    const result = await structuredLlm.invoke(formattedPrompt);

    // If not a prediction, return null
    if (!result.is_prediction) {
      return null;
    }

    // Normalize the timeframe to match our expected values
    let normalizedTimeframe: string = result.timeframe.toLowerCase();
    const validTimeframes = [
      'immediate',
      'days',
      'weeks',
      'months',
      'years',
      'decades',
      'uncertain',
    ];

    if (!validTimeframes.includes(normalizedTimeframe)) {
      // Map non-standard timeframes to the closest match
      if (normalizedTimeframe.includes('day') || normalizedTimeframe.includes('tomorrow')) {
        normalizedTimeframe = 'days';
      } else if (normalizedTimeframe.includes('week')) {
        normalizedTimeframe = 'weeks';
      } else if (normalizedTimeframe.includes('month')) {
        normalizedTimeframe = 'months';
      } else if (normalizedTimeframe.includes('year')) {
        normalizedTimeframe = 'years';
      } else if (
        normalizedTimeframe.includes('decade') ||
        normalizedTimeframe.includes('century')
      ) {
        normalizedTimeframe = 'decades';
      } else if (normalizedTimeframe.includes('now') || normalizedTimeframe.includes('current')) {
        normalizedTimeframe = 'immediate';
      } else {
        normalizedTimeframe = 'uncertain';
      }
    }

    // Return the prediction with metadata
    return {
      prediction_text: result.prediction_text,
      confidence_score: result.confidence_score,
      implicit: result.implicit,
      topic_relevance: result.topic_relevance,
      timeframe: normalizedTimeframe as any,
      has_condition: result.has_condition,
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
