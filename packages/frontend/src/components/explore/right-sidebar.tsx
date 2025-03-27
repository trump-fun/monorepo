import { EndingSoon } from '@/components/ending-soon';
import { HighestVolume } from '@/components/highest-volume';
import { SearchBar } from './search-bar';

interface RightSidebarProps {
  searchQuery: string;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function RightSidebar({ searchQuery, handleSearch }: RightSidebarProps) {
  return (
    <div className='hidden w-80 gap-4 overflow-y-auto border-l border-gray-200 p-4 md:block dark:border-gray-800'>
      <div className='mb-6'>
        <SearchBar value={searchQuery} onChange={handleSearch} />
      </div>
      <HighestVolume />
      <EndingSoon />
    </div>
  );
}
