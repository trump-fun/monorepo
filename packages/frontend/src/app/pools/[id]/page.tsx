import { PoolDetailClient } from '@/components/pools/PoolDetailClient';
import { supabaseAnonClient } from '@/lib/supabase';
import { fetchPool } from '@/utils/fetchPool';
import { Metadata } from 'next';

type Props = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<Record<string, string | string[]>>; // Query params
};

export const revalidate = 60;

async function getPoolData(poolId: string, page = 1, pageSize = 10) {
  try {
    // First fetch parent comments with pagination and get total count
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

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

    const parentComments = commentsResponse.data || [];
    const parentIds = parentComments.map((comment) => comment.id);

    // Then fetch all replies for these comments in a single query
    const repliesResponse = await supabaseAnonClient
      .from('comments')
      .select('id, pool_id, user_address, body, created_at, upvotes, commentID')
      .in('commentID', parentIds)
      .order('created_at', { ascending: true });

    // Organize replies by parent comment using a type-safe approach
    const repliesByParent = (repliesResponse.data || []).reduce<
      Record<string, typeof repliesResponse.data>
    >((acc, reply) => {
      const commentID = reply.commentID;
      if (commentID) {
        if (!acc[commentID]) {
          acc[commentID] = [];
        }
        acc[commentID].push(reply);
      }
      return acc;
    }, {});

    // Attach replies to parent comments with proper typing, converting IDs to strings
    const commentsWithReplies = parentComments.map((comment) => ({
      ...comment,
      id: String(comment.id),
      upvotes: comment.upvotes ?? 0,
      replies: (repliesByParent[comment.id] || []).map((reply) => ({
        ...reply,
        id: String(reply.id),
        upvotes: reply.upvotes ?? 0,
        commentID: reply.commentID ? String(reply.commentID) : null,
      })),
    }));

    const total = countResponse.count || 0;
    const hasMore = total > page * pageSize;

    return {
      comments: commentsWithReplies,
      pagination: {
        page,
        pageSize,
        total,
        hasMore,
      },
    };
  } catch (error) {
    console.error('Error fetching comments data:', error);
    return {
      comments: [],
      pagination: {
        page: 1,
        pageSize,
        total: 0,
        hasMore: false,
      },
    };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).id;

  const pool = await fetchPool(id);
  const poolNumber = id;
  const poolQuestion = pool?.question || 'Prediction pool';
  const siteName = 'Trump.fun';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://trump-fun.vercel.app/';
  const poolUrl = `${baseUrl}/pools/${id}`;
  const imageUrl = pool?.mediaUrl || '/default-pool-image.jpg';

  return {
    title: poolQuestion
      ? `${poolQuestion} | Pool #${poolNumber} | ${siteName}`
      : `Prediction Pool #${poolNumber} | ${siteName}`,
    description: pool?.question
      ? `Join the prediction pool: ${pool.question}. Place your bets with FREEDOM tokens and win big if you predict correctly!`
      : 'Join our prediction markets, bet with FREEDOM tokens, and win rewards for accurate predictions!',
    keywords: [
      'prediction market',
      'FREEDOM tokens',
      'betting',
      'predictions',
      'crypto predictions',
    ],
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: poolUrl,
    },
    openGraph: {
      title: poolQuestion
        ? `${poolQuestion} | Prediction Pool #${poolNumber}`
        : `Prediction Pool #${poolNumber}`,
      description: pool?.question
        ? `Join the prediction pool: ${pool.question}. Place your bets now!`
        : 'Join our prediction markets and win rewards for accurate predictions!',
      url: poolUrl,
      siteName: siteName,
      images: [
        {
          url: imageUrl,
          width: 1024,
          height: 1024,
          alt: pool?.question || `Prediction Pool #${poolNumber}`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: poolQuestion
        ? `${poolQuestion} | Pool #${poolNumber}`
        : `Prediction Pool #${poolNumber}`,
      description: pool?.question
        ? `Join the prediction pool: ${pool.question}. Place your bets now!`
        : 'Join our prediction markets and win rewards for accurate predictions!',
      images: [imageUrl],
    },
  };
}

export default async function PoolDetailPage({ params }: Props) {
  const id = (await params).id;
  const { comments, pagination } = await getPoolData(id);

  return <PoolDetailClient id={id} initialComments={{ comments, pagination }} />;
}
