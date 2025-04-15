import { InlineKeyboard } from 'grammy';
import { PoolStatus } from '@trump-fun/common';
import { type Pool } from '@trump-fun/common';

/**
 * Creates a visual progress bar
 * @param percentage The percentage value (0-100)
 * @returns A string representing a visual progress bar
 */
export function createProgressBar(percentage: number): string {
  const filledChar = '█';
  const emptyChar = '░';
  const barLength = 20;
  const filledCount = Math.round((percentage / 100) * barLength);

  return (
    filledChar.repeat(filledCount) +
    emptyChar.repeat(Math.max(0, barLength - filledCount)) +
    ` ${percentage.toFixed(1)}%`
  );
}

/**
 * Creates the main navigation keyboard for pools
 * @param pools List of pool objects
 * @param currentFilter Current filter type
 * @param pagination Pagination state object
 * @returns Configured InlineKeyboard
 */
export function createPoolsNavigationKeyboard(
  pools: Pool[],
  currentFilter: string,
  pagination: { offset: number; limit: number }
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  // Add pool selection buttons
  pools.forEach((pool, index) => {
    keyboard.text(`Pool #${pool.poolId} (${pool.status})`, `pool_view_${pool.poolId}`);
    if ((index + 1) % 2 === 0 || index === pools.length - 1) keyboard.row();
  });

  // Filter buttons
  keyboard
    .text(currentFilter === 'active' ? '🔥 Active ✓' : '🔥 Active', `pools_filter_active`)
    .text(currentFilter === 'trending' ? '📈 Trending ✓' : '📈 Trending', `pools_filter_trending`)
    .row()
    .text(
      currentFilter === 'ending_soon' ? '⏰ Ending Soon ✓' : '⏰ Ending Soon',
      `pools_filter_ending_soon`
    )
    .text(currentFilter === 'newest' ? '🆕 Newest ✓' : '🆕 Newest', `pools_filter_newest`)
    .row();

  // Pagination
  if (pools.length >= pagination.limit) {
    keyboard.text(
      '⬇️ Next Page',
      `pools_page_${pagination.offset + pagination.limit}_${currentFilter}`
    );
  }

  if (pagination.offset > 0) {
    keyboard.text(
      '⬆️ Previous Page',
      `pools_page_${Math.max(0, pagination.offset - pagination.limit)}_${currentFilter}`
    );
  }

  return keyboard;
}

/**
 * Creates a keyboard for pool details
 * @param pool The pool object
 * @returns Configured InlineKeyboard
 */
export function createPoolDetailsKeyboard(pool: Pool): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  if (pool.status === PoolStatus.Pending) {
    // If pool is active, add a full-width prominent betting button
    keyboard
      .text('🔥 PLACE BET 🔥', `bet_pool_${pool.id}`)
      .row()
      .text('🔙 Back to Pools', 'pools_back_to_list');
  } else {
    // If pool betting is closed, just show back button
    keyboard.text('🔙 Back to Pools', 'pools_back_to_list');
  }

  return keyboard;
}

/**
 * Creates a keyboard for bet option selection
 * @param pool The pool object
 * @returns Configured InlineKeyboard
 */
export function createBetOptionsKeyboard(pool: Pool): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  // Add buttons for each option
  pool.options.forEach((option: string, index: number) => {
    keyboard.text(`${index + 1}. ${option}`, `bet_option_${pool.poolId}_${index}`);
    if (index % 2 === 1 || index === pool.options.length - 1) keyboard.row();
  });

  // Add back button
  keyboard.text('⬅️ Back to Pools', 'bet_cmd');

  return keyboard;
}

/**
 * Creates a keyboard for bet amount selection
 * @param poolId The ID of the pool
 * @param optionIndex The selected option index
 * @param balance The user's token balance
 * @returns Configured InlineKeyboard
 */
export function createBetAmountKeyboard(
  poolId: string,
  optionIndex: string,
  balance: number
): InlineKeyboard {
  const amountOptions = [10, 50, 100, 200, 500];
  const keyboard = new InlineKeyboard();

  // Only show amounts the user can afford
  amountOptions.forEach((amount, index) => {
    if (amount <= balance) {
      keyboard.text(`${amount} FREEDOM`, `bet_amount_${poolId}_${optionIndex}_${amount}`);
      if (index % 3 === 2) keyboard.row();
    }
  });
  if (amountOptions.some(amount => amount <= balance)) keyboard.row();

  // Add custom amount option and back button
  keyboard.text('💰 Custom Amount', `bet_custom_${poolId}_${optionIndex}`);
  keyboard.row().text('⬅️ Back to Pool', `bet_pool_${poolId}`);

  return keyboard;
}
