import { apolloClient } from '@/lib/apolloClient';
import { formatPoolMessage } from '@/utils/messages';
import { createPoolDetailsKeyboard } from '@/utils/ui';
import { OrderDirection, Pool_OrderBy, type Pool } from '@trump-fun/common';
import type { CommandContext, Context } from 'grammy';
import { GET_POOL } from '../../queries';

export const poolCommand = async (ctx: CommandContext<Context>) => {
  if (!ctx.message) {
    return ctx.reply('Message not found.');
  }

  const inputPoolId = ctx.message.text.split(' ')[1];
  if (!inputPoolId) {
    return ctx.reply('Please provide a pool ID.\nUsage: /pool [pool_id]');
  }

  try {
    const poolResult = await apolloClient.query({
      query: GET_POOL,
      variables: {
        poolId: inputPoolId,
        orderBy: Pool_OrderBy.CreatedAt,
        orderDirection: OrderDirection.Desc,
      },
    });

    if (poolResult.error) {
      console.error('Error fetching pool:', poolResult.error);
      return ctx.reply('Error fetching pool data.');
    }

    if (!poolResult.data || !poolResult.data.pool) {
      return ctx.reply(`No data found for pool ID: ${inputPoolId}`);
    }

    const poolData = poolResult.data.pool as Pool;
    const message = formatPoolMessage(poolData);

    // Create keyboard with betting options and navigation
    const keyboard = createPoolDetailsKeyboard(poolData);

    if (poolData.imageUrl) {
      // Send the image with the caption
      return ctx.replyWithPhoto(poolData.imageUrl, {
        caption: message,
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });
    }

    // If no image was found or there was an error, just send the text message
    return ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } catch (error) {
    console.error('Exception in pool command:', error);
    return ctx.reply('An unexpected error occurred while fetching pool data.');
  }
};
