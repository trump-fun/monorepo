'use client';

import { BettingProgress } from '@/components/pools/BettingProgress';
import { useTokenContext } from '@/hooks/useTokenContext';
import { calculateOptionPercentages } from '@/utils/betsInfo';

import { OrderDirection, Pool, Pool_OrderBy, TokenType, useGetPoolsQuery } from '@/types';
import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import PoolImage from './pool-image';

export function HighestVolume() {
  const { tokenType } = useTokenContext();
  const currentTimestamp = Math.floor(Date.now() / 1000);

  const {
    data: volumePools,
    loading,
    previousData,
    error,
  } = useGetPoolsQuery({
    variables: {
      filter: {
        // status: PoolStatus.Pending,
        betsCloseAt_gt: currentTimestamp.toString(),
      },
      orderBy:
        tokenType === TokenType.Usdc ? Pool_OrderBy.UsdcBetTotals : Pool_OrderBy.PointsBetTotals,
      orderDirection: OrderDirection.Desc,
      first: 3,
    },
    context: { name: 'volumeSearch' },
    notifyOnNetworkStatusChange: true,
  });

  const poolsToDisplay = useMemo(() => {
    if (loading && !previousData) {
      return { pools: [] };
    }
    return volumePools || previousData || { pools: [] };
  }, [volumePools, loading, previousData]);

  // Calculate volume data for pools
  const volumeData = useMemo(() => {
    if (!poolsToDisplay?.pools || poolsToDisplay.pools.length === 0) {
      return [];
    }

    const pools = poolsToDisplay.pools.slice(0, 3);
    return pools.map((pool) => ({
      pool,
      displayVolume:
        Number(tokenType === TokenType.Usdc ? pool.usdcBetTotals : pool.pointsBetTotals) /
        Math.pow(10, tokenType === TokenType.Usdc ? 6 : 6),
    }));
  }, [poolsToDisplay, tokenType]);

  if (error) {
    console.error(error);
    return (
      <div className='py-4 text-center text-gray-400'>
        <p>Error loading highest volume pools</p>
      </div>
    );
  }
  return (
    <div className='bg-background mb-4 rounded-lg border border-gray-800 p-4 shadow-lg'>
      <div className='mb-4 flex items-center gap-2'>
        <TrendingUp size={20} className='text-orange-500' />
        <h2 className='text-lg font-bold'>Highest Vol</h2>
      </div>

      <div className='space-y-4'>
        {loading && !previousData ? (
          // Initial loading state
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
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
        ) : volumeData.length > 0 ? (
          volumeData.map(
            (
              {
                pool,
                displayVolume,
              }: {
                pool: Pool;
                displayVolume: number;
              },
              index: number
            ) => {
              if (!pool) return null;

              return (
                <Link
                  key={pool.id || index}
                  href={pool.id ? `/pools/${pool.id}` : '#'}
                  className='-m-2 block rounded-md p-2 transition-colors hover:bg-gray-900'
                >
                  <div className='flex gap-3'>
                    <PoolImage imageUrl={pool.imageUrl} width={32} height={32} />
                    <div className='flex-1'>
                      <p className='mb-1 line-clamp-2 text-sm'>{pool.question}</p>
                      <div className='mb-2 flex items-center gap-2'>
                        <div className='flex-1'>
                          <BettingProgress
                            percentages={calculateOptionPercentages(pool, tokenType)}
                            pool={pool}
                            totalVolume={displayVolume.toString()}
                            compact
                          />
                        </div>
                        <div className='flex items-center gap-1 text-xs text-gray-400'>
                          <TrendingUp size={12} />
                          <span>{displayVolume.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            }
          )
        ) : (
          <div className='py-4 text-center text-gray-400'>
            <p>No high volume predictions available</p>
          </div>
        )}
      </div>
    </div>
  );
}
