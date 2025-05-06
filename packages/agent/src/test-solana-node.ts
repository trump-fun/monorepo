//TODO this is a one off test script, delete me when you're confident Solana is working
import { DEFAULT_CHAIN_ID } from './config';
import {
  runSingleNode,
  type SingleResearchItemState,
} from './pool-generation-agent/single-betting-pool-graph';

// Create a minimally viable research item state
const imageUrl =
  'https://fxewzungnacaxpsnowcu.supabase.co/storage/v1/object/public/trump-fun/trump-images/In-a-vibrant-photo-realistic-1746549380379.jpg';

async function main() {
  // Prepare the initial state with required fields
  const initialState: SingleResearchItemState = {
    targetTruthSocialAccountId: 'realDonaldTrump',
    chainId: DEFAULT_CHAIN_ID,
    research: {
      truth_social_post: {
        id: 'test-post-id',
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
        content: 'Test post content for Solana betting pool',
        account: {
          id: 'realDonaldTrump',
          username: 'realDonaldTrump',
          acct: 'realDonaldTrump',
          display_name: 'Donald J. Trump',
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
          verified: true,
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
      should_process: true,
      betting_pool_idea:
        "Everyone knows MY endorsements are the MOST POWERFUL endorsements in history! Regarding Jimmy Patronis, who I STRONGLY supported, will I make ANOTHER Truth Social post mentioning 'Jimmy Patronis' BY NAME by May 13th, 2025, 12:35 PM Eastern Time? People are waiting to see!?",
      image_url: imageUrl,
      transaction_hash: null,
      pool_id: null,
    },
    messages: [],
  };

  try {
    console.log('Invoking create_betting_pool_solana node...');
    const result = await runSingleNode('create_betting_pool_solana', initialState);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error invoking node:', error);
  }
}

main();
