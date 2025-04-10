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
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { LogOut, Plus, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { PrivyLoginButton } from './login-button';

interface AuthButtonProps {
  className?: string;
}

export function AuthButton({ className }: AuthButtonProps) {
  const { authenticated, ready: authReady, createWallet, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { address } = useAccount();

  // Only check authReady initially
  if (!authReady) {
    return (
      <div className='flex w-full gap-2'>
        <Button size='lg' disabled className={cn('h-12 w-full bg-gray-400', className)}>
          Loading Auth...
        </Button>
      </div>
    );
  }

  // If not authenticated, show login options
  if (!authenticated) {
    return (
      <div className='flex w-full gap-2'>
        <PrivyLoginButton
          variant='outlined'
          className={cn(
            'h-12 w-full border-2 border-orange-500 text-lg font-semibold text-orange-500 hover:bg-orange-50',
            className
          )}
        />
      </div>
    );
  }

  // If authenticated but wallets aren't ready yet
  if (!walletsReady) {
    return (
      <div className='flex gap-2'>
        <Button
          size='lg'
          disabled
          className={cn('h-12 w-full bg-gray-400 text-lg font-semibold', className)}
        >
          Loading Wallets...
        </Button>
      </div>
    );
  }

  // If authenticated and wallets are ready, but no wallets exist
  if (wallets.length === 0) {
    return (
      <div className='flex gap-2'>
        <Button
          size='lg'
          onClick={() => createWallet()}
          className={cn(
            'h-12 w-full bg-orange-500 text-lg font-semibold hover:bg-orange-600',
            className
          )}
        >
          <Plus className='mr-2 h-4 w-4' />
          Create Wallet with Passkey
        </Button>
      </div>
    );
  }

  // If authenticated and has wallets, show wallet menu and explore button
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
          {wallets.map((wallet) => (
            <DropdownMenuItem key={wallet.address} className='cursor-pointer'>
              {wallet.address.slice(0, 6)}...
              {wallet.address.slice(-4)}
              {wallet.walletClientType === 'privy' ? ' (Embedded)' : ' (External)'}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className='cursor-pointer text-red-500' onClick={logout}>
            <LogOut className='mr-2 h-4 w-4' />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
