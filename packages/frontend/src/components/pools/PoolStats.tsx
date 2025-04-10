import CountdownTimer from '@/components/Timer';
import { useTokenContext } from '@/hooks/useTokenContext';
import { GetPoolQuery } from '@/types';
import { calculateBettors } from '@/utils/calculateBettors';
import { Clock, TrendingUp, Users } from 'lucide-react';

interface PoolStatsProps {
  pool: GetPoolQuery['pool'];
  totalVolume: string;
}

export const PoolStats = ({ pool, totalVolume }: PoolStatsProps) => {
  const { tokenLogo } = useTokenContext();
  if (!pool) {
    return null;
  }
  return (
    <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
      {/* Volume Card */}
      <div className='bg-card flex flex-col items-center justify-center rounded-lg border border-gray-200 p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-800'>
        <div className='mb-2 rounded-full bg-green-100 p-2 dark:bg-green-900/30'>
          <TrendingUp className='text-green-500' size={20} />
        </div>
        <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
          Total Volume
        </p>
        <div className='flex items-center gap-2'>
          {tokenLogo}
          <p className='text-xl font-bold'>{totalVolume.toLocaleString()}</p>
        </div>
      </div>

      {/* Time Left Card */}
      <div className='bg-card flex flex-col items-center justify-center rounded-lg border border-gray-200 p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-800'>
        <div className='mb-2 rounded-full bg-blue-100 p-2 dark:bg-blue-900/30'>
          <Clock className='text-blue-500' size={20} />
        </div>
        <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
          Bets close
        </p>
        <div className='mt-1 text-xl font-bold'>
          {pool.betsCloseAt ? (
            <CountdownTimer
              showClockIcon={false}
              closesAt={Number(pool.betsCloseAt) * 1000}
              digitClassName='text-white'
              colonClassName='text-white'
            />
          ) : (
            'Manual'
          )}
        </div>
      </div>

      {/* Bettors Card */}
      <div className='bg-card flex flex-col items-center justify-center rounded-lg border border-gray-200 p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-800'>
        <div className='mb-2 rounded-full bg-orange-100 p-2 dark:bg-orange-900/30'>
          <Users className='text-orange-500' size={20} />
        </div>
        <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
          Bettors
        </p>
        <p className='mt-1 text-xl font-bold'>{calculateBettors(pool)}</p>
      </div>
    </div>
  );
};
