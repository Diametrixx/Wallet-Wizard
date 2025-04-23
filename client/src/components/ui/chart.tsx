import * as React from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface ChartProps {
  data: any[];
  type: "area" | "line" | "bar" | "pie";
  height?: number;
  colors?: string[];
  dataKey?: string;
  nameKey?: string;
  secondaryDataKey?: string;
  xAxisDataKey?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showLegend?: boolean;
  className?: string;
}

export function Chart({
  data,
  type = "line",
  height = 300,
  colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"],
  dataKey = "value",
  nameKey = "name",
  secondaryDataKey,
  xAxisDataKey = "date",
  showGrid = true,
  showTooltip = true,
  showXAxis = true,
  showYAxis = true,
  showLegend = false,
  className,
}: ChartProps) {
  const renderChart = () => {
    switch (type) {
      case "area":
        return (
          <AreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />}
            {showXAxis && <XAxis dataKey={xAxisDataKey} stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />}
            {showYAxis && <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />}
            {showTooltip && <Tooltip contentStyle={{ backgroundColor: "#1E1E1E", borderColor: "rgba(255,255,255,0.1)" }} />}
            <Area type="monotone" dataKey={dataKey} stroke={colors[0]} fill={colors[0]} fillOpacity={0.2} />
            {secondaryDataKey && <Area type="monotone" dataKey={secondaryDataKey} stroke={colors[1]} fill={colors[1]} fillOpacity={0.2} />}
          </AreaChart>
        );
      case "line":
        return (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />}
            {showXAxis && <XAxis dataKey={xAxisDataKey} stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />}
            {showYAxis && <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />}
            {showTooltip && <Tooltip contentStyle={{ backgroundColor: "#1E1E1E", borderColor: "rgba(255,255,255,0.1)" }} />}
            <Line type="monotone" dataKey={dataKey} stroke={colors[0]} strokeWidth={2} dot={{ fill: colors[0], r: 4 }} />
            {secondaryDataKey && <Line type="monotone" dataKey={secondaryDataKey} stroke={colors[1]} strokeWidth={2} dot={{ fill: colors[1], r: 4 }} />}
          </LineChart>
        );
      case "bar":
        return (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />}
            {showXAxis && <XAxis dataKey={xAxisDataKey} stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />}
            {showYAxis && <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />}
            {showTooltip && <Tooltip contentStyle={{ backgroundColor: "#1E1E1E", borderColor: "rgba(255,255,255,0.1)" }} />}
            <Bar dataKey={dataKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
            {secondaryDataKey && <Bar dataKey={secondaryDataKey} fill={colors[1]} radius={[4, 4, 0, 0]} />}
          </BarChart>
        );
      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey={nameKey}
              label={(entry) => entry[nameKey]}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip contentStyle={{ backgroundColor: "#1E1E1E", borderColor: "rgba(255,255,255,0.1)" }} />}
            {showLegend && <Legend />}
          </PieChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
