'use client';

import { Tables } from '@trump-fun/common';
import CommentSection from './comment-section';

interface CommentSectionWrapperProps {
  poolId: string;
  initialComments?: Tables<'comments'>[];
  isLoading: boolean;
  error: Error | null;
}

export default function CommentSectionWrapper({
  poolId,
  initialComments,
  isLoading,
  error,
}: CommentSectionWrapperProps) {
  return (
    <div className='mt-6'>
      <CommentSection
        poolId={poolId}
        initialComments={initialComments || []}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
