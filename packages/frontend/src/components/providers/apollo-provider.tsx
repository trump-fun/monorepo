'use client';

import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { PropsWithChildren } from 'react';

export function ApolloClientProvider({ children }: PropsWithChildren) {
  const client = new ApolloClient({
    uri: process.env.NEXT_PUBLIC_INDEXER_URL,
    cache: new InMemoryCache(),
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_INDEXER_API_KEY}`,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    loadDevMessages();
    loadErrorMessages();
  }

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
