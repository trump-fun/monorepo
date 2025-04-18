'use client';

import { Button } from '@/components/ui/button';
import { useNetwork } from '@/hooks/useNetwork';
import { topUpBalance } from '@/utils/topUp';
import { useLogin, usePrivy, useWallets } from '@privy-io/react-auth';
import { LogIn } from 'lucide-react';
import { useEffect } from 'react';
import { useTokenBalance } from '../hooks/useTokenBalance';

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
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
  const { refetch: fetchBalance } = useTokenBalance();
  const { chainId } = useNetwork();

  useEffect(() => {
    if (!ready || !authenticated || !embeddedWallet) {
      return;
    }

    const makeCall = async () => {
      try {
        const result = await topUpBalance({
          walletAddress: embeddedWallet.address,
          chainId,
        });

        if (result.success) {
          fetchBalance();
        }
      } catch (error) {
        console.error('Error in makeCall:', error);
      }
    };

    makeCall();
  }, [ready, authenticated, embeddedWallet, fetchBalance, chainId]);

  const { login } = useLogin({
    onError: (error) => {
      console.error('Login error:', error);
    },

    onComplete: async ({ user }) => {
      await topUpBalance({
        walletAddress: user.wallet?.address || '',
        chainId,
      });

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
      className={className}
    >
      <LogIn className='mr-2 h-4 w-4' />
      Connect
    </Button>
  );
}
