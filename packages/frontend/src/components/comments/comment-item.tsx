'use client';

import { toggleLike } from '@/app/actions/like-actions';
import { isCommentLiked, saveCommentLike } from '@/app/pool-actions';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/formatDate';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useDynamicSolana } from '@/hooks/useDynamicSolana';
import { Tables } from '@trump-fun/common';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { RandomAvatar } from 'react-random-avatars';

interface CommentItemProps {
  comment: Tables<'comments'>;
}

// Define local CommentData interface for this component
interface CommentData {
  id: string;
  commentID?: string;
  parent_id?: string;
  user_address: string;
  body: string;
  created_at: string;
  upvotes?: number;
}

const CommentItem = ({ comment }: CommentItemProps) => {
  const [upvotes, setUpvotes] = useState<number>(comment.upvotes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replies, setReplies] = useState<CommentData[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [hasTrumpReplies, setHasTrumpReplies] = useState(false);

  const { setShowAuthFlow } = useDynamicContext();
  const { primaryWallet } = useDynamicContext();
  const { signMessage, isAuthenticated } = useDynamicSolana();

  const isWalletConnected = isAuthenticated && primaryWallet?.address;

  // Check for Trump replies when component mounts
  useEffect(() => {
    const checkForTrumpReplies = async () => {
      if (!comment.id) return;

      try {
        const response = await fetch(`/api/comment?comment_id=${comment.id}`);
        if (!response.ok) throw new Error('Failed to fetch replies');

        const data = await response.json();

        // Check if there are any Trump replies
        let trumpReplies: CommentData[] = [];
        if (data.comments && Array.isArray(data.comments)) {
          trumpReplies = data.comments.filter(
            (reply: CommentData) =>
              reply.user_address === '0xRealDonaldTrump2025' &&
              (String(reply.commentID) === String(comment.id) ||
                String(reply.parent_id) === String(comment.id))
          );
        } else if (Array.isArray(data)) {
          trumpReplies = data.filter(
            (reply: CommentData) =>
              reply.user_address === '0xRealDonaldTrump2025' &&
              (String(reply.commentID) === String(comment.id) ||
                String(reply.parent_id) === String(comment.id))
          );
        }

        // Set whether there are Trump replies
        setHasTrumpReplies(trumpReplies.length > 0);

        // Save the replies in state in case the user wants to view them
        setReplies(trumpReplies);
      } catch (error) {
        console.error('Error checking for Trump replies:', error);
      }
    };

    checkForTrumpReplies();
  }, [comment.id]);

  // Fetch replies when the user clicks to view replies
  useEffect(() => {
    const fetchReplies = async () => {
      if (!comment.id || !showReplies || replies.length > 0) return;

      setIsLoadingReplies(true);
      try {
        // We already have the replies from the initial check, no need to fetch again
        // unless we need to refresh the data
        setIsLoadingReplies(false);
      } catch (error) {
        console.error('Error fetching replies:', error);
        setIsLoadingReplies(false);
      }
    };

    fetchReplies();
  }, [comment.id, showReplies, replies.length]);

  // Define hooks at the top level before any conditional returns
  const handleLike = useCallback(async () => {
    if (!comment || !comment.id) return;

    if (!isWalletConnected) {
      setShowAuthFlow(true);
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (!primaryWallet?.address) {
        setIsSubmitting(false);
        return;
      }

      // Determine action without updating state yet
      const newIsLiked = !isLiked;

      // Calculate the correct upvote count based on the current state
      // and whether the user is liking or unliking
      let newUpvotes = upvotes;
      if (newIsLiked) {
        // If user is liking and wasn't liked before
        newUpvotes = upvotes + 1;
      } else {
        // If user is unliking and was liked before
        newUpvotes = Math.max(0, upvotes - 1);
      }

      const messageObj = {
        action: 'toggle_like',
        commentId: comment.id,
        operation: newIsLiked ? 'like' : 'unlike',
        timestamp: new Date().toISOString(),
        account: primaryWallet.address.toLowerCase(),
      };

      const messageStr = JSON.stringify(messageObj);

      const signature = await signMessage(messageStr);

      // Call API first to ensure the data is saved
      const result = await toggleLike(
        comment.id,
        newIsLiked ? 'like' : 'unlike',
        signature!,
        messageStr
      );

      if (result.success) {
        setIsLiked(newIsLiked);
        setUpvotes(result.upvotes ?? newUpvotes);

        // Update localStorage after successful server update
        saveCommentLike(comment.id, newIsLiked);
      } else {
        console.error('Error toggling comment like:', result.error);
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
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isLiked,
    isSubmitting,
    isWalletConnected,
    setShowAuthFlow,
    primaryWallet,
    signMessage,
    comment,
    upvotes,
  ]);

  const toggleReplies = useCallback(() => {
    setShowReplies(!showReplies);
  }, [showReplies]);

  // Check localStorage when component mounts to see if this comment was liked before
  useEffect(() => {
    if (typeof window !== 'undefined' && comment?.id) {
      const wasLiked = isCommentLiked(comment.id);
      setIsLiked(wasLiked);
    }
  }, [comment?.id, isAuthenticated]);

  if (!comment || !comment.id) {
    return null;
  }

  return (
    <div className='border-b pb-4 last:border-0'>
      <div className='flex gap-3'>
        <div className='relative h-10 w-10 overflow-hidden rounded-full'>
          <RandomAvatar size={40} name={comment.user_address} />
        </div>

        <div className='flex-1'>
          <div className='mb-1 flex items-center gap-2'>
            <span className='font-medium'>
              {comment.user_address.slice(0, 6)}...{comment.user_address.slice(-4)}
            </span>

            <span className='text-sm text-gray-500'>{formatDate(comment.created_at)}</span>
          </div>

          <p className='mb-3'>{comment.body}</p>

          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              className={`h-9 gap-2 px-3 ${
                isLiked
                  ? 'font-bold text-orange-500 hover:text-orange-600'
                  : 'text-orange-500 hover:text-orange-500 focus:text-orange-500 active:text-orange-500'
              }`}
              onClick={handleLike}
              disabled={isSubmitting}
            >
              <span>FACTS</span>
              {isLiked && <span className='ml-1.5'>🦅</span>}
              <span className='ml-1.5'>{upvotes}</span>
            </Button>

            {/* Only show Trump reply button if there are replies */}
            {hasTrumpReplies && (
              <Button
                variant='ghost'
                size='sm'
                className='h-9 gap-2 px-3 text-blue-500 hover:text-blue-600'
                onClick={toggleReplies}
              >
                <span>{showReplies ? 'Hide Trump Replies' : 'Show Trump Replies'}</span>
                <span className='ml-1.5'>🇺🇸</span>
              </Button>
            )}
          </div>

          {/* Replies section - only show when showReplies is true */}
          {showReplies && hasTrumpReplies && (
            <div className='mt-3 border-l-2 border-red-200 pl-4'>
              {isLoadingReplies ? (
                <div className='mt-3 pl-4 text-sm text-gray-500'>Loading Trump replies...</div>
              ) : replies && replies.length > 0 ? (
                <>
                  <h4 className='mb-2 text-sm font-semibold text-gray-700'>
                    Trump Responses ({replies.length})
                  </h4>
                  {replies.map((reply) => (
                    <div key={reply.id} className='mb-3 border-t border-gray-100 pt-2'>
                      <div className='mb-1 flex items-center gap-2'>
                        <div className='flex items-center'>
                          <div className='relative h-6 w-6 overflow-hidden rounded-full'>
                            <Image
                              src='/trump.jpeg'
                              alt='Trump Avatar'
                              fill
                              className='object-cover'
                              sizes='100%'
                            />
                          </div>
                          <span className='ml-2 text-sm font-bold'>@realDonaldTrump</span>
                        </div>
                        <span className='text-xs text-gray-500'>
                          {formatDate(reply.created_at)}
                        </span>
                      </div>
                      <p className='ml-8 text-sm'>{reply.body}</p>
                    </div>
                  ))}
                </>
              ) : (
                <div className='mt-3 pl-4 text-sm text-gray-500'>No Trump replies yet</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
