'use client';

import { NetworkStatus } from '@apollo/client';
import { useMemo, useRef } from 'react';
import { PoolCard } from './pool-card';
import {
  OrderDirection,
  Pool_OrderBy,
  PoolStatus,
  useGetPoolsQuery,
} from '@/types/__generated__/graphql';

export function PoolList({ className = '' }: { className?: string }) {
  const isFirstRenderRef = useRef(true);
  const orderBy = Pool_OrderBy.CreatedAt;
  const orderDirection = OrderDirection.Desc;

  const { data, loading, error, networkStatus } = useGetPoolsQuery({
    variables: {
      filter: {
        status: PoolStatus.Pending,
      },
      orderBy,
      orderDirection,
      first: 9,
    },
    context: { name: 'mainSearch' },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    pollInterval: 15000,
  });

  const pools = useMemo(() => data?.pools || [], [data?.pools]);

  const isInitialLoading = useMemo(() => {
    if (!isFirstRenderRef.current) return false;
    if (pools.length > 0) {
      isFirstRenderRef.current = false;
      return false;
    }
    return loading && networkStatus === NetworkStatus.loading;
  }, [loading, networkStatus, pools]);

  if (pools.length === 0 && !loading) {
    return <div className='py-10 text-center text-gray-400'>No predictions found</div>;
  }

  if (error && pools.length === 0) {
    return (
      <div className='py-10 text-center text-red-400'>Error fetching pools: {error?.message}</div>
    );
  }

  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {isInitialLoading
        ? Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className='h-64 animate-pulse rounded-lg border border-gray-800 bg-gray-900'
            />
          ))
        : pools.map((pool) => <PoolCard pool={pool} key={pool.id} />)}
    </div>
  );
}
