import { Bet } from '../types/__generated__/graphql';

export function calculateVolume(bets: Bet[]) {
  let totalVolume = 0;
  let activeVolume = 0;

  bets.forEach((bet) => {
    try {
      const betAmount = parseFloat(bet.amount);
      if (!isNaN(betAmount)) {
        totalVolume += betAmount;

        if (bet.pool.status === 'PENDING') {
          activeVolume += betAmount;
        }
      }
    } catch (error) {
      console.error('Error calculating bet volume:', error);
    }
  });

  return { totalVolume, activeVolume };
}

export function formatTokenAmount(amount: string | number, tokenType: number) {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) return '0';

  // const decimals = tokenType === 0 ? USDC_DECIMALS : POINTS_DECIMALS;
  // return (numericAmount / Math.pow(10, decimals)).toLocaleString();
  return numericAmount.toLocaleString();
}
