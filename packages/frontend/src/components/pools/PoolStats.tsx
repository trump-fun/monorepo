import { calculateBettors } from '@/utils/calculateBettors';
import { Pool } from '@trump-fun/common';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Users } from 'lucide-react';

interface PoolStatsProps {
  pool: Pool;
  totalVolume: string;
}

export const PoolStats = ({ pool, totalVolume }: PoolStatsProps) => {
  return (
    <div className='mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4'>
      <div className='flex flex-col rounded-lg border p-3 shadow-sm'>
        <span className='text-muted-foreground mb-1 text-xs'>Total Volume</span>
        <span className='font-semibold'>{totalVolume}</span>
      </div>

      <div className='flex flex-col rounded-lg border p-3 shadow-sm'>
        <span className='text-muted-foreground mb-1 text-xs'>Total Bets</span>
        <span className='font-semibold'>{pool.bets.length}</span>
      </div>

      <div className='flex flex-col rounded-lg border p-3 shadow-sm'>
        <span className='text-muted-foreground mb-1 flex items-center gap-1 text-xs'>
          <Users size={12} />
          <span>Unique Bettors</span>
        </span>
        <span className='font-semibold'>{calculateBettors(pool)}</span>
      </div>

      <div className='flex flex-col rounded-lg border p-3 shadow-sm'>
        <span className='text-muted-foreground mb-1 flex items-center gap-1 text-xs'>
          <Clock size={12} />
          <span>Ends</span>
        </span>
        <span className='font-semibold'>
          {pool.betsCloseAt
            ? formatDistanceToNow(new Date(Number(pool.betsCloseAt) * 1000), { addSuffix: true })
            : 'Manual'}
        </span>
      </div>
    </div>
  );
};
