'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DynamicLoginButton } from './login-button';

export function TrumpUserPill() {
  const { primaryWallet } = useDynamicContext();

  // Show login button if not authenticated
  if (!primaryWallet) {
    return <DynamicLoginButton />;
  }

  // Get the wallet address for the avatar
  const address = primaryWallet?.address || '';

  // Show the user avatar
  return (
    <div className='flex items-center gap-2'>
      <Avatar className='h-10 w-10'>
        <AvatarImage
          src={`https://api.dicebear.com/7.x/identicon/svg?seed=${address}`}
          alt='User Avatar'
        />
        <AvatarFallback>{address ? `${address.slice(0, 2)}` : 'U'}</AvatarFallback>
      </Avatar>
    </div>
  );
}
