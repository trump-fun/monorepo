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
import config, { DEFAULT_CHAIN_ID } from '../config';
import type { ResearchItem } from '../types/research-item';
import { createBettingPool as createBettingPoolEvm } from './tools/create-betting-pool';
import { createBettingPoolSolana } from './tools/create-betting-pool-solana';
import { generateBettingPoolIdea } from './tools/generate-betting-pool-idea';
import { generateImageFlux } from './tools/generate-image-flux';
import { newsApiSearchFunctionSingle } from './tools/news-api';
import { extractAndScrapeExternalLink, hasExternalLink } from './tools/scrape-external-link';
import { extractSearchQueryFunctionSingle } from './tools/search-query';
import { sendTgMessage } from './tools/send-tg-message';
import { tavilySearchFunctionSingle } from './tools/tavily-search';
import { upsertTruthSocialPost } from './tools/upsert-truth-social-post';

export const SingleResearchItemAnnotation = Annotation.Root({
  targetTruthSocialAccountId: Annotation<string>,
  chainId: Annotation<string>({
    value: (curr, update) => update,
    default: () => DEFAULT_CHAIN_ID,
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
  console.log('shouldContinueProcessing', state);
  if (!state.research) return 'stop';

  // If the item is explicitly marked as should not process, stop
  if (state.research.should_process === false) return 'stop';

  // If the item already has a pool ID or transaction hash, it's already processed
  if (state.research.pool_id || state.research.transaction_hash) return 'stop';

  return 'continue';
}

// Function to check if source tracing should be performed
function shouldTraceSource(state: SingleResearchItemState): 'trace' | 'skip' {
  if (!state.research || state.research.should_process === false) return 'skip';
  if (state.research.source_tracing_complete === true) return 'skip';

  // Skip source tracing if there's no external link and no related news
  const hasExternalContent =
    state.research.external_link_url ||
    (state.research.related_news_urls && state.research.related_news_urls.length > 0) ||
    state.research.truth_social_post.card?.url;

  return hasExternalContent ? 'trace' : 'skip';
}

// Create the graph
const builder = new StateGraph(SingleResearchItemAnnotation);

function selectChainType(state: SingleResearchItemState): 'evm' | 'solana' | 'default' {
  if (config.chainConfig[state.chainId]?.chainType === 'evm') {
    return 'evm';
  } else if (config.chainConfig[state.chainId]?.chainType === 'solana') {
    return 'solana';
  }
  return 'default';
}

// Node function that just passes through the state
async function chooseChainNode(
  state: SingleResearchItemState
): Promise<Partial<SingleResearchItemState>> {
  return state;
}

// Add nodes to the graph
builder
  .addNode('extract_search_query', extractSearchQueryFunctionSingle)
  .addNode('check_external_link', extractAndScrapeExternalLink)
  .addNode('news_api_search', newsApiSearchFunctionSingle)
  .addNode('tavily_search', tavilySearchFunctionSingle)
  // .addNode('trace_source_chain', traceSourceChain) // Add the new node
  .addNode('generate_betting_pool_idea', generateBettingPoolIdea)
  // .addNode('generate_image', generateImageVenice)
  .addNode('generate_image', generateImageFlux)
  .addNode('choose_chain', chooseChainNode)
  .addNode('create_betting_pool_evm', createBettingPoolEvm)
  .addNode('create_betting_pool_solana', createBettingPoolSolana)
  .addNode('upsert_truth_social_post', upsertTruthSocialPost)
  .addNode('send_tg_message', sendTgMessage)
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
  // After tavily search, conditionally trace sources
  // .addConditionalEdges('tavily_search', shouldTraceSource, {
  //   trace: 'trace_source_chain',
  //   skip: 'generate_betting_pool_idea',
  // })
  // After source tracing, generate betting pool idea
  .addEdge('tavily_search', 'generate_betting_pool_idea')
  .addConditionalEdges('generate_betting_pool_idea', shouldContinueProcessing, {
    continue: 'generate_image',
    stop: END,
  })
  .addConditionalEdges('generate_image', shouldContinueProcessing, {
    continue: 'choose_chain',
    stop: END,
  })
  .addConditionalEdges('choose_chain', selectChainType, {
    evm: 'create_betting_pool_evm',
    solana: 'create_betting_pool_solana',
    default: 'create_betting_pool_solana',
  })
  .addEdge('create_betting_pool_evm', 'upsert_truth_social_post')
  .addEdge('create_betting_pool_solana', 'upsert_truth_social_post')
  .addEdge('upsert_truth_social_post', 'send_tg_message')
  .addEdge('send_tg_message', END);

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
