import { GET_POOLS } from '@/lib/queries';
import { OrderDirection, Pool_OrderBy, PoolStatus, TokenType } from '@/types/__generated__/graphql';
import { useQuery } from '@apollo/client';
import { useMemo, useState } from 'react';

export type FilterType = 'newest' | 'highest' | 'ending_soon' | 'ended' | 'recently_closed';

export function usePools(tokenType: TokenType) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const [hasMore, setHasMore] = useState(true);

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

  const {
    data,
    loading: isLoading,
    fetchMore,
    refetch: refetchPools,
  } = useQuery(GET_POOLS, {
    variables: {
      filter: activeConfig.filter,
      orderBy: activeConfig.orderBy,
      orderDirection: activeConfig.orderDirection,
      first: PAGE_SIZE,
      skip: 0,
    },
    context: { name: 'mainSearch' },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
  });

  const filteredPools = useMemo(() => {
    const pools = data?.pools || [];
    if (!searchQuery.trim()) return pools;

    const query = searchQuery.toLowerCase().trim();
    return pools.filter((pool) => pool.question.toLowerCase().includes(query));
  }, [data, searchQuery]);

  const handleFilterChange = (newFilter: FilterType) => {
    setActiveFilter(newFilter);
    setPage(0);
    setHasMore(true);
    refetchPools({
      filter: filterConfigs[newFilter].filter,
      orderBy: filterConfigs[newFilter].orderBy,
      orderDirection: filterConfigs[newFilter].orderDirection,
      first: PAGE_SIZE,
      skip: 0,
    });
  };

  const loadMore = async () => {
    if (!hasMore || isLoading) return;

    const nextPage = page + 1;
    const skip = nextPage * PAGE_SIZE;

    const result = await fetchMore({
      variables: {
        skip,
        first: PAGE_SIZE,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          ...prev,
          pools: [...prev.pools, ...fetchMoreResult.pools],
        };
      },
    });

    const newPools = result.data.pools;
    if (newPools.length < PAGE_SIZE) {
      setHasMore(false);
    }

    setPage(nextPage);
  };

  return {
    filteredPools,
    isLoading,
    activeFilter,
    searchQuery,
    setSearchQuery,
    handleFilterChange,
    refetchPools,
    loadMore,
    hasMore,
  };
}
