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
import { useCallback, useEffect, useState } from 'react';

export default function Home() {
  // Added state for hero image
  const [heroImage, setHeroImage] = useState('/hero.png');

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
      await new Promise((resolve) => setTimeout(resolve, 2000));
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
              <div className='relative mx-auto w-full max-w-[95%]'>
                <Image
                  src='/hero.png'
                  alt='Trump'
                  width={950}
                  height={950}
                  className='h-auto w-full transition-opacity duration-150'
                  style={{ opacity: heroImage === '/hero.png' ? 1 : 0 }}
                  priority
                />
                <Image
                  src='/hero-except-its-laser-eyes.png'
                  alt='Trump with laser eyes'
                  width={950}
                  height={950}
                  className='absolute top-0 left-0 h-auto w-full transition-opacity duration-150'
                  style={{ opacity: heroImage === '/hero-except-its-laser-eyes.png' ? 1 : 0 }}
                  priority
                />
              </div>

              <div className='absolute top-[60%] left-0 -translate-y-1/2 transform md:top-[50%] md:left-10 md:translate-y-0'>
                <div className='mx-4 max-w-md rounded-lg bg-black/70 p-6 backdrop-blur-sm md:mx-0'>
                  <h1 className='mb-6 text-3xl font-bold text-white md:text-4xl'>
                    Bet on Trump&apos;s next move and win big.
                  </h1>

                  <div className='flex flex-col gap-4'>
                    <Button
                      variant='default'
                      className='h-12 w-full bg-orange-500 text-lg font-semibold text-white hover:bg-orange-600'
                      asChild
                      onMouseEnter={() => setHeroImage('/hero-except-its-laser-eyes.png')}
                      onMouseLeave={() => setHeroImage('/hero.png')}
                    >
                      <Link href='/explore'>
                        <Compass className='mr-2 h-4 w-4' />
                        Explore
                      </Link>
                    </Button>
                    <div className='rounded-md bg-black/40'>
                      <AuthButton className='w-full' />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className='py-6'>
          <div className='container px-4 md:px-6'>
            <PoolList />
          </div>
        </section>
      </main>
    </div>
  );
}
