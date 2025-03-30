'use client';

import { GET_POOLS } from '@/app/queries';
import { useTokenContext } from '@/hooks/useTokenContext';
import { NetworkStatus, useQuery } from '@apollo/client';
import { OrderDirection, Pool, Pool_OrderBy, PoolStatus, TokenType } from '@trump-fun/common';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PoolCard } from './pool-card';

export function PoolList() {
  const { tokenType } = useTokenContext();
  const [pools, setPools] = useState<Pool[] | null>(null);
  const isFirstRenderRef = useRef(true);

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
    fetchPolicy: 'network-only',
    pollInterval: 15000,
  });

  useEffect(() => {
    if (data?.pools?.length > 0) {
      setPools(data.pools);
    }
  }, [data]);

  const isInitialLoading = useMemo(() => {
    if (!isFirstRenderRef.current) return false;
    if (pools !== null) {
      isFirstRenderRef.current = false;
      return false;
    }
    return loading && networkStatus === NetworkStatus.loading;
  }, [loading, networkStatus, pools]);

  const poolCards = useMemo(() => {
    if (!pools) return null;
    return pools.map((pool: Pool) => <PoolCard key={pool.id} pool={pool} />);
  }, [pools]);

  if (isInitialLoading) {
    return (
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className='bg-muted h-[300px] animate-pulse rounded-lg p-4' />
        ))}
      </div>
    );
  }

  if (error && !pools) {
    return <div>Error fetching pools: {error?.message}</div>;
  }

  return (
    <div>
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>{poolCards}</div>
    </div>
  );
}
