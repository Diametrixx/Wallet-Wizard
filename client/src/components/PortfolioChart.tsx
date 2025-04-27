import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/wallet-utils";
import { Portfolio } from "@shared/schema";

interface PortfolioChartProps {
  portfolio: Portfolio;
  timeFrame?: "all" | "year" | "sixMonths" | "threeMonths";
}

export default function PortfolioChart({ portfolio, timeFrame = "all" }: PortfolioChartProps) {
  // Get the appropriate time series data based on the selected time frame
  const getTimeSeriesData = useMemo(() => {
    if (portfolio.timeFrames && portfolio.timeFrames.length > 0) {
      const selectedTimeFrame = portfolio.timeFrames.find(tf => tf.period === timeFrame);
      if (selectedTimeFrame) {
        return selectedTimeFrame.timeSeriesData;
      }
    }
    
    // If no time frame data found or timeFrames is not set, use default
    return portfolio.timeSeriesData;
  }, [portfolio, timeFrame]);
  
  // Format the chart data - sample points to avoid overcrowding
  const chartData = useMemo(() => {
    if (getTimeSeriesData.length === 0) return [];
    
    const interval = Math.max(1, Math.floor(getTimeSeriesData.length / 15));
    return getTimeSeriesData.filter((_, i) => i % interval === 0 || i === getTimeSeriesData.length - 1);
  }, [getTimeSeriesData]);
  
  // Get chart title based on timeframe
  const getChartTitle = () => {
    switch(timeFrame) {
      case "all": return "ALL-TIME PORTFOLIO VALUE";
      case "year": return "1 YEAR PORTFOLIO VALUE";
      case "sixMonths": return "6 MONTH PORTFOLIO VALUE";
      case "threeMonths": return "3 MONTH PORTFOLIO VALUE";
      default: return "PORTFOLIO VALUE OVER TIME";
    }
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="cyber-card bg-cyber-dark/90 p-2 border border-white/20 text-sm">
          <p className="text-gray-300">{new Date(label).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
          <p className="text-cyber-green font-bold">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="cyber-card p-6 glow-border">
      <h3 className="font-pixel text-sm text-cyber-blue mb-4">{getChartTitle()}</h3>
      <div className="h-64 bg-cyber-dark/30 rounded-md border border-white/10 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis 
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
              tickFormatter={(value) => {
                if (value >= 1000) {
                  return `$${Math.round(value / 1000)}k`;
                }
                return `$${Math.round(value)}`;
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#00FFAA" 
              strokeWidth={2}
              dot={{ fill: '#00FFAA', r: 1 }}
              activeDot={{ r: 5, fill: '#00EEFF' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
