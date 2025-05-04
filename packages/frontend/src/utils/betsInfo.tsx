import { GetPoolQuery, GetPoolsQuery, Pool, PoolsQueryResultTypeSingle, TokenType } from '@/types';
import { FREEDOM_DECIMALS, USDC_DECIMALS } from '@trump-fun/common';
import React from 'react';

// Helper function to safely convert token amounts
const formatTokenAmount = (
  rawAmount: string | undefined,
  decimals: number,
  floor = false
): number => {
  const amount = Number(rawAmount || '0');
  const value = amount / Math.pow(10, decimals);
  return floor ? Math.floor(value) : value;
};
export const getVolumeForTokenType = (
  pool: GetPoolQuery['pool'] | GetPoolsQuery['pools'][number],
  tokenType: TokenType,
  raw = false
) => {
  if (!pool) return tokenType === TokenType.Usdc ? '0' : '0';

  const rawValue = tokenType === TokenType.Usdc ? pool.usdcBetTotals : pool.pointsBetTotals;

  if (raw) {
    return rawValue;
  }

  const decimals = tokenType === TokenType.Usdc ? USDC_DECIMALS : FREEDOM_DECIMALS;
  const value = Number(rawValue) / Math.pow(10, decimals);

  return Math.ceil(value);
};

export const getFormattedVolumeForTokenType = (pool: Pool, tokenType: TokenType, raw = false) => {
  const volume = getVolumeForTokenType(pool, tokenType, raw);
  return Number(volume).toLocaleString();
};

export const calculateVolume = (pool: PoolsQueryResultTypeSingle, tokenType: TokenType): React.ReactNode => {
  if (!pool) return tokenType === TokenType.Usdc ? '0' : '0';

  try {
    const isUsdc = tokenType === TokenType.Usdc;
    const rawAmount = isUsdc ? pool.usdcBetTotals : pool.pointsBetTotals;
    const decimals = isUsdc ? USDC_DECIMALS : FREEDOM_DECIMALS;
    const value = formatTokenAmount(rawAmount, decimals, !isUsdc);

    return (
      <>
        {isUsdc ? '💲' : '🦅'}
        <span className='ml-1'>{value.toLocaleString()}</span>
      </>
    );
  } catch (error) {
    console.error('Error calculating volume:', error);
    return tokenType === TokenType.Usdc ? '0' : '0';
  }
};

export const getBetTotals = (
  pool: PoolsQueryResultTypeSingle,
  tokenType: TokenType | string,
  option: number
): string => {
  if (!pool) return tokenType === TokenType.Usdc ? '$0' : '0';

  try {
    const isUsdc = tokenType === TokenType.Usdc;
    const betTotals = isUsdc ? pool.usdcBetTotals : pool.pointsBetTotals;
    if (!betTotals) return isUsdc ? '$0' : '0';

    const decimals = isUsdc ? USDC_DECIMALS : FREEDOM_DECIMALS;
    const value = formatTokenAmount(betTotals[option], decimals, !isUsdc);

    return value.toLocaleString();
  } catch (error) {
    console.error('Error getting bet totals:', error);
    return tokenType === TokenType.Usdc ? '$0' : '0';
  }
};

/**
 * Calculate percentages for each option in a pool
 */
export const calculateOptionPercentages = (
  pool: GetPoolQuery['pool'] | GetPoolsQuery['pools'][number],
  tokenType: TokenType
): number[] => {
  if (!pool) return [];

  const totalPoints = pool.pointsBetTotals;
  const totalUsdc = pool.usdcBetTotals;

  const pointsPercentages =
    totalPoints > BigInt(0)
      ? pool.pointsBetTotalsByOption.map((points: string) =>
          Number((BigInt(points || '0') * BigInt(100)) / totalPoints)
        )
      : pool.options.map(() => 0);

  const usdcPercentages =
    totalUsdc > BigInt(0)
      ? pool.usdcBetTotalsByOption.map((usdc: string) =>
          Number((BigInt(usdc || '0') * BigInt(100)) / totalUsdc)
        )
      : pool.options.map(() => 0);

  return pool.options.map((_, index) => {
    if (tokenType === TokenType.Freedom && totalPoints > BigInt(0)) {
      return pointsPercentages[index];
    } else if (tokenType === TokenType.Usdc && totalUsdc > BigInt(0)) {
      return usdcPercentages[index];
    } else if (totalPoints > BigInt(0) && totalUsdc > BigInt(0)) {
      return Math.round((pointsPercentages[index] + usdcPercentages[index]) / 2);
    } else if (totalPoints > BigInt(0)) {
      return pointsPercentages[index];
    } else if (totalUsdc > BigInt(0)) {
      return usdcPercentages[index];
    } else {
      return 0;
    }
  });
};

/**
 * Calculate relative volume percentages for multiple pools
 */
export const calculateRelativeVolumePercentages = (
  pools: Pool[],
  tokenType: TokenType
): number[] => {
  if (!pools || !pools.length) return [];

  // Get the total volume of all pools
  const totalVolume = pools.reduce((acc, pool) => {
    const volume = Number(getVolumeForTokenType(pool, tokenType, true));
    return acc + volume;
  }, 0);

  if (totalVolume <= 0) return pools.map(() => 0);

  // Calculate percentage of total for each pool
  return pools.map((pool) => {
    const volume = Number(getVolumeForTokenType(pool, tokenType, true));
    return Math.round((volume / totalVolume) * 100);
  });
};
