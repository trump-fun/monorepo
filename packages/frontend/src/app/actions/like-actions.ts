'use server';

import { createSupabaseAdminClient } from '@/lib/supabase';
import { verifySignature } from '@/utils/verifySignature';

type ToggleLikeResult = {
  success: boolean;
  upvotes?: number;
  error?: string;
};

export async function toggleLike(
  commentId: number,
  operation: 'like' | 'unlike',
  signature: string,
  messageStr?: string
): Promise<ToggleLikeResult> {
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

    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('upvotes')
      .eq('id', commentId)
      .single();

    if (fetchError) {
      return { success: false, error: `Failed to fetch comment: ${fetchError.message}` };
    }

    const currentUpvotes = comment?.upvotes || 0;
    const newUpvotes = operation === 'like' ? currentUpvotes + 1 : Math.max(0, currentUpvotes - 1);

    const { error: updateError } = await supabase
      .from('comments')
      .update({ upvotes: newUpvotes })
      .eq('id', commentId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, upvotes: newUpvotes };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to toggle like: ${errorMessage}` };
  }
}
