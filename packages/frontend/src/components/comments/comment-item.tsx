'use client';

import { toggleLike } from '@/app/actions/like-actions';
import { isCommentLiked, saveCommentLike } from '@/app/pool-actions';
import { Button } from '@/components/ui/button';
import { Comment } from '@/types';
import { formatDate } from '@/utils/formatDate';
import { usePrivy, useSignMessage, useWallets } from '@privy-io/react-auth';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { RandomAvatar } from 'react-random-avatars';

interface CommentItemProps {
  comment: Comment;
}

const CommentItem = ({ comment }: CommentItemProps) => {
  const [upvotes, setUpvotes] = useState<number>(comment.upvotes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [hasTrumpReplies, setHasTrumpReplies] = useState(false);
  const { login, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { signMessage } = useSignMessage();

  const isWalletConnected = authenticated && wallets && wallets.length > 0 && wallets[0]?.address;

  // Check for Trump replies when component mounts
  useEffect(() => {
    const checkForTrumpReplies = async () => {
      if (!comment.id) return;

      try {
        const response = await fetch(`/api/comment?comment_id=${comment.id}`);
        if (!response.ok) throw new Error('Failed to fetch replies');

        const data = await response.json();

        // Log the response to debug

        // Check if there are any Trump replies
        let trumpReplies = [];
        if (data.comments && Array.isArray(data.comments)) {
          trumpReplies = data.comments.filter(
            (reply: any) =>
              reply.user_address === '0xRealDonaldTrump2025' &&
              (reply.commentID === comment.id || reply.parent_id === comment.id)
          );
        } else if (Array.isArray(data)) {
          trumpReplies = data.filter(
            (reply) =>
              reply.user_address === '0xRealDonaldTrump2025' &&
              (reply.commentID === comment.id || reply.parent_id === comment.id)
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

  // Check localStorage when component mounts to see if this comment was liked before
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wasLiked = isCommentLiked(comment.id);
      setIsLiked(wasLiked);
    }
  }, [comment.id, authenticated]);

  if (!comment || !comment.id) {
    return null;
  }

  const handleLike = async () => {
    if (!isWalletConnected) {
      login();
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const wallet = wallets?.[0];

      if (!wallet || !wallet.address) {
        return setIsSubmitting(false);
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

      // Call API first to ensure the data is saved
      const result = await toggleLike(
        comment.id,
        newIsLiked ? 'like' : 'unlike',
        signature,
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
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

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
