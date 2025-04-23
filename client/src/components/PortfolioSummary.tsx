import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { formatCurrency } from "@/lib/wallet-utils";
import { Portfolio } from "@shared/schema";

interface PortfolioSummaryProps {
  portfolio: Portfolio;
}

export default function PortfolioSummary({ portfolio }: PortfolioSummaryProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(portfolio.wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cyber-card p-6 mb-8 glow-border">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between">
        <div className="mb-6 md:mb-0">
          <h2 className="font-pixel text-xl text-cyber-green mb-2 cyber-glow">WALLET ANALYSIS</h2>
          <div className="mb-4">
            <div className="text-gray-400 text-sm mb-1">Wallet</div>
            <div className="flex items-center text-white">
              <span className="truncate max-w-[200px] md:max-w-xs text-sm font-mono">
                {portfolio.wallet.address}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyAddress} 
                className="ml-2 text-gray-400 hover:text-cyber-green transition"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <div className="text-gray-400 text-xs">Total Value</div>
              <div className="text-lg font-bold text-white">{formatCurrency(portfolio.totalValue)}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs">All-Time P&L</div>
              <div className={`text-lg font-bold ${portfolio.allTimeProfit >= 0 ? 'text-cyber-green' : 'text-cyber-pink'}`}>
                {portfolio.allTimeProfit >= 0 ? '+' : ''}{formatCurrency(portfolio.allTimeProfit)}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs">Performance</div>
              <div className={`text-lg font-bold ${portfolio.performancePercentage && portfolio.performancePercentage >= 0 ? 'text-cyber-green' : 'text-cyber-pink'}`}>
                {portfolio.performancePercentage ? (portfolio.performancePercentage >= 0 ? '+' : '') + portfolio.performancePercentage.toFixed(1) + '%' : 'N/A'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="cyber-card p-4 w-full md:w-auto bg-cyber-dark/70 border border-white/10 text-center">
          <div className="mb-2">
            <img 
              src={portfolio.memeImage} 
              alt="Performance meme" 
              className="w-24 h-24 mx-auto rounded-md object-cover" 
            />
          </div>
          <div className="font-pixel text-cyber-yellow text-sm mb-1">YOUR CRYPTO RANK</div>
          <div className="text-white font-bold text-lg">{portfolio.memeRank}</div>
          <p className="text-xs text-gray-300 mt-1">{portfolio.memeSummary.substring(0, 40)}...</p>
        </div>
      </div>
    </div>
  );
}
