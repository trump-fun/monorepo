import { ChatPromptTemplate } from '@langchain/core/prompts';
import axios from 'axios';
import { z } from 'zod';
import { config } from '../../config';
import type { GraderState, PendingPool } from '../betting-grader-graph';
import type { Evidence } from './gather-evidence';

/**
 * Gathers evidence from Twitter/X search queries for all non-failed pools
 * Uses a combination of basic and AI-powered search for more comprehensive results
 */
export async function gatherXEvidence(state: GraderState): Promise<Partial<GraderState>> {
  console.log('Gathering evidence from Twitter/X queries for all pools');

  if (Object.keys(state.pendingPools).length === 0) {
    console.error('No pending pools to gather Twitter/X evidence for');
    return { pendingPools: {} };
  }

  // Define the expected output schema
  const xEvidenceSchema = z.object({
    url: z.string(),
    summary: z.string(),
    search_query: z.string(),
    isCredible: z.boolean(),
    credibilityReasoning: z.string(),
    canGradeBet: z.boolean(),
    gradingRelevance: z.string(),
    aiGeneratedLikelihood: z.number().min(0).max(1),
    supportingLinks: z.array(z.string()),
  });

  const updatedPendingPools: Record<string, PendingPool> = {};
  for (const [poolId, pendingPool] of Object.entries(state.pendingPools)) {
    // Skip pools that have failed or don't have Twitter search queries
    if (
      pendingPool.failed ||
      !pendingPool.xSearchQueries ||
      pendingPool.xSearchQueries.length === 0
    ) {
      console.log(`Skipping pool ${poolId} - failed or no Twitter search queries`);
      updatedPendingPools[poolId] = {
        ...pendingPool,
        failed:
          pendingPool.failed ||
          !pendingPool.xSearchQueries ||
          pendingPool.xSearchQueries.length === 0,
      };
      continue;
    }

    const xEvidenceList: Evidence[] = [];

    const xEvidencePrompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a Twitter/X analysis assistant that identifies and summarizes relevant evidence.
        For the given search query and tweet results, extract information that helps determine the outcome of a betting pool.
        
        BETTING CONTEXT:
        What users are betting on: {question}
        
        Options: {options}

        Guidelines:
        - Only include tweets that provide substantive information about the outcome
        - Summarize the key points from the tweet in 2-3 sentences
        - Consider the credibility of the tweet author (verified status, follower count, expertise)
        - Note any links to external sources or data that supports the tweet's claims
        - Explicitly evaluate the credibility of the source (true/false)
        - Provide reasoning for your credibility assessment in one sentence
        - Evaluate whether this tweet contains information that can help determine the bet outcome (true/false)
        - Explain in one sentence why this tweet is or isn't relevant for grading this bet
        - Estimate the likelihood this content was AI-generated (0 to 1 scale)
        - Extract any links or references from the tweet that support its claims`,
      ],
      [
        'human',
        `SEARCH QUERY: {query}

        TWEET URL: {url}
        
        TWEET CONTENT: {content}
        
        AUTHOR: {author}
        
        ENGAGEMENT: {engagement}
        
        In your JSON response, include:
        - A summary of the tweet
        - Whether this is a credible source (isCredible: true/false)
        - One sentence explaining your credibility assessment (credibilityReasoning)
        - Whether this tweet can help grade the bet (canGradeBet: true/false)
        - One sentence explaining its relevance to grading (gradingRelevance)
        - The likelihood this was AI-generated from 0 to 1 (aiGeneratedLikelihood)
        - An array of any supporting links mentioned (supportingLinks)`,
      ],
    ]);

    // Process Twitter search queries for this pool using both standard and AI-powered search
    for (const query of pendingPool.xSearchQueries) {
      try {
        console.log(`Searching Twitter/X for pool ${poolId} with query: ${query}`);
        let searchResults: any[] = [];

        // Try basic search first (faster and less expensive)
        try {
          const basicSearchResponse = await axios.get('https://apis.datura.ai/twitter', {
            params: {
              query: query,
              count: 5, // Get 5 tweets per query
              sort: 'Top', // Get most relevant tweets first
              min_retweets: 5, // Set minimum engagement for better quality results
            },
            headers: {
              Authorization: `Bearer ${config.daturaApiKey}`,
              'Content-Type': 'application/json',
            },
          });

          // Check if the basic search returned results
          if (Array.isArray(basicSearchResponse.data) && basicSearchResponse.data.length > 0) {
            searchResults = basicSearchResponse.data;
            console.log(`Basic search returned ${searchResults.length} tweets for query: ${query}`);
          } else if (basicSearchResponse.data && basicSearchResponse.data.search_id) {
            // If response contains a search_id, it's using the async API pattern
            const searchId = basicSearchResponse.data.search_id;
            console.log(`Initiated Twitter/X search with ID: ${searchId}`);

            // Wait a reasonable time for the search to complete
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Get search results
            const resultsResponse = await axios.get(`https://apis.datura.ai/twitter/${searchId}`, {
              headers: {
                Authorization: `Bearer ${config.daturaApiKey}`,
              },
            });

            if (resultsResponse.data.status === 'completed' && resultsResponse.data.tweets) {
              searchResults = resultsResponse.data.tweets;
              console.log(`Retrieved ${searchResults.length} tweets from search ID: ${searchId}`);
            }
          }
        } catch (error: any) {
          console.warn(
            `Basic search failed for query '${query}', falling back to AI search: ${error.message}`
          );
        }

        // If basic search returned no results, try AI-powered search
        if (searchResults.length === 0) {
          try {
            const aiSearchResponse = await axios.post(
              'https://apis.datura.ai/desearch/ai/search/links/twitter',
              {
                prompt: `${query} - relevant to: ${pendingPool.pool.question}`,
                model: 'NOVA', // Using NOVA model as specified in the docs
              },
              {
                headers: {
                  Authorization: `Bearer ${config.daturaApiKey}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (
              aiSearchResponse.data &&
              aiSearchResponse.data.miner_tweets &&
              Array.isArray(aiSearchResponse.data.miner_tweets) &&
              aiSearchResponse.data.miner_tweets.length > 0
            ) {
              searchResults = aiSearchResponse.data.miner_tweets;
              console.log(`AI search returned ${searchResults.length} tweets for query: ${query}`);
            }
          } catch (error: any) {
            console.error(`AI search failed for query '${query}': ${error.message}`);
          }
        }

        // Early termination if no results found from either search method
        if (searchResults.length === 0) {
          console.log(`No tweets found for query: ${query}. Moving to next query.`);
          continue;
        }

        // Process each tweet
        for (const tweet of searchResults) {
          try {
            // Create structured LLM
            const structuredLlm = config.cheap_large_llm.withStructuredOutput(xEvidenceSchema, {
              name: 'gatherXEvidence',
            });

            // Extract tweet data (handling different API response formats)
            const username = tweet.username || (tweet.user ? tweet.user.username : 'unknown');
            const tweetId = tweet.tweet_id || tweet.id;
            const tweetText = tweet.text;
            const verified =
              tweet.verified ||
              (tweet.user ? tweet.user.verified || tweet.user.is_blue_verified : false);
            const followersCount =
              tweet.followers_count || (tweet.user ? tweet.user.followers_count : 0);
            const favoriteCount =
              tweet.favorite_count ||
              tweet.like_count ||
              (tweet.metrics ? tweet.metrics.like_count : 0);
            const retweetCount =
              tweet.retweet_count || (tweet.metrics ? tweet.metrics.retweet_count : 0);
            const replyCount = tweet.reply_count || (tweet.metrics ? tweet.metrics.reply_count : 0);

            // Format the prompt with the tweet information
            const formattedPrompt = await xEvidencePrompt.formatMessages({
              question: pendingPool.pool.question,
              options: pendingPool.pool.options,
              query: query,
              url: `https://x.com/${username}/status/${tweetId}`,
              content: tweetText,
              author: `@${username} ${verified ? '(Verified)' : ''} - Followers: ${followersCount || 'unknown'}`,
              engagement: `Likes: ${favoriteCount || 'unknown'}, Retweets: ${retweetCount || 'unknown'}, Replies: ${replyCount || 'unknown'}`,
            });

            // Call the LLM with the formatted prompt
            const result = await structuredLlm.invoke(formattedPrompt);
            console.log(
              `Tweet summary for @${username}: ${result.summary.substring(0, 100)}... (Credible: ${result.isCredible}, Can Grade: ${result.canGradeBet})`
            );

            // Add the search query
            result.search_query = query;

            // Only add evidence if it comes from a credible source AND can help grade the bet
            if (result.isCredible && result.canGradeBet) {
              // Check for duplicates before adding
              const isDuplicate = xEvidenceList.some(evidence => evidence.url === result.url);

              if (!isDuplicate) {
                xEvidenceList.push(result);
              } else {
                console.log(`Skipping duplicate evidence from URL: ${result.url}`);
              }
            } else if (!result.isCredible) {
              console.log(
                `Skipping non-credible evidence from @${username}: ${result.credibilityReasoning}`
              );
            } else {
              console.log(
                `Skipping irrelevant tweet from @${username}: ${result.gradingRelevance}`
              );
            }
          } catch (error: any) {
            console.error(`Error processing tweet: ${error.message}`);
            continue;
          }
        }
      } catch (error: any) {
        // Distinguish between bad requests and other errors for the search initiation
        if (error.response && error.response.status === 400) {
          console.error(
            `Bad request error for query '${query}'. Query may be invalid:`,
            error.response.data
          );
          // Don't retry bad queries
        } else if (error.response && error.response.status === 429) {
          // Handle rate limiting
          const retryAfter = error.response.headers['retry-after'] || 60;
          console.warn(`Rate limited on Twitter/X search. Retry after ${retryAfter} seconds.`);
          // Wait and retry could be implemented here
        } else {
          console.error(`Error processing Twitter/X query '${query}' for pool ${poolId}:`, error);
          // For other errors, we might retry in a future grading cycle
        }
        continue;
      }
    }

    console.log(`Gathered ${xEvidenceList.length} pieces of Twitter/X evidence for pool ${poolId}`);

    // Return updated pool with Twitter evidence
    updatedPendingPools[poolId] = {
      ...pendingPool,
      xEvidence: xEvidenceList,
    };
  }

  return { pendingPools: updatedPendingPools };
}
