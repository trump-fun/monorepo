import { GraphQLClient } from 'graphql-request';

export function createGraphQLClient() {
  const indexerUrl = process.env.NEXT_PUBLIC_INDEXER_URL;
  const indexerApiKey = process.env.NEXT_PUBLIC_INDEXER_API_KEY;

  if (!indexerUrl || !indexerApiKey) {
    throw new Error('Missing required environment variables for GraphQL client');
  }

  return new GraphQLClient(indexerUrl, {
    headers: {
      Authorization: `Bearer ${indexerApiKey}`,
    },
  });
}

export const graphqlClient = createGraphQLClient();
