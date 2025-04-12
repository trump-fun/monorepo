import { TokenType } from '../types/__generated__/graphql';
import { USDC_DECIMALS, POINTS_DECIMALS } from '../config';

// Constants for token names
export const TOKEN_NAMES = {
  [TokenType.Usdc]: 'USDC',
  [TokenType.Freedom]: 'FREEDOM',
};

/**
 * Get the number of decimals for a token type
 * @param tokenType Type of token (USDC or Freedom)
 * @returns Number of decimals
 */
export function getTokenDecimals(tokenType: TokenType): number {
  return tokenType === TokenType.Usdc ? USDC_DECIMALS : POINTS_DECIMALS;
}

/**
 * Convert raw token amount to human-readable decimal form
 * @param amount Raw token amount (with decimals)
 * @param tokenType Type of token (USDC or Freedom)
 * @returns Number in human-readable form
 */
export function toDecimal(amount: string | number | bigint, tokenType: TokenType): number {
  let rawAmount: number;
  if (typeof amount === 'string') {
    rawAmount = Number(amount);
  } else if (typeof amount === 'bigint') {
    // Convert bigint to number safely
    rawAmount = Number(amount);
  } else {
    rawAmount = amount;
  }
  const decimals = getTokenDecimals(tokenType);
  return rawAmount / Math.pow(10, decimals);
}

/**
 * Convert human-readable decimal value to raw token amount with proper decimals
 * @param amount Human-readable decimal amount
 * @param tokenType Type of token (USDC or Freedom)
 * @returns Raw token amount as BigInt
 */
export function toRawAmount(amount: number, tokenType: TokenType): bigint {
  const decimals = getTokenDecimals(tokenType);
  return BigInt(Math.floor(amount * Math.pow(10, decimals)));
}

/**
 * Get the divisor to convert raw amounts to decimal
 * @param tokenType Type of token (USDC or Freedom)
 * @returns The divisor as a bigint
 */
export function getTokenDivisor(tokenType: TokenType): bigint {
  const decimals = getTokenDecimals(tokenType);
  return BigInt(10) ** BigInt(decimals);
}

/**
 * Format a raw token amount to a locale string
 * @param amount Raw token amount (with decimals)
 * @param tokenType Type of token (USDC or Freedom)
 * @param options Locale string options
 * @returns Formatted string (without currency symbol)
 */
export function formatTokenAmount(
  amount: string | number,
  tokenType: TokenType,
  options?: Intl.NumberFormatOptions
): string {
  const value = toDecimal(amount, tokenType);
  return value.toLocaleString('en-US', { maximumFractionDigits: 2, ...options });
}

/**
 * Format a raw USDC amount with dollar sign
 * @param amount Raw USDC amount (with decimals)
 * @param options Locale string options
 * @returns Formatted string with $ prefix
 */
export function formatUSDC(amount: string | number, options?: Intl.NumberFormatOptions): string {
  const value = toDecimal(amount, TokenType.Usdc);
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2, ...options })}`;
}

/**
 * Format a raw FREEDOM amount
 * @param amount Raw FREEDOM amount (with decimals)
 * @param options Locale string options
 * @returns Formatted string
 */
export function formatFreedom(amount: string | number, options?: Intl.NumberFormatOptions): string {
  const value = toDecimal(amount, TokenType.Freedom);
  return value.toLocaleString('en-US', { maximumFractionDigits: 2, ...options });
}

/**
 * Format a date from timestamp
 * @param timestamp Unix timestamp
 * @returns Formatted date string
 */
export function formatDate(timestamp: string | number): string {
  const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  return new Date(ts * 1000).toLocaleString();
}

/**
 * Format a token amount for display with appropriate abbreviation for large numbers
 * @param amount Raw token amount (with decimals)
 * @param tokenType Type of token (USDC or FREEDOM)
 * @returns Formatted string with abbreviation (K, M, B)
 */
/**
 * Get the token name based on token type
 * @param tokenType Type of token
 * @returns Token name as a string
 */
export function getTokenName(tokenType: TokenType): string {
  return TOKEN_NAMES[tokenType] || 'FREEDOM';
}

/**
 * Format a token amount with the token name
 * @param amount Raw token amount (with decimals)
 * @param tokenType Type of token (USDC or FREEDOM)
 * @param options Locale string options
 * @returns Formatted string with token name
 */
export function formatWithTokenName(
  amount: string | number,
  tokenType: TokenType,
  options?: Intl.NumberFormatOptions
): string {
  const value =
    tokenType === TokenType.Usdc ? formatUSDC(amount, options) : formatFreedom(amount, options);
  return `${value} ${getTokenName(tokenType)}`;
}

export function formatAbbreviatedAmount(amount: string | number, tokenType: TokenType): string {
  const value = toDecimal(amount, tokenType);

  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  } else {
    return value.toFixed(1);
  }
}

/**
 * Gets time remaining until a timestamp in human-readable format
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted time remaining string or empty if in past
 */
export function getTimeRemaining(timestamp: number | string): string {
  const endTime = typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000;
  const now = Date.now();
  const remainingMs = endTime - now;

  if (remainingMs <= 0) {
    return '';
  }

  const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
