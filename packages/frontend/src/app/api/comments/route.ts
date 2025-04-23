import { supabaseAnonClient } from '@/lib/supabase';
import { CommentWithReplies } from '@/types/comments';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get('poolId');
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 10;
    const includeReplies = searchParams.get('includeReplies') === 'true';

    if (!poolId) {
      return NextResponse.json({ error: 'Pool ID is required' }, { status: 400 });
    }

    // Calculate pagination ranges
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // First fetch parent comments with pagination and get total count
    const [commentsResponse, countResponse] = await Promise.all([
      supabaseAnonClient
        .from('comments')
        .select('id, pool_id, user_address, body, created_at, upvotes')
        .eq('pool_id', poolId)
        .is('commentID', null)
        .order('created_at', { ascending: false })
        .range(from, to),

      supabaseAnonClient
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('pool_id', poolId)
        .is('commentID', null),
    ]);

    if (commentsResponse.error) {
      throw new Error(commentsResponse.error.message);
    }

    const parentComments = commentsResponse.data || [];
    const total = countResponse.count || 0;

    let commentsWithReplies: CommentWithReplies[] = parentComments.map((comment) => ({
      ...comment,
      id: String(comment.id),
      upvotes: comment.upvotes || 0,
    }));

    if (includeReplies && parentComments.length > 0) {
      const parentIds = parentComments.map((comment) => comment.id);

      // Fetch all replies for these comments in a single query
      const repliesResponse = await supabaseAnonClient
        .from('comments')
        .select('id, pool_id, user_address, body, created_at, upvotes, commentID')
        .in('commentID', parentIds)
        .order('created_at', { ascending: true });

      if (repliesResponse.error) {
        throw new Error(repliesResponse.error.message);
      }

      // Organize replies by parent comment
      const repliesByParent = (repliesResponse.data || []).reduce<Record<string, any[]>>(
        (acc, reply) => {
          const commentID = reply.commentID;
          if (commentID) {
            if (!acc[commentID]) {
              acc[commentID] = [];
            }
            acc[commentID].push(reply);
          }
          return acc;
        },
        {}
      );

      // Attach replies to parent comments
      commentsWithReplies = parentComments.map((comment) => ({
        ...comment,
        id: String(comment.id),
        upvotes: comment.upvotes || 0, // Ensure upvotes is always a number
        replies: repliesByParent[comment.id] || [],
      }));
    }

    const response = NextResponse.json({
      comments: commentsWithReplies,
      pagination: {
        page,
        pageSize,
        total,
        hasMore: total > page * pageSize,
      },
    });

    // Cache for 30 seconds on CDN, allow stale-while-revalidate for up to 1 hour
    response.headers.set('Cache-Control', 's-maxage=30, stale-while-revalidate=3600');

    return response;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}
