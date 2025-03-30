import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bet, Pool, Tables, TokenType } from '@trump-fun/common';
import { formatDistanceToNow } from 'date-fns';
import CommentSectionWrapper from '../comments/comment-section-wrapper';

interface TabSwitcherProps {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  pool: Pool; // Replace with proper typing
  comments: Tables<'comments'>[];
  isCommentsLoading: boolean;
  commentsError: any;
}

export const TabSwitcher = ({
  selectedTab,
  setSelectedTab,
  pool,
  comments,
  isCommentsLoading,
  commentsError,
}: TabSwitcherProps) => {
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
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
        {pool?.bets?.length > 0 ? (
          <div className='space-y-2'>
            {pool?.bets?.slice(0, 10).map((bet: Bet) => (
              <div key={bet.id} className='flex items-center justify-between rounded-md border p-3'>
                <div className='flex items-center'>
                  <Avatar className='mr-2 h-6 w-6'>
                    <AvatarImage src='/avatar-placeholder.png' />
                    <AvatarFallback>{truncateAddress(bet.user)[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className='text-sm'>
                      <span className='font-medium'>{truncateAddress(bet.user)}</span>
                      <span> bet on </span>
                      <span
                        className={
                          bet.option === '0'
                            ? 'font-medium text-green-500'
                            : 'font-medium text-red-500'
                        }
                      >
                        {pool.options[parseInt(bet.option)]}
                      </span>
                    </div>
                    <span className='text-muted-foreground text-xs'>
                      {bet.updatedAt && !isNaN(Number(bet.updatedAt))
                        ? formatDistanceToNow(new Date(Number(bet.updatedAt) * 1000), {
                            addSuffix: true,
                          })
                        : 'Unknown time'}
                    </span>
                  </div>
                </div>
                <div className='font-medium'>
                  {(Number(bet.amount) / 10 ** 6).toLocaleString()}{' '}
                  {bet.tokenType === TokenType.Usdc ? 'USDC' : 'pts'}
                </div>
              </div>
            ))}
            {pool?.bets?.length > 10 && (
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
