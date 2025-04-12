import { TokenType } from '@/types';
import { UserStats } from '@/types/interfaces';
import { ReactNode } from 'react';

interface BettingStatsProps {
  userStats: UserStats;
  tokenLogo: ReactNode;
  tokenType?: TokenType; // Make it optional since we don't use it
}

export function BettingStats({ userStats, tokenLogo }: BettingStatsProps) {
  const {
    totalBets,
    wonBets,
    lostBets,
    pendingBets,
    totalVolume,
    // Ignore activeVolume since we don't use it
    winRate,
    avgBetSize,
  } = userStats;

  return (
    <div className='w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900'>
      <h3 className='mb-3 text-lg font-medium'>Betting Stats</h3>

      <div className='grid grid-cols-2 gap-3'>
        <div className='rounded-md bg-gray-100 p-3 dark:bg-gray-800'>
          <div className='text-sm text-gray-500 dark:text-gray-400'>Total Bets</div>
          <div className='text-xl font-bold'>{totalBets}</div>
        </div>

        <div className='rounded-md bg-gray-100 p-3 dark:bg-gray-800'>
          <div className='text-sm text-gray-500 dark:text-gray-400'>Win Rate</div>
          <div className='text-xl font-bold'>{winRate}%</div>
        </div>

        <div className='rounded-md bg-gray-100 p-3 dark:bg-gray-800'>
          <div className='text-sm text-gray-500 dark:text-gray-400'>Volume</div>
          <div className='flex items-center text-xl font-bold'>
            {tokenLogo}
            {totalVolume.toFixed(0)}
          </div>
        </div>

        <div className='rounded-md bg-gray-100 p-3 dark:bg-gray-800'>
          <div className='text-sm text-gray-500 dark:text-gray-400'>Avg. Bet Size</div>
          <div className='flex items-center text-xl font-bold'>
            {tokenLogo}
            {avgBetSize}
          </div>
        </div>
      </div>

      <div className='mt-3 grid grid-cols-3 gap-2'>
        <div className='rounded-md bg-green-50 p-2 text-center dark:bg-green-900/20'>
          <div className='text-xs text-green-600 dark:text-green-400'>Won</div>
          <div className='font-medium'>{wonBets}</div>
        </div>

        <div className='rounded-md bg-red-50 p-2 text-center dark:bg-red-900/20'>
          <div className='text-xs text-red-600 dark:text-red-400'>Lost</div>
          <div className='font-medium'>{lostBets}</div>
        </div>

        <div className='rounded-md bg-yellow-50 p-2 text-center dark:bg-yellow-900/20'>
          <div className='text-xs text-yellow-600 dark:text-yellow-400'>Pending</div>
          <div className='font-medium'>{pendingBets}</div>
        </div>
      </div>
    </div>
  );
}
