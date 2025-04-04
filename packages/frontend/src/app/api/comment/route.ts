import { NextRequest } from 'next/server';

import { supabaseAnonClient } from '@/lib/supabase';

const GET = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const comment_id = searchParams.get('comment_id');

  try {
    if (!comment_id) {
      return Response.json(
        { error: 'Comment ID is required' },
        { status: 400, statusText: 'Bad Request' }
      );
    }

    const { data } = await supabaseAnonClient
      .from('comments')
      .select('*')
      .eq('commentID', parseInt(comment_id as string, 10))
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
