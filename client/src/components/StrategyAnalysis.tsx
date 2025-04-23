import React from 'react';
import { getRandomItemFromArray } from '@/lib/utils';
import { performanceSummaries } from '@/assets/memes';

interface StrategyAnalysisProps {
  strategy: {
    diamondHandsFactor: number;
    degenLevel: number;
    paperHandsRisk: number;
  };
  performance: 'excellent' | 'good' | 'neutral' | 'bad' | 'terrible';
}

const StrategyAnalysis: React.FC<StrategyAnalysisProps> = ({ strategy, performance }) => {
  const { diamondHandsFactor, degenLevel, paperHandsRisk } = strategy;

  // Get a random performance summary based on performance level
  const summary = getRandomItemFromArray(performanceSummaries[performance]);

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
        <p className="text-sm">{summary}</p>
      </div>
      
      <div className="cyber-card bg-cyber-green/10 p-3 rounded-md border border-cyber-green/20">
        <div className="flex items-center mb-2">
          <i className="fas fa-robot text-cyber-green mr-2"></i>
          <h4 className="text-sm font-bold text-cyber-green">AI STRATEGY SUGGESTION</h4>
        </div>
        {performance === 'excellent' && (
          <p className="text-xs text-gray-300">Consider taking some profits after your strong gains. Even diamond hands should rebalance occasionally.</p>
        )}
        {performance === 'good' && (
          <p className="text-xs text-gray-300">Your strategy is solid. Consider increasing your position in your top performers when the market dips.</p>
        )}
        {performance === 'neutral' && (
          <p className="text-xs text-gray-300">Your balanced approach is safe, but you might be missing opportunities. Consider researching emerging sectors.</p>
        )}
        {performance === 'bad' && (
          <p className="text-xs text-gray-300">Try to avoid selling during downtrends. Set specific targets for entry and exit to avoid emotional decisions.</p>
        )}
        {performance === 'terrible' && (
          <p className="text-xs text-gray-300">Consider focusing on blue chip crypto assets and DCA strategy. Avoid chasing pumps and high-risk tokens.</p>
        )}
      </div>
    </div>
  );
};

export default StrategyAnalysis;
