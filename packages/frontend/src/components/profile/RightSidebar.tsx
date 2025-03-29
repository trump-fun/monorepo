import { EndingSoon } from '@/components/ending-soon';
import { HighestVolume } from '@/components/highest-volume';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useMemo } from 'react';

export function RightSidebar({
  searchQuery,
  handleSearch,
}: {
  searchQuery: string;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  // Memoize components to prevent unnecessary re-renders
  const memoizedHighestVolume = useMemo(() => <HighestVolume />, []);
  const memoizedEndingSoon = useMemo(() => <EndingSoon />, []);

  return (
    <div className='hidden w-80 overflow-y-auto border-l border-gray-200 p-4 md:block dark:border-gray-800'>
      {/* Search */}
      <div className='mb-6'>
        <div className='relative'>
          <Search
            className='absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-500 dark:text-gray-400'
            size={16}
          />
          <Input
            placeholder='Search your bets...'
            className='border-gray-300 pl-10 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Market Insights */}
      {memoizedHighestVolume}
      {memoizedEndingSoon}
    </div>
  );
}
