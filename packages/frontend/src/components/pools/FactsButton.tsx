import { Button } from '@/components/ui/button';
import { ClipLoader } from 'react-spinners';

interface FactsButtonProps {
  handleFacts: () => void;
  hasFactsed: boolean;
  isFactsProcessing: boolean;
  poolFacts: number;
}

export const FactsButton = ({
  handleFacts,
  hasFactsed,
  isFactsProcessing,
  poolFacts,
}: FactsButtonProps) => {
  return (
    <Button
      variant={hasFactsed ? 'default' : 'outline'}
      className={`flex items-center gap-2 ${hasFactsed ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
      onClick={handleFacts}
      disabled={isFactsProcessing}
    >
      {isFactsProcessing ? (
        <ClipLoader size={14} color='#ffffff' />
      ) : (
        <>
          <span className='font-bold'>FACTS</span>
          <span className='text-xs'>{poolFacts}</span>
        </>
      )}
    </Button>
  );
};
