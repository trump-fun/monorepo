import { PoolDetailClient } from '@/components/pools/PoolDetailClient';
import { supabaseAnonClient } from '@/lib/supabase';
import { Metadata } from 'next';

type Props = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<Record<string, string | string[]>>; // Query params
};

export const revalidate = 60;

async function getPoolData(poolId: string) {
  try {
    const commentsResponse = await supabaseAnonClient
      .from('comments')
      .select('*')
      .eq('pool_id', poolId)
      .is('commentID', null)
      .order('created_at', { ascending: false });

    return {
      comments: commentsResponse.data || [],
    };
  } catch (error) {
    console.error('Error fetching comments data:', error);
    return { comments: [] };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).id;

  //TODO Below line triggers gql invariant, should fix later
  // const pool = await fetchPool(id);
  const pool = {
    question: undefined,
    imageUrl: undefined,
  };
  // Using default metadata since we can't fetch pool data server-side with Apollo anymore
  return {
    title: `Prediction Pool #${id}`,
    description: pool?.question || 'Predict the outcome of this event',
    openGraph: {
      images: [pool?.imageUrl || '/default-pool-image.jpg'],
    },
  };
}

export default async function PoolDetailPage({ params }: Props) {
  const id = (await params).id;
  const { comments } = await getPoolData(id);

  return <PoolDetailClient id={id} initialComments={comments} />;
}
