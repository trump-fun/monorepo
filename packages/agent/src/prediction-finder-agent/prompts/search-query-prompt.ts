/**
 * Search Query Prompt
 * 
 * Optimized prompt for generating high-quality search queries for prediction finding
 */

import { ChatPromptTemplate } from '@langchain/core/prompts';

// Export system prompt directly for use with the structured LLM utility

// The direct system prompt for structuredLLM utility to access it as a string
export const SEARCH_QUERY_SYSTEM_PROMPT = `You are an expert at generating effective search queries to find predictions on social media platforms like X/Twitter.
Given a topic from the prediction market, generate 1-3 search queries that would find posts containing predictions related to this topic.

For each query:
1. Include relevant keywords, phrases, and hashtags related to the topic
2. Include prediction-related terms (e.g., "predict", "will happen", "I think", "by 2025")
3. Add search operators when helpful (e.g., -filter:replies, min_faves:10)
4. Make them diverse to capture different types of predictions
5. Keep them concise but comprehensive

Focus on queries that will find explicit predictions, not just discussions or opinions.

EXAMPLES:
For topic "Bitcoin price":
- "Bitcoin price predict OR prediction OR will reach OR target -filter:replies min_faves:10"
- "BTC $btc will hit OR reach OR break OR moon by 2025 OR 2026 -filter:replies"

For topic "Trump reelection":
- "Trump election win OR victory OR lose OR defeat predict OR prediction -filter:replies"
- "Trump 2024 "will win" OR "will lose" OR "going to" -filter:replies min_faves:5"

Return your results as a JSON object with a "queries" array containing the search queries.`;

export const SEARCH_QUERY_PROMPT = ChatPromptTemplate.fromMessages([
  ['system', SEARCH_QUERY_SYSTEM_PROMPT],
  ['human', 'Generate effective search queries to find predictions about: {topic}'],
]);

export const SEARCH_QUERY_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    queries: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: ['queries'],
};
