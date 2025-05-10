'use client';

import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { SolanaWalletConnectorsWithConfig } from '@dynamic-labs/solana';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SOLANA_DEVNET_CONFIG, SUPABASE_BUCKET } from '@trump-fun/common';
import { ReactNode } from 'react';
import { topUpBalance } from '@/utils/topUp';

const queryClient = new QueryClient();

interface DynamicAuthProviderProps {
  children: ReactNode;
}

export function DynamicAuthProvider({ children }: DynamicAuthProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <DynamicContextProvider
        settings={{
          environmentId:
            process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID ||
            'ecf64c3a-50ac-44db-a0e3-e74a962dfe02',
          walletConnectors: [
            SolanaWalletConnectorsWithConfig({
              customRpcUrls: { solana: [SOLANA_DEVNET_CONFIG.rpcUrl] },
            }),
          ],
          appLogoUrl: `${SUPABASE_BUCKET}/logo/trump.svg`,
          appName: 'Trump Fun',
          handlers: {
            // Handler that runs before wallet connection is established
            handleConnectedWallet: async ({ address }) => {
              console.log('Connected wallet:', address);
              if (address) {
                await topUpBalance({
                  walletAddress: address,
                  cluster: 'devnet',
                });
              }
              return true;
            },
            // Handler for authenticated user - runs after user authenticates
            handleAuthenticatedUser: async ({ user }) => {
              console.log('Authenticated user:', user.userId);

              console.log(user);

              // Get the first wallet address from the user's verified credentials
              const walletAddress = user.verifiedCredentials?.[0]?.address;
              console.log('Wallet address from verified credentials:', walletAddress);

              if (walletAddress) {
                await topUpBalance({
                  walletAddress,
                  cluster: 'devnet',
                });
              }
              return;
            },
          },
          events: {
            // Event when authentication is successful
            onAuthSuccess: (args) => {
              console.log('Auth success event:', args.primaryWallet?.address);
              if (args.primaryWallet?.address) {
                topUpBalance({
                  walletAddress: args.primaryWallet.address,
                  cluster: 'devnet',
                });
              }
            },
            // Event when a wallet is added
            onWalletAdded: (args) => {
              console.log('Wallet added:', args.wallet?.address);
              if (args.wallet?.address) {
                topUpBalance({
                  walletAddress: args.wallet.address,
                  cluster: 'devnet',
                });
              }
            },
            // Event when user profile is updated
            onUserProfileUpdate: (user) => {
              console.log('User profile updated:', user.verifiedCredentials?.[0]?.address);
              const walletAddress = user.verifiedCredentials?.[0]?.address;
              if (walletAddress) {
                topUpBalance({
                  walletAddress,
                  cluster: 'devnet',
                });
              }
            },
          },
        }}
      >
        {children}
      </DynamicContextProvider>
    </QueryClientProvider>
  );
}
