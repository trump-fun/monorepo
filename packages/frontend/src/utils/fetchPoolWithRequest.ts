/*
 * Alternative to fetchPool.ts since apolloClient is tempermental when called w/ a backend route
 */
import { graphqlClient } from '@/lib/graphql-client';
import { Pool } from '@trump-fun/common';

type FetchPoolOptions = {
  headers?: HeadersInit;
};

// Define the query string directly instead of using the Apollo document
const POOL_QUERY = `
  query GetPoolServer($poolId: ID!) {
    pool(id: $poolId) {
      id
      poolId
      question
      options
      status
      chainId
      chainName
      createdAt
      imageUrl
      createdBlockNumber
      createdBlockTimestamp
      createdTransactionHash
      lastUpdatedBlockNumber
      lastUpdatedBlockTimestamp
      lastUpdatedTransactionHash
      gradedBlockNumber
      gradedBlockTimestamp
      gradedTransactionHash
      betsCloseAt
      bets {
        id
        betId
        user
        option
        amount
        tokenType
      }
      usdcBetTotals
      pointsBetTotals
      usdcVolume
      pointsVolume
      originalTruthSocialPostId
    }
  }
`;

export async function fetchPoolWithRequest(
  poolId: string,
  options?: FetchPoolOptions
): Promise<Pool | null> {
  try {
    const data = await graphqlClient.request(POOL_QUERY, { poolId }, options?.headers);

    return (data as any).pool as Pool;
  } catch (error) {
    console.error('Error in fetchPoolWithRequest:', error);
    throw error;
  }
}
