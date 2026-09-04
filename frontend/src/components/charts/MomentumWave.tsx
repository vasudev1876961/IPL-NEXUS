import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface MomentumPoint {
  innings: number;
  over: number;
  win_prob: number;
  pressure: number;
  runs: number;
  wickets: number;
}

interface MomentumWaveProps {
  data: MomentumPoint[];
  title?: string;
  battingTeam?: string;
  bowlingTeam?: string;
}

export const MomentumWave: React.FC<MomentumWaveProps> = ({
  data,
  title = "Match Momentum Wave & Win Probability Evolution",
  battingTeam = "Batting Side",
  bowlingTeam = "Bowling Side",
}) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-nexus-border relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
          <p className="text-xs text-gray-400 font-mono">
            Over-by-over probability trajectory conditioned on pressure
          </p>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-nexus-cyan"></span>
            <span className="text-gray-300">Win Prob %</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-nexus-gold"></span>
            <span className="text-gray-300">Pressure Index</span>
          </div>
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="pressureGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1E2D4D" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="over"
              tick={{ fill: "#6B7280", fontSize: 11, fontFamily: "JetBrains Mono" }}
              tickFormatter={(val) => `Ov ${val}`}
              axisLine={{ stroke: "#1E2D4D" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#6B7280", fontSize: 11, fontFamily: "JetBrains Mono" }}
              axisLine={{ stroke: "#1E2D4D" }}
            />
            <ReferenceLine y={50} stroke="#4B5563" strokeDasharray="3 3" label={{ value: "50% Even", fill: "#6B7280", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0D1527",
                borderColor: "#1E2D4D",
                borderRadius: "8px",
                fontFamily: "Outfit",
                fontSize: "12px",
              }}
              formatter={(val: any, name: any) => [
                name === "win_prob" ? `${val}%` : `${val} / 100`,
                name === "win_prob" ? `${battingTeam} Win Prob` : `${bowlingTeam} Pressure Indicator`,
              ]}
              labelFormatter={(label) => `Over ${label}`}
            />
            <Area
              type="monotone"
              dataKey="win_prob"
              stroke="#00F0FF"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#probGradient)"
            />
            <Area
              type="monotone"
              dataKey="pressure"
              stroke="#F59E0B"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#pressureGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
