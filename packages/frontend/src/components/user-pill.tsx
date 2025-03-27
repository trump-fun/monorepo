'use client';

import { usePrivy } from '@privy-io/react-auth';
import { UserPill } from '@privy-io/react-auth/ui';
import { PrivyLoginButton } from './login-button';

export function TrumpUserPill() {
  const { authenticated, ready } = usePrivy();

  if (!ready) {
    return <div className='h-10 w-10 animate-pulse rounded-full bg-gray-300'></div>;
  }

  if (!authenticated) {
    return <PrivyLoginButton />;
  }

  return (
    <div className='flex items-center gap-2'>
      <UserPill ui={{ background: 'accent' }} size={16} />
    </div>
  );
}
