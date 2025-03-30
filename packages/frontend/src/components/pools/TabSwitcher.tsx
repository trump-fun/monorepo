import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GetBetPlacedQuery, GetPoolQuery } from '@/types/__generated__/graphql';
import { Tables } from '@trump-fun/common';
import { formatDistanceToNow } from 'date-fns';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import CommentSectionWrapper from '../comments/comment-section-wrapper';

interface TabSwitcherProps {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  pool: GetPoolQuery['pool']; // Replace with proper typing
  bets: GetBetPlacedQuery['betPlaceds']; // Replace with proper typing
  comments: Tables<'comments'>[];
  isCommentsLoading: boolean;
  commentsError: any;
}

export const TabSwitcher = ({
  selectedTab,
  setSelectedTab,
  pool,
  bets,
  comments,
  isCommentsLoading,
  commentsError,
}: TabSwitcherProps) => {
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!pool) {
    return null;
  }

  return (
    <Tabs
      defaultValue='comments'
      value={selectedTab}
      onValueChange={setSelectedTab}
      className='mt-6'
    >
      <TabsList className='w-full'>
        <TabsTrigger value='comments' className='flex-1'>
          Comments ({comments?.length || 0})
        </TabsTrigger>
        <TabsTrigger value='activity' className='flex-1'>
          Activity
        </TabsTrigger>
      </TabsList>

      <TabsContent value='comments' className='pt-4'>
        <CommentSectionWrapper
          error={commentsError}
          poolId={pool.id}
          initialComments={comments}
          isLoading={isCommentsLoading}
          key={pool.id}
        />
      </TabsContent>

      <TabsContent value='activity' className='pt-4'>
        {bets?.length > 0 ? (
          <div className='space-y-2'>
            {bets?.slice(0, 10).map((bet) => (
              <div key={bet.id} className='flex items-center justify-between rounded-md border p-3'>
                <div className='flex items-center'>
                  <Avatar className='mr-2 h-6 w-6'>
                    {bet.user ? (
                      <Jazzicon diameter={24} seed={jsNumberForAddress(bet.user)} />
                    ) : (
                      <AvatarFallback>{truncateAddress(bet.user)[0]}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className='text-sm'>
                      <span className='font-medium'>{truncateAddress(bet.user)}</span>
                      <span> bet on </span>
                      <span
                        className={
                          bet.optionIndex === '0'
                            ? 'font-medium text-green-500'
                            : 'font-medium text-red-500'
                        }
                      >
                        {pool.options[parseInt(bet.optionIndex)]}
                      </span>
                    </div>
                    <span className='text-muted-foreground text-xs'>
                      {bet.blockTimestamp && !isNaN(Number(bet.blockTimestamp))
                        ? formatDistanceToNow(new Date(Number(bet.blockTimestamp) * 1000), {
                            addSuffix: true,
                          })
                        : 'Unknown time'}
                    </span>
                  </div>
                </div>
                <div className='font-medium'>
                  {(Number(bet.amount) / 10 ** 6).toLocaleString()}{' '}
                  {bet.tokenType === 0 ? 'USDC' : 'FREEDOM'}
                </div>
              </div>
            ))}
            {bets?.length > 10 && (
              <div className='pt-2 text-center'>
                <Button variant='link'>View all activity</Button>
              </div>
            )}
          </div>
        ) : (
          <div className='py-8 text-center'>
            <p className='text-muted-foreground'>No betting activity yet.</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};
