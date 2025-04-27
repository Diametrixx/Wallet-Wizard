import React from 'react';
import { performanceSummaries } from '@/assets/memes';

interface StrategyAnalysisProps {
  tradingMetrics: {
    diamondHandsFactor: number;
    degenLevel: number;
    paperHandsRisk: number;
    strategy: string;
    suggestion: string;
  };
}

const StrategyAnalysis: React.FC<StrategyAnalysisProps> = ({ tradingMetrics }) => {
  const { diamondHandsFactor, degenLevel, paperHandsRisk, strategy, suggestion } = tradingMetrics;

  return (
    <div className="cyber-card p-6 glow-border">
      <h3 className="font-pixel text-sm text-white mb-4">YOUR TRADING STRATEGY</h3>
      
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-400">Diamond Hands Factor</span>
          <span className="text-xs text-cyber-green">{diamondHandsFactor}%</span>
        </div>
        <div className="w-full bg-cyber-dark rounded-full h-2 overflow-hidden">
          <div className="bg-cyber-green h-full" style={{ width: `${diamondHandsFactor}%` }}></div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-400">Degen Level</span>
          <span className="text-xs text-cyber-yellow">{degenLevel}%</span>
        </div>
        <div className="w-full bg-cyber-dark rounded-full h-2 overflow-hidden">
          <div className="bg-cyber-yellow h-full" style={{ width: `${degenLevel}%` }}></div>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-400">Paper Hands Risk</span>
          <span className="text-xs text-cyber-pink">{paperHandsRisk}%</span>
        </div>
        <div className="w-full bg-cyber-dark rounded-full h-2 overflow-hidden">
          <div className="bg-cyber-pink h-full" style={{ width: `${paperHandsRisk}%` }}></div>
        </div>
      </div>
      
      <div className="bg-cyber-dark/50 p-3 rounded-md border border-white/10 mb-4">
        <p className="text-sm">{strategy}</p>
      </div>
      
      <div className="cyber-card bg-cyber-green/10 p-3 rounded-md border border-cyber-green/20">
        <div className="flex items-center mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyber-green mr-2">
            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 1 1-8 0"></path>
            <circle cx="12" cy="8" r="2"></circle>
            <path d="M12 10v4"></path>
            <path d="M12 18h.01"></path>
          </svg>
          <h4 className="text-sm font-bold text-cyber-green">STRATEGY SUGGESTION</h4>
        </div>
        <p className="text-xs text-gray-300">{suggestion}</p>
      </div>
    </div>
  );
};

export default StrategyAnalysis;
