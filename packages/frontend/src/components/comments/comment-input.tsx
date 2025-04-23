'use client';

import { Button } from '@/components/ui/button';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState } from 'react';
import { RandomAvatar } from 'react-random-avatars';

interface CommentInputProps {
  onCommentSubmit: (content: string) => void;
  isWalletConnected: boolean;
}

const CommentInput = ({ onCommentSubmit, isWalletConnected }: CommentInputProps) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { wallets } = useWallets();
  const { login } = usePrivy();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || isSubmitting) return;

    if (!isWalletConnected) {
      login();
      return;
    }

    setIsSubmitting(true);
    try {
      await onCommentSubmit(newComment);
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='mb-6'>
      <div className='flex gap-4'>
        <div className='relative h-10 w-10 overflow-hidden rounded-full'>
          <RandomAvatar name={wallets?.[0]?.address || 'guest'} />
        </div>
        <div className='flex-1'>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isWalletConnected ? 'Write a comment...' : 'Connect wallet to comment'}
            disabled={!isWalletConnected || isSubmitting}
            className='w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none'
            rows={2}
          />
          {isWalletConnected && (
            <Button type='submit' disabled={isSubmitting || !newComment.trim()} className='mt-2'>
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          )}
          {!isWalletConnected && (
            <Button type='button' onClick={() => login()} className='mt-2'>
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default CommentInput;
