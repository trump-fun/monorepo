'use client';

import { addComment } from '@/app/actions/comment-actions';
import { CommentWithReplies, MessageToSign } from '@/types/comments';
import { usePrivy, useSignMessage, useWallets } from '@privy-io/react-auth';
import { useCallback, useEffect, useState } from 'react';
import CommentList from './comment-list';
import CommentInput from './comment-input';

interface CommentSectionWrapperProps {
  poolId: string;
  initialComments?: CommentWithReplies[];
  initialPagination?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  isLoading: boolean;
  error: Error | null;
  onCommentsUpdated?: () => void;
}

export default function CommentSectionWrapper({
  poolId,
  initialComments,
  initialPagination = { page: 1, pageSize: 10, total: 0, hasMore: false },
  isLoading,
  error,
  onCommentsUpdated,
}: CommentSectionWrapperProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>(initialComments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState(initialPagination);

  const { wallets } = useWallets();
  const { login, authenticated } = usePrivy();
  const { signMessage } = useSignMessage();

  const loadMoreComments = useCallback(async () => {
    if (isLoadingMore || !pagination.hasMore) return;
    setIsLoadingMore(true);

    try {
      const nextPage = pagination.page + 1;
      const res = await fetch(
        `/api/comments?poolId=${poolId}&page=${nextPage}&pageSize=${pagination.pageSize}`
      );
      if (!res.ok) throw new Error('Failed to load more comments');

      const data = await res.json();
      setComments((prev) => [...prev, ...data.comments]);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error loading more comments:', err);
      import('@/utils/toast').then(({ showErrorToast }) => {
        showErrorToast('Failed to load more comments');
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [poolId, pagination, isLoadingMore]);

  // Update pagination when initialPagination changes
  useEffect(() => {
    setPagination(initialPagination);
  }, [initialPagination]);

  // Debounce comment updates to prevent rapid re-renders
  const updateComments = useCallback((newComments: CommentWithReplies[]) => {
    setComments((prev) => {
      // Only update if comments have changed
      const prevIds = new Set(prev.map((c) => c.id));
      const newIds = new Set(newComments.map((c) => c.id));

      if (prevIds.size !== newIds.size || !Array.from(prevIds).every((id) => newIds.has(id))) {
        return newComments;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    if (initialComments) {
      // Only update if the comments have actually changed
      const currentIds = new Set(comments.map((c) => c.id));
      const newIds = new Set(initialComments.map((c) => c.id));

      if (
        currentIds.size !== newIds.size ||
        !Array.from(currentIds).every((id) => newIds.has(id))
      ) {
        setComments((prev) => {
          // Keep optimistic comments at the top
          const optimisticComments = prev.filter((c) => String(c.id).includes('temp-'));
          return [...optimisticComments, ...initialComments];
        });
      }
    }
  }, [initialComments, comments]);

  const handleCommentSubmit = useCallback(
    async (content: string) => {
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

        // Create optimistic comment
        const optimisticComment: CommentWithReplies = {
          id: `temp-${Date.now()}`,
          pool_id: String(poolId),
          user_address: wallet.address.toLowerCase(),
          body: content,
          created_at: new Date().toISOString(),
          upvotes: 0,
          replies: [],
        };

        // Add optimistic comment to the UI
        updateComments([optimisticComment, ...comments]);

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

        await addComment(poolId, content, signature, messageStr);

        if (onCommentsUpdated) {
          await onCommentsUpdated();
        }

        import('@/utils/toast').then(({ showSuccessToast }) => {
          showSuccessToast('Comment posted successfully');
        });
      } catch (err) {
        console.error('Error adding comment:', err);
        // Remove optimistic comment on error
        updateComments(comments.filter((comment) => !String(comment.id).includes('temp-')));

        import('@/utils/toast').then(({ showErrorToast }) => {
          showErrorToast('Failed to post comment');
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      poolId,
      isSubmitting,
      wallets,
      authenticated,
      login,
      signMessage,
      comments,
      updateComments,
      onCommentsUpdated,
    ]
  );

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
        <CommentList
          comments={comments}
          pagination={pagination}
          onLoadMore={loadMoreComments}
          isLoadingMore={isLoadingMore}
        />
      ) : (
        <div className='py-6 text-center text-gray-500'>
          No comments yet. Be the first to share your thoughts!
        </div>
      )}

      {/* Load more comments button */}
      {pagination.hasMore && !isLoadingMore && (
        <button
          onClick={loadMoreComments}
          className='mt-4 w-full rounded-md bg-orange-500 py-2 text-center font-medium text-white transition-colors hover:bg-orange-600'
        >
          Load more comments
        </button>
      )}

      {/* Loading spinner for loading more comments */}
      {isLoadingMore && (
        <div className='flex items-center justify-center py-4'>
          <div className='h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent'></div>
        </div>
      )}
    </div>
  );
}
