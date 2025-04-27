import { Token } from "@shared/schema";
import { formatCurrency } from "@/lib/wallet-utils";

interface TokenListProps {
  title: string;
  titleColor: string;
  tokens: Token[];
  bgColorClass?: string;
}

export default function TokenList({ title, titleColor, tokens, bgColorClass = "bg-cyber-dark/30" }: TokenListProps) {
  if (!tokens || tokens.length === 0) {
    return (
      <div className="cyber-card p-6 glow-border">
        <h3 className={`font-pixel text-sm ${titleColor} mb-4`}>{title}</h3>
        <div className="p-4 text-center text-gray-400">
          <p>No tokens to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cyber-card p-6 glow-border">
      <h3 className={`font-pixel text-sm ${titleColor} mb-4`}>{title}</h3>
      
      {tokens.map((token, index) => (
        <div key={index} className={`flex items-center p-3 ${bgColorClass} rounded-md mb-3 ${index === tokens.length - 1 ? 'mb-0' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-cyber-dark/50 flex items-center justify-center mr-3 overflow-hidden">
            {token.logoUrl ? (
              <img 
                src={token.logoUrl} 
                alt={token.symbol} 
                className="w-10 h-10 rounded-full object-cover" 
              />
            ) : (
              <span className="text-xs font-bold">{token.symbol.substring(0, 3)}</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="font-bold">{token.name || token.symbol}</span>
              <span className={(token.change24h || 0) >= 0 ? 'text-cyber-green' : 'text-cyber-pink'}>
                {(token.change24h || 0) >= 0 ? '+' : ''}{(token.change24h || 0).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{token.amount.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4
              })} {token.symbol}</span>
              <span>{formatCurrency(token.value)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
