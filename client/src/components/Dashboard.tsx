import React, { useState } from 'react';
import { formatCurrency } from '@/lib/wallet-utils';
import PortfolioSummary from './PortfolioSummary';
import PortfolioChart from './PortfolioChart';
import TokenList from './TokenList';
import StrategyAnalysis from './StrategyAnalysis';
import ActionButtons from './ActionButtons';
import AllocationChart from './AllocationChart';
import { Portfolio } from '@shared/schema';

const Dashboard: React.FC<{ portfolio: Portfolio }> = ({ portfolio }) => {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<"all" | "year" | "sixMonths" | "threeMonths">(
    portfolio.selectedTimeFrame || "all"
  );

  // Handle time frame selection
  const handleTimeFrameChange = (timeFrame: "all" | "year" | "sixMonths" | "threeMonths") => {
    setSelectedTimeFrame(timeFrame);
  };

  return (
    <div>
      {/* Portfolio Summary with time frame selection */}
      <PortfolioSummary 
        portfolio={portfolio} 
        onTimeFrameChange={handleTimeFrameChange} 
      />
      
      {/* Dashboard Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Portfolio Chart with time frame */}
        <div className="col-span-1 md:col-span-2">
          <PortfolioChart 
            portfolio={portfolio} 
            timeFrame={selectedTimeFrame}
          />
        </div>
        
        {/* Trading Strategy */}
        <div className="col-span-1">
          <StrategyAnalysis 
            tradingMetrics={portfolio.tradingMetrics} 
          />
        </div>
      </div>
      
      {/* Token Lists and Allocation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Top Winners */}
        <div className="md:col-span-1">
          <TokenList 
            title="TOP WINNERS"
            titleColor="text-cyber-green"
            tokens={portfolio.topWinners}
          />
        </div>
        
        {/* Top Losers */}
        <div className="md:col-span-1">
          <TokenList 
            title="TOP LOSERS" 
            titleColor="text-cyber-pink"
            tokens={portfolio.topLosers}
          />
        </div>

        {/* Portfolio Allocation */}
        <div className="md:col-span-1">
          <AllocationChart 
            title="PORTFOLIO ALLOCATION"
            titleColor="text-cyber-yellow"
            allocationData={portfolio.allocationData}
          />
        </div>
      </div>
      
      <div className="mb-8">
        <ActionButtons walletAddress={portfolio.wallet.address} />
      </div>
    </div>
  );
};

export default Dashboard;
