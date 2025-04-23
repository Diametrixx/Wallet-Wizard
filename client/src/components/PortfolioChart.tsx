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

interface PortfolioChartProps {
  timeSeriesData: Array<{
    date: string;
    value: number;
  }>;
}

export default function PortfolioChart({ timeSeriesData }: PortfolioChartProps) {
  // Process data for the chart - only show every 7th data point to avoid overcrowding
  const chartData = useMemo(() => {
    if (timeSeriesData.length === 0) return [];
    
    const interval = Math.max(1, Math.floor(timeSeriesData.length / 15));
    return timeSeriesData.filter((_, i) => i % interval === 0 || i === timeSeriesData.length - 1);
  }, [timeSeriesData]);

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="cyber-card bg-cyber-dark/90 p-2 border border-white/20 text-sm">
          <p className="text-gray-300">{label}</p>
          <p className="text-cyber-green font-bold">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="cyber-card p-6 glow-border">
      <h3 className="font-pixel text-sm text-cyber-blue mb-4">PORTFOLIO VALUE OVER TIME</h3>
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
              tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
              tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
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
