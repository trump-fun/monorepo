import { TRUMP_FUN_TG_URL, TRUMP_FUN_TWITTER_URL } from '@trump-fun/common';
import Image from 'next/image';
import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className='bg-background border-t border-gray-200 py-8 dark:border-gray-800'>
      <div className='container px-4 md:px-6'>
        <div className='flex flex-col items-center justify-between gap-4 md:flex-row'>
          <div className='flex flex-col items-center gap-2 md:items-start'>
            <div className='text-2xl font-bold text-orange-500'>
              <Link href='/'>Trump.fun</Link>
            </div>
          </div>
          <div className='flex flex-col items-center gap-6 md:flex-row'>
            <Link href={TRUMP_FUN_TG_URL} target='_blank' rel='noopener noreferrer'>
              <Image src='/tg.svg' alt='tg' width={20} height={20} className='size-7' />
            </Link>
            <Link href={TRUMP_FUN_TWITTER_URL} target='_blank' rel='noopener noreferrer'>
              <svg
                viewBox='0 0 24 24'
                aria-hidden='true'
                className='size-6 fill-current text-orange-500'
              >
                <g>
                  <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'></path>
                </g>
              </svg>
            </Link>
          </div>
        </div>
        <div className='text-muted-foreground mt-8 text-center text-xs'>
          © {new Date().getFullYear()} Trump.fun. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
