'use client';

import { GET_POOLS } from '@/app/queries';
import { POLLING_INTERVALS } from '@/consts';
import { useTokenContext } from '@/hooks/useTokenContext';
import { NetworkStatus, useQuery } from '@apollo/client';
import {
  OrderDirection,
  Pool,
  Pool_OrderBy,
  PoolStatus,
  TokenType,
} from '@trump-fun/common';
import { useMemo, useRef } from 'react';
import { PoolCard } from './pool-card';

export function PoolList() {
  const { tokenType } = useTokenContext();
  // Store the last valid pools data to prevent flashing during refetches
  const lastValidPoolsRef = useRef<Pool[] | null>(null);

  // Determine sort field based on token type
  const volumeOrderBy =
    tokenType === TokenType.Usdc ? Pool_OrderBy.UsdcVolume : Pool_OrderBy.PointsVolume;

  const {
    data: pools,
    loading,
    error,
    networkStatus,
  } = useQuery(GET_POOLS, {
    variables: {
      filter: {
        status: PoolStatus.Pending,
        betsCloseAt_gt: Math.floor(Date.now() / 1000),
      },
      orderBy: volumeOrderBy,
      orderDirection: OrderDirection.Desc,
      first: 9,
    },
    pollInterval: POLLING_INTERVALS['landing-pools'],
    context: { name: 'mainSearch' },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  // Only show loading state on initial load, not during polling or refetching
  const isInitialLoading =
    loading && networkStatus === NetworkStatus.loading && !lastValidPoolsRef.current;

  // Update the ref whenever we have valid data
  if (pools?.pools?.length > 0) {
    lastValidPoolsRef.current = pools.pools as Pool[];
  }

  // Use either current data or the last valid data to prevent flashing
  const currentPools = pools?.pools?.length > 0 ? pools.pools : lastValidPoolsRef.current;

  // Memoize the pool cards to prevent unnecessary re-renders
  const poolCards = useMemo(() => {
    if (!currentPools) return null;

    return currentPools.map((pool: Pool) => (
      <PoolCard key={pool.id} pool={pool as unknown as Pool} />
    ));
  }, [currentPools]);

  if (isInitialLoading) {
    return (
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className='bg-muted h-[300px] animate-pulse rounded-lg p-4' />
        ))}
      </div>
    );
  }

  // Only log on non-undefined values to reduce console spam
  if (pools?.pools) {
    console.log('pools length', pools.pools.length);
  }

  // Only show error if we have no previous valid data to display
  if (error && !currentPools) {
    return <div>Error fetching pools: {error?.message}</div>;
  }

  return (
    <div>
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>{poolCards}</div>
    </div>
  );
}
