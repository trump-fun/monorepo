import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import config from '../config';

// Import formatting utilities from common package
import { formatFreedom, formatTokenAmount, formatUSDC, getTimeRemaining } from '@trump-fun/common';

// Configure dayjs plugins
dayjs.extend(relativeTime);

/**
 * Format a number as currency with appropriate decimals
 * @param amount The number to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted string
 */
export function formatCurrency(amount: number | string, decimals = 2): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) return '0';

  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

// Re-export formatting functions from common package
export {
  formatDate as commonFormatDate,
  formatFreedom,
  formatTokenAmount,
  formatUSDC,
  getTimeRemaining,
};

/**
 * Format a timestamp to a human-readable date and time with custom format
 * @param timestamp Unix timestamp (seconds)
 * @returns Formatted date string
 */
export function formatDate(timestamp: number | string): string {
  const time = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  return dayjs(time * 1000).format('MMM D, YYYY h:mm A');
}

// getTimeRemaining now imported from common package

/**
 * Get transaction explorer URL
 * @param hash Transaction hash
 * @returns Explorer URL
 */
export function getExplorerLink(hash: string): string {
  return `${config.chain.explorerUrl}/tx/${hash}`;
}
