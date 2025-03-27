import { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';

const GET = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const poolId = searchParams.get('poolId') || null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('pool_id', poolId)
      .is('commentID', null)
      .order('created_at', { ascending: false });

    return Response.json(
      {
        comments: data,
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
