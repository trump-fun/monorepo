import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FilterType } from '@/hooks/usePools';
import {
  TRUMP_FUN_TG_URL,
  TRUMP_FUN_TWITTER_URL,
  TRUMP_FUN_TWITTER_USERNAME,
} from '@/utils/config';
import Link from 'next/link';
import { FaTelegramPlane } from 'react-icons/fa';

interface FilterSidebarProps {
  activeFilter: FilterType;
  onFilterChange: (value: FilterType) => void;
}

export function FilterSidebar({ activeFilter, onFilterChange }: FilterSidebarProps) {
  const renderFilterButton = (value: FilterType, label: string) => (
    <Button
      variant={activeFilter === value ? 'default' : 'ghost'}
      className='w-full justify-start font-medium'
      onClick={() => onFilterChange(value)}
    >
      {label}
    </Button>
  );

  return (
    <div className='hidden w-60 flex-col border-r border-gray-200 p-4 md:flex dark:border-gray-800'>
      <div className='space-y-2'>
        {renderFilterButton('newest', 'Newest')}
        {renderFilterButton('highest', 'Highest Vol.')}
        {renderFilterButton('ending_soon', 'Ending Soon')}
        {renderFilterButton('recently_closed', 'Recently Closed')}
        <Separator className='my-2' />
        <Link href={TRUMP_FUN_TWITTER_URL} target='_blank'>
          <Button variant='outline' className='mb-2 w-full justify-start gap-2'>
            <svg
              viewBox='0 0 24 24'
              aria-hidden='true'
              className='h-4 w-4 fill-current text-black dark:text-white'
            >
              <g>
                <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'></path>
              </g>
            </svg>
            Follow @{TRUMP_FUN_TWITTER_USERNAME}
          </Button>
        </Link>
        <Link href={TRUMP_FUN_TG_URL} target='_blank'>
          <Button variant='outline' className='w-full justify-start gap-2'>
            <FaTelegramPlane className='h-4 w-4 text-black dark:text-white' />
            Telegram Bot
          </Button>
        </Link>
      </div>
    </div>
  );
}
