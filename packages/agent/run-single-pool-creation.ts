import 'dotenv/config';
import config, { DEFAULT_CHAIN_ID } from './src/config';
import { singleBettingPoolGraph } from './src/pool-generation-agent/single-betting-pool-graph';
import type { ResearchItem } from './src/types/research-item';
import type { TruthSocialPost } from './src/types/truth-social-post';

// Example Truth Social post to process
const exampleTruthSocialPost = {
  id: '114241306148201991',
  created_at: '2025-03-28T17:46:32.743Z',
  in_reply_to_id: null,
  quote_id: null,
  in_reply_to_account_id: null,
  sensitive: false,
  spoiler_text: '',
  visibility: 'public',
  language: '', // Set empty string instead of null to match the TruthSocialPost type
  uri: 'https://truthsocial.com/@realDonaldTrump/114241306148201991',
  url: 'https://truthsocial.com/@realDonaldTrump/114241306148201991',
  content:
    '<p><a href="https://www.whitehouse.gov/fact-sheets/2025/03/fact-sheet-president-donald-j-trump-adjusts-imports-of-automobiles-and-automobile-parts-into-the-united-states/" rel="nofollow noopener noreferrer" target="_blank"><span class="invisible">https://www.</span><span class="ellipsis">whitehouse.gov/fact-sheets/202</span><span class="invisible">5/03/fact-sheet-president-donald-j-trump-adjusts-imports-of-automobiles-and-automobile-parts-into-the-united-states/</span></a></p>',
  account: {
    id: '107780257626128497',
    username: 'realDonaldTrump',
    acct: 'realDonaldTrump',
    display_name: 'Donald J. Trump',
    locked: false,
    bot: false,
    discoverable: false,
    group: false,
    created_at: '2022-02-11T16:16:57.705Z',
    note: '<p></p>',
    url: 'https://truthsocial.com/@realDonaldTrump',
    avatar:
      'https://static-assets-1.truthsocial.com/tmtg:prime-ts-assets/accounts/avatars/107/780/257/626/128/497/original/454286ac07a6f6e6.jpeg',
    avatar_static:
      'https://static-assets-1.truthsocial.com/tmtg:prime-ts-assets/accounts/avatars/107/780/257/626/128/497/original/454286ac07a6f6e6.jpeg',
    header:
      'https://static-assets-1.truthsocial.com/tmtg:prime-ts-assets/accounts/headers/107/780/257/626/128/497/original/ba3b910ba387bf4e.jpeg',
    header_static:
      'https://static-assets-1.truthsocial.com/tmtg:prime-ts-assets/accounts/headers/107/780/257/626/128/497/original/ba3b910ba387bf4e.jpeg',
    followers_count: 9340841,
    following_count: 72,
    statuses_count: 26047,
    last_status_at: '2025-03-30',
    verified: true,
    location: '',
    website: 'www.DonaldJTrump.com',
    unauth_visibility: true,
    chats_onboarded: true,
    feeds_onboarded: true,
    accepting_messages: false,
    show_nonmember_group_statuses: null,
    emojis: [],
    fields: [],
    tv_onboarded: false,
    tv_account: false,
  },
  media_attachments: [
    {
      id: '114241305604870320',
      type: 'image',
      url: 'https://static-assets-1.truthsocial.com/tmtg:prime-ts-assets/media_attachments/files/114/241/305/604/870/320/original/7025ff77198305df.jpg',
      preview_url:
        'https://static-assets-1.truthsocial.com/tmtg:prime-ts-assets/media_attachments/files/114/241/305/604/870/320/small/7025ff77198305df.jpg',
      external_video_id: null,
      remote_url: null,
      preview_remote_url: null,
      text_url: null,
      meta: {
        original: {
          width: 2019,
          height: 509,
          size: '2019x509',
          aspect: 3.9666011787819255,
        },
        small: {
          width: 1593,
          height: 402,
          size: '1593x402',
          aspect: 3.962686567164179,
        },
      },
      description: null,
      blurhash: 'U5A,,-WBD%ayR*ayRjof00ofxuayofofj[ay',
      processing: 'complete',
    },
  ],
  mentions: [],
  tags: [],
  card: {
    id: null,
    url: 'https://www.whitehouse.gov/fact-sheets/2025/03/fact-sheet-president-donald-j-trump-adjusts-imports-of-automobiles-and-automobile-parts-into-the-united-states/',
    title:
      'Fact Sheet: President Donald J. Trump Adjusts Imports of Automobiles and Automobile Parts into the United States',
    description:
      'COUNTERING TRADE PRACTICES THAT THREATEN TO IMPAIR U.S. NATIONAL SECURITY: Today, President Donald J. Trump signed a proclamation invoking Section',
    type: 'link',
    author_name: '',
    author_url: '',
    provider_name: 'www.whitehouse.gov',
    provider_url: '',
    html: '',
    width: 800,
    height: 419,
    image:
      'https://static-assets-1.truthsocial.com/tmtg:prime-ts-assets/cache/preview_cards/images/051/331/942/original/ece2b15f42d0b76f.jpg',
    embed_url: '',
    blurhash: 'U34ejGay00ofM{j[xuay00j[?vWB?bayD*of',
    links: null,
    group: null,
  },
  group: null,
  quote: null,
  in_reply_to: null,
  reblog: null,
  sponsored: false,
  replies_count: 351,
  reblogs_count: 3188,
  favourites_count: 13944,
  favourited: false,
  reblogged: false,
  muted: false,
  pinned: false,
  bookmarked: false,
  poll: null,
  emojis: [],
} as TruthSocialPost; // Cast to ensure type compatibility

