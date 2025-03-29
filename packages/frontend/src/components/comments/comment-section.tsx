'use client';

import { useEffect, useState } from 'react';

import CommentList from './comment-list';

import CommentInput from './comment-input';

import { addComment } from '@/app/actions/comment-actions';

import { usePrivy, useSignMessage, useWallets } from '@privy-io/react-auth';

import { Tables } from '@trump-fun/common';

interface CommentSectionProps {
  poolId: string;

  initialComments: Tables<'comments'>[];
  isLoading: boolean;
  error: Error | null;
}

type MessageToSign = {
  action: string;

  poolId: string;

  content: string;

  timestamp: string;

  account: string;
};

export default function CommentSection({
  poolId,

  initialComments,
  isLoading,
  error,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Tables<'comments'>[]>(initialComments || []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { wallets } = useWallets();

  const { login, authenticated } = usePrivy();

  const { signMessage } = useSignMessage();

  // Update comments when initialComments changes
  useEffect(() => {
    if (initialComments && initialComments.length > 0) {
      setComments(initialComments);
    }
  }, [initialComments]);

  // const isWalletConnected = authenticated && wallets && wallets.length > 0 && wallets[0]?.address;

  const handleLoginClick = () => login();

  const handleCommentSubmit = async (content: string) => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const wallet = wallets?.[0];

      if (!wallet || !wallet.address) {
        setIsSubmitting(false);

        if (!authenticated) {
          handleLoginClick();
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

      try {
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

        // Add comment to database but don't refresh the page
        await addComment(poolId, content, signature, messageStr);
      } catch {
        // Silent error handling to avoid UI disruption
      }
    } catch {
      // Silent error handling to avoid UI disruption
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold'>Comments</h2>

      {authenticated ? (
        <CommentInput onCommentSubmit={handleCommentSubmit} isWalletConnected={authenticated} />
      ) : (
        <button
          onClick={handleLoginClick}
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
