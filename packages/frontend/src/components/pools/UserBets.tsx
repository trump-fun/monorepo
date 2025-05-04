'use client';
import { Bet, PoolsQueryResultTypeSingle, TokenType } from '@/types';
import { formatTokenAmount } from '@/utils/betsCalculations';
import { format } from 'date-fns';
import { ReactNode } from 'react';

interface UserBetsProps {
  placedBets: Bet[];
  pool: PoolsQueryResultTypeSingle;
  tokenLogo: ReactNode;
  symbol: string;
}

export const UserBets = ({ placedBets, pool, tokenLogo }: UserBetsProps) => {
  if (placedBets.length === 0) {
    return null;
  }

  if (!pool) return null;

  return (
    <div className='mb-6'>
      <h3 className='mb-4 text-lg font-semibold'>Your Bets</h3>
      <div className='space-y-2'>
        {placedBets.map((bet) => (
          <div key={bet.id} className='flex items-center justify-between rounded-md border p-3'>
            <div className='flex flex-col'>
              <div className='flex items-center'>
                <span className={Number(bet.optionIndex) === 0 ? 'text-green-500' : 'text-red-500'}>
                  {pool.options[Number(bet.optionIndex)]}
                </span>
              </div>
              <span className='text-muted-foreground text-sm'>
                {bet.createdAt
                  ? format(new Date(Number(bet.createdAt) * 1000), 'MMM d, yyyy h:mm a')
                  : 'Date unavailable'}
              </span>
            </div>
            <div className='flex items-center gap-1'>
              <span className='font-medium'>
                {formatTokenAmount(
                  bet.amount,
                  bet.tokenType === TokenType.Usdc
                    ? Number(TokenType.Usdc)
                    : Number(TokenType.Freedom)
                )}
              </span>
              {tokenLogo}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
