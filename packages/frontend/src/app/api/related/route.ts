import { graphqlClient } from '@/lib/graphql-client';
import { OrderDirection, Pool_OrderBy, PoolStatus } from '@/types';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
const openaiClient = new OpenAI();

// Define the query string directly instead of using Apollo
const GET_POOLS_QUERY = `
  query GetPoolsServerRelated(
    $filter: Pool_filter!
    $orderBy: Pool_orderBy!
    $orderDirection: OrderDirection!
    $first: Int
  ) {
    pools(
      where: $filter
      orderBy: $orderBy
      orderDirection: $orderDirection
      first: $first
    ) {
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
        usdcBetTotals
        pointsBetTotals
        usdcVolume
        pointsVolume
        originalTruthSocialPostId
    }
  }
`;

// Define interfaces for the GraphQL response types
interface Pool {
  id: string;
  poolId: string;
  question: string;
  options: string[];
  status: string;
  chainId: string;
  chainName: string;
  createdAt: string;
  imageUrl?: string;
  [key: string]: any; // For other properties we don't explicitly need to reference
}

interface PoolsResponse {
  pools: Pool[];
}

export const GET = async (request: NextRequest) => {
  try {
    const question = request.nextUrl.searchParams.get('question');
    if (!question) {
      return NextResponse.json({ error: 'Missing "question" parameter' }, { status: 400 });
    }

    // Get pools using graphql-request
    const data = await graphqlClient.request<PoolsResponse>(GET_POOLS_QUERY, {
      filter: {
        status: PoolStatus.Pending,
      },
      orderBy: Pool_OrderBy.CreatedAt,
      orderDirection: OrderDirection.Desc,
      first: 20,
    });

    if (!data?.pools) {
      return NextResponse.json({ error: 'No pools found' }, { status: 404 });
    }

    const poolSummaries = data.pools
      .map((pool: Pool) => `ID: ${pool.id}, Question: ${pool.question}`)
      .join('\n');
    const prompt = `The user is currently viewing a pool with the question: "${question}".\n\nHere are 10 pools with their IDs and questions:\n${poolSummaries}\n\nBased on similar characteristics (e.g., question), provide an array of 5 pool IDs that are most closely related to this pool.\n\nReturn the results in a JSON array format like this:\n["pool_id_1", "pool_id_2", "pool_id_3", "pool_id_4", "pool_id_5"]`;

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return NextResponse.json({ error: 'Failed to generate completion' }, { status: 500 });
    }

    const relatedPoolIds = JSON.parse(responseContent);

    // Get related pools using graphql-request
    const relatedPools = await graphqlClient.request<PoolsResponse>(GET_POOLS_QUERY, {
      filter: {
        id_in: relatedPoolIds,
      },
      orderBy: Pool_OrderBy.CreatedAt,
      orderDirection: OrderDirection.Desc,
      first: 5,
    });

    if (!relatedPools?.pools) {
      return NextResponse.json({ error: 'No related pools found' }, { status: 404 });
    }

    return NextResponse.json({ relatedPools });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};
