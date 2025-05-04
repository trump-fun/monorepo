import {
  GetPoolsQueryVariables,
  OrderDirection,
  Pool_OrderBy,
  PoolStatus,
  TokenType,
  useGetPoolsQuery,
} from '@/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useTokenContext } from './useTokenContext';

interface UsePoolsOptions {
  category?: string;
  orderBy?: Pool_OrderBy;
  orderDirection?: OrderDirection;
  skip?: number;
  first?: number;
  pollInterval?: number;
  filter?: GetPoolsQueryVariables['filter'];
  context?: any;
}

export function usePools({
  category,
  orderBy,
  orderDirection = OrderDirection.Desc,
  skip = 0,
  first = 20,
  pollInterval = 0,
  filter = {},
  context = { name: 'pools' },
}: UsePoolsOptions) {
  const { tokenType } = useTokenContext();
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const currentTimestamp = Math.floor(Date.now() / 1000);

  // Default filter includes pending status and future bets close time
  // Important: Use the enum value directly without wrapping in a string
  const defaultFilter: GetPoolsQueryVariables['filter'] = {
    status: PoolStatus.Pending, // Use enum value directly, not wrapped in a string
    betsCloseAt_gt: currentTimestamp, // Send as a number, not a string
    ...filter,
  };

  // Combine override variables with defaults
  const variables: GetPoolsQueryVariables = {
    filter: defaultFilter,
    orderBy:
      tokenType === TokenType.Usdc ? Pool_OrderBy.UsdcBetTotals : Pool_OrderBy.PointsBetTotals,
    orderDirection: OrderDirection.Desc,
    skip,
    first,
  };

  // Fetch pools based on variables
  const { data, loading, fetchMore, error, networkStatus, refetch } = useGetPoolsQuery({
    variables,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
    pollInterval,
    context,
  });

  // Filter pools based on search query
  const filteredPools = useMemo(() => {
    if (!data?.pools) return [];

    if (!searchQuery) return data.pools;

    const query = searchQuery.toLowerCase();
    return data.pools.filter(
      (pool) =>
        pool.question.toLowerCase().includes(query) ||
        pool.options.some((option) => option.toLowerCase().includes(query))
    );
  }, [data?.pools, searchQuery]);

  // Handle filter change
  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilter(filter);
  }, []);

  // Handle loading more pools when bottom of list is in view
  const loadMore = useCallback(() => {
    if (!loading && hasMore && data?.pools?.length) {
      fetchMore({
        variables: {
          skip: data.pools.length,
          first,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult?.pools?.length) {
            setHasMore(false);
            return prev;
          }

          return {
            ...prev,
            pools: [...prev.pools, ...fetchMoreResult.pools],
          };
        },
      });
    }
  }, [data?.pools?.length, fetchMore, first, hasMore, loading]);

  // Trigger load more when bottom is in view
  useEffect(() => {
    if (inView) {
      loadMore();
    }
  }, [inView, loadMore]);

  // Reset hasMore when filter changes
  useEffect(() => {
    setHasMore(true);
  }, [variables.filter, variables.orderBy, variables.orderDirection]);

  // Expose variables for potential UI controls
  const sortOptions = {
    orderBy: variables.orderBy,
    orderDirection: variables.orderDirection,
  };

  // Return formatted result
  return {
    pools: data?.pools || [],
    filteredPools,
    loading,
    error,
    loadMore,
    loadMoreRef: ref,
    hasMore,
    networkStatus,
    refetch,
    sortOptions,
    searchQuery,
    setSearchQuery,
    activeFilter,
    handleFilterChange,
    isLoading: loading,
  };
}
