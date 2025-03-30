import { apolloClient } from '@/lib/apollo/client';
import { GET_POOLS } from '@/server/queries';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Pool, Pool_OrderBy, PoolStatus, OrderDirection } from '@/types';
const openaiClient = new OpenAI();

export const GET = async (request: NextRequest) => {
  try {
    const question = request.nextUrl.searchParams.get('question');
    if (!question) {
      return NextResponse.json({ error: 'Missing "question" parameter' }, { status: 400 });
    }

    const { data } = await apolloClient.query({
      query: GET_POOLS,
      variables: {
        filter: {
          status: PoolStatus.Pending,
        },
        orderBy: Pool_OrderBy.CreatedAt,
        orderDirection: OrderDirection.Desc,
        first: 20,
      },
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

    const relatedPools = await apolloClient.query({
      query: GET_POOLS,
      variables: {
        filter: {
          id_in: relatedPoolIds,
        },
        orderBy: Pool_OrderBy.CreatedAt,
        orderDirection: OrderDirection.Desc,
        first: 5,
      },
    });

    if (!relatedPools?.data?.pools) {
      return NextResponse.json({ error: 'No related pools found' }, { status: 404 });
    }

    return NextResponse.json({ relatedPools });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};
