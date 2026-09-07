import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { PlayerDNAAxis } from "../../types";

interface DualRadarCompareProps {
  player1Name: string;
  player1Role: string;
  player1Axes: PlayerDNAAxis[];
  player2Name: string;
  player2Role: string;
  player2Axes: PlayerDNAAxis[];
}

export const DualRadarCompare: React.FC<DualRadarCompareProps> = ({
  player1Name,
  player1Role,
  player1Axes,
  player2Name,
  player2Role,
  player2Axes,
}) => {
  // Combine axes into single radar dataset
  const combinedData = player1Axes.map((ax1, i) => {
    const ax2 = player2Axes.find((a) => a.axis === ax1.axis) || player2Axes[i];
    return {
      axis: ax1.axis,
      [player1Name]: ax1.value,
      [player2Name]: ax2 ? ax2.value : 0,
    };
  });

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] relative overflow-hidden space-y-4">
      {/* Glow effects */}
      <div className="absolute -top-16 -left-16 w-56 h-56 bg-nexus-cyan/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-nexus-gold/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with dual badge legends */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block">
            DUAL-POLYGON SITUATIONAL MATRIX
          </span>
          <h3 className="text-lg font-black text-white">Comparative 10-Axis Radar</h3>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-nexus-cyan/10 border border-nexus-cyan/30 px-3 py-1 rounded-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-nexus-cyan shadow-[0_0_8px_#00F0FF]"></span>
            <span className="text-xs font-bold text-white">{player1Name}</span>
            <span className="text-[10px] font-mono text-nexus-cyan">({player1Role})</span>
          </div>

          <span className="text-xs font-mono font-bold text-gray-500">VS</span>

          <div className="flex items-center space-x-2 bg-nexus-gold/10 border border-nexus-gold/30 px-3 py-1 rounded-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-nexus-gold shadow-[0_0_8px_#F59E0B]"></span>
            <span className="text-xs font-bold text-white">{player2Name}</span>
            <span className="text-[10px] font-mono text-nexus-gold">({player2Role})</span>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={combinedData}>
            <PolarGrid stroke="#1E2D4D" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "Outfit" }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "#4B5563", fontSize: 9 }}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#080D1A",
                borderColor: "#1E2D4D",
                borderRadius: "12px",
                color: "#F3F4F6",
                fontSize: "12px",
                fontFamily: "Outfit",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              }}
              formatter={(val: any, name: any) => [`${val} / 100`, name]}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", fontFamily: "Outfit", paddingTop: "8px" }}
            />
            <Radar
              name={player1Name}
              dataKey={player1Name}
              stroke="#00F0FF"
              fill="#00F0FF"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Radar
              name={player2Name}
              dataKey={player2Name}
              stroke="#F59E0B"
              fill="#F59E0B"
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Axis Delta Matrix Grid */}
      <div className="pt-2 border-t border-white/[0.08]">
        <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2">
          Dimension-by-Dimension Edge Analysis
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {combinedData.map((d) => {
            const val1 = Number(d[player1Name]) || 0;
            const val2 = Number(d[player2Name]) || 0;
            const diff = Math.round((val1 - val2) * 10) / 10;
            const isP1Leading = diff > 0;
            const isTie = diff === 0;

            return (
              <div
                key={d.axis}
                className="bg-[#080D1A] rounded-xl p-2.5 border border-white/[0.06] text-center"
              >
                <span className="text-[10px] font-mono text-gray-400 block truncate">
                  {d.axis}
                </span>
                <div className="flex items-center justify-center space-x-1.5 mt-1">
                  <span className="text-xs font-mono font-bold text-nexus-cyan">{val1}</span>
                  <span className="text-[10px] text-gray-500">|</span>
                  <span className="text-xs font-mono font-bold text-nexus-gold">{val2}</span>
                </div>
                <div className="mt-1">
                  {isTie ? (
                    <span className="text-[9px] font-mono text-gray-500">Even</span>
                  ) : isP1Leading ? (
                    <span className="text-[9px] font-mono text-nexus-cyan font-bold">
                      +{diff} P1
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-nexus-gold font-bold">
                      +{Math.abs(diff)} P2
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
