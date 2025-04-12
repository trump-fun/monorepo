import type { Context } from 'grammy';
import { getWallet, checkAllBalances } from '../utils/wallet';
import type { BotContext } from '../../types';
import { formatWalletMessage } from '../utils/messages';

export const wallet = async (ctx: Context | BotContext) => {
  if (!ctx.from) {
    return ctx.reply('User not found.');
  }

  try {
    const wallet = await getWallet(ctx.from.id, ctx);

    if (!wallet) {
      return ctx.reply('Error fetching wallet.');
    }

    const { address, chainType, isNewWallet } = wallet;

    // For a new wallet, we'll set the balances to 0
    if (isNewWallet) {
      const message = formatWalletMessage(address, 0, 0, 0, isNewWallet);
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

    // Use our centralized message formatter
    const message = formatWalletMessage(
      address,
      ethBalance,
      freedomBalance,
      usdcBalance,
      isNewWallet
    );

    ctx.reply(message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Wallet command error:', error);
    ctx.reply('Sorry, there was an error processing your wallet request. Please try again later.');
  }
};
