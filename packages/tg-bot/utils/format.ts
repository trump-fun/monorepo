import { formatDate as formatDateCommon, formatFreedom, formatUSDC } from '@trump-fun/common';
import { PoolStatus } from '@trump-fun/common/src/types/__generated__/graphql';

/**
 * Format a USDC amount with $ sign
 * @param value Raw USDC value with decimals
 * @returns Formatted string with $ sign
 */
export const formatUSD = (value: string) => {
  return formatUSDC(value);
};

/**
 * Format a FREEDOM token amount
 * @param value Raw FREEDOM value with decimals
 * @returns Formatted string
 */
export const formatPoints = (value: string) => {
  return formatFreedom(value);
};

/**
 * Format a timestamp as a locale string
 * @param timestamp Unix timestamp
 * @returns Formatted date string
 */
export const formatDate = (timestamp: string) => {
  return formatDateCommon(timestamp);
};

// Format status with emoji
export const formatStatus = (status: PoolStatus) => {
  switch (status) {
    case PoolStatus.Pending:
      return '🟢 Active';
    case PoolStatus.Graded:
      return '✅ Graded';
    default:
      return status;
  }
};
