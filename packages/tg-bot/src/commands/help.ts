import type { CommandContext, Context } from 'grammy';
import { InlineKeyboard } from 'grammy';

export const help = async (ctx: CommandContext<Context>) => {
  if (!ctx.from) {
    ctx.reply('User not found.');
    return;
  }

  try {
    const keyboard = new InlineKeyboard()
      .text('💰 Wallet', 'wallet_cmd')
      .text('🏆 Pools', 'pools_cmd')
      .row()
      .text('🎮 Place Bet', 'bet_cmd')
      .text('🔍 My Bets', 'bets_cmd')
      .row()
      .text('💸 Withdraw', 'withdraw_cmd');

    const message = `🇺🇸 <b>Welcome to Trump.fun, ${ctx.from.first_name}!</b> 🇺🇸

Bet on President Trump's actions and Truth Social posts! Win FREEDOM tokens and USDC.

🎰 <b>Prediction Markets:</b>
• /pools - Browse all betting pools based on Trump's posts
• /pool [ID] - View details of a specific prediction
• /bet - Place a bet on what Trump will do next

💰 <b>Your Account:</b>
• /wallet - Manage your crypto wallet
• /bets - Track your bets on Trump's actions
• /withdraw - Cash out your winnings
• /airdrop - Get free FREEDOM tokens

🔄 <b>Quick Access:</b>
• /start, /help - Show this menu anytime

<i>MAKE BETTING GREAT AGAIN with the buttons below!</i>`;

    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });

    // Send a follow-up tip message after a short delay
    setTimeout(async () => {
      await ctx.reply(
        '💡 <b>TREMENDOUS TIP:</b> Use the /pools command to see the latest Truth Social predictions! Bet on what President Trump will say or do next.',
        { parse_mode: 'HTML' }
      );
    }, 1000);
  } catch (error) {
    console.error('Help command error:', error);
    ctx.reply('Sorry, there was an error processing your help request. Please try again later.');
  }
};
