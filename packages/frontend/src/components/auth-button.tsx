'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isSolanaWallet } from '@dynamic-labs/solana';
import { LogOut, Wallet } from 'lucide-react';
import { DynamicLoginButton } from './login-button';

interface AuthButtonProps {
  className?: string;
}

export function AuthButton({ className }: AuthButtonProps) {
  const { primaryWallet, handleLogOut } = useDynamicContext();

  const address = primaryWallet?.address;
  const isSolana = primaryWallet && isSolanaWallet(primaryWallet);

  // Loading state - we'll use a simpler approach since Dynamic doesn't expose isInitializing
  if (!primaryWallet && !address) {
    return (
      <div className='flex w-full gap-2'>
        <DynamicLoginButton
          variant='outlined'
          className={cn(
            'h-12 w-full border-2 border-orange-500 text-lg font-semibold text-orange-500 hover:bg-orange-50',
            className
          )}
        />
      </div>
    );
  }

  // If authenticated and has wallet, show wallet menu
  return (
    <div className='flex w-full gap-2'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            className={cn(
              'h-12 w-full border-2 border-orange-500 text-lg font-semibold text-orange-500 hover:bg-orange-50',
              className
            )}
          >
            <Wallet className='mr-2 h-4 w-4' />
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Wallet'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-56'>
          <DropdownMenuItem className='cursor-pointer'>
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown address'}
            {isSolana ? ' (Solana)' : ' (Other)'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className='cursor-pointer text-red-500' onClick={handleLogOut}>
            <LogOut className='mr-2 h-4 w-4' />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
