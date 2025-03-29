import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MobileFilterTabsProps {
  activeFilter: string;
  onChange: (value: string) => void;
}

export function MobileFilterTabs({ activeFilter, onChange }: MobileFilterTabsProps) {
  return (
    <div className='scrollbar-hide mb-4 overflow-x-auto md:hidden'>
      <Tabs defaultValue='active' value={activeFilter} onValueChange={onChange} className='w-full'>
        <TabsList className='bg-gray-100 dark:bg-gray-900'>
          <TabsTrigger
            value='active'
            className='data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800'
          >
            Active
          </TabsTrigger>
          <TabsTrigger
            value='won'
            className='data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800'
          >
            Won
          </TabsTrigger>
          <TabsTrigger
            value='lost'
            className='data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800'
          >
            Lost
          </TabsTrigger>
          <TabsTrigger
            value='all'
            className='data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800'
          >
            All
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
