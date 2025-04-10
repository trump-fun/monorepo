import { gql, request } from 'graphql-request';
import type { GraderState, PendingPool } from '../betting-grader-graph';
import type { Pool } from '@trump-fun/common';
/**
 * Fetches pools with "PENDING" status from the GraphQL endpoint
 */
const fetchPendingPoolsQuery = gql`
  query fetchPendingPools {
    pools(where: { status: PENDING }) {
      id
      status
      question
      options
      betsCloseAt
      usdcBetTotals
      pointsBetTotals
      originalTruthSocialPostId
    }
  }
`;
export async function fetchPendingPools(state: GraderState): Promise<Partial<GraderState>> {
  console.log('Fetching pending pools...');

  const chainConfig = state.chainConfig;

  try {
    interface FetchPendingPoolsResponse {
      pools: Pool[];
    }

    const response = await request<FetchPendingPoolsResponse>({
      url: chainConfig.subgraphUrl,
      document: fetchPendingPoolsQuery,
      requestHeaders: {
        Authorization: `Bearer ${chainConfig.subgraphApiKey}`,
      },
    });

    const pools = response.pools;
    console.log(`Found ${pools.length} pending pools`);

    return {
      pendingPools: pools.slice(0, 1).reduce<Record<string, PendingPool>>(
        (acc: Record<string, PendingPool>, pool: Pool) => {
          acc[pool.id] = {
            pool,
            evidenceSearchQueries: [] as string[],
            evidence: [] as any[],
            gradingResult: {
              result: '',
              result_code: 0,
              probabilities: {} as Record<string, number>,
              sources: [] as string[],
              explanation: '',
            },
            contractUpdated: false,
            txHash: '',
            failed: false,
          };
          return acc;
        },
        {} as Record<string, PendingPool>
      ),
    };
  } catch (error) {
    console.error(`Request failed: ${error}`);
    return { pendingPools: {} };
  }
}
