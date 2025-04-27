import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { formatCurrency } from "@/lib/wallet-utils";
import { Portfolio, TimeFrame } from "@shared/schema";

interface PortfolioSummaryProps {
  portfolio: Portfolio;
  onTimeFrameChange?: (timeFrame: "all" | "year" | "sixMonths" | "threeMonths") => void;
}

export default function PortfolioSummary({ portfolio, onTimeFrameChange }: PortfolioSummaryProps) {
  const [copied, setCopied] = useState(false);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<"all" | "year" | "sixMonths" | "threeMonths">(
    portfolio.selectedTimeFrame || "all"
  );
  
  // Find the active time frame data or use defaults
  const activeTimeFrame = portfolio.timeFrames?.find(tf => tf.period === selectedTimeFrame) || {
    period: "all",
    profit: portfolio.allTimeProfit,
    performancePercentage: portfolio.performancePercentage,
    performance: portfolio.performance || "neutral",
    startDate: "",
    endDate: "",
    timeSeriesData: portfolio.timeSeriesData
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(portfolio.wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleTimeFrameChange = (timeFrame: "all" | "year" | "sixMonths" | "threeMonths") => {
    setSelectedTimeFrame(timeFrame);
    if (onTimeFrameChange) {
      onTimeFrameChange(timeFrame);
    }
  };
  
  // Button style helper
  const getButtonStyle = (timeFrame: "all" | "year" | "sixMonths" | "threeMonths") => {
    return timeFrame === selectedTimeFrame
      ? "bg-cyber-green/20 text-cyber-green border-cyber-green"
      : "bg-transparent text-gray-400 border-gray-700 hover:border-cyber-green/50 hover:text-cyber-green/70";
  };

  return (
    <div className="cyber-card p-6 mb-8 glow-border">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between">
        <div className="mb-6 md:mb-0 w-full">
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
          
          {/* Time frame selector */}
          <div className="flex flex-wrap mb-4 gap-2">
            <button 
              onClick={() => handleTimeFrameChange("all")}
              className={`px-3 py-1 rounded-md text-xs border ${getButtonStyle("all")}`}
            >
              All-time
            </button>
            <button 
              onClick={() => handleTimeFrameChange("year")}
              className={`px-3 py-1 rounded-md text-xs border ${getButtonStyle("year")}`}
            >
              Last year
            </button>
            <button 
              onClick={() => handleTimeFrameChange("sixMonths")}
              className={`px-3 py-1 rounded-md text-xs border ${getButtonStyle("sixMonths")}`}
            >
              Last 6 months
            </button>
            <button 
              onClick={() => handleTimeFrameChange("threeMonths")}
              className={`px-3 py-1 rounded-md text-xs border ${getButtonStyle("threeMonths")}`}
            >
              Last 3 months
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div>
              <div className="text-gray-400 text-xs">Total Value</div>
              <div className="text-lg font-bold text-white">{formatCurrency(portfolio.totalValue)}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs">
                {selectedTimeFrame === "all" ? "All-Time P&L" : 
                 selectedTimeFrame === "year" ? "1Y P&L" :
                 selectedTimeFrame === "sixMonths" ? "6M P&L" : "3M P&L"}
              </div>
              <div className={`text-lg font-bold ${activeTimeFrame.profit >= 0 ? 'text-cyber-green' : 'text-cyber-pink'}`}>
                {activeTimeFrame.profit >= 0 ? '+' : ''}{formatCurrency(activeTimeFrame.profit)}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs">Performance</div>
              <div className={`text-lg font-bold ${activeTimeFrame.performancePercentage >= 0 ? 'text-cyber-green' : 'text-cyber-pink'}`}>
                {activeTimeFrame.performancePercentage ? (activeTimeFrame.performancePercentage >= 0 ? '+' : '') + 
                activeTimeFrame.performancePercentage.toFixed(1) + '%' : 'N/A'}
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
