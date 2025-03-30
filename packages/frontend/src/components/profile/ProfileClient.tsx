'use client';

import { RightSidebar } from '@/components/explore/right-sidebar';
import { BetsList } from '@/components/profile/BetsList';
import { MobileFilterTabs } from '@/components/profile/MobileFilterTabs';
import { MobileProfileSection } from '@/components/profile/MobileProfileSection';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import { Input } from '@/components/ui/input';
import { useFilteredPools } from '@/hooks/useFilteredPools';
import { useTokenContext } from '@/hooks/useTokenContext';
import { useUserBetsData } from '@/hooks/useUserBetsData';
import { useUserStats } from '@/hooks/useUserStats';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { useWithdraw } from '@/hooks/useWithdraw';
import { Bet, PayoutClaimed } from '@/types/__generated__/graphql';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

//TODO Types are very sloppy in this file
export function ProfileClient() {
  const [activeFilter, setActiveFilter] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const { address } = useWalletAddress();
  const { tokenType } = useTokenContext();
  const { betsData, isLoading, isError } = useUserBetsData(activeFilter);
  const withdrawalProps = useWithdraw();

  // Use memoized values from the GraphQL queries
  const memoizedBets = useMemo(() => betsData.bets as Bet[], [betsData.bets]);
  const memoizedPayouts = useMemo(
    () => betsData.payoutClaimeds as PayoutClaimed[],
    [betsData.payoutClaimeds]
  );

  const userStats = useUserStats(memoizedBets, memoizedPayouts);

  const filteredPools = useFilteredPools(activeFilter, searchQuery, memoizedBets, memoizedPayouts);

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
        <ProfileSidebar
          address={address}
          activeFilter={activeFilter}
          handleFilterChange={handleFilterChange}
          userStats={userStats}
          withdrawalProps={withdrawalProps}
          tokenType={tokenType}
          betWithdrawals={betsData.betWithdrawals}
        />

        <main className='flex flex-1 flex-col overflow-y-hidden md:flex-row'>
          <div className='scrollbar-hide flex flex-1 justify-center overflow-y-auto p-4'>
            <div className='w-full max-w-2xl'>
              <MobileProfileSection
                address={address}
                userStats={userStats}
                withdrawalProps={withdrawalProps}
                tokenType={tokenType}
              />

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

              <BetsList pools={filteredPools} activeFilter={activeFilter} isLoading={isLoading} />
            </div>
          </div>
        </main>

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
