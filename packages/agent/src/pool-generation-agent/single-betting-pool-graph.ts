/**
 * A single post betting pool generator that processes one Truth Social post at a time.
 * This graph takes a Truth Social post and creates a betting pool by:
 * 1. Extracting search queries
 * 2. Performing parallel research (News API and Tavily)
 * 3. Generating a betting pool idea
 * 4. Generating an image
 * 5. Creating the betting pool on-chain
 *
 * IMPORTANT: This implementation replaces the previous commented version.
 * After reviewing this implementation, please remove the warning header at the top of the file.
 */
import type { BaseMessage } from '@langchain/core/messages';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import type { BettingChainConfig } from '../config';
import { DEFAULT_CHAIN_ID, config } from '../config';
import type { ResearchItem } from '../types/research-item';
import { createBettingPool } from './tools/create-betting-pool';
import { generateBettingPoolIdea } from './tools/generate-betting-pool-idea';
import { generateImage } from './tools/generate-image';
import { newsApiSearchFunctionSingle } from './tools/news-api';
import { extractAndScrapeExternalLink, hasExternalLink } from './tools/scrape-external-link';
import { extractSearchQueryFunctionSingle } from './tools/search-query';
import { tavilySearchFunction } from './tools/tavily-search';
import { upsertTruthSocialPost } from './tools/upsert-truth-social-post';

export const SingleResearchItemAnnotation = Annotation.Root({
  targetTruthSocialAccountId: Annotation<string>,
  chainConfig: Annotation<BettingChainConfig>({
    value: (curr, update) => update,
    default: () => config.chainConfig[DEFAULT_CHAIN_ID],
  }),
  research: Annotation<ResearchItem>({
    reducer: (curr, update) => {
      // If current item is empty, return the update
      if (!curr.truth_social_post?.id) return update;

      // If update item is empty, return current
      if (!update.truth_social_post?.id) return curr;

      // If IDs match, merge the items
      if (curr.truth_social_post.id === update.truth_social_post.id) {
        return {
          ...curr,
          ...update,
          transaction_hash: update.transaction_hash || curr.transaction_hash,
          pool_id: update.pool_id || curr.pool_id,
        };
      }

      // If IDs don't match, return the update as it's a new item
      return update;
    },
    default: () => ({
      truth_social_post: {
        id: '',
        created_at: new Date().toISOString(),
        in_reply_to_id: null,
        quote_id: null,
        in_reply_to_account_id: null,
        sensitive: false,
        spoiler_text: '',
        visibility: 'public',
        language: 'en',
        uri: '',
        url: '',
        content: '',
        account: {
          id: '',
          username: '',
          acct: '',
          display_name: '',
          locked: false,
          bot: false,
          discoverable: false,
          group: false,
          created_at: new Date().toISOString(),
          note: '',
          url: '',
          avatar: '',
          avatar_static: '',
          header: '',
          header_static: '',
          followers_count: 0,
          following_count: 0,
          statuses_count: 0,
          last_status_at: new Date().toISOString(),
          verified: false,
          location: '',
          website: '',
          unauth_visibility: false,
          chats_onboarded: false,
          feeds_onboarded: false,
          accepting_messages: false,
          show_nonmember_group_statuses: null,
          emojis: [],
          fields: [],
          tv_onboarded: false,
          tv_account: false,
        },
        media_attachments: [],
        mentions: [],
        tags: [],
        card: null,
      },
      should_process: false,
      transaction_hash: null,
      pool_id: null,
    }),
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: (curr, update) => [...curr, ...update],
    default: () => [],
  }),
});

export type SingleResearchItemState = typeof SingleResearchItemAnnotation.State;

// Function to check if we should proceed with processing
function shouldContinueProcessing(state: SingleResearchItemState): 'continue' | 'stop' {
  if (!state.research) return 'stop';

  // If the item is explicitly marked as should not process, stop
  if (state.research.should_process === false) return 'stop';

  // If the item already has a pool ID or transaction hash, it's already processed
  if (state.research.pool_id || state.research.transaction_hash) return 'stop';

  return 'continue';
}

// Create the graph
const builder = new StateGraph(SingleResearchItemAnnotation);

//TODO if the item should not be processed, we can still to end. Adding additional conditional edges to this could speed up the graph.
// Add nodes to the graph
builder
  .addNode('extract_search_query', extractSearchQueryFunctionSingle)
  .addNode('check_external_link', extractAndScrapeExternalLink)
  .addNode('news_api_search', newsApiSearchFunctionSingle)
  .addNode('tavily_search', tavilySearchFunction)
  .addNode('generate_betting_pool_idea', generateBettingPoolIdea)
  .addNode('generate_image', generateImage)
  .addNode('create_betting_pool', createBettingPool)
  .addNode('upsert_truth_social_post', upsertTruthSocialPost)
  .addEdge(START, 'extract_search_query')
  .addConditionalEdges('extract_search_query', shouldContinueProcessing, {
    continue: 'news_api_search',
    stop: END,
  })
  // Check if the post has an external link after news API search
  .addConditionalEdges('news_api_search', hasExternalLink, {
    scrape: 'check_external_link',
    skip: 'tavily_search',
  })
  // After scraping external link, proceed to tavily search
  .addEdge('check_external_link', 'tavily_search')
  .addEdge('tavily_search', 'generate_betting_pool_idea')
  .addConditionalEdges('generate_betting_pool_idea', shouldContinueProcessing, {
    continue: 'generate_image',
    stop: END,
  })
  // TODO we need to upsert the truth social post after generate image because image generation is extremely expensive.
  .addConditionalEdges('generate_image', shouldContinueProcessing, {
    continue: 'create_betting_pool',
    stop: END,
  })
  .addEdge('create_betting_pool', 'upsert_truth_social_post')
  .addEdge('upsert_truth_social_post', END);

// Compile the graph
export const singleBettingPoolGraph = builder.compile();
singleBettingPoolGraph.name = 'trump-fun-single-pool-creation';

// Export a function to run a single node for testing
export async function runSingleNode(
  nodeName: keyof typeof singleBettingPoolGraph.nodes,
  state: SingleResearchItemState
) {
  const node = singleBettingPoolGraph.nodes[nodeName];
  if (!node) {
    throw new Error(`Node '${nodeName}' not found in the graph`);
  }

  const result = await node.invoke(state);
  return result;
}
