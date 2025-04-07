'use client';

import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { PropsWithChildren } from 'react';

// TODO Old code from deprecated apollo.ts file. Confirm we haven't lost functionality
// import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// export function createApolloClient() {
//   const indexerUrl = process.env.NEXT_PUBLIC_INDEXER_URL;
//   const indexerApiKey = process.env.NEXT_PUBLIC_INDEXER_API_KEY;

//   if (!indexerUrl || !indexerApiKey) {
//     throw new Error('Missing required environment variables for Apollo client');
//   }

//   return new ApolloClient({
//     link: new HttpLink({
//       uri: indexerUrl,
//       fetch,
//       headers: {
//         Authorization: `Bearer ${indexerApiKey}`,
//       },
//     }),
//     cache: new InMemoryCache(),
//   });
// }

// export const apolloClient = createApolloClient();

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
