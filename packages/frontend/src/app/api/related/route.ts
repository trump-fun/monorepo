import { graphqlClient } from '@/lib/graphql-client';
import { OrderDirection, Pool_OrderBy, PoolStatus } from '@/types';
import { NextRequest, NextResponse } from 'next/server';
import { GET_POOLS_STRING } from '@trump-fun/common/src/graphql/queries';
import OpenAI from 'openai';
const openaiClient = new OpenAI();

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
  // Additional optional properties that might be present in the Pool object
  bets?: unknown[];
  usdcVolume?: string;
  pointsVolume?: string;
  betsCloseAt?: number;
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

    // Get pools using graphql-request with centralized query
    const data = await graphqlClient.request<PoolsResponse>(GET_POOLS_STRING, {
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

    // Get related pools using graphql-request with centralized query
    const relatedPools = await graphqlClient.request<PoolsResponse>(GET_POOLS_STRING, {
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
