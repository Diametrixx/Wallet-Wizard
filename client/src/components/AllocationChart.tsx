import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface AllocationData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface AllocationChartProps {
  title: string;
  titleColor: string;
  allocationData: AllocationData[];
}

export default function AllocationChart({ title, titleColor, allocationData }: AllocationChartProps) {
  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="cyber-card bg-cyber-dark/90 p-2 border border-white/20 text-sm">
          <p className="text-white font-bold">{data.name}</p>
          <p className="text-cyber-yellow">{data.percentage}%</p>
          <p className="text-gray-300">${data.value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="cyber-card p-6 glow-border">
      <h3 className={`font-pixel text-sm ${titleColor} mb-4`}>{title}</h3>
      <div className="h-48 bg-cyber-dark/30 rounded-md mb-4 flex items-center justify-center border border-white/10">
        {allocationData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                labelLine={false}
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-gray-400">
            <svg className="w-8 h-8 mx-auto mb-2 text-cyber-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <p className="text-sm">No allocation data available</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {allocationData.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: item.color }}></div>
            <span className="text-xs">{item.name} ({item.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
