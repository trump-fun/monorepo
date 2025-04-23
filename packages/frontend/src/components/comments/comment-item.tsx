'use client';

import { addComment } from '@/app/actions/comment-actions';
import { toggleLike } from '@/app/actions/like-actions';
import { Button } from '@/components/ui/button';
import { CommentWithReplies, MessageToSign } from '@/types/comments';
import { isCommentLiked, saveCommentLike } from '@/utils/comment-storage';
import { formatDate } from '@/utils/formatDate';
import { usePrivy, useSignMessage, useWallets } from '@privy-io/react-auth';
import Image from 'next/image';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { RandomAvatar } from 'react-random-avatars';

interface CommentItemProps {
  comment: CommentWithReplies;
  initialReplies?: CommentWithReplies[];
  onReplyAdded?: () => Promise<void>;
}

const CommentItemBase = ({ comment, onReplyAdded }: CommentItemProps) => {
  const [upvotes, setUpvotes] = useState<number>(comment.upvotes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);

  const { login, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { signMessage } = useSignMessage();

  const replies = useMemo(() => comment.replies || [], [comment.replies]);
  const sortedReplies = useMemo(() => {
    return [...replies].sort((a, b) => {
      const timestampA = new Date(a.created_at).getTime();
      const timestampB = new Date(b.created_at).getTime();
      return timestampB - timestampA; // Sort by date, newest first
    });
  }, [replies]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const wallet = wallets?.[0];

      if (!wallet || !wallet.address) {
        if (!authenticated) {
          login();
        }
        return;
      }

      const messageObj: MessageToSign = {
        action: 'add_comment',
        poolId: String(comment.pool_id),
        commentID: String(comment.id),
        content: replyText,
        timestamp: new Date().toISOString(),
        account: wallet.address.toLowerCase(),
      };

      const messageStr = JSON.stringify(messageObj);

      const { signature } = await signMessage(
        { message: messageStr },
        {
          uiOptions: {
            title: 'Sign your reply',
            description: 'Sign this message to verify you are the author of this reply',
            buttonText: 'Sign Reply',
          },
          address: wallet.address,
        }
      );

      await addComment(comment.pool_id, replyText, signature, messageStr, parseInt(comment.id));

      // Clear form and refresh comments
      setReplyText('');
      setShowReplyForm(false);
      if (onReplyAdded) {
        await onReplyAdded();
      }
      setShowReplies(true); // Show replies after adding one

      import('@/utils/toast').then(({ showSuccessToast }) => {
        showSuccessToast('Reply posted successfully');
      });
    } catch (error) {
      console.error('Error posting reply:', error);
      import('@/utils/toast').then(({ showErrorToast }) => {
        showErrorToast('Failed to post reply');
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define hooks at the top level before any conditional returns
  const handleLike = useCallback(async () => {
    if (!authenticated) {
      login();
      return;
    }

    // Return early if already processing
    if (isSubmitting) {
      return;
    }

    if (isSubmitting || !comment?.id) return;

    setIsSubmitting(true);

    try {
      const wallet = wallets?.[0];
      if (!wallet?.address) {
        setIsSubmitting(false);
        return;
      }

      const newIsLiked = !isLiked;
      const optimisticUpvotes = newIsLiked ? upvotes + 1 : Math.max(0, upvotes - 1);

      // Optimistically update UI
      setIsLiked(newIsLiked);
      setUpvotes(optimisticUpvotes);

      const messageObj = {
        action: 'toggle_like',
        commentId: comment.id,
        operation: newIsLiked ? 'like' : 'unlike',
        timestamp: new Date().toISOString(),
        account: wallet.address.toLowerCase(),
      };

      const messageStr = JSON.stringify(messageObj);

      const { signature } = await signMessage(
        { message: messageStr },
        {
          uiOptions: {
            title: newIsLiked ? 'Sign to FACTS' : 'Sign to remove FACTS',
            description: 'Sign this message to verify your action',
            buttonText: 'Sign',
          },
          address: wallet.address,
        }
      );

      const result = await toggleLike(
        Number(comment.id),
        newIsLiked ? 'like' : 'unlike',
        signature,
        messageStr
      );

      if (result.success) {
        // Update with server response
        const newUpvotes = typeof result.upvotes === 'number' ? result.upvotes : optimisticUpvotes;
        setUpvotes(newUpvotes);
        await saveCommentLike(String(comment.id), newIsLiked);
      } else {
        // Revert optimistic update on error
        setIsLiked(!newIsLiked);
        setUpvotes(upvotes);
        throw new Error(result.error || 'Failed to toggle like');
      }
    } catch (error) {
      // Only log errors that aren't user rejections
      if (
        error instanceof Error &&
        !error.message.includes('rejected') &&
        !error.message.includes('cancel') &&
        !error.message.includes('user rejected')
      ) {
        console.error('Error handling comment FACTS:', error);
        import('@/utils/toast').then(({ showErrorToast }) => {
          showErrorToast('Failed to update FACTS');
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isLiked, isSubmitting, login, wallets, signMessage, comment, upvotes, authenticated]);

  // Check if comment is liked when component mounts
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (comment?.id) {
        const liked = await isCommentLiked(String(comment.id));
        setIsLiked(liked);
      }
    };
    checkLikeStatus();
  }, [comment?.id]);

  return (
    <div className='relative space-y-3'>
      <div className='flex items-start gap-4'>
        <div className='relative h-10 w-10 overflow-hidden rounded-full'>
          <RandomAvatar name={wallets?.[0]?.address || 'guest'} />
        </div>
        <div className='flex-1 space-y-2'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>
              {comment.user_address === '0xRealDonaldTrump2025' ? (
                <span className='flex items-center gap-1'>
                  Donald J. Trump
                  <Image
                    src='/verified.svg'
                    alt='Verified'
                    width={16}
                    height={16}
                    className='inline'
                  />
                </span>
              ) : (
                `${comment.user_address.slice(0, 6)}...${comment.user_address.slice(-4)}`
              )}
            </span>
            <span className='text-xs text-gray-500'>{formatDate(comment.created_at)}</span>
          </div>
          <p className='text-sm text-gray-100'>{comment.body}</p>
          <div className='flex items-center gap-4'>
            <Button
              variant='ghost'
              size='sm'
              className='flex items-center gap-1 text-xs'
              onClick={handleLike}
              disabled={isSubmitting}
            >
              <span>{upvotes} FACTS</span>
              {isLiked ? '🔥' : '👀'}
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className='text-xs'
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              Reply
            </Button>
            {replies.length > 0 && (
              <Button
                variant='ghost'
                size='sm'
                className='text-xs'
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? 'Hide' : `Show ${replies.length}`}{' '}
                {replies.length === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {showReplyForm && (
        <form onSubmit={handleReplySubmit} className='mt-2 ml-14'>
          <div className='flex gap-2'>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder='Write a reply...'
              className='flex-1 rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none'
              rows={2}
            />
            <Button type='submit' disabled={isSubmitting || !replyText.trim()} className='self-end'>
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      )}

      {showReplies && replies.length > 0 && (
        <div className='ml-14 space-y-4'>
          {sortedReplies.map((reply) => (
            <div key={reply.id} className='flex items-start gap-4'>
              <div className='relative h-8 w-8 overflow-hidden rounded-full'>
                <RandomAvatar name={wallets?.[0]?.address || 'guest'} />
              </div>
              <div className='flex-1 space-y-1'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium'>
                    {reply.user_address === '0xRealDonaldTrump2025' ? (
                      <span className='flex items-center gap-1'>
                        Donald J. Trump
                        <Image
                          src='/verified.svg'
                          alt='Verified'
                          width={14}
                          height={14}
                          className='inline'
                        />
                      </span>
                    ) : (
                      `${reply.user_address.slice(0, 6)}...${reply.user_address.slice(-4)}`
                    )}
                  </span>
                  <span className='text-xs text-gray-500'>{formatDate(reply.created_at)}</span>
                </div>
                <p className='text-sm text-gray-100'>{reply.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CommentItem = memo(CommentItemBase, (prevProps, nextProps) => {
  return (
    prevProps.comment.id === nextProps.comment.id &&
    prevProps.comment.upvotes === nextProps.comment.upvotes &&
    prevProps.comment.body === nextProps.comment.body &&
    prevProps.comment.replies?.length === nextProps.comment.replies?.length
  );
});

export default CommentItem;
