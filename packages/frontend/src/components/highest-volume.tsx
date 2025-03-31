'use client';

import { GET_POOLS } from '@/app/queries';
import { BettingProgress } from '@/components/pools/BettingProgress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTokenContext } from '@/hooks/useTokenContext';
import { OrderDirection, Pool_OrderBy, PoolStatus, TokenType } from '@/types/__generated__/graphql';
import { calculateOptionPercentages, calculateRelativeVolumePercentages } from '@/utils/betsInfo';
import { useQuery } from '@apollo/client';
import { useQueries } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';

interface PoolPostData {
  post?: {
    image_url?: string;
  };
}

export function HighestVolume() {
  const { tokenType } = useTokenContext();
  const currentTimestamp = Math.floor(Date.now() / 1000);

  const {
    data: volumePools,
    loading,
    previousData,
  } = useQuery(GET_POOLS, {
    variables: {
      filter: {
        status: PoolStatus.Pending,
        betsCloseAt_gt: currentTimestamp.toString(),
      },
      orderBy: tokenType === TokenType.Usdc ? Pool_OrderBy.UsdcVolume : Pool_OrderBy.PointsVolume,
      orderDirection: OrderDirection.Desc,
      first: 3,
    },
    context: { name: 'volumeSearch' },
    notifyOnNetworkStatusChange: true,
  });

  // Use memoized data to prevent disappearing on refresh
  const poolsToDisplay = useMemo(() => {
    // On initial load, show loading state
    if (loading && !previousData) {
      return { pools: [] };
    }
    // For subsequent loads, use previous data until new data is ready
    return volumePools || previousData || { pools: [] };
  }, [volumePools, loading, previousData]);

  // Calculate volume data for pools
  const volumeData = useMemo(() => {
    if (!poolsToDisplay?.pools || poolsToDisplay.pools.length === 0) {
      return [];
    }

    const pools = poolsToDisplay.pools.slice(0, 3);
    return calculateRelativeVolumePercentages(pools, tokenType);
  }, [poolsToDisplay, tokenType]);

  // Use useQueries to fetch pool images in parallel
  const poolQueries = useQueries({
    queries: volumeData.map(({ pool }) => ({
      queryKey: ['highest-volume-pool', pool?.id || 'unknown'],
      queryFn: async () => {
        if (!pool?.id) return { post: { image_url: '/trump.jpeg' } };
        const res = await fetch(`/api/post?poolId=${pool.id}`);
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json() as Promise<PoolPostData>;
      },
      staleTime: 60000,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    })),
  });

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
          volumeData.map(({ pool, percentage, displayVolume }, index) => {
            if (!pool) return null;
            const poolData = poolQueries[index]?.data as PoolPostData | undefined;

            return (
              <Link
                key={pool.id || index}
                href={pool.id ? `/pools/${pool.id}` : '#'}
                className='-m-2 block rounded-md p-2 transition-colors hover:bg-gray-900'
              >
                <div className='flex gap-3'>
                  <Avatar className='h-8 w-8 overflow-hidden rounded-full'>
                    <AvatarImage src={poolData?.post?.image_url || '/trump.jpeg'} alt='Trump' />
                    <AvatarFallback>
                      <Image src={'/trump.jpeg'} alt='Trump' width={32} height={32} />
                    </AvatarFallback>
                  </Avatar>
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
          })
        ) : (
          // Empty state when no pools are available
          <div className='py-4 text-center text-gray-400'>
            <p>No high volume predictions available</p>
          </div>
        )}
      </div>
    </div>
  );
}
