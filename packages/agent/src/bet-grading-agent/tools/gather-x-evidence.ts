import { ChatPromptTemplate } from '@langchain/core/prompts';
import axios from 'axios';
import { z } from 'zod';
import { config } from '../../config';
import type { GraderState, PendingPool } from '../betting-grader-graph';
import type { Evidence } from './gather-evidence';

/**
 * Gathers evidence from Twitter/X search queries for all non-failed pools
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
        - Note any links to external sources or data that supports the tweet's claims`,
      ],
      [
        'human',
        `SEARCH QUERY: {query}

        TWEET URL: {url}
        
        TWEET CONTENT: {content}
        
        AUTHOR: {author}
        
        ENGAGEMENT: {engagement}`,
      ],
    ]);

    // Process Twitter search queries for this pool
    for (const query of pendingPool.xSearchQueries) {
      try {
        console.log(`Searching Twitter/X for pool ${poolId} with query: ${query}`);

        // Initiate the Twitter/X search
        const searchResponse = await axios.post(
          'https://api.datura.ai/v1/x/searches',
          {
            query: query,
            count: 5, // Get 5 tweets per query
          },
          {
            headers: {
              Authorization: `Bearer ${config.daturaApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // Get the search ID from the response
        const searchId = searchResponse.data.search_id;
        console.log(`Initiated Twitter/X search with ID: ${searchId}`);

        // Poll for results (in a real implementation, you might want to add a timeout/retry logic)
        let searchResults;
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
          attempts++;

          // Wait before checking results
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Get search results
          const resultsResponse = await axios.get(
            `https://api.datura.ai/v1/x/searches/${searchId}`,
            {
              headers: {
                Authorization: `Bearer ${config.daturaApiKey}`,
              },
            }
          );

          // Check if search is complete
          if (resultsResponse.data.status === 'completed') {
            searchResults = resultsResponse.data.tweets;
            console.log(`Found ${searchResults.length} tweets for query: ${query}`);
            break;
          }

          console.log(`Search status: ${resultsResponse.data.status}, waiting...`);
        }

        if (!searchResults) {
          console.error(`Failed to get Twitter/X search results after ${maxAttempts} attempts`);
          continue;
        }

        // Process each tweet
        for (const tweet of searchResults) {
          // Create structured LLM
          const structuredLlm = config.cheap_large_llm.withStructuredOutput(xEvidenceSchema, {
            name: 'gatherXEvidence',
          });

          // Format the prompt with the tweet information
          const formattedPrompt = await xEvidencePrompt.formatMessages({
            question: pendingPool.pool.question,
            options: pendingPool.pool.options,
            query: query,
            url: `https://x.com/${tweet.username}/status/${tweet.tweet_id}`,
            content: tweet.text,
            author: `@${tweet.username} ${tweet.verified ? '(Verified)' : ''} - Followers: ${tweet.followers_count}`,
            engagement: `Likes: ${tweet.favorite_count}, Retweets: ${tweet.retweet_count}, Replies: ${tweet.reply_count}`,
          });

          // Call the LLM with the formatted prompt
          const result = await structuredLlm.invoke(formattedPrompt);
          console.log(
            `Tweet summary for @${tweet.username}: ${result.summary.substring(0, 100)}...`
          );

          // Add the search query
          result.search_query = query;

          xEvidenceList.push(result);
        }
      } catch (error) {
        console.error(`Error processing Twitter/X query '${query}' for pool ${poolId}:`, error);
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
