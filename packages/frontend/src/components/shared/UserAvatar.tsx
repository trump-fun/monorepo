import { Avatar } from '@/components/ui/avatar';
import { RandomAvatar } from 'react-random-avatars';

interface UserAvatarProps {
  address?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function UserAvatar({ address, size = 'md' }: UserAvatarProps) {
  const sizeClass = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
  };

  const avatarSize = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  return (
    <Avatar className={`${sizeClass[size]} overflow-hidden rounded-full`}>
      <RandomAvatar size={avatarSize[size]} name={address || ''} />
    </Avatar>
  );
}
