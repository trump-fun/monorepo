'use client';

interface CommentSectionWrapperProps {
  poolId: string;
  initialComments?: Tables<'comments'>[];
  isLoading: boolean;
  error: Error | null;
}

import { addComment } from '@/app/actions/comment-actions';
import { usePrivy, useSignMessage, useWallets } from '@privy-io/react-auth';
import { Tables } from '@trump-fun/common';
import { useEffect, useState } from 'react';
import CommentInput from './comment-input';
import CommentList from './comment-list';

type MessageToSign = {
  action: string;
  poolId: string;
  content: string;
  timestamp: string;
  account: string;
};

export default function CommentSectionWrapper({
  poolId,
  initialComments,
  isLoading,
  error,
}: CommentSectionWrapperProps) {
  const [comments, setComments] = useState<Tables<'comments'>[]>(initialComments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { wallets } = useWallets();
  const { login, authenticated } = usePrivy();
  const { signMessage } = useSignMessage();

  useEffect(() => {
    if (initialComments && initialComments.length > 0) {
      setComments(initialComments);
    }
  }, [initialComments]);

  const handleCommentSubmit = async (content: string) => {
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const wallet = wallets?.[0];

      if (!wallet || !wallet.address) {
        setIsSubmitting(false);
        if (!authenticated) {
          login();
        }
        return;
      }

      const messageObj: MessageToSign = {
        action: 'add_comment',
        poolId,
        content,
        timestamp: new Date().toISOString(),
        account: wallet.address.toLowerCase(),
      };

      const messageStr = JSON.stringify(messageObj);

      const { signature } = await signMessage(
        { message: messageStr },
        {
          uiOptions: {
            title: 'Sign your comment',
            description: 'Sign this message to verify you are the author of this comment',
            buttonText: 'Sign Comment',
          },
          address: wallet.address,
        }
      );

      const tempComment: Tables<'comments'> = {
        body: content,
        pool_id: poolId,
        signature,
        user_address: wallet.address,
        created_at: new Date().toISOString(),
        id: Date.now(),
        updated_at: null,
        commentID: null,
        upvotes: null,
        trump_responded: false,
      };

      if (!tempComment || !comments) {
        setIsSubmitting(false);
        return;
      }

      setComments([tempComment, ...comments]);
      await addComment(poolId, content, signature, messageStr);
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='mt-6 space-y-4'>
      <h2 className='text-xl font-semibold'>Comments</h2>

      {authenticated ? (
        <CommentInput onCommentSubmit={handleCommentSubmit} isWalletConnected={authenticated} />
      ) : (
        <button
          onClick={() => login()}
          className='w-full rounded-md bg-orange-500 py-2 text-center font-medium text-white transition-colors hover:bg-orange-600'
        >
          Connect Wallet to Comment
        </button>
      )}

      {error && (
        <div className='rounded-md bg-red-500/10 p-4 text-red-500'>
          Error loading comments: {error.message}
        </div>
      )}

      {isLoading ? (
        <div className='flex items-center justify-center py-8'>
          <div className='h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent'></div>
        </div>
      ) : comments && comments.length > 0 ? (
        <CommentList comments={comments} />
      ) : (
        <div className='py-6 text-center text-gray-500'>
          No comments yet. Be the first to share your thoughts!
        </div>
      )}
    </div>
  );
}
