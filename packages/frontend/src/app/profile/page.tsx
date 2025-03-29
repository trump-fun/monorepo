'use client';

import { useTokenContext } from '@/hooks/useTokenContext';
import { useUserStats } from '@/hooks/useUserStats';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { useWithdraw } from '@/hooks/useWithdraw';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useUserBetsData } from '@/hooks/useUserBetsData';
import { useFilteredPools } from '@/hooks/useFilteredPools';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import { MobileProfileSection } from '@/components/profile/MobileProfileSection';
import { MobileFilterTabs } from '@/components/profile/MobileFilterTabs';
import { BetsList } from '@/components/profile/BetsList';
import { RightSidebar } from '@/components/explore/right-sidebar';

export default function ProfilePage() {
  const [activeFilter, setActiveFilter] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const { address } = useWalletAddress();
  const { tokenType } = useTokenContext();

  // Get user's betting data
  const { betsData, isLoading, isError } = useUserBetsData(activeFilter);

  // Get withdrawal functionality
  const withdrawalProps = useWithdraw();

  // Calculate user stats from bets data
  const userStats = useUserStats(betsData.bets, betsData.payoutClaimeds);

  // Filter pools based on search query
  const filteredPools = useFilteredPools(
    activeFilter,
    searchQuery,
    betsData.bets,
    betsData.payoutClaimeds
  );

  // Handle user interactions
  const handleFilterChange = (value: string) => setActiveFilter(value);
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value);

  if (isError) {
    return (
      <div className='flex h-[calc(100vh-4rem)] items-center justify-center'>
        <p className='text-red-500'>Error loading your betting data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className='flex h-[calc(100vh-4rem)] flex-col'>
      <div className='flex flex-1 overflow-hidden'>
        {/* Desktop Sidebar */}
        <ProfileSidebar
          address={address}
          activeFilter={activeFilter}
          handleFilterChange={handleFilterChange}
          userStats={userStats}
          withdrawalProps={withdrawalProps}
          tokenType={tokenType}
          betWithdrawals={betsData.betWithdrawals}
        />

        {/* Main Content */}
        <main className='flex flex-1 flex-col overflow-y-hidden md:flex-row'>
          <div className='scrollbar-hide flex flex-1 justify-center overflow-y-auto p-4'>
            <div className='w-full max-w-2xl'>
              {/* Mobile Profile Section */}
              <MobileProfileSection
                address={address}
                userStats={userStats}
                withdrawalProps={withdrawalProps}
                tokenType={tokenType}
              />

              {/* Mobile Search and Filters */}
              <div className='mb-4 md:hidden'>
                <div className='mb-4'>
                  <SearchInput
                    placeholder='Search your bets...'
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
                <div className='scrollbar-hide overflow-x-auto'>
                  <MobileFilterTabs activeFilter={activeFilter} onChange={handleFilterChange} />
                </div>
              </div>

              {/* Betting Posts */}
              <BetsList pools={filteredPools} activeFilter={activeFilter} isLoading={isLoading} />
            </div>
          </div>
        </main>

        {/* Right Sidebar with Search and Market Insights */}
        <RightSidebar searchQuery={searchQuery} handleSearch={handleSearch} />
      </div>
    </div>
  );
}

function SearchInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className='relative'>
      <Search
        className='absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-500 dark:text-gray-400'
        size={16}
      />
      <Input
        placeholder={placeholder}
        className='border-gray-300 pl-10 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
