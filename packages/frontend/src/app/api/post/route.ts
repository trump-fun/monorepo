import { NextRequest } from 'next/server';

import { supabaseAnonClient } from '@/lib/supabase';

const GET = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const poolId = searchParams.get('poolId');

  if (!poolId) {
    return Response.json(
      { error: 'Pool ID is required' },
      { status: 400, statusText: 'Bad Request' }
    );
  }

  try {
    const { data } = await supabaseAnonClient
      .from('truth_social_posts')
      .select('*')
      .eq('pool_id', poolId)
      .single();

    return Response.json(
      {
        post: data,
      },
      {
        status: 200,
        statusText: 'OK',
      }
    );
  } catch (err) {
    console.error(err);
    return Response.json(
      {
        error: (err as Error).message,
      },
      {
        status: 400,
        statusText: 'Bad Request',
      }
    );
  }
};

export { GET };
