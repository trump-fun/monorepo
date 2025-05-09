'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DynamicUserProfile, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { DynamicLoginButton } from './login-button';

export function TrumpUserPill() {
  const { primaryWallet, setShowDynamicUserProfile } = useDynamicContext();

  // Show login button if not authenticated
  if (!primaryWallet) {
    return <DynamicLoginButton />;
  }

  // Get the wallet address for the avatar
  const address = primaryWallet?.address || '';

  // Show the user avatar
  return (
    <div className='flex items-center gap-2'>
      <DynamicUserProfile />

      <Avatar className='h-10 w-10 cursor-pointer' onClick={() => setShowDynamicUserProfile(true)}>
        <AvatarImage
          src={`https://api.dicebear.com/7.x/identicon/svg?seed=${address}`}
          alt='User Avatar'
        />
        <AvatarFallback>{address ? `${address.slice(0, 2)}` : 'U'}</AvatarFallback>
      </Avatar>
    </div>
  );
}
