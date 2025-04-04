import { supabaseAnonClient } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const poolId = searchParams.get('poolId');
  const userAddress = searchParams.get('address')?.toLowerCase();

  if (!poolId) {
    return Response.json({ error: 'Pool ID is required' }, { status: 400 });
  }

  try {
    const { count, error: countError } = await supabaseAnonClient
      .from('facts')
      .select('*', { count: 'exact', head: true })
      .eq('pool_id', poolId)
      .is('comment_id', null);

    if (countError) throw countError;

    let userLiked = false;
    if (userAddress) {
      const { data, error } = await supabaseAnonClient
        .from('facts')
        .select('id')
        .eq('pool_id', poolId)
        .eq('user_id', userAddress)
        .is('comment_id', null)
        .maybeSingle();

      if (!error) userLiked = !!data;
    }

    return Response.json({ count: count || 0, userLiked }, { status: 200 });
  } catch (error) {
    console.error('Error fetching pool FACTS:', error);
    return Response.json({ error: 'Failed to fetch pool FACTS' }, { status: 500 });
  }
}
