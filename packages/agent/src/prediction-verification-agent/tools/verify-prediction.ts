import { ChatPromptTemplate } from '@langchain/core/prompts';
import axios from 'axios';
import { z } from 'zod';
import config from '../../config';

// Define schema for prediction verification
const _predictionVerificationSchema = z.object({
  prediction_text: z.string().describe('The original prediction text'),
  prediction_date: z.string().describe('When the prediction was made'),
  prediction_source: z.string().describe('Source of the prediction (URL, post ID)'),
  predictor_username: z.string().describe('Username of the person who made the prediction'),
  matured: z.boolean().describe('Whether the prediction has matured/resolved'),
  outcome: z.enum(['correct', 'partially_correct', 'incorrect', 'unverifiable', 'pending']),
  confidence_score: z
    .number()
    .min(0)
    .max(1)
    .describe('How confident are we in this verification (0-1)'),
  evidence_urls: z.array(z.string()).describe('URLs supporting the verification'),
  evidence_text: z.string().describe('Text explaining the evidence for verification'),
  verification_date: z.string().describe('When this verification was performed'),
});

export type PredictionVerification = z.infer<typeof _predictionVerificationSchema>;

/**
 * Verifies if a prediction has matured (proven right or wrong) and collects evidence
 *
 * @param params Parameters for prediction verification
 * @returns Verification results including evidence and outcome
 */
export async function verifyPrediction(params: {
  prediction_text: string;
  prediction_date: string;
  prediction_source: string;
  predictor_username: string;
}): Promise<PredictionVerification> {
  console.log(`Verifying prediction: "${params.prediction_text}" by @${params.predictor_username}`);

  // Step 1: Extract key claim(s) from the prediction
  const claims = await extractPredictionClaims(params.prediction_text);

  // Step 2: Search for evidence related to these claims
  const evidenceResults = await searchForVerificationEvidence(claims, params.prediction_date);

  // Step 3: Analyze evidence to determine if prediction matured and is correct/incorrect
  const verificationResult = await analyzePredictionEvidence(
    params.prediction_text,
    params.prediction_date,
    evidenceResults
  );

  // Step 4: Return the full verification object with defaults for any missing properties
  return {
    ...params,
    matured: verificationResult.matured ?? false,
    outcome: verificationResult.outcome ?? 'pending',
    confidence_score: verificationResult.confidence_score ?? 0,
    evidence_urls: verificationResult.evidence_urls ?? [],
    evidence_text: verificationResult.evidence_text ?? 'No evidence provided',
    verification_date: new Date().toISOString(),
  };
}

/**
 * Extracts key claims from a prediction text
 */
