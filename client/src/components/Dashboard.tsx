import React from 'react';
import { shortenAddress, formatCurrency, formatPercent } from '@/lib/utils';
import PortfolioChart from './PortfolioChart';
import TokenList from './TokenList';
import StrategyAnalysis from './StrategyAnalysis';
import MemePersona from './MemePersona';
import ActionButtons from './ActionButtons';

export interface PortfolioData {
  walletAddress: string;
  totalValue: number;
  pnl: number;
  percentChange: number;
  performance: 'excellent' | 'good' | 'neutral' | 'bad' | 'terrible';
  tokens: {
    winners: Token[];
    losers: Token[];
  };
  transactions: Transaction[];
  allocation: Allocation[];
  strategy: {
    diamondHandsFactor: number;
    degenLevel: number;
    paperHandsRisk: number;
  };
}

export interface Token {
  name: string;
  symbol: string;
  amount: number;
  price: number;
  value: number;
  percentChange: number;
}

export interface Transaction {
  type: 'received' | 'sent' | 'swapped';
  description: string;
  amount: string;
  timestamp: number;
  counterparty: string;
  platform?: string;
}

export interface Allocation {
  name: string;
  symbol: string;
  percentage: number;
  color: string;
}

const Dashboard: React.FC<{ data: PortfolioData }> = ({ data }) => {
  const {
    walletAddress,
    totalValue,
    pnl,
    percentChange,
    tokens,
    transactions,
    allocation,
    strategy,
    performance
  } = data;

  return (
    <div>
      {/* Performance Summary */}
      <div className="cyber-card p-6 mb-8 glow-border">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="font-pixel text-xl text-cyber-green mb-2 cyber-glow">WALLET ANALYSIS</h2>
            <div className="mb-4">
              <div className="text-gray-400 text-sm mb-1">Wallet</div>
              <div className="flex items-center text-white">
                <span className="truncate max-w-[200px] md:max-w-xs text-sm font-mono">{walletAddress}</span>
                <button 
                  className="ml-2 text-gray-400 hover:text-cyber-green transition"
                  onClick={() => navigator.clipboard.writeText(walletAddress)}
                >
                  <i className="fas fa-copy"></i>
                </button>
              </div>
            </div>
            <div className="flex space-x-4">
              <div>
                <div className="text-gray-400 text-xs">Total Value</div>
                <div className="text-lg font-bold text-white">{formatCurrency(totalValue)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">All-Time P&L</div>
                <div className={`text-lg font-bold ${pnl >= 0 ? 'text-cyber-green' : 'text-cyber-pink'}`}>
                  {formatCurrency(pnl)}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Performance</div>
                <div className={`text-lg font-bold ${percentChange >= 0 ? 'text-cyber-green' : 'text-cyber-pink'}`}>
                  {formatPercent(percentChange)}
                </div>
              </div>
            </div>
          </div>
          
          <MemePersona performance={performance} />
        </div>
      </div>
      
      {/* Dashboard Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Portfolio Value Chart */}
        <div className="cyber-card col-span-full p-6 glow-border">
          <h3 className="font-pixel text-sm text-cyber-blue mb-4">PORTFOLIO VALUE OVER TIME</h3>
          <PortfolioChart />
        </div>
        
        {/* Top Winners */}
        <div className="cyber-card p-6 glow-border">
          <h3 className="font-pixel text-sm text-cyber-green mb-4">TOP WINNERS</h3>
          <TokenList tokens={tokens.winners} type="winners" />
        </div>
        
        {/* Top Losers */}
        <div className="cyber-card p-6 glow-border">
          <h3 className="font-pixel text-sm text-cyber-pink mb-4">TOP LOSERS</h3>
          <TokenList tokens={tokens.losers} type="losers" />
        </div>
        
        {/* Portfolio Allocation */}
        <div className="cyber-card p-6 glow-border">
          <h3 className="font-pixel text-sm text-cyber-yellow mb-4">PORTFOLIO ALLOCATION</h3>
          <div className="h-48 bg-cyber-dark/30 rounded-md mb-4 flex items-center justify-center border border-white/10">
            <div className="w-full h-full">
              <PortfolioChart type="allocation" data={allocation} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {allocation.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-3 h-3 bg-${item.color} rounded-sm mr-2`}></div>
                <span className="text-xs">{item.name} ({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Transaction History */}
        <div className="cyber-card p-6 glow-border">
          <h3 className="font-pixel text-sm text-white mb-4">RECENT TRANSACTIONS</h3>
          
          <div className="space-y-3">
            {transactions.slice(0, 3).map((tx, index) => (
              <div key={index} className="flex items-center p-2 bg-cyber-dark/70 rounded-md border border-white/5">
                <div className={`w-8 h-8 rounded-full ${
                  tx.type === 'received' ? 'bg-cyber-green/20' : 
                  tx.type === 'sent' ? 'bg-cyber-pink/20' : 'bg-cyber-blue/20'
                } flex items-center justify-center mr-3`}>
                  <i className={`fas ${
                    tx.type === 'received' ? 'fa-arrow-down text-cyber-green' : 
                    tx.type === 'sent' ? 'fa-arrow-up text-cyber-pink' : 'fa-exchange-alt text-cyber-blue'
                  } text-xs`}></i>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-sm">{tx.description}</span>
                    <span className="text-sm font-mono">{tx.amount}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{new Date(tx.timestamp).toLocaleDateString()}</span>
                    <span>{tx.type === 'swapped' ? tx.platform : `${tx.type === 'sent' ? 'To' : 'From'}: ${shortenAddress(tx.counterparty)}`}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 py-2 text-xs text-gray-300 border border-white/10 rounded-md hover:bg-white/5 transition">
            View All Transactions
          </button>
        </div>
        
        {/* Trading Strategy */}
        <StrategyAnalysis strategy={strategy} performance={performance} />
      </div>
      
      {/* Action Buttons */}
      <ActionButtons walletAddress={walletAddress} />
    </div>
  );
};

export default Dashboard;