async function runSinglePostProcess() {
  console.log('Running single betting pool creation agent...');
  console.log('API keys configured:');
  console.log('- Tavily API Key:', config.tavilyApiKey ? 'Configured ✓' : 'Missing ✗');
  console.log('- News API Key:', config.newsApiKey ? 'Configured ✓' : 'Missing ✗');
  console.log('- Flux API Key:', config.fluxApiKey ? 'Configured ✓' : 'Missing ✗');

  // Create a research item with the example post
  const researchItem: ResearchItem = {
    truth_social_post: exampleTruthSocialPost,
    should_process: true, // Mark for processing
    transaction_hash: null,
    pool_id: null,
  };

  // Setup the initial state for the graph
  const initialState = {
    messages: [],
    targetTruthSocialAccountId: config.trumpTruthSocialId,
    research: researchItem,
    chainConfig: config.chainConfig[DEFAULT_CHAIN_ID], // Use imported DEFAULT_CHAIN_ID
  };

  try {
    console.log('\n--- PROCESSING TRUTH SOCIAL POST ---');
    console.log(`Post ID: ${researchItem.truth_social_post.id}`);
    console.log(`Post date: ${researchItem.truth_social_post.created_at}`);
    console.log(`Post content: ${researchItem.truth_social_post.content}`);

    if (researchItem.truth_social_post.card) {
      console.log(`Card title: ${researchItem.truth_social_post.card.title}`);
      console.log(`Card description: ${researchItem.truth_social_post.card.description}`);
    }

    // Invoke the graph with the initial state
    const result = await singleBettingPoolGraph.invoke(initialState);

    console.log('\n--- FINAL RESULT ---');
    console.log('Betting pool idea:', result.research?.betting_pool_idea || 'None generated');
    console.log('Image URL:', result.research?.image_url || 'None generated');
    console.log('Pool ID:', result.research?.pool_id || 'None created');
    console.log('Transaction hash:', result.research?.transaction_hash || 'None created');

    // Log the full result object for debugging
    console.log('\n--- COMPLETE RESULT OBJECT ---');
    console.log(JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('Error running single betting pool creation:', error);
    throw error;
  }
}

// Run the script
runSinglePostProcess().catch(console.error);
