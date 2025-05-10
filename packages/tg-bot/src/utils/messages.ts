import {
  PoolStatus,
  formatFreedom,
  formatUSDC,
  formatWithTokenName,
  TokenType,
  getTimeRemaining,
} from '@trump-fun/common';
import { type Pool } from '@trump-fun/common';
import dayjs from 'dayjs';
import { createProgressBar } from './ui';

/**
 * Constants for message formatting
 */
export const FORMAT = {
  HTML: 'HTML', // Use HTML formatting (with <b>, <i>, etc.)
  MARKDOWN: 'MD', // Use Markdown formatting (with *, _, etc.)
};

// Default format to use throughout the application
export const DEFAULT_FORMAT = FORMAT.HTML;

// getTimeRemaining now imported from common package

/**
 * Format a date for display in the bot
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted date string
 */
export function formatDate(timestamp: number | string): string {
  // Use dayjs formatting for bot-specific date display
  const time = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  return dayjs(time * 1000).format('MMM D, YYYY h:mm A');
}

/**
 * Standard formatting for pool messages using HTML
 * @param pool Pool data object
 * @returns Formatted HTML message for pool display
 */
export function formatPoolMessage(pool: Pool): string {
  const {
    poolId,
    question,
    options,
    status,
    chainName,
    betsCloseAt,
    usdcBetTotals,
    pointsBetTotals,
    usdcBetTotals,
    pointsBetTotals,
    winningOption,
    createdBlockTimestamp,
    isDraw,
  } = pool;

  const totalPoints =
    pointsBetTotals?.reduce((sum, points) => sum + BigInt(points || '0'), BigInt(0)) || BigInt(0);
  const totalUsdc =
    usdcBetTotals?.reduce((sum, usdc) => sum + BigInt(usdc || '0'), BigInt(0)) || BigInt(0);

  const pointsPercentages =
    totalPoints > BigInt(0)
      ? pointsBetTotals?.map(points =>
          Number((BigInt(points || '0') * BigInt(100)) / totalPoints)
        ) || []
      : options.map(() => 0);

  const usdcPercentages =
    totalUsdc > BigInt(0)
      ? usdcBetTotals?.map(usdc => Number((BigInt(usdc || '0') * BigInt(100)) / totalUsdc)) || []
      : options.map(() => 0);

  const combinedPercentages = options.map((_, index) => {
    if (totalPoints > BigInt(0) && totalUsdc > BigInt(0)) {
      return Math.round(((pointsPercentages[index] || 0) + (usdcPercentages[index] || 0)) / 2);
    } else if (totalPoints > BigInt(0)) {
      return pointsPercentages[index] || 0;
    } else if (totalUsdc > BigInt(0)) {
      return usdcPercentages[index] || 0;
    } else {
      return 0;
    }
  });

  const optionsDisplay = options
    .map((option, index) => {
      const usdcAmount = usdcBetTotals?.[index] || '0';
      const pointsAmount = pointsBetTotals?.[index] || '0';
      const percentage = combinedPercentages[index] || 0;

      const isWinner = winningOption !== null && index.toString() === winningOption;
      const isDrewOption = isDraw && winningOption !== null && index.toString() === winningOption;

      const progressBar = createProgressBar(percentage);

      return `• <b>${option}</b>: ${formatUSDC(usdcAmount || '0')} (${formatFreedom(
        pointsAmount || '0'
      )} points) - ${percentage.toFixed(1)}%\n  ${progressBar}${isWinner ? ' ✅' : ''}${isDrewOption ? ' 🤝' : ''}`;
    })
    .join('\n\n');

  let timeRemaining = '';
  if (betsCloseAt) {
    const endTime = Number(betsCloseAt) * 1000;
    const now = Date.now();
    const remainingMs = endTime - now;

    if (remainingMs > 0) {
      const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      timeRemaining = `\n⏰ <b>Time Remaining:</b> ${days}d ${hours}h`;
    }
  }

  return `
<b>🔮 Prediction Pool #${poolId}</b>

<b>❓ Question:</b>
${question}

<b>📊 Options:</b>
${optionsDisplay}

💰 <b>Total Volume:</b> ${formatUSDC(usdcBetTotals || '0')} (${formatFreedom(pointsBetTotals || '0')} points)
⏰ <b>Betting Closes:</b> ${formatDate(betsCloseAt || '0')}${timeRemaining}
🕒 <b>Created:</b> ${formatDate(createdBlockTimestamp || pool.createdAt || '0')}
🔄 <b>Status:</b> ${status}${status === PoolStatus.Pending ? ' (OPEN FOR BETTING)' : status === PoolStatus.Graded || status === PoolStatus.Regraded ? ' (COMPLETED)' : ' (BETTING CLOSED)'}
⛓️ <b>Chain:</b> ${chainName || 'Base'}

<code>/pool ${poolId}</code>
`.trim();
}

/**
 * Format a list of pools for display
 * @param pools Array of pool objects
 * @returns Formatted HTML message string
 */
