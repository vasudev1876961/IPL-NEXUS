import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { PlayerDNAAxis } from "../../types";

interface PlayerDNARadarProps {
  playerName: string;
  role: string;
  archetype: string;
  axes: PlayerDNAAxis[];
}

export const PlayerDNARadar: React.FC<PlayerDNARadarProps> = ({
  playerName,
  role,
  archetype,
  axes,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-nexus-border relative overflow-hidden">
      {/* Background neon flare */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-nexus-cyan/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-white tracking-wide">
              {playerName}
            </h3>
            <span className="bg-nexus-cyan/15 text-nexus-cyan text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-nexus-cyan/30">
              {role.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-nexus-gold font-mono tracking-wide mt-0.5">
            Archetype: {archetype}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-gray-400 block">
            10-DIMENSIONAL DNA
          </span>
          <span className="text-xs font-semibold text-gray-300">
            Normalized (0–100)
          </span>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={axes}>
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
                backgroundColor: "#0D1527",
                borderColor: "#1E2D4D",
                borderRadius: "8px",
                color: "#F3F4F6",
                fontSize: "12px",
                fontFamily: "Outfit",
              }}
              formatter={(val: any) => [`${val} / 100`, "Rating"]}
            />
            <Radar
              name={playerName}
              dataKey="value"
              stroke="#00F0FF"
              fill="#00F0FF"
              fillOpacity={0.35}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2 pt-3 border-t border-nexus-border/60">
        {axes.slice(0, 5).map((ax) => (
          <div key={ax.axis} className="bg-nexus-surface/60 rounded-lg p-2 text-center">
            <span className="text-[10px] text-gray-400 block truncate">{ax.axis}</span>
            <span className="text-xs font-mono font-bold text-nexus-cyan">{ax.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
