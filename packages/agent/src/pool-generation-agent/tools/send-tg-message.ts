import { Bot } from 'grammy';
import { supabase } from '../../config';
import type { SingleResearchItemState } from '../single-betting-pool-graph';

/**
 * Send a notification message to all Telegram users when a new betting pool is created
 * @param state The current state of the research item containing pool details
 * @returns The unchanged state
 */
export async function sendTgMessage(
  state: SingleResearchItemState
): Promise<Partial<SingleResearchItemState>> {
  console.log('Sending Telegram notifications about new pool creation');

  const research = state.research;
  if (!research) {
    console.log('No research item to send notification about');
    return { research };
  }

  // Only send notifications if a pool was actually created
  if (!research.pool_id) {
    console.log('No pool ID found, skipping Telegram notification');
    return { research };
  }

  try {
    // Get Telegram bot token
    const botToken = process.env.BOT_ID;
    if (!botToken) {
      console.error('Missing Telegram bot token, cannot send notifications');
      return { research };
    }

    // Create bot instance
    const bot = new Bot(botToken);

    // Fetch all user chat IDs from wallets table
    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('tg_id')
      .not('tg_id', 'is', null);

    if (error) {
      console.error('Error fetching telegram wallets:', error);
      return { research };
    }

    if (!wallets || wallets.length === 0) {
      console.log('No telegram wallets found, no notifications to send');
      return { research };
    }

    console.log(`Found ${wallets.length} Telegram users to notify about new pool`);

    // Prepare the notification message
    // betting_pool_idea is a string containing the full idea
    let poolTitle = 'New Betting Pool';
    let poolDescription = 'A new betting pool has been created.';

    // Extract title and description from the betting_pool_idea string if available
    if (research.betting_pool_idea) {
      const ideaLines = research.betting_pool_idea
        .split('\n')
        .filter(line => line.trim().length > 0);

      // Usually the first line contains the title
      if (ideaLines && ideaLines.length > 0) {
        // @ts-expect-error
        poolTitle = ideaLines[0].replace(/^(title|pool|idea):\s*/i, '').trim();
      }

      // Rest of the content can be used as description
      if (ideaLines && ideaLines.length > 1) {
        poolDescription = ideaLines.slice(1).join('\n').trim();
      }
    }

    const message =
      `🎯 *New Betting Pool Created!* 🎯\n\n` +
      `*${poolTitle}*\n\n` +
      `${poolDescription}\n\n` +
      `Pool ID: \`${research.pool_id}\`\n\n` +
      `Use /pool ${research.pool_id} to view details and place bets!`;

    // Send messages to all users (in parallel batches to avoid rate limiting)
    const batchSize = 30; // Send 30 messages at a time
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < wallets.length; i += batchSize) {
      const batch = wallets.slice(i, i + batchSize);

      // Send messages to each user in the current batch in parallel
      await Promise.allSettled(
        batch.map(async wallet => {
          try {
            if (wallet.tg_id) {
              // If an image was generated, send it with the message
              if (research.image_url) {
                // Send photo with caption
                await bot.api.sendPhoto(wallet.tg_id, research.image_url, {
                  caption: message,
                  parse_mode: 'Markdown',
                });
                console.log(`Sent notification with image to Telegram user ${wallet.tg_id}`);
              } else {
                // No image, just send text message
                await bot.api.sendMessage(wallet.tg_id, message, {
                  parse_mode: 'Markdown',
                });
                console.log(`Sent notification to Telegram user ${wallet.tg_id}`);
              }
            }
          } catch (err) {
            console.error(
              `Failed to send message to user ${wallet ? wallet.tg_id || 'unknown' : 'unknown'}:`,
              err
            );
            // Continue with other users even if some fail
          }
        })
      );

      // Add a small delay between batches to avoid hitting Telegram API rate limits
      if (i + batchSize < wallets.length) {
        await delay(1000); // 1 second delay between batches
      }
    }

    console.log('Finished sending Telegram notifications about new pool');
  } catch (err) {
    console.error('Error sending Telegram notifications:', err);
    // Don't throw error to avoid breaking the pipeline
  }

  return {
    research,
  };
}
