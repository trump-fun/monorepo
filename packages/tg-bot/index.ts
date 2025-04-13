import { Bot, GrammyError, HttpError } from 'grammy';
import config from './src/config';

// Define session interface for better type safety
interface SessionData {
  currentStep?: string;
  currentPool?: string;
  lastAction?: string;
  lastTimestamp?: number;
}

// Store session data in memory to avoid complex session middleware type issues
const sessionData: Record<number, SessionData> = {};

// Import commands
import { help } from './src/commands/help';
import { wallet } from './src/commands/wallet';
import { handlePoolsNavigation, poolsCommand } from './src/commands/pools';
import { poolCommand } from './src/commands/pool';
import { betsCommand, handleBetsFilter } from './src/commands/bets';
import {
  placeBetCommand,
  handleBetPoolSelection,
  handleBetOptionSelection,
  handleTokenTypeSelection,
  processBetWithParams,
} from './src/commands/bet';
import { withdrawCommand } from './src/commands/withdraw';
import { airdrop } from './src/commands/airdrop';
import { getWallet } from './src/utils/wallet';

// Initialize the bot with token from config
const bot = new Bot(config.bot.token);

// Using in-memory session data instead of middleware
// Helper functions for session management
const getSession = (userId: number): SessionData => {
  if (!sessionData[userId]) sessionData[userId] = {};
  return sessionData[userId];
};

const clearSession = (userId: number): void => {
  delete sessionData[userId];
};

const setSessionStep = (userId: number, step: string): void => {
  const session = getSession(userId);
  session.currentStep = step;
  session.lastTimestamp = Date.now();
};

// Add error handling middleware
bot.catch(err => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e);
  } else {
    console.error('Unknown error:', e);
  }
});

