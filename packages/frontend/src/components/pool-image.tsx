'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

interface PoolImageProps {
  imageUrl?: string;
  width?: number;
  height?: number;
  avatarClassName?: string;
}

/**
 * This component renders the pool's imageUrl as an avatar, with "./trump.jpeg" as a fallback.
 * It's used in the pool-card, ending-soon-bet, and highest-volume components.
 */
export const PoolImage = ({
  imageUrl,
  width = 32,
  height = 32,
  avatarClassName = 'h-10 w-10 overflow-hidden rounded-full',
}: PoolImageProps) => {
  return (
    <Avatar className={avatarClassName}>
      {imageUrl && <AvatarImage src={imageUrl} alt='Pool' />}
      <AvatarFallback>
        <Image src={'/trump.jpeg'} alt='Trump' width={width} height={height} />
      </AvatarFallback>
    </Avatar>
  );
};

export default PoolImage;
