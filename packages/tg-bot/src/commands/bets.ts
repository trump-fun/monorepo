import type { Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { apolloClient } from '@/lib/apolloClient';
import { GET_BETS } from '../../queries';
import { getWallet } from '../utils/wallet';
import { PoolStatus, type Bet, TokenType, formatTokenAmount } from '@trump-fun/common';

enum FilterType {
  ACTIVE = 'active',
  WON = 'won',
  LOST = 'lost',
  ALL = 'all',
}

interface BetFilters {
  [key: string]: any;
}

// Function to format bets into a readable message
function formatBetsMessage(bets: Bet[], filterType: string): string {
  if (!bets || bets.length === 0) {
    return `No ${filterType} bets found.`;
  }

  let message = `<b>Your ${filterType} bets:</b>\n\n`;

  bets.forEach((bet, index) => {
    // Get raw amount and convert properly based on token type
    const amount = typeof bet.amount === 'string' ? bet.amount : '0';
    // Format using the bet's token type
    const formattedAmount = formatTokenAmount(amount, bet.tokenType);
    const question = bet.pool.question?.trim() || 'Untitled Pool';

    // Format betting date if available
    const betDate = bet.createdAt ? new Date(parseInt(bet.createdAt.toString()) * 1000) : null;
    const dateString = betDate
      ? betDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';
    const timeString = betDate
      ? betDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : '';
    const dateTimeString = betDate ? `${dateString} at ${timeString}` : '';

    // Format status with emoji
    let statusEmoji = '⏳';
    let outcomeText = '';

    if (bet.pool.status === PoolStatus.Graded) {
      // We don't have direct winner/loser properties, so we need to check
      // if the user has won or lost based on other information
      const userAddress = bet.user.toString().toLowerCase();
      const userOption = Number(bet.option);
      const winningOption = bet.pool.winningOption ? Number(bet.pool.winningOption) : -1;

      if (winningOption === userOption) {
        statusEmoji = '🏆';
        outcomeText = ' (You won!)';
      } else if (winningOption !== -1) {
        statusEmoji = '❌';
        outcomeText = ' (You lost)';
      }
    } else if (bet.pool.status === PoolStatus.Regraded) {
      statusEmoji = '🔄';
    }

    message += `<b>${index + 1}.</b> ${question}\n`;
    const tokenName = bet.tokenType === TokenType.Freedom ? 'FREEDOM' : 'USDC';
    message += `   <b>Amount:</b> ${formattedAmount} ${tokenName}\n`;
    message += `   <b>Status:</b> ${statusEmoji} ${bet.pool.status}${outcomeText}`;

    // Add date if available
    if (dateTimeString) {
      message += `\n   <b>Placed:</b> ${dateTimeString}`;
    }

    message += `\n\n`;
  });

  return message;
}

function getFilter(filterType: FilterType, walletAddress: string): any {
  const filters: BetFilters = {
    [FilterType.ACTIVE]: {
      user: walletAddress,
      pool_: {
        status: PoolStatus.Pending,
      },
    },
    [FilterType.WON]: {
      user: walletAddress,
      pool_: {
        status: PoolStatus.Graded,
      },
      winner_: {
        id_eq: walletAddress,
      },
    },
    [FilterType.LOST]: {
      user: walletAddress,
      pool_: {
        status: PoolStatus.Graded,
      },
      loser_: {
        id_eq: walletAddress,
      },
    },
    [FilterType.ALL]: {
      user: walletAddress,
    },
  };

  return filters[filterType] || filters[FilterType.ALL];
}

function createFilterKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Active', `bets_filter_${FilterType.ACTIVE}`)
    .text('Won', `bets_filter_${FilterType.WON}`)
    .text('Lost', `bets_filter_${FilterType.LOST}`)
    .text('All', `bets_filter_${FilterType.ALL}`);
}

async function fetchBets(filter: any): Promise<{ bets: Bet[] | null; error: Error | null }> {
  try {
    const { data, error } = await apolloClient.query({
      query: GET_BETS,
      variables: {
        filter,
        orderBy: 'createdAt',
        orderDirection: 'desc',
        first: 10,
      },
      fetchPolicy: 'network-only',
    });

    if (error) {
      console.error('Error fetching bets:', error);
      return { bets: null, error };
    }

    return { bets: data.bets, error: null };
  } catch (err) {
    console.error('Exception while fetching bets:', err);
    return {
      bets: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

// Main command handler
export const betsCommand = async (ctx: Context): Promise<void> => {
  if (!ctx.from) {
    await ctx.reply('User not found.');
    return;
  }

  try {
    const wallet = await getWallet(ctx.from.id, ctx);

    if (!wallet) {
      await ctx.reply('No wallet found. Please set up your wallet first.');
      return;
    }

    const filter = getFilter(FilterType.ALL, wallet.address);
    const { bets, error } = await fetchBets(filter);

    if (error || !bets) {
      await ctx.reply('Error fetching bets. Please try again later.');
      return;
    }

    // Create inline keyboard for filtering
    const keyboard = createFilterKeyboard();

    // Send message with bets and filter keyboard
    await ctx.reply(formatBetsMessage(bets, FilterType.ALL), {
      reply_markup: keyboard,
      parse_mode: 'HTML',
    });
  } catch (err) {
    console.error('Error in bets command:', err);
    await ctx.reply('An unexpected error occurred. Please try again later.');
  }
};

// Callback handler for filter buttons
export const handleBetsFilter = async (ctx: Context): Promise<void> => {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery) || ctx.callbackQuery.data === undefined)
    return;

  try {
    // Extract filter type from callback data
    const callbackData = ctx.callbackQuery.data.toString();
    if (!callbackData.startsWith('bets_filter_')) return;

    const filterType = callbackData.replace('bets_filter_', '') as FilterType;

    if (!ctx.from) {
      await ctx.answerCallbackQuery('User not found.');
      return;
    }

    const wallet = await getWallet(ctx.from.id, ctx);
    if (!wallet) {
      await ctx.answerCallbackQuery('No wallet found. Please set up your wallet first.');
      return;
    }

    // Acknowledge the callback to stop loading indicator
    await ctx.answerCallbackQuery();

    // Get filter and fetch bets
    const filter = getFilter(filterType, wallet.address);
    const { bets, error } = await fetchBets(filter);

    if (error || !bets) {
      await ctx.editMessageText('Error fetching bets. Please try again later.', {
        reply_markup: createFilterKeyboard(),
      });
      return;
    }

    // Update the message with filtered bets
    await ctx.editMessageText(formatBetsMessage(bets, filterType), {
      reply_markup: createFilterKeyboard(),
      parse_mode: 'HTML',
    });
  } catch (err: any) {
    // Check if this is a "message not modified" error (which is not a critical error)
    if (err.description && err.description.includes('message is not modified')) {
      // Just log it but don't show an error to the user
      console.log('Bets filter produced identical message content - ignoring');
      return;
    }

    console.error('Error in bets filter handler:', err);
    await ctx.answerCallbackQuery('An error occurred processing your request.');
  }
};