// Register commands
const registerCommands = () => {
  // Basic commands
  bot.command('start', ctx => help(ctx));
  bot.command('help', ctx => help(ctx));
  bot.command('wallet', ctx => wallet(ctx));
  bot.command('pools', ctx => poolsCommand(ctx));
  bot.command('pool', ctx => poolCommand(ctx));
  bot.command('bets', ctx => betsCommand(ctx));
  bot.command('bet', ctx => placeBetCommand(ctx));
  bot.command('withdraw', ctx => withdrawCommand(ctx));
  bot.command('airdrop', ctx => airdrop(ctx));

  // Callback queries for menu navigation
  const menuHandlers = {
    wallet_cmd: wallet,
    pools_cmd: poolsCommand,
    bets_cmd: betsCommand,
  };

  // Register all menu callbacks
  Object.entries(menuHandlers).forEach(([command, handler]) => {
    bot.callbackQuery(command, async ctx => {
      await ctx.answerCallbackQuery();
      await handler(ctx);
    });
  });

  // Specialized callback handlers
  bot.callbackQuery('withdraw_cmd', async ctx => {
    await ctx.answerCallbackQuery();
    await withdrawCommand(ctx);
  });

  // Regex-based callback handlers for navigation
  bot.callbackQuery(/^pools?_/, handlePoolsNavigation);
  bot.callbackQuery(/^bets_filter_/, handleBetsFilter);

  // Betting flow callback handlers
  bot.callbackQuery(/^bet_pool_/, handleBetPoolSelection);
  bot.callbackQuery(/^bet_option_/, handleBetOptionSelection);
  bot.callbackQuery('bet_cmd', async ctx => {
    await ctx.answerCallbackQuery();
    await placeBetCommand(ctx);
  });

  // Handle custom betting amount inputs
  bot.on('message:text', async ctx => {
    // Check if we're in a betting flow by checking our in-memory session state
    const userId = ctx.from?.id || 0;
    if (userId && getSession(userId).currentStep?.startsWith('bet_custom_')) {
      try {
        const amount = parseFloat(ctx.message.text);
        const userSession = getSession(userId);
        const [_, __, poolId, optionIndex, tokenType] = userSession.currentStep!.split('_');

        if (isNaN(amount) || amount <= 0) {
          return ctx.reply('❌ Please enter a valid positive number.');
        }

        // Clear the session step
        delete userSession.currentStep;

        // Get the user's wallet
        if (!ctx.from) {
          return ctx.reply('❌ User information not available.');
        }

        const wallet = await getWallet(ctx.from.id, ctx);
        if (!wallet) {
          return ctx.reply('❌ Unable to retrieve wallet. Please try again.');
        }

        // Place the bet with the custom amount
        await processBetWithParams(ctx, wallet, [
          '/bet',
          poolId || '0',
          (parseInt(optionIndex || '0') + 1).toString(),
          amount.toString(),
          tokenType || '0', // Use the token type from the custom amount callback
        ]);
      } catch (error) {
        console.error('Error processing custom amount:', error);
        ctx.reply('❌ There was an error processing your bet. Please try again with /bet.');
      }
      return;
    }

    // Default message handler for non-command messages
    if (!ctx.message.text.startsWith('/')) {
      ctx.reply("I didn't understand that message. Type /help to see available commands.");
    }
  });

  // Handle specific betting amount selections
  bot.callbackQuery(/^bet_amount_/, async ctx => {
    await ctx.answerCallbackQuery();

    const callbackData = ctx.callbackQuery?.data;
    if (!callbackData) return;

    // Format: bet_amount_poolId_optionIndex_amount_tokenType
    const [_, __, poolId, optionIndex, amount, tokenType] = callbackData.split('_');

    // Get the user's wallet
    if (!ctx.from) {
      return ctx.reply('❌ User information not available.');
    }

    const wallet = await getWallet(ctx.from.id, ctx);
    if (!wallet) {
      return ctx.reply('❌ Unable to retrieve wallet. Please try again.');
    }

    if (!poolId || !optionIndex || !amount) {
      return ctx.reply('❌ Invalid bet parameters.');
    }

    // Place the bet with the selected amount and correct token type
    await processBetWithParams(ctx, wallet, [
      '/bet',
      poolId,
      (parseInt(optionIndex) + 1).toString(),
      amount,
      tokenType || '0', // Use the token type from the callback data
    ]);
  });

  // Handle token type selection
  bot.callbackQuery(/^bet_token_/, async ctx => {
    await ctx.answerCallbackQuery();

    try {
      await handleTokenTypeSelection(ctx);
    } catch (error) {
      console.error('Error handling token selection:', error);
      await ctx.reply('❌ An error occurred processing your token selection. Please try again.');
    }
  });

  // Handle custom amount request
  bot.callbackQuery(/^bet_custom_/, async ctx => {
    await ctx.answerCallbackQuery();

    const callbackData = ctx.callbackQuery?.data;
    if (!callbackData) return;

    // Store the current state in our in-memory session
    const userId = ctx.from?.id || 0;
    if (!userId) return;

    setSessionStep(userId, callbackData);

    await ctx.reply(
      '💵 <b>Enter Bet Amount</b>\n\n' +
        'Please reply with the amount you want to bet (numbers only):',
      { parse_mode: 'HTML' }
    );
  });
};

// Register all commands and handlers
registerCommands();

// Set the commands for the bot menu
bot.api.setMyCommands([
  { command: 'help', description: 'Show help message' },
  { command: 'wallet', description: 'Manage your wallet' },
  { command: 'pools', description: 'Browse betting pools' },
  { command: 'pool', description: 'View a specific pool' },
  { command: 'bets', description: 'View your bets' },
  { command: 'bet', description: 'Place a bet' },
  { command: 'withdraw', description: 'Withdraw your winnings' },
  { command: 'airdrop', description: 'Get free FREEDOM tokens' },
]);

// Start the bot
console.log(`Starting ${config.env} mode bot`);
bot.start();

// Export for potential programmatic usage
export { bot };
