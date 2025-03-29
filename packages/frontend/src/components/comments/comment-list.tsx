'use client';

import { Tables } from '@trump-fun/common';
import CommentItem from './comment-item';

interface CommentListProps {
  comments: Tables<'comments'>[];
}

const CommentList = ({ comments }: CommentListProps) => {
  // Ensure we have a valid array
  const validComments = Array.isArray(comments) ? comments : [];

  return (
    <div className='space-y-6'>
      {validComments.length > 0 ? (
        validComments.map(comment => <CommentItem key={comment.id} comment={comment} />)
      ) : (
        <div className='py-8 text-center text-gray-500'>
          No comments yet. Be the first to comment!
        </div>
      )}
    </div>
  );
};

export default CommentList;
