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

// Helper function to ensure data is serializable
function toSerializableData(data: any) {
  return JSON.parse(JSON.stringify(data));
}

export default async function PoolDetailPage({ params }: Props) {
  const id = (await params).id;
  const { comments } = await getPoolData(id);

  // Convert the data to a serializable format
  const serializableComments = toSerializableData(comments);

  return <PoolDetailClient id={id} initialComments={serializableComments} />;
}
