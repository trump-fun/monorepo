import { TokenType } from '@/types';
import { DEFAULT_CHAIN_ID, USDC_DECIMALS } from '@trump-fun/common';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Re-export constants from common package
export { USDC_DECIMALS };

export enum FrontendPoolStatus {
  Pending = 'pending',
  Grading = 'grading',
  Graded = 'graded',
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;

export const addressToBackgroundColor = (address: string) => {
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `hsl(${hash % 360}, 50%, 50%)`;
};

const toDecimal = (amount: number | string, tokenType: TokenType) => {
  if (typeof amount === 'string') {
    amount = parseFloat(amount);
  }
  if (isNaN(amount)) {
    return 0;
  }
  const decimals = tokenType === TokenType.Usdc ? USDC_DECIMALS : 0;
  return amount / Math.pow(10, decimals);
};

export function generateRandomColor(isLight: boolean) {
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 50) + 50; // 50-100
  const lightness = isLight
    ? Math.floor(Math.random() * 30) + 60
    : Math.floor(Math.random() * 30) + 15; // Light: 60-90, Dark: 15-45
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Convert USDC amount to dollars (without currency symbol)
 * @param amount Raw USDC amount with decimals
 * @returns Formatted string without $ prefix
 */
export function usdcAmountToDollars(amount: number | string): string {
  return toDecimal(amount, TokenType.Usdc).toFixed(0);
}

/**
 * Convert USDC amount to dollars as a number
 * @param amount Raw USDC amount with decimals
 * @param alreadyFormatted Whether the amount is already formatted
 * @returns Number value
 * @deprecated Use toDecimal from common package instead
 */
export function usdcAmountToDollarsNumber(
  amount: number | string,
  alreadyFormatted: boolean = false
): number {
  if (alreadyFormatted) {
    return typeof amount === 'string' ? parseInt(amount) : amount;
  }
  return Math.round(toDecimal(amount, TokenType.Usdc));
}

export const bigintToHexString = (n: bigint) => {
  return n.toString(16);
};

export const shame = (t: string) => {
  return t.indexOf('0x0') === 0 ? t : `0x0${t}`;
};

export const parseChainId = (chainId: number | string): string => {
  let parsedChainId = chainId;
  if (typeof chainId === 'string') {
    parsedChainId = parseInt(chainId);
  }
  return parsedChainId === DEFAULT_CHAIN_ID ? 'Base Sepolia' : 'Unknown';
};
