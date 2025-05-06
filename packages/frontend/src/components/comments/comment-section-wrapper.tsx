'use client';

interface CommentSectionWrapperProps {
  poolId: string;
  initialComments?: Tables<'comments'>[];
  isLoading: boolean;
  error: Error | null;
  onCommentsUpdated?: () => void;
}

import { addComment } from '@/app/actions/comment-actions';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useDynamicSolana } from '@/hooks/useDynamicSolana';
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
  onCommentsUpdated,
}: CommentSectionWrapperProps) {
  const [comments, setComments] = useState<Tables<'comments'>[]>(initialComments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { primaryWallet, setShowAuthFlow } = useDynamicContext();
  const { signMessage, isAuthenticated } = useDynamicSolana();

  useEffect(() => {
    if (initialComments && initialComments.length > 0) {
      setComments(initialComments);
    }
  }, [initialComments]);

  const handleCommentSubmit = async (content: string) => {
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!primaryWallet?.address) {
        setIsSubmitting(false);
        if (!isAuthenticated) {
          setShowAuthFlow(true);
        }
        return;
      }

      const messageObj: MessageToSign = {
        action: 'add_comment',
        poolId,
        content,
        timestamp: new Date().toISOString(),
        account: primaryWallet.address.toLowerCase(),
      };

      const messageStr = JSON.stringify(messageObj);

      const signature = await signMessage(messageStr);

      // Submit the comment to the server without creating tempComment first
      await addComment(poolId, content, signature, messageStr);

      // Instead of optimistic update, fetch the latest comments
      // This should be a callback passed from the parent component
      if (onCommentsUpdated) {
        onCommentsUpdated();
      }

      // Show success notification
      import('@/utils/toast').then(({ showSuccessToast }) => {
        showSuccessToast('Comment posted successfully');
      });
    } catch (err) {
      console.error('Error adding comment:', err);
      // Show error notification
      import('@/utils/toast').then(({ showErrorToast }) => {
        showErrorToast('Failed to post comment');
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='mt-6 space-y-4'>
      <h2 className='text-xl font-semibold'>Comments</h2>

      {isAuthenticated ? (
        <CommentInput onCommentSubmit={handleCommentSubmit} isWalletConnected={isAuthenticated} />
      ) : (
        <button
          onClick={() => setShowAuthFlow(true)}
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
