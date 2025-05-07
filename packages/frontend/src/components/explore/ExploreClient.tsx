'use client';

import { FilterSidebar } from '@/components/explore/filter-sidebar';
import { MobileFilters } from '@/components/explore/mobile-filters';
import { PoolList } from '@/components/explore/pool-list';
import { RightSidebar } from '@/components/explore/right-sidebar';
import { SearchBar } from '@/components/explore/search-bar';
import { useTokenContext } from '@/hooks/useTokenContext';
import { OrderDirection, Pool_OrderBy, PoolStatus, TokenType, useGetPoolsQuery } from '@/types';
import { NetworkStatus } from '@apollo/client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInView } from 'react-intersection-observer';

// Define filter types to match the sidebar
type FilterType = 'newest' | 'highest' | 'ending_soon' | 'recently_closed';

export function ExploreClient() {
  const { tokenType } = useTokenContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('newest');
  const [hasMore, setHasMore] = useState(true);
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '400px 0px', // Increased rootMargin for earlier loading
    trackVisibility: true,
    delay: 100,
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const currentTimestamp = Math.floor(Date.now() / 1000);

  // Determine query parameters based on activeFilter
  const queryParams = useMemo(() => {
    // Default filter and order settings
    let filter: Record<string, any> = {
      status: PoolStatus.Pending,
      betsCloseAt_gt: currentTimestamp,
    };
    let orderBy = Pool_OrderBy.CreatedAt;
    let orderDirection = OrderDirection.Desc;

    // Customize based on activeFilter
    switch (activeFilter) {
      case 'newest':
        orderBy = Pool_OrderBy.CreatedAt;
        orderDirection = OrderDirection.Desc;
        break;
      case 'highest':
        orderBy =
          tokenType === TokenType.Usdc ? Pool_OrderBy.UsdcBetTotals : Pool_OrderBy.PointsBetTotals;
        orderDirection = OrderDirection.Desc;
        break;
      case 'ending_soon':
        orderBy = Pool_OrderBy.BetsCloseAt;
        orderDirection = OrderDirection.Asc;
        break;
      case 'recently_closed':
        // For recently closed, we need different filter settings
        filter = {
          status: PoolStatus.Graded,
          betsCloseAt_lt: currentTimestamp,
        };
        orderBy = Pool_OrderBy.BetsCloseAt;
        orderDirection = OrderDirection.Desc;
        break;
    }

    return { filter, orderBy, orderDirection };
  }, [activeFilter, currentTimestamp, tokenType]);

  const {
    data,
    loading: isLoading,
    fetchMore,
    refetch,
    networkStatus,
    error: getPoolsError,
  } = useGetPoolsQuery({
    variables: {
      filter: queryParams.filter,
      orderBy: queryParams.orderBy,
      orderDirection: queryParams.orderDirection,
      first: 10,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
    pollInterval: 10000,
    context: { name: 'explore' },
  });

  if (getPoolsError) {
    console.error('getPoolsError:', getPoolsError);
  }
  // Update initial load state
  useEffect(() => {
    if (data?.pools && data.pools.length > 0 && initialLoad) {
      setInitialLoad(false);
    }
  }, [data?.pools, initialLoad]);

  // Reset paging and refetch when filter changes
  useEffect(() => {
    setHasMore(true);
    setInitialLoad(true);
    refetch();
  }, [activeFilter, refetch]);

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

  const handleFilterChange = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
    setHasMore(true);
  }, []);

  const loadMore = useCallback(() => {
    if (
      !isLoading &&
      !isLoadingMore &&
      hasMore &&
      data?.pools?.length &&
      networkStatus !== NetworkStatus.fetchMore
    ) {
      setIsLoadingMore(true);
      fetchMore({
        variables: {
          skip: data.pools.length,
          first: 10,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult || !fetchMoreResult.pools || fetchMoreResult.pools.length === 0) {
            setHasMore(false);
            setIsLoadingMore(false);
            return prev;
          }

          // Check if we've reached the end
          if (fetchMoreResult.pools.length < 10) {
            setHasMore(false);
          }

          setIsLoadingMore(false);
          return {
            ...prev,
            pools: [...prev.pools, ...fetchMoreResult.pools],
          };
        },
      }).catch(() => {
        setIsLoadingMore(false);
      });
    }
  }, [data?.pools?.length, fetchMore, hasMore, isLoading, isLoadingMore, networkStatus]);

  // Trigger load more when bottom is in view
  useEffect(() => {
    if (inView && hasMore && !isLoadingMore && !initialLoad) {
      loadMore();
    }
  }, [inView, loadMore, isLoadingMore, hasMore, initialLoad]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Determine if we're in an initial loading state (to show minimal loading UI)
  const isInitialLoading =
    initialLoad && isLoading && (!data || !data.pools || data.pools.length === 0);

  return (
    <div className='flex h-[calc(100vh-4rem)] flex-col'>
      <div className='flex flex-1 overflow-hidden'>
        <FilterSidebar activeFilter={activeFilter} onFilterChange={handleFilterChange} />

        <main className='flex flex-1 flex-col overflow-y-hidden md:flex-row'>
          <div className='scrollbar-hide scroll-hide flex flex-1 justify-center overflow-y-auto p-4'>
            <div className='w-full max-w-2xl'>
              <div className='mb-4 md:hidden'>
                <SearchBar value={searchQuery} onChange={handleSearch} />
              </div>

              <MobileFilters activeFilter={activeFilter} onFilterChange={handleFilterChange} />

              <PoolList
                pools={filteredPools}
                isLoading={isInitialLoading}
                tokenType={tokenType}
                hasMore={hasMore}
                onLoadMore={loadMore}
                loadMoreRef={loadMoreRef}
                isLoadingMore={isLoadingMore}
              />

              {/* Only show global refresh indicator for non-initial loads */}
              {!initialLoad && isLoading && networkStatus === NetworkStatus.refetch && (
                <div className='fixed top-4 right-4 z-50 flex items-center gap-2 rounded-md bg-black/70 px-3 py-2 text-sm text-white dark:bg-white/10'>
                  <div className='size-4 animate-spin rounded-full border-2 border-gray-300 border-t-white'></div>
                  <span>Updating...</span>
                </div>
              )}
            </div>
          </div>
        </main>

        <RightSidebar searchQuery={searchQuery} handleSearch={handleSearch} />
      </div>
    </div>
  );
}
