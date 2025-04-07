'use client';

import { FilterSidebar } from '@/components/explore/filter-sidebar';
import { MobileFilters } from '@/components/explore/mobile-filters';
import { PoolList } from '@/components/explore/pool-list';
import { RightSidebar } from '@/components/explore/right-sidebar';
import { SearchBar } from '@/components/explore/search-bar';
import { usePools } from '@/hooks/usePools';
import { useTokenContext } from '@/hooks/useTokenContext';
import { useCallback, useEffect, useRef } from 'react';

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
  } = usePools(tokenType);
  console.log('filteredPools', filteredPools);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || !hasMore || isLoading) return;

    const { scrollTop, clientHeight, scrollHeight } = scrollContainerRef.current;

    if (scrollHeight - scrollTop - clientHeight < 200) {
      loadMore();
    }
  }, [hasMore, isLoading, loadMore]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  return (
    <div className='flex h-[calc(100vh-4rem)] flex-col'>
      <div className='flex flex-1 overflow-hidden'>
        <FilterSidebar activeFilter={activeFilter} onFilterChange={handleFilterChange} />

        <main className='flex flex-1 flex-col overflow-y-hidden md:flex-row'>
          <div
            ref={scrollContainerRef}
            className='scrollbar-hide scroll-hide flex flex-1 justify-center overflow-y-auto p-4'
          >
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
              />
            </div>
          </div>
        </main>

        <RightSidebar searchQuery={searchQuery} handleSearch={handleSearch} />
      </div>
    </div>
  );
}
