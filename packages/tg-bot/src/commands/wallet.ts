import type { Context } from 'grammy';
import { getWallet, checkAllBalances } from '../utils/wallet';
import type { BotContext } from '../../types';
import { formatWalletMessage } from '../utils/messages';
import { airdropTokens } from '../utils/airdrop';

export const wallet = async (ctx: Context | BotContext) => {
  if (!ctx.from) {
    return ctx.reply('User not found.');
  }

  try {
    const wallet = await getWallet(ctx.from.id, ctx);

    if (!wallet) {
      return ctx.reply('Error fetching wallet.');
    }

    const { address, isNewWallet } = wallet;

    // For a new wallet, we'll set the balances to 0 and attempt an airdrop
    if (isNewWallet) {
      await ctx.reply('Creating your wallet and sending your initial FREEDOM tokens...', {
        parse_mode: 'HTML',
      });

      // Airdrop tokens to new user (10k tokens)
      const airdropResult = await airdropTokens(address);

      let freedomBalance = 0;
      if (airdropResult.success && airdropResult.amountMinted > 0) {
        freedomBalance = airdropResult.amountMinted;
      }

      const message = formatWalletMessage(address, 0, freedomBalance, 0, isNewWallet);
      return ctx.reply(message, { parse_mode: 'HTML' });
    }

    // Fetch balances for existing wallets
    await ctx.reply('Fetching your token balances...', { parse_mode: 'HTML' });

    // Use the improved checkAllBalances function that fetches all balances in parallel
    const {
      eth: ethBalance,
      freedom: freedomBalance,
      usdc: usdcBalance,
    } = await checkAllBalances(address);

    // Attempt to airdrop tokens if Freedom balance is low
    let airdropMessage = '';
    if (freedomBalance < 1000) {
      const airdropResult = await airdropTokens(address);

      if (airdropResult.success && airdropResult.amountMinted > 0) {
        airdropMessage = `\n\n🎉 <b>AIRDROP</b>: Received ${airdropResult.amountMinted.toFixed(2)} FREEDOM tokens!`;
        // Update the Freedom balance to include the airdropped tokens
        const updatedFreedomBalance = freedomBalance + airdropResult.amountMinted;

        // Use our centralized message formatter with updated balance
        const message =
          formatWalletMessage(
            address,
            ethBalance,
            updatedFreedomBalance,
            usdcBalance,
            isNewWallet
          ) + airdropMessage;

        return ctx.reply(message, { parse_mode: 'HTML' });
      } else if (!airdropResult.success && airdropResult.error?.includes('rate limit')) {
        airdropMessage = `\n\n⏳ <b>AIRDROP COOLDOWN</b>: ${airdropResult.error}\nNext airdrop available: ${airdropResult.rateLimitReset}`;
      }
    }

    // Use our centralized message formatter
    const message =
      formatWalletMessage(address, ethBalance, freedomBalance, usdcBalance, isNewWallet) +
      airdropMessage;

    ctx.reply(message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Wallet command error:', error);
    ctx.reply('Sorry, there was an error processing your wallet request. Please try again later.');
  }
};
