'use client';

import { FilterSidebar } from '@/components/explore/filter-sidebar';
import { MobileFilters } from '@/components/explore/mobile-filters';
import { PoolList } from '@/components/explore/pool-list';
import { RightSidebar } from '@/components/explore/right-sidebar';
import { SearchBar } from '@/components/explore/search-bar';
import { usePools } from '@/hooks/usePools';
import { useTokenContext } from '@/hooks/useTokenContext';

export function ExploreClient() {
  const { tokenType } = useTokenContext();
  const {
    filteredPools,
    isLoading,
    activeFilter,
    searchQuery,
    setSearchQuery,
    handleFilterChange,
    loadMore,
    hasMore,
  } = usePools({
    filter: {
      // status: 'Pending',
      // betsCloseAt_gt: Math.floor(Date.now() / 1000).toString(),
    },
    // orderBy:
    // tokenType === TokenType.Usdc ? Pool_OrderBy.UsdcBetTotals : Pool_OrderBy.PointsBetTotals,
    // orderDirection: OrderDirection.Desc,
    pollInterval: 10000,
    context: { name: 'explore' },
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

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
                isLoading={isLoading}
                tokenType={tokenType}
                hasMore={hasMore}
                onLoadMore={loadMore}
              />
            </div>
          </div>
        </main>

        <RightSidebar searchQuery={searchQuery} handleSearch={handleSearch} />
      </div>
    </div>
  );
}
