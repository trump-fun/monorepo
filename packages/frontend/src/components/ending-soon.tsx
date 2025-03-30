'use client';

import { GET_POOLS, GET_POOLS_SUBSCRIPTION } from '@/app/queries';
import { useTokenContext } from '@/hooks/useTokenContext';
import { OrderDirection, Pool, Pool_OrderBy, PoolStatus } from '@/types';
import { getVolumeForTokenType } from '@/utils/betsInfo';
import { useQuery, useSubscription } from '@apollo/client';
import { Clock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EndingSoonBet } from './ending-soon-bet';

export function EndingSoon() {
  const { tokenType } = useTokenContext();
  const [pools, setPools] = useState<Pool[]>([]);

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const oneDayFromNow = currentTimestamp + 86400;

  const variables = {
    filter: {
      betsCloseAt_gt: currentTimestamp.toString(),
      betsCloseAt_lt: oneDayFromNow.toString(),
      status_in: [PoolStatus.Pending, PoolStatus.None],
    },
    orderBy: Pool_OrderBy.BetsCloseAt,
    orderDirection: OrderDirection.Asc,
    first: 3,
  };

  const {
    data: initialData,
    loading,
    previousData,
  } = useQuery(GET_POOLS, {
    variables,
    context: { name: 'endingSoonSearch' },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
  });

  useSubscription(GET_POOLS_SUBSCRIPTION, {
    variables,
    shouldResubscribe: true,
    onData: ({ data }) => {
      if (data?.data?.pools) {
        setPools(data.data.pools);
      }
    },
  });

  useEffect(() => {
    if (initialData?.pools) {
      setPools(initialData.pools);
    }
  }, [initialData?.pools]);

  // Use previous data during loading states to prevent flashing
  const poolsToDisplay = useMemo(() => {
    // On initial load, show loading state
    if (loading && !previousData) {
      return [];
    }
    // Return current pools state (from either query or subscription)
    return pools.length > 0 ? pools : previousData?.pools || [];
  }, [pools, loading, previousData]);

  return (
    <div className='bg-background rounded-lg border border-gray-800 p-4 shadow-lg'>
      <div className='mb-4 flex items-center gap-2'>
        <Clock size={20} className='text-orange-500' />
        <h2 className='text-lg font-bold'>Ending Soon</h2>
      </div>

      <div className='space-y-4'>
        {loading && !previousData ? (
          // Initial loading state
          <div className='space-y-4'>
            {[1, 2, 3].map(i => (
              <div key={i} className='animate-pulse'>
                <div className='flex gap-3'>
                  <div className='h-8 w-8 rounded-full bg-gray-700'></div>
                  <div className='flex-1'>
                    <div className='mb-2 h-4 w-3/4 rounded bg-gray-700'></div>
                    <div className='h-3 w-full rounded bg-gray-700'></div>
                    <div className='mt-2 flex justify-between'>
                      <div className='h-3 w-16 rounded bg-gray-700'></div>
                      <div className='h-3 w-16 rounded bg-gray-700'></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : poolsToDisplay.length > 0 ? (
          poolsToDisplay.map((pool: Pool) => {
            return (
              <EndingSoonBet
                key={pool.id}
                avatar='/trump.jpeg'
                question={pool.question}
                volume={getVolumeForTokenType(pool, tokenType)}
                timeLeft={pool.betsCloseAt}
                poolId={pool.id}
              />
            );
          })
        ) : (
          // Empty state when no pools are available
          <div className='py-4 text-center text-gray-400'>
            <p>No predictions ending soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
