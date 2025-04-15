import { ApolloClient, InMemoryCache, HttpLink, from, type DocumentNode } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import fetch from 'cross-fetch';

// Custom error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// HTTP link for API connection
const httpLink = new HttpLink({
  uri: process.env.INDEXER_URL,
  fetch,
  headers: {
    Authorization: `Bearer ${process.env.INDEXER_API_KEY}`,
  },
});

// Configure the Apollo Client with cache policies
export const apolloClient = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Pool: {
        keyFields: ['poolId'],
        fields: {
          bets: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  },
});

export type { DocumentNode }; // Re-export DocumentNode for proper typing of GraphQL queries
