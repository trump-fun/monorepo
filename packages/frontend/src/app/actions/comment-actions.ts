'use server';

import { createSupabaseAdminClient } from '@/lib/supabase';
import { verifySignature } from '@/utils/verifySignature';
import { Database } from '@trump-fun/common';

export async function addComment(
  poolId: string,
  content: string,
  signature: string,
  messageStr?: string,
  commentID?: number
) {
  try {
    const supabase = await createSupabaseAdminClient();

    if (!signature || !messageStr) {
      return { success: false, error: 'Signature required' };
    }

    const walletAddress = verifySignature(messageStr, signature);
    const message = JSON.parse(messageStr);

    if (!walletAddress) {
      return { success: false, error: 'Invalid signature' };
    }

    if (walletAddress.toLowerCase() !== message.account) {
      return { success: false, error: 'Address mismatch' };
    }

    const comment: Database['public']['Tables']['comments']['Insert'] = {
      body: content,
      pool_id: poolId,
      signature,
      user_address: walletAddress.toLowerCase(),
      created_at: new Date().toISOString(),
      commentID,
    };

    const { data, error } = await supabase.from('comments').insert(comment);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to add comment: ${errorMessage}` };
  }
}
