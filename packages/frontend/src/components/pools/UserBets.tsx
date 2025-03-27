import { Bet, Pool } from '@trump-fun/common';
import { format } from 'date-fns';
import { ReactNode } from 'react';

interface UserBetsProps {
  placedBets: any; // Replace with proper typing
  pool: Pool; // Replace with proper typing
  USDC_DECIMALS: number;
  tokenLogo: ReactNode;
  symbol: string;
}

export const UserBets = ({ placedBets, pool, USDC_DECIMALS, tokenLogo }: UserBetsProps) => {
  if (!placedBets?.bets || placedBets.bets.length === 0) {
    return null;
  }

  return (
    <div className='mb-6'>
      <h3 className='mb-4 text-lg font-semibold'>Your Bets</h3>
      <div className='space-y-2'>
        {placedBets.bets.map((bet: Bet) => (
          <div key={bet.id} className='flex items-center justify-between rounded-md border p-3'>
            <div className='flex flex-col'>
              <div className='flex items-center'>
                <span className={bet.option === '0' ? 'text-green-500' : 'text-red-500'}>
                  {pool.options[parseInt(bet.option)]}
                </span>
              </div>
              <span className='text-muted-foreground text-sm'>
                {bet.updatedAt
                  ? format(new Date(Number(bet.updatedAt) * 1000), 'MMM d, yyyy h:mm a')
                  : 'Date unavailable'}
              </span>
            </div>
            <div className='flex items-center gap-1'>
              <span className='font-medium'>
                {(Number(bet.amount) / 10 ** USDC_DECIMALS).toLocaleString()}
              </span>
              {tokenLogo}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
