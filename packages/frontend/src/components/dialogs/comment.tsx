import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import type { FC } from 'react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

import { addComment } from '@/app/actions/comment-actions';
import { usePrivy, useSignMessage, useWallets } from '@privy-io/react-auth';

type MessageToSign = {
  action: string;
  poolId: string;
  comment: string;
  timestamp: string;
  account: string;
};

interface CommentPostModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onCommentSubmit?: (comment: string) => Promise<void>;
  poolId: string;
  username: string;
  avatar: string;
}

export const CommentModal: FC<CommentPostModalProps> = ({
  isOpen,
  setIsOpen,
  onCommentSubmit,
  poolId,
  username,
  avatar,
}) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { wallets } = useWallets();
  const { login, authenticated } = usePrivy();
  const { signMessage } = useSignMessage();

  const handleSubmit = async () => {
    if (!comment.trim()) {
      showErrorToast("Comment can't be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      if (onCommentSubmit) {
        await onCommentSubmit(comment);
      }
    } catch (error) {
      showErrorToast(
        'Failed to post comment',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      setIsSubmitting(false);
    }

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
        comment,
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

      await addComment(poolId, comment, signature, messageStr);

      setComment('');
      setIsOpen(false);
      showSuccessToast('Comment posted successfully');
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold'>Add your comment</DialogTitle>
          <DialogDescription>
            Share your thoughts on this post. Be respectful and follow community guidelines.
          </DialogDescription>
        </DialogHeader>

        <div className='mt-2 flex items-start gap-3'>
          <Avatar className='h-10 w-10'>
            <AvatarImage src={avatar} alt={username} />
            <AvatarFallback className='bg-orange-300 text-orange-700'>
              {username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className='flex-1'>
            <div className='mb-1 text-sm font-semibold'>{username}</div>
            <Textarea
              placeholder='Write your comment here...'
              className='min-h-[120px] resize-none focus-visible:ring-orange-500'
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className='mt-4 flex justify-end gap-2'>
          <DialogClose asChild>
            <Button type='button' variant='outline' onClick={() => setComment('')}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type='button'
            variant='default'
            className='bg-orange-500 hover:bg-orange-600'
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
