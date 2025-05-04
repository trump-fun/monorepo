import { PoolStatus, TokenType } from '@/types';
import { BetsQueryResultTypeMulti } from '@/types/bet';

export function calculateVolume(bets: BetsQueryResultTypeMulti) {
  let totalVolume = 0;
  let activeVolume = 0;

  bets.forEach((bet) => {
    try {
      const betAmount = parseFloat(bet.amount);
      if (!isNaN(betAmount)) {
        totalVolume += betAmount;

        if (bet.pool.status === PoolStatus.Pending) {
          activeVolume += betAmount;
        }
      }
    } catch (error) {
      console.error('Error calculating bet volume:', error);
    }
  });

  return { totalVolume, activeVolume };
}

export function formatTokenAmount(amount: string | number, _tokenType: TokenType) {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) return '0';

  // const decimals = tokenType === 0 ? USDC_DECIMALS : FREEDOM_DECIMALS;
  // return (numericAmount / Math.pow(10, decimals)).toLocaleString();
  return numericAmount.toLocaleString();
}
