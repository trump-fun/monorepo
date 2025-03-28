import { GET_POOLS } from '@/app/queries';
import { useQuery } from '@apollo/client';
import {
  OrderDirection,
  POLLING_INTERVALS,
  Pool,
  Pool_OrderBy,
  PoolStatus,
  TokenType,
} from '@trump-fun/common';
import { useMemo, useState } from 'react';

export type FilterType = 'newest' | 'highest' | 'ending_soon' | 'ended' | 'recently_closed';

export function usePools(tokenType: TokenType) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('newest');
  const [searchQuery, setSearchQuery] = useState('');

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

  const { orderBy, orderDirection, filter } = useMemo(
    () => filterConfigs[activeFilter],
    [activeFilter, filterConfigs]
  );

  const {
    data,
    refetch: refetchPools,
    loading: isLoading,
  } = useQuery(GET_POOLS, {
    variables: { filter, orderBy, orderDirection },
    context: { name: 'mainSearch' },
    notifyOnNetworkStatusChange: true,
    pollInterval: POLLING_INTERVALS['explore-pools'],
  });

  const filteredPools = useMemo(() => {
    const pools = data?.pools || [];
    if (!searchQuery.trim()) return pools;

    const query = searchQuery.toLowerCase().trim();
    return pools.filter((pool: Pool) => pool.question.toLowerCase().includes(query));
  }, [data?.pools, searchQuery]);

  const handleFilterChange = (newFilter: FilterType) => {
    setActiveFilter(newFilter);
    refetchPools(filterConfigs[newFilter]);
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
