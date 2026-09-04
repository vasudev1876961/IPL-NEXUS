import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ScoreDistributionChartProps {
  data: Array<{ score_range: string; count: number }>;
  expectedScore: number;
  confidenceInterval: [number, number];
}

export const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({
  data,
  expectedScore,
  confidenceInterval,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-nexus-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">
            10,000-Run Monte Carlo Outcome Distribution
          </h3>
          <p className="text-xs text-gray-400 font-mono">
            Frequency distribution of projected final match scores
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="bg-nexus-surface px-2.5 py-1 rounded-md border border-nexus-border">
            <span className="text-gray-400">Median: </span>
            <span className="text-nexus-cyan font-bold">{expectedScore}</span>
          </div>
          <div className="bg-nexus-surface px-2.5 py-1 rounded-md border border-nexus-border">
            <span className="text-gray-400">90% Range: </span>
            <span className="text-nexus-gold font-bold">
              {confidenceInterval[0]} - {confidenceInterval[1]}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#1E2D4D" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="score_range"
              tick={{ fill: "#6B7280", fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={{ stroke: "#1E2D4D" }}
            />
            <YAxis
              tick={{ fill: "#6B7280", fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={{ stroke: "#1E2D4D" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0D1527",
                borderColor: "#1E2D4D",
                borderRadius: "8px",
                fontFamily: "Outfit",
                fontSize: "12px",
              }}
              formatter={(val: any) => [`${val} simulations`, "Frequency"]}
              labelFormatter={(label) => `Score range: ${label}`}
            />
            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
