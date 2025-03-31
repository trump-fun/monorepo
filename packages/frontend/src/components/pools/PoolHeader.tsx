import TruthSocial from '@/components/common/truth-social';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { GetPoolQuery, PoolStatus } from '@/types';
import { Database } from '@trump-fun/common';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

interface PoolHeaderProps {
  pool: GetPoolQuery['pool'];
  postData?: Database['public']['Tables']['truth_social_posts']['Row'];
}

export const PoolHeader = ({ pool, postData }: PoolHeaderProps) => {
  if (!pool) return null;
  return (
    <CardHeader className='pb-4'>
      <div className='mb-2 flex flex-wrap items-start justify-between gap-2'>
        <div className='flex items-center'>
          <Avatar className='mr-2 h-8 w-8'>
            <AvatarImage
              src={postData?.image_url ? postData?.image_url : '/trump.jpeg'}
              alt='realDonaldTrump'
            />
            <AvatarFallback>
              <Image src={'/trump.jpeg'} alt='User' width={32} height={32} />
            </AvatarFallback>
          </Avatar>
          <div className='text-sm'>
            <div className='font-bold'>realDonaldTrump</div>
            <span className='text-muted-foreground'>
              {new Date(Number(pool.createdAt) * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          {pool.status === PoolStatus.Pending || pool.status === PoolStatus.None ? (
            <div className='flex items-center'>
              <span className='relative flex h-3 w-3'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75'></span>
                <span className='relative inline-flex h-3 w-3 rounded-full bg-green-500'></span>
              </span>
            </div>
          ) : (
            <Badge variant='secondary' className='bg-red-500'>
              CLOSED
            </Badge>
          )}
          <span className='text-muted-foreground text-xs'>
            {formatDistanceToNow(new Date(pool.createdAt * 1000), { addSuffix: true })}
          </span>
          <TruthSocial postId={pool.originalTruthSocialPostId || ''} />
        </div>
      </div>

      <CardTitle className='text-2xl font-bold'>{pool.question}</CardTitle>
    </CardHeader>
  );
};
