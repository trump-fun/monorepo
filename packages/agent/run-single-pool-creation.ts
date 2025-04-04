import 'dotenv/config';
import config, { DEFAULT_CHAIN_ID } from './src/config';
import { singleBettingPoolGraph } from './src/pool-generation-agent/single-betting-pool-graph';
import type { ResearchItem } from './src/types/research-item';
import type { TruthSocialPost } from './src/types/truth-social-post';

// Example Truth Social post to process
const exampleTruthSocialPost = {
  id: '114246747590580179',
  uri: 'https://truthsocial.com/@realDonaldTrump/114246747590580179',
  url: 'https://truthsocial.com/@realDonaldTrump/114246747590580179',
  card: {
    id: null,
    url: 'https://swampthevoteusa.com/fl-01/',
    html: '',
    type: 'link',
    group: null,
    image:
      'https://static-assets-1.truthsocial.com/tmtg:prime-ts-assets/cache/preview_cards/images/051/191/114/original/c32a0e60c8be97de.png',
    links: null,
    title: 'Swamp the Vote FL-01',
    width: 800,
    height: 419,
    blurhash: 'UQC?fpR+9Ff6tSj]WVof0KWB.8WUNGbHofay',
    embed_url: '',
    author_url: '',
    author_name: '',
    description:
      'PRESIDENT TRUMP’S MAGA MAJORITY HANGS IN THE BALANCE! Democrats are pouring in resources to flip FL-01 and stop our America First agenda in its tracks, so it’s up to proud Patriots like you to defend this crucial seat. Here’s the reality: if we lose this race, our House Majority will shrink, and delivering victories for […]',
    provider_url: '',
    provider_name: 'swampthevoteusa.com',
  },
  poll: null,
  tags: [],
  group: null,
  muted: false,
  quote: null,
  emojis: [],
  pinned: false,
  reblog: null,
  account: {
    id: '107780257626128497',
    bot: false,
    url: 'https://truthsocial.com/@realDonaldTrump',
    acct: 'realDonaldTrump',
    note: '<p></p>',
    group: false,
    avatar:
      'https://static-assets-1.truthsocial.com/tmtg:prime-ts-assets/accounts/avatars/107/780/257/626/128/497/original/454286ac07a6f6e6.jpeg',
    emojis: [],
    fields: [],
    header:
      'https://static-assets-1.truthsocial.com/tmtg:prime-ts-assets/accounts/headers/107/780/257/626/128/497/original/ba3b910ba387bf4e.jpeg',
    locked: false,
    website: 'www.DonaldJTrump.com',
    location: '',
    username: 'realDonaldTrump',
    verified: true,
    created_at: '2022-02-11T16:16:57.705Z',
    tv_account: false,
    discoverable: false,
    display_name: 'Donald J. Trump',
    tv_onboarded: false,
    avatar_static:
      'https://static-assets-1.truthsocial.com/tmtg:prime-ts-assets/accounts/avatars/107/780/257/626/128/497/original/454286ac07a6f6e6.jpeg',
    header_static:
      'https://static-assets-1.truthsocial.com/tmtg:prime-ts-assets/accounts/headers/107/780/257/626/128/497/original/ba3b910ba387bf4e.jpeg',
    last_status_at: '2025-03-29',
    statuses_count: 26037,
    chats_onboarded: true,
    feeds_onboarded: true,
    followers_count: 9338252,
    following_count: 72,
    unauth_visibility: true,
    accepting_messages: false,
    show_nonmember_group_statuses: null,
  },
  content:
    '<p>Jimmy Patronis, Chief Financial Officer and Fire Marshall for the Great State of Florida, is running an incredible Campaign for Congress in Florida’s 1st Congressional District! A fourth generation Floridian from the beautiful Panhandle, and owner of an iconic seafood restaurant, Jimmy has been a wonderful friend to me, and to MAGA. As your next Congressman, Jimmy will fight hard alongside of me to Grow our Economy, Cut Taxes, Secure our Border, Stop Migrant Crime, Strengthen our Brave Military/Vets, Restore American Energy DOMINANCE, and Defend our always under siege Second Amendment.<br/> <br/>Florida, Election Day is this Tuesday, April 1st. GET OUT AND VOTE FOR JIMMY PATRONIS. Jimmy has my Complete and Total Endorsement — HE WILL NEVER LET YOU DOWN! <a href="https://swampthevoteusa.com/fl-01/" rel="nofollow noopener noreferrer" target="_blank"><span class="invisible">https://</span><span class="">swampthevoteusa.com/fl-01/</span><span class="invisible"></span></a></p>',
  language: 'en',
  mentions: [],
  quote_id: null,
  reblogged: false,
  sensitive: false,
  sponsored: false,
  bookmarked: false,
  created_at: '2025-03-29T16:50:22.560Z',
  favourited: false,
  visibility: 'public',
  in_reply_to: null,
  spoiler_text: '',
  reblogs_count: 204,
  replies_count: 44,
  in_reply_to_id: null,
  favourites_count: 544,
  media_attachments: [],
  in_reply_to_account_id: null,
} as TruthSocialPost;

async function runSinglePostProcess() {
  console.log('Running single betting pool creation agent...');
  console.log('API keys configured:');
  console.log('- Tavily API Key:', config.tavilyApiKey ? 'Configured ✓' : 'Missing ✗');
  console.log('- News API Key:', config.newsApiKey ? 'Configured ✓' : 'Missing ✗');
  console.log('- Venice API Key:', config.veniceApiKey ? 'Configured ✓' : 'Missing ✗');

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