async function extractPredictionClaims(predictionText: string): Promise<string[]> {
  const claimsPrompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are an expert at extracting testable claims from predictions. 
      Extract the key claims made in the prediction that could be verified with evidence.
      Focus on specific, measurable outcomes rather than vague statements.
      Return ONLY a JSON array of strings, with each string being a single claim.`,
    ],
    ['human', `Prediction: ${predictionText}`],
  ]);

  try {
    const formattedPrompt = await claimsPrompt.format({});
    const result = await config.cheap_large_llm.invoke(formattedPrompt);
    let claims: string[] = [];

    // Parse the result, which should be a JSON array of strings
    try {
      const content = result.content.toString().trim();
      // Strip any markdown formatting
      const jsonString = content.replace(/```json|```/g, '').trim();
      claims = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Error parsing claims from LLM response:', parseError);
      // Fallback to simpler extraction
      claims = [predictionText];
    }

    console.log(`Extracted ${claims.length} claims from prediction:`, claims);
    return claims;
  } catch (error) {
    console.error('Error extracting claims:', error);
    return [predictionText];
  }
}

/**
 * Searches for evidence related to prediction claims across multiple sources
 */
async function searchForVerificationEvidence(
  claims: string[],
  predictionDate: string
): Promise<any[]> {
  const allEvidence: any[] = [];

  // Convert predictionDate to Date object
  const predDate = new Date(predictionDate);

  // Determine time window for searching evidence (from prediction date to now)
  const searchQuery = claims.join(' OR ');
  console.log(`Searching for evidence using query: ${searchQuery}`);

  try {
    // 1. Search using Datura Web Link Search API
    const webSearchResponse = await axios.post(
      'https://apis.datura.ai/desearch/ai/search/links/web',
      {
        prompt: `${searchQuery} verification evidence fact check`,
        tools: ['web', 'news', 'hackernews'],
        model: 'NOVA',
      },
      {
        headers: {
          Authorization: `Bearer ${config.daturaApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Process web search results
    if (webSearchResponse.data && webSearchResponse.data.search_results) {
      const webResults = webSearchResponse.data.search_results.organic_results || [];
      console.log(`Found ${webResults.length} web search results`);

      // Add relevant results to evidence
      for (const result of webResults) {
        allEvidence.push({
          url: result.link,
          title: result.title,
          snippet: result.snippet,
          source: 'web_search',
          date: result.date || 'unknown',
        });
      }
    }

    // 2. Search using Tavily for more targeted results
    if (config.tavilyApiKey) {
      try {
        const tavilyParams = {
          query: `${searchQuery} facts evidence verification`,
          search_depth: 'advanced',
          include_domains: [
            'reuters.com',
            'apnews.com',
            'bbc.com',
            'cnn.com',
            'foxnews.com',
            'bloomberg.com',
            'wsj.com',
            'nytimes.com',
          ],
          include_answer: true,
          max_results: 5,
        };

        const tavilyResponse = await axios.post('https://api.tavily.com/search', tavilyParams, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.tavilyApiKey}`,
          },
        });

        if (tavilyResponse.data && tavilyResponse.data.results) {
          console.log(`Found ${tavilyResponse.data.results.length} results from Tavily`);

          for (const result of tavilyResponse.data.results) {
            allEvidence.push({
              url: result.url,
              title: result.title,
              snippet: result.content.substring(0, 200),
              source: 'tavily',
              date: 'recent', // Tavily doesn't always provide dates
            });
          }
        }
      } catch (tavilyError) {
        console.error('Error searching Tavily:', tavilyError);
      }
    }

    // 3. Search X/Twitter for recent discussions
    try {
      const xSearchResponse = await axios.post(
        'https://apis.datura.ai/desearch/ai/search/links/twitter',
        {
          prompt: `${searchQuery} fact verification confirmed`,
          model: 'NOVA',
        },
        {
          headers: {
            Authorization: `Bearer ${config.daturaApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (xSearchResponse.data && xSearchResponse.data.miner_tweets) {
        const tweets = xSearchResponse.data.miner_tweets;
        console.log(`Found ${tweets.length} relevant X/Twitter posts`);

        for (const tweet of tweets) {
          // Only include tweets that are from after the prediction date
          const tweetDate = new Date(tweet.created_at);
          if (tweetDate > predDate) {
            allEvidence.push({
              url: tweet.url || `https://x.com/i/status/${tweet.id}`,
              title: `Tweet by @${tweet.user?.username || 'unknown'}`,
              snippet: tweet.text,
              source: 'twitter',
              date: tweet.created_at,
              engagement: {
                likes: tweet.like_count,
                retweets: tweet.retweet_count,
                replies: tweet.reply_count,
              },
            });
          }
        }
      }
    } catch (xSearchError) {
      console.error('Error searching X/Twitter:', xSearchError);
    }

    return allEvidence;
  } catch (error) {
    console.error('Error searching for verification evidence:', error);
    return [];
  }
}

/**
 * Analyzes collected evidence to determine if the prediction is correct/incorrect
 */
async function analyzePredictionEvidence(
  prediction: string,
  predictionDate: string,
  evidence: any[]
): Promise<Partial<PredictionVerification>> {
  // If no evidence found, return unverifiable
  if (evidence.length === 0) {
    return {
      matured: false,
      outcome: 'pending',
      confidence_score: 0,
      evidence_urls: [],
      evidence_text: 'No relevant evidence found to verify this prediction.',
    };
  }

  // Format evidence for the LLM
  const evidenceText = evidence
    .map(
      (e, i) =>
        `Evidence ${i + 1}: [${e.source}] ${e.title}\nURL: ${e.url}\nDate: ${e.date}\nContent: ${e.snippet}`
    )
    .join('\n\n');

  const verificationPrompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are an expert at verifying predictions based on evidence.
      
      Analyze the prediction and the provided evidence to determine:
      1. Has the prediction matured (enough time has passed that we can say if it was right or wrong)?
      2. What was the outcome (correct, partially correct, incorrect, unverifiable, or still pending)?
      3. How confident are we in this verification (0-1 scale)?
      
      Consider:
      - The specificity of the prediction
      - The credibility of the evidence sources
      - The timeframe of the prediction
      - Any contradictory evidence
      
      Only mark a prediction as "correct" or "incorrect" if there is clear evidence.
      If the evidence is mixed, use "partially_correct".
      If there's insufficient evidence, use "unverifiable".
      If more time is needed for the prediction to mature, use "pending".
      
      Provide a clear explanation summarizing how the evidence supports your conclusion.`,
    ],
    [
      'human',
      `Prediction: "${prediction}"
      Prediction Date: ${predictionDate}
      Current Date: ${new Date().toISOString()}
      
      Evidence:
      ${evidenceText}
      
      Please verify this prediction based on the evidence provided.`,
    ],
  ]);

  try {
    // Create structured output
    const structuredLlm = config.large_llm.withStructuredOutput({
      matured: z.boolean(),
      outcome: z.enum(['correct', 'partially_correct', 'incorrect', 'unverifiable', 'pending']),
      confidence_score: z.number().min(0).max(1),
      evidence_text: z.string(),
    });

    // Format the prompt into messages before invoking
    const formattedPrompt = await verificationPrompt.formatMessages({});
    // Call the LLM
    const result = await structuredLlm.invoke(formattedPrompt);

    // Get evidence URLs from the top 3 most relevant pieces of evidence
    const evidenceUrls = evidence.slice(0, Math.min(evidence.length, 3)).map(e => e.url);

    return {
      ...result,
      evidence_urls: evidenceUrls,
    };
  } catch (error) {
    console.error('Error analyzing prediction evidence:', error);

    // Fallback response
    return {
      matured: false,
      outcome: 'unverifiable',
      confidence_score: 0,
      evidence_urls: [],
      evidence_text: 'Error analyzing evidence: ' + String(error),
    };
  }
}

/**
 * Batch verify multiple predictions
 */
export async function verifyPredictionBatch(
  predictions: {
    prediction_text: string;
    prediction_date: string;
    prediction_source: string;
    predictor_username: string;
  }[]
): Promise<PredictionVerification[]> {
  console.log(`Batch verifying ${predictions.length} predictions`);

  // Process predictions in batches of 5 to avoid rate limiting
  const batchSize = 5;
  const results: PredictionVerification[] = [];

  for (let i = 0; i < predictions.length; i += batchSize) {
    const batch = predictions.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}...`);

    const batchPromises = batch.map(pred => verifyPrediction(pred));
    const batchResults = await Promise.all(batchPromises);

    results.push(...batchResults);

    // Add a small delay between batches
    if (i + batchSize < predictions.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}
