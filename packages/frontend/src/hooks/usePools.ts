import { GET_POOLS, GET_POOLS_SUBSCRIPTION } from '@/app/queries';
import { useQuery, useSubscription } from '@apollo/client';
import { OrderDirection, Pool, Pool_OrderBy, PoolStatus, TokenType } from '@trump-fun/common';
import { useEffect, useMemo, useState } from 'react';

export type FilterType = 'newest' | 'highest' | 'ending_soon' | 'ended' | 'recently_closed';

export function usePools(tokenType: TokenType) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [pools, setPools] = useState<Pool[]>([]);

  const filterConfigs = useMemo(() => {
    const currentTimestamp = Math.floor(Date.now() / 1000).toString();
    const oneDayFromNow = (parseInt(currentTimestamp) + 86400).toString();

    const pendingBaseFilter = { status: PoolStatus.Pending };
    const openPoolsFilter = { ...pendingBaseFilter, betsCloseAt_gt: currentTimestamp };

    return {
      newest: {
        orderBy: Pool_OrderBy.CreatedAt,
        orderDirection: OrderDirection.Desc,
        filter: openPoolsFilter,
      },
      highest: {
        orderBy: tokenType === TokenType.Usdc ? Pool_OrderBy.UsdcVolume : Pool_OrderBy.PointsVolume,
        orderDirection: OrderDirection.Desc,
        filter: openPoolsFilter,
      },
      ending_soon: {
        orderBy: Pool_OrderBy.BetsCloseAt,
        orderDirection: OrderDirection.Asc,
        filter: { ...openPoolsFilter, betsCloseAt_lt: oneDayFromNow },
      },
      ended: {
        orderBy: Pool_OrderBy.BetsCloseAt,
        orderDirection: OrderDirection.Desc,
        filter: { ...pendingBaseFilter, betsCloseAt_lt: currentTimestamp },
      },
      recently_closed: {
        orderBy: Pool_OrderBy.GradedBlockTimestamp,
        orderDirection: OrderDirection.Desc,
        filter: {
          status_in: [PoolStatus.Graded, PoolStatus.Regraded],
          betsCloseAt_lt: currentTimestamp,
        },
      },
    };
  }, [tokenType]);

  const activeConfig = useMemo(() => filterConfigs[activeFilter], [activeFilter, filterConfigs]);

  // Initial data load with useQuery
  const {
    data: initialData,
    loading: isLoading,
    refetch: refetchPools,
  } = useQuery(GET_POOLS, {
    variables: {
      filter: activeConfig.filter,
      orderBy: activeConfig.orderBy,
      orderDirection: activeConfig.orderDirection,
    },
    context: { name: 'mainSearch' },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
  });

  // Subscribe to real-time updates
  const { data: subscriptionData } = useSubscription(GET_POOLS_SUBSCRIPTION, {
    variables: {
      filter: activeConfig.filter,
      orderBy: activeConfig.orderBy,
      orderDirection: activeConfig.orderDirection,
    },
    shouldResubscribe: true,
    onData: ({ data }) => {
      if (data?.data?.pools) {
        setPools(data.data.pools);
      }
    },
  });

  // Initialize pools state with query data
  useEffect(() => {
    if (initialData?.pools) {
      setPools(initialData.pools);
    }
  }, [initialData?.pools]);

  const filteredPools = useMemo(() => {
    if (!searchQuery.trim()) return pools;

    const query = searchQuery.toLowerCase().trim();
    return pools.filter((pool: Pool) => pool.question.toLowerCase().includes(query));
  }, [pools, searchQuery]);

  const handleFilterChange = (newFilter: FilterType) => {
    setActiveFilter(newFilter);
    // Refetch initial data when filter changes
    refetchPools({
      filter: filterConfigs[newFilter].filter,
      orderBy: filterConfigs[newFilter].orderBy,
      orderDirection: filterConfigs[newFilter].orderDirection,
    });
  };

  return {
    filteredPools,
    isLoading,
    activeFilter,
    searchQuery,
    setSearchQuery,
    handleFilterChange,
  };
}
