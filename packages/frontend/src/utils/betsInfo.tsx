import { TOKEN_SYMBOLS } from '@/hooks/useTokenContext';
import { POINTS_DECIMALS, Pool, TokenType, USDC_DECIMALS } from '@trump-fun/common';
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
export const getVolumeForTokenType = (pool: Pool, tokenType: TokenType, raw = false) => {
  if (!pool) return tokenType === TokenType.Usdc ? '0' : '0';

  const rawValue = tokenType === TokenType.Usdc ? pool.usdcVolume : pool.pointsVolume;

  if (raw) {
    return rawValue;
  }

  const decimals = tokenType === TokenType.Usdc ? USDC_DECIMALS : POINTS_DECIMALS;
  const value = Number(rawValue) / Math.pow(10, decimals);

  return Math.ceil(value);
};

export const getFormattedVolumeForTokenType = (pool: Pool, tokenType: TokenType, raw = false) => {
  const volume = getVolumeForTokenType(pool, tokenType, raw);
  return Number(volume).toLocaleString();
};

export const calculateVolume = (pool: Pool, tokenType: TokenType): React.ReactNode => {
  if (!pool) return tokenType === TokenType.Usdc ? '0' : '0';

  try {
    const isUsdc = tokenType === TokenType.Usdc;
    const rawAmount = isUsdc ? pool.usdcVolume : pool.pointsVolume;
    const decimals = isUsdc ? USDC_DECIMALS : POINTS_DECIMALS;
    const value = formatTokenAmount(rawAmount, decimals, !isUsdc);

    return (
      <>
        {TOKEN_SYMBOLS[tokenType].logo}
        <span className='ml-1'>{value.toLocaleString()}</span>
      </>
    );
  } catch (error) {
    console.error('Error calculating volume:', error);
    return tokenType === TokenType.Usdc ? '0' : '0';
  }
};

export const getBetTotals = (
  pool: Pool,
  tokenType: TokenType | string,
  optionIndex: number
): string => {
  if (!pool) return tokenType === TokenType.Usdc ? '$0' : '0';

  try {
    const isUsdc = tokenType === TokenType.Usdc;
    const betTotals = isUsdc ? pool.usdcBetTotals : pool.pointsBetTotals;
    if (!betTotals) return isUsdc ? '$0' : '0';

    const decimals = isUsdc ? USDC_DECIMALS : POINTS_DECIMALS;
    const value = formatTokenAmount(betTotals[optionIndex], decimals, !isUsdc);

    return value.toLocaleString();
  } catch (error) {
    console.error('Error getting bet totals:', error);
    return tokenType === TokenType.Usdc ? '$0' : '0';
  }
};

/**
 * Calculate percentages for each option in a pool
 */
export const calculateOptionPercentages = (pool: Pool, tokenType?: TokenType): number[] => {
  if (!pool) return [];

  const totalPoints = pool.pointsBetTotals.reduce(
    (sum, points) => sum + BigInt(points || '0'),
    BigInt(0)
  );
  const totalUsdc = pool.usdcBetTotals.reduce((sum, usdc) => sum + BigInt(usdc || '0'), BigInt(0));

  const pointsPercentages =
    totalPoints > BigInt(0)
      ? pool.pointsBetTotals.map(points =>
          Number((BigInt(points || '0') * BigInt(100)) / totalPoints)
        )
      : pool.options.map(() => 0);

  const usdcPercentages =
    totalUsdc > BigInt(0)
      ? pool.usdcBetTotals.map(usdc => Number((BigInt(usdc || '0') * BigInt(100)) / totalUsdc))
      : pool.options.map(() => 0);

  return pool.options.map((_, index) => {
    if (tokenType === TokenType.Points && totalPoints > BigInt(0)) {
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
  tokenType: TokenType,
  minPercentage = 5
): {
  pool: Pool;
  percentage: number;
  displayVolume: number | string;
}[] => {
  if (!pools || pools.length === 0) {
    return [];
  }

  // Calculate raw volume values for each pool
  const volumeValues = pools.map(pool => {
    if (!pool) return { pool, rawVolume: 0 };

    const rawVolume =
      tokenType === TokenType.Usdc
        ? Number(pool.usdcVolume || '0')
        : Number(pool.pointsVolume || '0');
    return { pool, rawVolume };
  });

  // Find max volume to calculate relative percentages
  const maxVolume = Math.max(...volumeValues.map(v => v.rawVolume), 1);

  // Prepare display data
  return volumeValues.map(({ pool, rawVolume }) => ({
    pool,
    percentage: Math.max(Math.round((rawVolume / maxVolume) * 100), minPercentage), // Minimum percentage for visibility
    displayVolume: pool ? getVolumeForTokenType(pool, tokenType) : 0,
  }));
};
