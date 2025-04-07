import { PoolDetailClient } from '@/components/pools/PoolDetailClient';
import { supabaseAnonClient } from '@/lib/supabase';
import { fetchPool } from '@/utils/fetchPool';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<any>; //TODO Clean me up
};

export const revalidate = 60;

async function getPoolData(poolId: string) {
  try {
    const [pool, postResponse, commentsResponse] = await Promise.all([
      fetchPool(poolId),
      supabaseAnonClient.from('truth_social_posts').select('*').eq('pool_id', poolId).single(),
      supabaseAnonClient
        .from('comments')
        .select('*')
        .eq('pool_id', poolId)
        .is('commentID', null)
        .order('created_at', { ascending: false }),
    ]);

    return {
      pool,
      postData: postResponse.data || null,
      comments: commentsResponse.data || [],
    };
  } catch (error) {
    console.error('Error fetching pool data:', error);
    return { pool: null, postData: null, comments: [] };
  }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = (await params).id;
  const { pool } = await getPoolData(id);

  if (!pool) {
    return { title: 'Pool Not Found' };
  }

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: pool.question || `Prediction Pool #${id}`,
    description: pool.question || 'Predict the outcome of this event',
    openGraph: {
      images: [pool.imageUrl || '/default-pool-image.jpg', ...previousImages],
    },
  };
}
export default async function PoolDetailPage({ params }: Props) {
  const id = (await params).id;
  const { pool, postData, comments } = await getPoolData(id);

  if (!pool) {
    notFound();
  }

  return (
    <PoolDetailClient id={id} postData={postData} initialComments={comments} initialPool={pool} />
  );
}
