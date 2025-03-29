'use client';

import { AuthButton } from '@/components/auth-button';
import { PoolList } from '@/components/pools/pool-list';
import { Button } from '@/components/ui/button';
import { useNetwork } from '@/hooks/useNetwork';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { topUpBalance } from '@/utils/topUp';
import { usePrivy } from '@privy-io/react-auth';
import { Compass } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect } from 'react';

export default function Home() {
  // TODO We want to remove this when we can, have it here because the login button callback isn't getting called, probably because of a demount issue
  const { ready, authenticated, user } = usePrivy();
  const { refetch: fetchBalance } = useTokenBalance();
  const { chainId } = useNetwork();

  // Use useCallback to prevent the function from being recreated on every render
  const handleTopUp = useCallback(async () => {
    if (!ready || !authenticated || !user || !user.wallet?.address) {
      return;
    }

    try {
      const result = await topUpBalance({
        walletAddress: user.wallet.address,
        chainId,
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
  }, [ready, authenticated, user, fetchBalance, chainId]);

  useEffect(() => {
    if (ready && authenticated && user) {
      handleTopUp();
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
      </main>
    </div>
  );
}
