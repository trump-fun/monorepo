'use client';

import { Button } from '@/components/ui/button';

import { useState } from 'react';

import { RandomAvatar } from 'react-random-avatars';

interface CommentInputProps {
  onCommentSubmit: (content: string) => void;

  isWalletConnected: boolean;
}

const CommentInput = ({
  onCommentSubmit,

  isWalletConnected,
}: CommentInputProps) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    onCommentSubmit(newComment);

    setNewComment('');
  };

  return (
    <form onSubmit={handleSubmit} className='mb-6'>
      <div className='flex gap-4'>
        <div className='relative h-10 w-10 overflow-hidden rounded-full'>
          <RandomAvatar />
        </div>

        <div className='flex flex-1 flex-col gap-2'>
          <textarea
            placeholder={isWalletConnected ? 'Add a comment...' : 'Sign in to comment...'}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className='border-input bg-background ring-offset-background focus-visible:ring-ring min-h-[80px] w-full rounded-md border p-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
          />

          <div className='flex justify-end'>
            <Button type='submit' disabled={!newComment.trim()}>
              {isWalletConnected ? 'Comment' : 'Sign In'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentInput;
