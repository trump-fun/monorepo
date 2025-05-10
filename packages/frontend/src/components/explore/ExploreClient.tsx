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
import { Button } from '@/components/ui/button';

// Define filter types to match the sidebar
type FilterType = 'newest' | 'highest' | 'ending_soon' | 'recently_closed';

export function ExploreClient() {
  // App state
  const { tokenType } = useTokenContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('newest');

  // Pagination state
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Current timestamp for filtering
  const currentTimestamp = useMemo(() => Math.floor(Date.now() / 1000), []);

  // Determine query parameters based on activeFilter
  const queryParams = useMemo(() => {
    // Define filter configurations for each type
    const filterConfigs = {
      newest: {
        filter: {
          status: PoolStatus.Pending,
          betsCloseAt_gt: currentTimestamp,
        },
        orderBy: Pool_OrderBy.CreatedAt,
        orderDirection: OrderDirection.Desc,
      },
      highest: {
        filter: {
          status: PoolStatus.Pending,
          betsCloseAt_gt: currentTimestamp,
        },
        orderBy:
          tokenType === TokenType.Usdc ? Pool_OrderBy.UsdcBetTotals : Pool_OrderBy.PointsBetTotals,
        orderDirection: OrderDirection.Desc,
      },
      ending_soon: {
        filter: {
          status: PoolStatus.Pending,
          betsCloseAt_gt: currentTimestamp,
        },
        orderBy: Pool_OrderBy.BetsCloseAt,
        orderDirection: OrderDirection.Asc,
      },
      recently_closed: {
        filter: {
          status: PoolStatus.Graded,
          betsCloseAt_lt: currentTimestamp,
        },
        orderBy: Pool_OrderBy.BetsCloseAt,
        orderDirection: OrderDirection.Desc,
      },
    };

    // Return the configuration for the active filter
    return filterConfigs[activeFilter];
  }, [activeFilter, currentTimestamp, tokenType]);

  // Setup GraphQL query variables
  const queryVariables = useMemo(
    () => ({
      filter: queryParams.filter,
      orderBy: queryParams.orderBy,
      orderDirection: queryParams.orderDirection,
      first: 10,
    }),
    [queryParams]
  );

  // Setup the pools query with optimized options
  const {
    data,
    loading: isLoading,
    fetchMore,
    refetch,
    networkStatus,
    error: getPoolsError,
  } = useGetPoolsQuery({
    variables: queryVariables,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
    pollInterval: 10000, // Poll every 10 seconds
    context: { name: 'explore' },
  });

  // Log errors but don't break the UI
  useEffect(() => {
    if (getPoolsError) {
      console.error('Pool fetch error:', getPoolsError);
    }
  }, [getPoolsError]);

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

  // Filter pools based on search query with optimized search
  const filteredPools = useMemo(() => {
    if (!data?.pools) return [];
    if (!searchQuery.trim()) return data.pools;

    const query = searchQuery.toLowerCase().trim();

    return data.pools.filter((pool) => {
      // Check the question text
      if (pool.question.toLowerCase().includes(query)) return true;

      // Check each option
      for (const option of pool.options) {
        if (option.toLowerCase().includes(query)) return true;
      }

      return false;
    });
  }, [data?.pools, searchQuery]);

  // Optimized filter change handler with debouncing
  const handleFilterChange = useCallback(
    (filter: FilterType) => {
      if (filter === activeFilter) return;

      setActiveFilter(filter);
      setHasMore(true);
      setInitialLoad(true);

      // The refetch will be triggered by the useEffect that watches activeFilter
    },
    [activeFilter]
  );

  // Optimized loadMore function that handles pagination
  const loadMore = useCallback(() => {
    const isFetchingInProgress =
      isLoading ||
      isLoadingMore ||
      !hasMore ||
      !data?.pools?.length ||
      networkStatus === NetworkStatus.fetchMore;

    if (isFetchingInProgress) return;

    setIsLoadingMore(true);

    fetchMore({
      variables: {
        skip: data.pools.length,
        first: 10,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        // Handle empty results or errors
        if (!fetchMoreResult?.pools?.length) {
          setHasMore(false);
          return prev;
        }

        // Check if we've reached the end (received fewer than requested)
        if (fetchMoreResult.pools.length < 10) {
          setHasMore(false);
        }

        // Merge previous and new results
        return {
          ...prev,
          pools: [...prev.pools, ...fetchMoreResult.pools],
        };
      },
    })
      .catch((error) => {
        console.error('Error loading more pools:', error);
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  }, [data?.pools?.length, fetchMore, hasMore, isLoading, isLoadingMore, networkStatus]);

  // We've removed automatic loading when scrolling to the bottom
  // Now we'll use a button instead

  // Add debounced search for better performance
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Determine if we're in an initial loading state (to show minimal loading UI)
  const isInitialLoading = useMemo(
    () => initialLoad && isLoading && (!data || !data.pools || data.pools.length === 0),
    [initialLoad, isLoading, data]
  );

  return (
    <div className='flex h-[calc(100vh-4rem)] flex-col'>
      <div className='flex flex-1 overflow-hidden'>
        {/* Left sidebar with filters */}
        <FilterSidebar activeFilter={activeFilter} onFilterChange={handleFilterChange} />

        {/* Main content area */}
        <main className='flex flex-1 flex-col overflow-y-hidden md:flex-row' aria-live='polite'>
          <div className='scrollbar-hide scroll-hide flex flex-1 justify-center overflow-y-auto p-4'>
            <div className='w-full max-w-2xl'>
              {/* Mobile search - only visible on small screens */}
              <div className='mb-4 md:hidden'>
                <SearchBar
                  value={searchQuery}
                  onChange={handleSearch}
                  aria-label='Search predictions'
                />
              </div>

              {/* Mobile filters - only visible on small screens */}
              <MobileFilters activeFilter={activeFilter} onFilterChange={handleFilterChange} />

              {/* Pool listing with optimized rendering */}
              <PoolList
                pools={filteredPools}
                isLoading={isInitialLoading}
                tokenType={tokenType}
                hasMore={hasMore}
                onLoadMore={loadMore}
                isLoadingMore={isLoadingMore}
              />

              {/* Load More button */}
              {hasMore && filteredPools.length > 0 && (
                <div className='my-4 flex justify-center'>
                  <Button
                    onClick={loadMore}
                    disabled={isLoadingMore || networkStatus === NetworkStatus.fetchMore}
                    className='bg-orange-500 text-white hover:bg-orange-600'
                    size='lg'
                  >
                    {isLoadingMore || networkStatus === NetworkStatus.fetchMore ? (
                      <>
                        <div className='mr-2 size-4 animate-spin rounded-full border-2 border-gray-300 border-t-white'></div>
                        Loading more predictions...
                      </>
                    ) : (
                      'Load More Predictions'
                    )}
                  </Button>
                </div>
              )}

              {/* Only show global refresh indicator for non-initial loads */}
              {!initialLoad && isLoading && networkStatus === NetworkStatus.refetch && (
                <div className='fixed top-4 right-4 z-50 flex items-center gap-2 rounded-md bg-black/70 px-4 py-2 text-sm text-white shadow-lg dark:bg-white/10'>
                  <div className='size-4 animate-spin rounded-full border-2 border-gray-300 border-t-white'></div>
                  <span>Refreshing predictions...</span>
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
