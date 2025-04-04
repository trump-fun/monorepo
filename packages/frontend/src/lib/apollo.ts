import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

export function createApolloClient() {
  const indexerUrl = process.env.NEXT_PUBLIC_INDEXER_URL;
  const indexerApiKey = process.env.NEXT_PUBLIC_INDEXER_API_KEY;

  if (!indexerUrl || !indexerApiKey) {
    throw new Error('Missing required environment variables for Apollo client');
  }

  return new ApolloClient({
    link: new HttpLink({
      uri: indexerUrl,
      fetch,
      headers: {
        Authorization: `Bearer ${indexerApiKey}`,
      },
    }),
    cache: new InMemoryCache(),
  });
}

export const apolloClient = createApolloClient();
