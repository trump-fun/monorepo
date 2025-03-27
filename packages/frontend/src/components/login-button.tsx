'use client';

import { Button } from '@/components/ui/button';
import { topUpBalance } from '@/utils/topUp';
import { useLogin, usePrivy } from '@privy-io/react-auth';
import { LogIn } from 'lucide-react';
import { useEffect } from 'react';
import { useBalance } from '../hooks/usePointsBalance';
import { useEmbeddedWallet } from './EmbeddedWalletProvider';

export const PrivyLogoutButton = () => {
  const { logout } = usePrivy();
  return <Button onClick={logout}>Log out</Button>;
};

type PrivyLoginButtonProps = {
  className?: string;
  variant?: 'contained' | 'outlined';
};

export function PrivyLoginButton({
  className = 'bg-orange-500 text-white hover:bg-orange-600',
  variant = 'contained',
}: PrivyLoginButtonProps) {
  const { ready, authenticated } = usePrivy();
  const { embeddedWallet } = useEmbeddedWallet();
  const { refetch: fetchBalance } = useBalance();

  useEffect(() => {
    if (!ready || !authenticated || !embeddedWallet) {
      return;
    }

    const makeCall = async () => {
      try {
        console.log('Topping up balance');
        const result = await topUpBalance({
          walletAddress: embeddedWallet.address,
        });

        if (!result.success) {
          if (result.error && result.rateLimitReset) {
            // Rate limited case - log but don't escalate
            console.log(
              `Top-up rate limited: ${result.error}. Available again in ${result.rateLimitReset}`
            );
          } else if (result.error) {
            // Other error - use console.error but don't escalate to user
            console.error(`Top-up failed: ${result.error}`);
          }
        } else {
          fetchBalance();
        }
      } catch (error) {
        console.error('Error in makeCall:', error);
      }
    };

    makeCall();
  }, [ready, authenticated, embeddedWallet, fetchBalance]);

  // For some reason the callback
  const { login } = useLogin({
    onError: (error) => {
      console.error('Login error:', error);
    },

    onComplete: async ({ user }) => {
      console.log('Login complete:', user);
      const result = await topUpBalance({
        walletAddress: user.wallet?.address || '',
      });

      if (!result.success) {
        if (result.error && result.rateLimitReset) {
          // Rate limited case - log but don't escalate
          console.log(
            `Top-up rate limited: ${result.error}. Available again in ${result.rateLimitReset}`
          );
        } else if (result.error) {
          // Other error - use console.error but don't escalate to user
          console.error(`Top-up failed: ${result.error}`);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      fetchBalance();
    },
  });

  const disableLogin = !ready || (ready && authenticated);

  const buttonVariant = variant === 'outlined' ? 'outline' : 'default';

  return (
    <Button
      size='lg'
      variant={buttonVariant}
      disabled={disableLogin}
      onClick={() => login()}
      className={`h-12 w-full text-lg font-semibold md:max-w-48 ${className}`}
    >
      <LogIn className='mr-2 h-4 w-4' />
      Connect
    </Button>
  );
}
