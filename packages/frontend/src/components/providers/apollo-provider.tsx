'use client';

import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { PropsWithChildren } from 'react';

export const apolloClient = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_INDEXER_URL,
  cache: new InMemoryCache(),
  headers: {
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_INDEXER_API_KEY}`,
  },
});

export function ApolloClientProvider({ children }: PropsWithChildren) {
  if (process.env.NODE_ENV === 'development') {
    loadDevMessages();
    loadErrorMessages();
  }

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
