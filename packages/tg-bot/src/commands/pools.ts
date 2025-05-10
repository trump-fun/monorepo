import { apolloClient } from '@/lib/apolloClient';
import { formatPoolMessage } from '@/utils/messages';
import { createPoolDetailsKeyboard } from '@/utils/ui';
import {
  OrderDirection,
  PoolStatus,
  Pool_OrderBy,
  getTimeRemaining,
  type Pool,
} from '@trump-fun/common';
import type { Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { GET_POOLS } from '../../queries';

enum PoolFilterType {
  ACTIVE = 'active',
  TRENDING = 'trending',
  NEWEST = 'newest',
  HIGHEST_VOLUME = 'highest_volume',
  ENDING_SOON = 'ending_soon',
}

interface PaginationState {
  offset: number;
  limit: number;
}

function formatPoolsList(pools: Pool[]): string {
  if (pools.length === 0) {
    return "No prediction markets found on Trump's Truth Social posts yet.";
  }

  let message = '<b>🇺🇸 TRUMP PREDICTIONS:</b>\n\n';

  pools.forEach((pool, index) => {
    const totalVolume = Number(pool.usdcBetTotals || '0') + Number(pool.pointsBetTotals || '0');
    const formattedVolume = `$${(Number(totalVolume) / 10 ** 6).toFixed(2)}`;

    // Determine pool status with appropriate emoji
    let statusEmoji;
    let timeInfo = '';

    if (pool.status === PoolStatus.Pending) {
      statusEmoji = '🟢'; // Green circle for active pools

      // Add time remaining for active pools
      if (pool.betsCloseAt) {
        const remaining = getTimeRemaining(pool.betsCloseAt);
        if (remaining) {
          timeInfo = ` | ⏱️ ${remaining}`;
        }
      }
    } else if (pool.status === PoolStatus.Graded || pool.status === PoolStatus.Regraded) {
      statusEmoji = '✅'; // Checkmark for resolved pools
    } else {
      statusEmoji = '🟠'; // Orange for other statuses
    }

    // Format the Trump prediction with TREMENDOUS style
    message += `${index + 1}. <b>${pool.question}</b>\n`;
    message += `   ID: <code>${pool.poolId}</code> | ${statusEmoji} ${pool.status}${timeInfo} | Vol: ${formattedVolume} | Options: ${pool.options.length}\n\n`;
  });

  message += '<i>Use /pool [ID] or tap a button below to see details and place your bets!</i>';

  return message;
}

function getPoolQueryParams(filterType: PoolFilterType) {
  const now = Math.floor(Date.now() / 1000);

  switch (filterType) {
    case PoolFilterType.ACTIVE:
      return {
        filter: { status: PoolStatus.Pending },
        orderBy: Pool_OrderBy.CreatedAt,
        orderDirection: OrderDirection.Desc,
      };

    case PoolFilterType.TRENDING:
      return {
        filter: { status: PoolStatus.Pending },
        orderBy: Pool_OrderBy.PointsVolume,
        orderDirection: OrderDirection.Desc,
      };

    case PoolFilterType.NEWEST:
      return {
        filter: {},
        orderBy: Pool_OrderBy.CreatedAt,
        orderDirection: OrderDirection.Desc,
      };

    case PoolFilterType.HIGHEST_VOLUME:
      return {
        filter: {},
        orderBy: Pool_OrderBy.PointsVolume,
        orderDirection: OrderDirection.Desc,
      };

    case PoolFilterType.ENDING_SOON:
      return {
        filter: {
          status: PoolStatus.Pending,
          betsCloseAt_gt: now,
          betsCloseAt_lt: now + 86400 * 3,
        },
        orderBy: Pool_OrderBy.BetsCloseAt,
        orderDirection: OrderDirection.Asc,
      };

    default:
      return {
        filter: { status: PoolStatus.Pending },
        orderBy: Pool_OrderBy.CreatedAt,
        orderDirection: OrderDirection.Desc,
      };
  }
}

function createPoolsKeyboard(
  pools: Pool[],
  currentFilter: PoolFilterType,
  pagination: PaginationState
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  pools.slice(0, 5).forEach((pool, index) => {
    keyboard.text(`Pool ${index + 1}`, `pool_view_${pool.poolId}`).row();
  });

  keyboard
    .text('🔥 Trending', `pools_filter_${PoolFilterType.TRENDING}`)
    .text('🆕 Newest', `pools_filter_${PoolFilterType.NEWEST}`)
    .row()
    .text('💰 Highest Vol', `pools_filter_${PoolFilterType.HIGHEST_VOLUME}`)
    .text('⏱️ Ending Soon', `pools_filter_${PoolFilterType.ENDING_SOON}`)
    .row();

  if (pools.length > 0) {
    const prevOffset = Math.max(0, pagination.offset - pagination.limit);
    const nextOffset = pagination.offset + pagination.limit;

    keyboard
      .text('⬅️ Prev', `pools_page_${prevOffset}_${currentFilter}`)
      .text('➡️ Next', `pools_page_${nextOffset}_${currentFilter}`);
  }

  return keyboard;
}

async function fetchPools(
  queryParams: any,
  pagination: PaginationState
): Promise<{ pools: Pool[] | null; error: Error | null }> {
  if (!queryParams) {
    return { pools: null, error: new Error('Invalid query parameters') };
  }

  try {
    const { data, error } = await apolloClient.query({
      query: GET_POOLS,
      variables: {
        ...queryParams,
        first: pagination.limit,
        skip: pagination.offset,
      },
      fetchPolicy: 'network-only',
    });

    if (error) {
      console.error('Error fetching pools:', error);
      return { pools: null, error };
    }

    // Check if data and data.pools exist
    if (!data || !data.pools) {
      console.error('No data returned from the GraphQL endpoint');
      return {
        pools: null,
        error: new Error('The Graph endpoint is unavailable. The endpoint has been removed.'),
      };
    }

    return { pools: data.pools, error: null };
  } catch (err) {
    console.error('Exception while fetching pools:', err);
    return {
      pools: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

export const poolsCommand = async (ctx: Context): Promise<void> => {
  try {
    const pagination: PaginationState = {
      offset: 0,
      limit: 10,
    };

    const queryParams = getPoolQueryParams(PoolFilterType.NEWEST);
    const { pools, error } = await fetchPools(queryParams, pagination);

    if (error || !pools) {
      await ctx.reply('Sorry, there was an error fetching pools. Please try again later.');
      return;
    }

    if (pools.length === 0) {
      await ctx.reply('No active pools found at the moment.');
      return;
    }

    const keyboard = createPoolsKeyboard(pools, PoolFilterType.NEWEST, pagination);

    await ctx.reply(formatPoolsList(pools), {
      reply_markup: keyboard,
      parse_mode: 'HTML',
    });
  } catch (err) {
    console.error('Error in pools command:', err);
    await ctx.reply('An unexpected error occurred. Please try again later.');
  }
};

export const handlePoolsNavigation = async (ctx: Context): Promise<void> => {
  if (!ctx.callbackQuery?.data) return;

  await ctx.answerCallbackQuery(); // Important: Always acknowledge the callback query first

  try {
    const callbackData = ctx.callbackQuery.data.toString();

    if (callbackData.startsWith('pool_view_')) {
      const poolId = callbackData.replace('pool_view_', '');

      const { data, error } = await apolloClient.query({
        query: GET_POOLS,
        variables: {
          filter: { poolId },
          first: 1,
          orderBy: 'createdAt',
          orderDirection: 'desc',
        },
      });

      if (error || !data.pools || data.pools.length === 0) {
        await ctx.reply('Pool not found or error fetching details.');
        return;
      }

      // Create keyboard with betting options and navigation
      const poolData = data.pools[0];
      const keyboard = createPoolDetailsKeyboard(poolData);
      const formattedMessage = formatPoolMessage(poolData);

      // Check if the pool has an image URL
      if (poolData.imageUrl) {
        try {
          // Delete the current message
          await ctx.deleteMessage();

          // Send a new message with the image
          await ctx.replyWithPhoto(poolData.imageUrl, {
            caption: formattedMessage,
            parse_mode: 'HTML',
            reply_markup: keyboard,
          });
        } catch (error) {
          console.error('Error sending pool image:', error);
          // Fallback to text-only if image fails
          await ctx.editMessageText(formattedMessage, {
            reply_markup: keyboard,
            parse_mode: 'HTML',
          });
        }
      } else {
        // No image, use standard text message
        await ctx.editMessageText(formattedMessage, {
          reply_markup: keyboard,
          parse_mode: 'HTML',
        });
      }
      return;
    }

    if (callbackData.startsWith('pools_filter_')) {
      const filterType = callbackData.replace('pools_filter_', '') as PoolFilterType;

      const pagination: PaginationState = {
        offset: 0,
        limit: 10,
      };

      const queryParams = getPoolQueryParams(filterType);
      const { pools, error } = await fetchPools(queryParams, pagination);

      if (error || !pools) {
        await ctx.reply('Error fetching pools with this filter.');
        return;
      }

      await ctx.editMessageText(formatPoolsList(pools), {
        reply_markup: createPoolsKeyboard(pools, filterType, pagination),
        parse_mode: 'HTML',
      });
      return;
    }

    if (callbackData.startsWith('pools_page_')) {
      const parts = callbackData.replace('pools_page_', '').split('_');
      const offset = parseInt(parts[0] || '0');
      const filterType = (parts[1] || 'active') as PoolFilterType;

      const pagination: PaginationState = {
        offset,
        limit: 10,
      };

      const queryParams = getPoolQueryParams(filterType);
      const { pools, error } = await fetchPools(queryParams, pagination);

      if (error || !pools) {
        await ctx.reply('Error fetching more pools.');
        return;
      }

      await ctx.editMessageText(formatPoolsList(pools), {
        reply_markup: createPoolsKeyboard(pools, filterType, pagination),
        parse_mode: 'HTML',
      });
      return;
    }

    if (callbackData === 'pools_back_to_list') {
      const pagination: PaginationState = {
        offset: 0,
        limit: 10,
      };

      const queryParams = getPoolQueryParams(PoolFilterType.NEWEST);
      const { pools, error } = await fetchPools(queryParams, pagination);

      if (error || !pools) {
        await ctx.reply('Error returning to pools list.');
        return;
      }

      await ctx.editMessageText(formatPoolsList(pools), {
        reply_markup: createPoolsKeyboard(pools, PoolFilterType.NEWEST, pagination),
        parse_mode: 'HTML',
      });
      return;
    }
    // Handle bet_pool_ callback - redirect to bet.ts for the betting flow
    if (callbackData.startsWith('bet_pool_')) {
      // The handler in bet.ts will handle this callback
      // We don't return anything as this function returns void
      return;
    }
  } catch (err: any) {
    // Check if this is a "message not modified" error (which is not a critical error)
    if (err.description && err.description.includes('message is not modified')) {
      // Just log it but don't show an error to the user
      console.log('Navigation produced identical message content - ignoring');
      return;
    }

    console.error('Error in pools navigation handler:', err);
    await ctx.reply('An error occurred. Please try again.');
  }
};
