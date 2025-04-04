'use server';

import { createSupabaseAdminClient } from '@/lib/supabase';
import { verifySignature } from '@/utils/verifySignature';

type ToggleResponse = {
  success: boolean;
  facts?: number;
  liked?: boolean;
  error?: string;
};

export async function togglePoolFacts(
  poolId: string,
  operation: 'like' | 'unlike',
  signature: string,
  messageStr?: string
): Promise<ToggleResponse> {
  try {
    const supabase = await createSupabaseAdminClient();
    let walletAddress = null;

    if (signature && messageStr) {
      walletAddress = verifySignature(messageStr, signature);

      if (walletAddress) {
        const message = JSON.parse(messageStr);
        if (walletAddress.toLowerCase() !== message.account) {
          walletAddress = null;
        }
      }
    }

    if (!walletAddress) {
      return { success: false, error: 'Invalid signature' };
    }

    const userId = walletAddress.toLowerCase();

    const { data: existingFact } = await supabase
      .from('facts')
      .select('id')
      .eq('pool_id', poolId)
      .eq('user_id', userId)
      .is('comment_id', null)
      .single();

    if (operation === 'like' && !existingFact) {
      const { error: insertError } = await supabase.from('facts').insert({
        pool_id: poolId,
        user_id: userId,
        comment_id: null,
      });

      if (insertError) {
        console.error('Error inserting FACT:', insertError);
        return { success: false, error: `Failed to add FACT: ${insertError.message}` };
      }
    } else if (operation === 'unlike' && existingFact) {
      const { error: deleteError } = await supabase
        .from('facts')
        .delete()
        .eq('pool_id', poolId)
        .eq('user_id', userId)
        .is('comment_id', null);

      if (deleteError) {
        console.error('Error deleting FACT:', deleteError);
        return { success: false, error: `Failed to remove FACT: ${deleteError.message}` };
      }
    }

    const { count, error: countError } = await supabase
      .from('facts')
      .select('*', { count: 'exact', head: true })
      .eq('pool_id', poolId)
      .is('comment_id', null);

    if (countError) {
      console.error('Error getting FACTS count:', countError);
    }

    return {
      success: true,
      facts: count || 0,
      liked: operation === 'like',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in togglePoolFacts:', errorMessage);
    return { success: false, error: `Failed to toggle pool FACTS: ${errorMessage}` };
  }
}
