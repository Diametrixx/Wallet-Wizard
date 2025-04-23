import { Progress } from "@/components/ui/progress";
import { Bot } from "lucide-react";

interface TradingMetrics {
  diamondHandsFactor: number;
  degenLevel: number;
  paperHandsRisk: number;
  strategy: string;
  suggestion: string;
}

interface TradingStrategyProps {
  metrics: TradingMetrics;
}

export default function TradingStrategy({ metrics }: TradingStrategyProps) {
  return (
    <div className="cyber-card p-6 glow-border">
      <h3 className="font-pixel text-sm text-white mb-4">YOUR TRADING STRATEGY</h3>
      
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-400">Diamond Hands Factor</span>
          <span className="text-xs text-cyber-green">{metrics.diamondHandsFactor}%</span>
        </div>
        <Progress value={metrics.diamondHandsFactor} className="h-2 bg-cyber-dark" indicatorClassName="bg-cyber-green" />
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-400">Degen Level</span>
          <span className="text-xs text-cyber-yellow">{metrics.degenLevel}%</span>
        </div>
        <Progress value={metrics.degenLevel} className="h-2 bg-cyber-dark" indicatorClassName="bg-cyber-yellow" />
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-400">Paper Hands Risk</span>
          <span className="text-xs text-cyber-pink">{metrics.paperHandsRisk}%</span>
        </div>
        <Progress value={metrics.paperHandsRisk} className="h-2 bg-cyber-dark" indicatorClassName="bg-cyber-pink" />
      </div>
      
      <div className="bg-cyber-dark/50 p-3 rounded-md border border-white/10 mb-4">
        <p className="text-sm">{metrics.strategy}</p>
      </div>
      
      <div className="cyber-card bg-cyber-green/10 p-3 rounded-md border border-cyber-green/20">
        <div className="flex items-center mb-2">
          <Bot className="text-cyber-green mr-2 h-4 w-4" />
          <h4 className="text-sm font-bold text-cyber-green">AI STRATEGY SUGGESTION</h4>
        </div>
        <p className="text-xs text-gray-300">{metrics.suggestion}</p>
      </div>
    </div>
  );
}
