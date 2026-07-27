"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f97316", "#8b5cf6",
  "#ec4899", "#14b8a6", "#eab308", "#6366f1", "#84cc16",
];

export function CategoryPieChart({
  data,
}: {
  data: { category: string; count: number; label?: string }[];
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
        No data to display
      </div>
    );
  }

  const chartData = data
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((d, i) => ({
      name: d.label || d.category.replace(/_/g, " "),
      value: d.count,
      color: COLORS[i % COLORS.length],
    }));

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              background: "var(--glass-bg, rgba(255, 255, 255, 0.9))",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--glass-border, rgba(255, 255, 255, 0.18))",
              fontSize: "12px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {chartData.slice(0, 5).map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="capitalize">{entry.name}</span>
            <span className="text-muted-foreground">({entry.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
