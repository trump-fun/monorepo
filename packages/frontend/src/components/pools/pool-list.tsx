'use client';

import { GET_POOLS, GET_POOLS_SUBSCRIPTION } from '@/app/queries';
import { useTokenContext } from '@/hooks/useTokenContext';
import { NetworkStatus, useQuery, useSubscription } from '@apollo/client';
import { OrderDirection, Pool, Pool_OrderBy, PoolStatus, TokenType } from '@trump-fun/common';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PoolCard } from './pool-card';

export function PoolList() {
  const { tokenType } = useTokenContext();
  const [poolsData, setPoolsData] = useState<Pool[]>([]);
  const lastValidPoolsRef = useRef<Pool[] | null>(null);

  const volumeOrderBy =
    tokenType === TokenType.Usdc ? Pool_OrderBy.UsdcVolume : Pool_OrderBy.PointsVolume;

  const variables = {
    filter: {
      status: PoolStatus.Pending,
      betsCloseAt_gt: Math.floor(Date.now() / 1000),
    },
    orderBy: volumeOrderBy,
    orderDirection: OrderDirection.Desc,
    first: 9,
  };

  const { data, loading, error, networkStatus } = useQuery(GET_POOLS, {
    variables,
    context: { name: 'mainSearch' },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
  });

  useSubscription(GET_POOLS_SUBSCRIPTION, {
    variables,
    shouldResubscribe: true,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.pools) {
        setPoolsData(subscriptionData.data.pools);
        // Also update the ref to prevent flashing
        lastValidPoolsRef.current = subscriptionData.data.pools;
      }
    },
  });

  useEffect(() => {
    if (data?.pools?.length > 0) {
      setPoolsData(data.pools);
      lastValidPoolsRef.current = data.pools;
    }
  }, [data?.pools]);

  const isInitialLoading =
    loading && networkStatus === NetworkStatus.loading && !lastValidPoolsRef.current;

  const currentPools =
    poolsData.length > 0
      ? poolsData
      : data?.pools?.length > 0
        ? data.pools
        : lastValidPoolsRef.current;

  const poolCards = useMemo(() => {
    if (!currentPools) return null;

    return currentPools.map((pool: Pool) => <PoolCard key={pool.id} pool={pool} />);
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

  if (error && !currentPools) {
    return <div>Error fetching pools: {error?.message}</div>;
  }

  return (
    <div>
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>{poolCards}</div>
    </div>
  );
}
