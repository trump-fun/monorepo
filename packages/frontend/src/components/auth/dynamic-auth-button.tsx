'use client';

import { DynamicWidget, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface DynamicAuthButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showAddress?: boolean;
}

export function DynamicAuthButton({
  variant = 'default',
  size = 'default',
  className,
  showAddress = false,
}: DynamicAuthButtonProps) {
  const { user, primaryWallet, handleLogOut, isAuthenticated } = useDynamicContext();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Format address for display with ellipsis
  const formattedAddress = primaryWallet?.address
    ? `${primaryWallet.address.substring(0, 6)}...${primaryWallet.address.substring(
        primaryWallet.address.length - 4
      )}`
    : '';

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await handleLogOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isAuthenticated) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleSignOut}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? 'Signing Out...' : showAddress ? formattedAddress : 'Sign Out'}
      </Button>
    );
  }

  return <DynamicWidget variant='modal' buttonClassName={className} />;
}
