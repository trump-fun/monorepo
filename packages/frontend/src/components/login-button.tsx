'use client';

import { Button } from '@/components/ui/button';
import { useNetwork } from '@/hooks/useNetwork';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { LogIn } from 'lucide-react';
import { useEffect } from 'react';
import { useSolanaTokens } from '../hooks/useSolanaTokens';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';

export const DynamicLogoutButton = () => {
  const { handleLogOut } = useDynamicContext();
  return <Button onClick={handleLogOut}>Log out</Button>;
};

type DynamicLoginButtonProps = {
  className?: string;
  variant?: 'contained' | 'outlined';
};

export function DynamicLoginButton({
  className = 'bg-orange-500 text-white hover:bg-orange-600',
  variant = 'contained',
}: DynamicLoginButtonProps) {
  const { primaryWallet, setShowAuthFlow } = useDynamicContext();
  const { fetchBalances } = useSolanaTokens();
  const { cluster } = useNetwork();

  useEffect(() => {
    if (!primaryWallet) {
      return;
    }

    // When wallet is connected, fetch token balances
    fetchBalances();
  }, [primaryWallet, fetchBalances]);

  const disableLogin = !!primaryWallet;

  // For custom style buttons
  if (variant === 'outlined' || variant === 'contained') {
    const buttonVariant = variant === 'outlined' ? 'outline' : 'default';

    return (
      <Button
        size='lg'
        variant={buttonVariant}
        disabled={disableLogin}
        onClick={() => setShowAuthFlow(true)}
        className={className}
      >
        <LogIn className='mr-2 h-4 w-4' />
        Connect
      </Button>
    );
  }

  // Use Dynamic's default widget
  return <DynamicWidget variant='modal' buttonClassName={className} />;
}

// For backwards compatibility
export const PrivyLoginButton = DynamicLoginButton;
export const PrivyLogoutButton = DynamicLogoutButton;
