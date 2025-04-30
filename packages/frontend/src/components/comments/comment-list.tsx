'use client';

import { CommentWithReplies } from '@/types/comments';
import CommentItem from './comment-item';
import { Skeleton } from '../ui/skeleton';
import { ErrorBoundary } from 'react-error-boundary';
import { useEffect, useRef, useCallback, useMemo } from 'react';

interface CommentListProps {
  comments: CommentWithReplies[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

function CommentListFallback({
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600'>
      <p>Something went wrong loading this comment.</p>
      <button
        onClick={resetErrorBoundary}
        className='mt-2 text-sm font-medium text-red-600 hover:text-red-500'
      >
        Try again
      </button>
    </div>
  );
}

const CommentList = ({
  comments,
  isLoading,
  pagination,
  onLoadMore,
  isLoadingMore,
}: CommentListProps) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && !isLoading && !isLoadingMore && pagination?.hasMore) {
        onLoadMore?.();
      }
    },
    [isLoading, isLoadingMore, onLoadMore, pagination?.hasMore]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 1.0,
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver]);

  const validComments = useMemo(() => (Array.isArray(comments) ? comments : []), [comments]);

  if (isLoading) {
    return (
      <div className='space-y-6'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='flex gap-4'>
            <Skeleton className='h-10 w-10 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-[200px]' />
              <Skeleton className='h-16 w-full' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {validComments.length > 0 ? (
        <>
          {validComments.map((comment) => (
            <ErrorBoundary key={comment.id} FallbackComponent={CommentListFallback}>
              <CommentItem comment={comment} initialReplies={comment.replies || []} />
            </ErrorBoundary>
          ))}

          {pagination?.hasMore && (
            <div ref={observerTarget} className='mt-6'>
              {isLoadingMore && (
                <div className='space-y-6'>
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className='flex gap-4'>
                      <Skeleton className='h-10 w-10 rounded-full' />
                      <div className='flex-1 space-y-2'>
                        <Skeleton className='h-4 w-[200px]' />
                        <Skeleton className='h-16 w-full' />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className='py-8 text-center text-gray-500'>
          No comments yet. Be the first to comment!
        </div>
      )}
    </div>
  );
};

export default CommentList;