export function formatPoolsList(pools: Pool[]): string {
  if (pools.length === 0) {
    return 'No pools found matching your criteria.';
  }

  let message = '<b>📊 Available Pools:</b>\n\n';

  pools.forEach((pool, index) => {
    const timeInfo =
      pool.betsCloseAt && pool.status === PoolStatus.Pending
        ? getTimeRemaining(pool.betsCloseAt)
        : '';

    // Format volume information if available
    const usdcBetTotals = pool.usdcBetTotals ? formatUSDC(pool.usdcBetTotals) : '$0.00';
    const volumeInfo = pool.usdcBetTotals ? ` | Vol: ${usdcBetTotals}` : '';

    // Format options count
    const optionsCount = pool.options?.length || 0;
    const optionsInfo = ` | Options: ${optionsCount}`;

    // Status display with emoji
    const statusEmoji =
      pool.status === PoolStatus.Pending
        ? '🟢' // Green circle
        : pool.status === PoolStatus.Graded || pool.status === PoolStatus.Regraded
          ? '🔴' // Red circle
          : '🟠'; // Orange circle

    // Time remaining display
    const timeDisplay = timeInfo ? ` | ⏱️ ${timeInfo}` : '';

    // Format the pool entry with better structure
    message += `${index + 1}. <b>${pool.question}</b>\n`;
    message += `   ID: <code>${pool.poolId}</code> | ${statusEmoji} ${pool.status}${timeDisplay}${volumeInfo}${optionsInfo}\n\n`;
  });

  return message;
}

/**
 * Format a wallet message with balance information
 * @param address Wallet address
 * @param ethBalance ETH balance
 * @param tokenBalance FREEDOM token balance
 * @param usdcBalance USDC balance
 * @param isNewWallet Whether this is a new wallet
 * @returns Formatted HTML message
 */
export function formatWalletMessage(
  address: string,
  ethBalance: number,
  tokenBalance: number,
  usdcBalance: number,
  isNewWallet: boolean
): string {
  const header = isNewWallet ? '<b>✅ New wallet created!</b>\n\n' : '<b>💼 Your wallet</b>\n\n';

  return `
${header}
<b>Network:</b> Base Sepolia
<b>Address:</b> <code>${address}</code>

<b>Balances:</b>
• <b>ETH:</b> ${ethBalance.toFixed(4)} ETH
• <b>FREEDOM:</b> ${tokenBalance} FREEDOM
• <b>USDC:</b> ${usdcBalance ? '$' + usdcBalance.toFixed(2) : '$0'}

<i>Use this address to receive tokens on the Base Sepolia network.</i>
`.trim();
}

/**
 * Format a message about bet activity
 * @param bets Array of bet objects
 * @param filterType Current filter type
 * @returns Formatted HTML message
 */
export function formatBetsMessage(bets: any[], filterType: string): string {
  if (!bets || bets.length === 0) {
    return `No ${filterType.toLowerCase()} bets found.`;
  }

  let message = `<b>📈 Your ${filterType.toLowerCase()} bets:</b>\n\n`;

  bets.forEach((bet, index) => {
    const amount = typeof bet.amount === 'string' ? bet.amount : '0';
    const formattedAmount =
      bet.tokenType === TokenType.Usdc
        ? formatUSDC(amount)
        : formatWithTokenName(amount, TokenType.Freedom);

    // Get outcome status for the bet
    let outcomeStatus = '';
    if (bet.pool.status === PoolStatus.Graded || bet.pool.status === PoolStatus.Regraded) {
      const userWon = bet.option.toString() === bet.pool.winningOption;
      outcomeStatus = userWon ? ' | ✅ Won' : ' | ❌ Lost';
    }

    // Get time info
    let timeInfo = '';
    if (bet.pool.betsCloseAt && bet.pool.status === PoolStatus.Pending) {
      const remaining = getTimeRemaining(bet.pool.betsCloseAt);
      if (remaining) {
        timeInfo = ` | ⏱️ ${remaining}`;
      }
    } else {
      const timestamp =
        typeof bet.blockTimestamp === 'string'
          ? parseInt(bet.blockTimestamp) * 1000
          : bet.blockTimestamp * 1000;
      timeInfo = ` | ${dayjs(timestamp).format('MMM D, YYYY')}`;
    }

    const optionText = bet.pool.options[bet.option] || `Option ${bet.option}`;

    message += `${index + 1}. <b>${bet.pool.question}</b>\n`;
    message += `   ${formattedAmount} on "${optionText}"${outcomeStatus}${timeInfo}\n\n`;
  });

  return message;
}

/**
 * Format help message
 * @returns Formatted help message
 */
export function formatHelpMessage(): string {
  return `
<b>🇺🇸 Trump.fun Bot Commands</b>

<b>Prediction Markets:</b>
• /pools - Browse betting pools on Trump's posts
• /pool [id] - View details for a specific prediction

<b>Betting:</b>
• /bet - Place a new bet (interactive)
• /bet [poolId] [option] [amount] - Quick bet
• /bets - Track your bets on Trump's actions

<b>Wallet:</b>
• /wallet - View your ETH, FREEDOM & USDC balances
• /withdraw [amount] - Cash out your winnings

<b>Help:</b>
• /help - Show this TREMENDOUS help message

<i>MAKE BETTING GREAT AGAIN at Trump.fun!</i>
`.trim();
}
