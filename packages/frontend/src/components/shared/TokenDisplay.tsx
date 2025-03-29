import { POINTS_DECIMALS, TokenType, USDC_DECIMALS } from '@trump-fun/common';

interface TokenDisplayProps {
  value: number | string;
  tokenType: TokenType;
  tokenLogo: React.ReactNode;
  className?: string;
}

export function TokenDisplay({ value, tokenType, tokenLogo, className = '' }: TokenDisplayProps) {
  const formattedValue = typeof value === 'string' ? Number(value) : value;

  const displayValue =
    tokenType === TokenType.Usdc
      ? (formattedValue / Math.pow(10, USDC_DECIMALS)).toLocaleString()
      : Math.floor(formattedValue / Math.pow(10, POINTS_DECIMALS)).toLocaleString();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {tokenLogo}
      <span>{displayValue}</span>
    </div>
  );
}
