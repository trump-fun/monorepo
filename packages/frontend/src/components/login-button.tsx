'use client';

import { Button } from '@/components/ui/button';
import { useNetwork } from '@/hooks/useNetwork';
import { useLogin, usePrivy } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { LogIn } from 'lucide-react';
import { useEffect } from 'react';
import { useSolanaTokens } from '../hooks/useSolanaTokens';

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
  const { wallets } = useSolanaWallets();
  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
  const { fetchBalances } = useSolanaTokens();
  const { cluster } = useNetwork();

  useEffect(() => {
    if (!ready || !authenticated || !embeddedWallet) {
      return;
    }

    // When wallet is connected, fetch token balances
    fetchBalances();
  }, [ready, authenticated, embeddedWallet, fetchBalances]);

  const { login } = useLogin({
    onError: (error) => {
      console.error('Login error:', error);
    },

    onComplete: async ({ user }) => {
      // Fetch token balances after successful login
      await new Promise((resolve) => setTimeout(resolve, 1000));
      fetchBalances();
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
