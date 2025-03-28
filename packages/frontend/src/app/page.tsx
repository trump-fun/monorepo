'use client';

import { AuthButton } from '@/components/auth-button';
import { PoolList } from '@/components/pools/pool-list';
import { Button } from '@/components/ui/button';
import { useBalance } from '@/hooks/usePointsBalance';
import { TRUMP_FUN_TG_URL, TRUMP_FUN_TWITTER_URL } from '@/utils/config';
import { topUpBalance } from '@/utils/topUp';
import { usePrivy } from '@privy-io/react-auth';
import { Compass } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect } from 'react';

export default function Home() {
  //TODO We want to remove this when we can, have it here because the login button callback isn't getting called, probably because of a demount issue
  const { ready, authenticated, user } = usePrivy();
  const { refetch: fetchBalance } = useBalance();

  // Use useCallback to prevent the function from being recreated on every render
  const handleTopUp = useCallback(async () => {
    if (!ready || !authenticated || !user || !user.wallet?.address) {
      return;
    }

    try {
      const result = await topUpBalance({
        walletAddress: user.wallet.address,
      });

      if (!result.success) {
        if (result.error && result.rateLimitReset) {
        } else if (result.error) {
          console.error(`Top-up failed: ${result.error}`);
        }
      } else {
      }

      // Sleep for 2 seconds to ensure the balance is updated
      await new Promise(resolve => setTimeout(resolve, 2000));
      fetchBalance();
    } catch (error) {
      console.error('Error in handleTopUp:', error);
    }
  }, [ready, authenticated, user, fetchBalance]);

  useEffect(() => {
    if (ready && authenticated && user) {
      handleTopUp();
    } else {
    }
  }, [ready, authenticated, user, handleTopUp]);

  return (
    <div className='bg-background flex min-h-screen'>
      <main className='flex-1'>
        <section>
          <div className='container px-4 md:px-0'>
            <div className='relative flex flex-col items-center gap-4 text-center'>
              <Image
                src='/hero.png'
                alt='Trump'
                width={1000}
                height={1000}
                className='h-auto w-full rounded-t-lg'
              />
              <div className='mt-4 flex w-full flex-col gap-2 md:absolute md:bottom-28 md:left-10 md:mt-0 md:transform md:flex-row'>
                <Button
                  variant='default'
                  className='h-12 w-full bg-orange-500 text-lg font-semibold text-white hover:bg-orange-600 md:max-w-48'
                  asChild
                >
                  <Link href='/explore'>
                    <Compass className='mr-2 h-4 w-4' />
                    Explore
                  </Link>
                </Button>
                <AuthButton />
              </div>
            </div>
          </div>
        </section>

        <section className='py-12'>
          <div className='container px-4 md:px-6'>
            <PoolList />
          </div>
        </section>

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
      </main>
    </div>
  );
}
