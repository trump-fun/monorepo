import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilterType } from '@/hooks/usePools';

interface MobileFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (value: FilterType) => void;
}

export function MobileFilters({ activeFilter, onFilterChange }: MobileFiltersProps) {
  return (
    <div className='scrollbar-hide scroll-hide mb-4 overflow-x-auto md:hidden'>
      <Tabs
        defaultValue='newest'
        value={activeFilter}
        onValueChange={(value) => onFilterChange(value as FilterType)}
        className='w-full'
      >
        <TabsList className='bg-gray-100 dark:bg-gray-900'>
          <TabsTrigger
            value='newest'
            className='data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800'
          >
            Newest
          </TabsTrigger>
          <TabsTrigger
            value='highest'
            className='data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800'
          >
            Highest Vol.
          </TabsTrigger>
          <TabsTrigger
            value='ending_soon'
            className='data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800'
          >
            Ending Soon
          </TabsTrigger>
          <TabsTrigger
            value='ended'
            className='data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800'
          >
            Ended
          </TabsTrigger>
          <TabsTrigger
            value='recently_closed'
            className='data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800'
          >
            Recent
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
