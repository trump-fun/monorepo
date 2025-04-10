import { useTokenBalance } from '@/hooks/useTokenBalance';
interface TokenDisplayProps {
  className?: string;
}

export function TokenDisplay({ className = '' }: TokenDisplayProps) {
  const { formattedBalance, tokenLogo } = useTokenBalance();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {tokenLogo}
      <span>{formattedBalance}</span>
    </div>
  );
}
