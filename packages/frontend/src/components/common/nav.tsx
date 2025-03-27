'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { Compass, Menu, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { NetworkIndicator } from '../network-indicator';
import { ThemeToggle } from '../theme-toggle';
import { TokenSwitch } from '../token-switch';
import { TrumpUserPill } from '../user-pill';

export default function Nav() {
  const { formattedBalance, tokenLogo } = useTokenBalance();

  const navItems = [
    {
      label: 'Explore',
      href: '/explore',
      icon: Compass,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
    },
  ];
  return (
    <>
      <header className='fixed top-0 right-0 left-0 z-50 w-full bg-white dark:bg-[#0A0A0A]'>
        <div className='container mx-auto flex h-fit max-w-7xl items-center justify-between md:h-16'>
          <div className='text-2xl font-bold text-orange-500'>
            <Link href='/explore' className='flex items-center gap-2'>
              <Image
                src='https://fxewzungnacaxpsnowcu.supabase.co/storage/v1/object/public/trump-fun/logo/trump.svg'
                alt='Trump.fun'
                width={40}
                height={40}
              />
              <span className='text-2xl font-bold'>Trump.fun</span>
            </Link>
          </div>
          <div className='flex h-full items-center gap-4'>
            {/* Desktop navigation */}
            <div className='hidden items-center gap-4 md:flex'>
              <NetworkIndicator />
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant='outline'
                  className='h-10.5 bg-transparent text-gray-400 hover:bg-transparent hover:text-orange-500'
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon size={18} className='mr-0.5' />
                    {item.label}
                  </Link>
                </Button>
              ))}

              <TokenSwitch />
              <div className='flex items-center gap-2'>
                <div className='text-sm text-gray-400'>Balance</div>
                <div className='font-bold'>
                  {tokenLogo} {formattedBalance}
                </div>
              </div>
              <TrumpUserPill />
              <ThemeToggle />
            </div>

            {/* Mobile navigation */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant='ghost' size='icon' aria-label='Toggle menu' className='md:hidden'>
                  <Menu size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side='right' className='flex h-full flex-col'>
                <SheetTitle className='text-center font-bold text-orange-500'>
                  <div className='flex flex-col items-center'>
                    <Image
                      src='https://fxewzungnacaxpsnowcu.supabase.co/storage/v1/object/public/trump-fun/logo/trump.svg'
                      alt='Trump.fun'
                      width={100}
                      height={30}
                      priority
                      className='mx-auto h-8 w-auto'
                    />
                    <span className='mt-1 text-xl font-bold'>Trump.fun</span>
                  </div>
                </SheetTitle>
                <div className='mt-6 flex flex-1 flex-col items-center gap-6'>
                  <div className='mb-2 flex items-center gap-2'>
                    <div className='text-sm text-gray-400'>Balance</div>
                    <div className='font-bold'>
                      {tokenLogo} {formattedBalance}
                    </div>
                  </div>
                  <TokenSwitch />

                  <div className='w-full space-y-4'>
                    {navItems.map((item) => (
                      <Button
                        key={item.href}
                        variant='outline'
                        className='w-full justify-center bg-transparent text-gray-400 hover:bg-transparent hover:text-orange-500'
                        asChild
                      >
                        <Link href={item.href}>
                          <item.icon size={18} className='mr-2' />
                          {item.label}
                        </Link>
                      </Button>
                    ))}
                  </div>
                  <NetworkIndicator />

                  <TrumpUserPill />
                </div>
                <div className='flex flex-col items-center gap-4 pb-6'>
                  <ThemeToggle />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
