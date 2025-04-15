import type { Context } from 'grammy';
import type { BotContext } from '../../types';
import { getWallet } from '../utils/wallet';
import { airdropTokens, checkRateLimit } from '../utils/airdrop';

/**
 * Command handler for /airdrop - allows users to request an airdrop of Freedom tokens
 * @param ctx Bot context
 */
export const airdrop = async (ctx: Context | BotContext) => {
  if (!ctx.from) {
    return ctx.reply('User not found.');
  }

  try {
    await ctx.reply('Checking eligibility for FREEDOM token airdrop...', { parse_mode: 'HTML' });

    // Get user's wallet
    const wallet = await getWallet(ctx.from.id, ctx);

    if (!wallet) {
      return ctx.reply(
        'Error fetching your wallet. Please try /wallet first to set up your wallet.'
      );
    }

    const { address, isNewWallet } = wallet;

    // For a brand new wallet, automatically airdrop
    if (isNewWallet) {
      await ctx.reply('Setting up initial airdrop for your new wallet...', { parse_mode: 'HTML' });

      const airdropResult = await airdropTokens(address);

      if (airdropResult.success && airdropResult.amountMinted > 0) {
        return ctx.reply(
          `🎉 <b>WELCOME AIRDROP</b>: You've received ${airdropResult.amountMinted.toFixed(2)} FREEDOM tokens!\n\n` +
            `Use /wallet to see your updated balance.`,
          { parse_mode: 'HTML' }
        );
      } else if (!airdropResult.success) {
        return ctx.reply(
          `❌ <b>AIRDROP FAILED</b>: ${airdropResult.error || 'Unknown error occurred'}\n\n` +
            `Please try again later or contact support.`,
          { parse_mode: 'HTML' }
        );
      }
    }

    // Check if the user is eligible for an airdrop (not rate-limited)
    const isEligible = await checkRateLimit(address);

    if (isEligible) {
      const airdropResult = await airdropTokens(address);

      if (airdropResult.success && airdropResult.amountMinted > 0) {
        return ctx.reply(
          `🎉 <b>AIRDROP SUCCESS</b>: You've received ${airdropResult.amountMinted.toFixed(2)} FREEDOM tokens!\n\n` +
            `Use /wallet to see your updated balance.`,
          { parse_mode: 'HTML' }
        );
      } else if (airdropResult.success && airdropResult.amountMinted === 0) {
        return ctx.reply(
          `ℹ️ <b>NO AIRDROP NEEDED</b>: ${airdropResult.message || 'Your balance is already sufficient.'}\n\n` +
            `You'll be eligible for more tokens when your balance falls below 1,000 FREEDOM.`,
          { parse_mode: 'HTML' }
        );
      } else {
        return ctx.reply(
          `❌ <b>AIRDROP FAILED</b>: ${airdropResult.error || 'Unknown error occurred'}\n\n` +
            `Please try again later or contact support.`,
          { parse_mode: 'HTML' }
        );
      }
    } else {
      // User is not eligible due to rate limiting
      // Find out when they can get their next airdrop
      const nextAirdropTime = await getNextAirdropTime(address);

      return ctx.reply(
        `⏳ <b>AIRDROP COOLDOWN</b>: You've recently received tokens.\n\n` +
          `You can get your next airdrop ${nextAirdropTime}.\n\n` +
          `Use /wallet to see your current balance.`,
        { parse_mode: 'HTML' }
      );
    }
  } catch (error) {
    console.error('Airdrop command error:', error);
    ctx.reply('Sorry, there was an error processing your airdrop request. Please try again later.');
  }
};

/**
 * Helper function to get a user-friendly message about when the next airdrop is available
 * @param address User's wallet address
 * @returns Formatted string with time until next airdrop
 */
async function getNextAirdropTime(address: string): Promise<string> {
  try {
    const supabase = (await import('../lib/supabase')).supabase;

    const { data } = await supabase
      .from('trump_users')
      .select('last_login_bonus')
      .eq('id', address.toLowerCase())
      .single();

    if (!data || !data.last_login_bonus) {
      return 'soon';
    }

    const lastBonus = new Date(data.last_login_bonus);
    const RATE_LIMIT_HOURS = 6;
    const RATE_LIMIT_MS = RATE_LIMIT_HOURS * 60 * 60 * 1000;
    const nextAirdropTime = new Date(lastBonus.getTime() + RATE_LIMIT_MS);
    const now = new Date();

    // If next airdrop time is in the past, they should be eligible now
    if (nextAirdropTime <= now) {
      return 'now';
    }

    // Calculate time remaining
    const diffMs = nextAirdropTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `in <b>${diffHours} hour${diffHours > 1 ? 's' : ''} and ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}</b>`;
    } else {
      return `in <b>${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}</b>`;
    }
  } catch (error) {
    console.error('Error getting next airdrop time:', error);
    return 'later';
  }
}
