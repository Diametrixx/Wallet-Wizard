import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Portfolio } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import LoadingScreen from "@/components/LoadingScreen";
import PortfolioSummary from "@/components/PortfolioSummary";
import PortfolioChart from "@/components/PortfolioChart";
import TokenList from "@/components/TokenList";
import AllocationChart from "@/components/AllocationChart";
import TransactionHistory from "@/components/TransactionHistory";
import TradingStrategy from "@/components/TradingStrategy";
import MemeSummary from "@/components/MemeSummary";
import { Button } from "@/components/ui/button";
import { Download, Share2, Search } from "lucide-react";
import { useLocation } from "wouter";
import { isValidAddress, detectChain } from "@/lib/wallet-utils";

export default function Dashboard() {
  const { address } = useParams<{ address: string }>();
  const [, setLocation] = useLocation();
  const [chain, setChain] = useState<"ethereum" | "solana" | null>(null);

  // Detect the chain from the address
  useEffect(() => {
    if (address) {
      const detectedChain = detectChain(address);
      setChain(detectedChain);
    }
  }, [address]);

  // Fetch portfolio data
  const { data: portfolio, isLoading, error } = useQuery<Portfolio>({
    queryKey: [`/api/analyze`, address, chain],
    enabled: !!address && !!chain,
    queryFn: async () => {
      if (!address || !chain) return null;
      
      try {
        console.log(`Analyzing wallet: ${address} on chain: ${chain} with forced refresh`);
        const res = await apiRequest("POST", "/api/analyze", { 
          address, 
          chain,
          forceRefresh: true // Always force refresh to get the latest data
        });
        
        const data = await res.json();
        console.log("Analysis completed:", data);
        return data;
      } catch (err) {
        console.error("Error analyzing wallet:", err);
        throw err;
      }
    }
  });

  // Handle invalid address
  useEffect(() => {
    if (address && !isValidAddress(address)) {
      setLocation("/");
    }
  }, [address, setLocation]);

  // Handle loading and error states
  if (isLoading) {
    return <LoadingScreen progress={65} status="Analyzing wallet data..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="cyber-card w-full max-w-lg p-8 text-center glow-border">
          <h2 className="font-pixel text-xl text-cyber-pink mb-4">ANALYSIS FAILED</h2>
          <p className="text-gray-300 mb-6">
            {error instanceof Error ? error.message : "Failed to analyze wallet data"}
          </p>
          <Button 
            variant="default" 
            className="bg-cyber-purple hover:bg-cyber-purple/80" 
            onClick={() => setLocation("/")}
          >
            <Search className="mr-2 h-4 w-4" /> Try Another Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return <LoadingScreen progress={80} status="Processing portfolio data..." />;
  }

  return (
    <div>
      {/* Portfolio Summary Card */}
      <PortfolioSummary portfolio={portfolio} />
      
      {/* Dashboard Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Portfolio Value Chart */}
        <div className="col-span-full">
          <PortfolioChart timeSeriesData={portfolio.timeSeriesData} />
        </div>
        
        {/* Top Winners */}
        <TokenList 
          title="TOP WINNERS" 
          titleColor="text-cyber-green" 
          tokens={portfolio.topWinners} 
          bgColorClass="bg-cyber-green/10" 
        />
        
        {/* Top Losers */}
        <TokenList 
          title="TOP LOSERS" 
          titleColor="text-cyber-pink" 
          tokens={portfolio.topLosers} 
          bgColorClass="bg-cyber-pink/10" 
        />
        
        {/* Portfolio Allocation */}
        <AllocationChart 
          title="PORTFOLIO ALLOCATION" 
          titleColor="text-cyber-yellow" 
          allocationData={portfolio.allocationData} 
        />
        
        {/* Transaction History */}
        <TransactionHistory 
          transactions={portfolio.transactions || []} 
        />
        
        {/* Trading Strategy */}
        <TradingStrategy 
          metrics={portfolio.tradingMetrics} 
        />
      </div>
      
      {/* Meme Summary */}
      <MemeSummary 
        memeRank={portfolio.memeRank}
        memeSummary={portfolio.memeSummary}
        memeImage={portfolio.memeImage}
      />
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
        <Button 
          variant="outline" 
          className="border-cyber-green/30 text-cyber-green hover:bg-cyber-green/20 font-pixel tracking-wider"
        >
          <Download className="mr-2 h-4 w-4" /> DOWNLOAD REPORT
        </Button>
        <Button 
          variant="outline" 
          className="border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/20 font-pixel tracking-wider"
        >
          <Share2 className="mr-2 h-4 w-4" /> SHARE RESULTS
        </Button>
        <Button 
          className="bg-cyber-purple text-white hover:bg-cyber-purple/80 font-pixel tracking-wider"
          onClick={() => setLocation("/")}
        >
          <Search className="mr-2 h-4 w-4" /> ANALYZE NEW WALLET
        </Button>
      </div>
    </div>
  );
}
