import { Gauge, Sparkles, AlertTriangle } from "lucide-react";
import { CounterfactualScenario } from "../../types";

interface WinProbGaugeProps {
  battingTeam: string;
  bowlingTeam: string;
  battingProb: number;
  bowlingProb: number;
  confidence: number;
  pressureIndex: number;
  counterfactuals?: CounterfactualScenario[];
}

export const WinProbGauge: React.FC<WinProbGaugeProps> = ({
  battingTeam,
  bowlingTeam,
  battingProb,
  bowlingProb,
  confidence,
  pressureIndex,
  counterfactuals = [],
}) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-nexus-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Gauge className="w-5 h-5 text-nexus-cyan" />
          <h3 className="text-base font-bold text-white tracking-wide">
            Calibrated Win Probability
          </h3>
        </div>
        <div className="flex items-center space-x-2 bg-nexus-surface px-3 py-1 rounded-full border border-nexus-border">
          <span className="text-[11px] font-mono text-gray-400">Confidence:</span>
          <span className="text-xs font-mono font-bold text-nexus-emerald">
            {confidence.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Win probability bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-semibold">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-nexus-cyan shadow-glow"></span>
            <span className="text-white">{battingTeam}</span>
            <span className="text-nexus-cyan font-mono font-bold text-lg">
              {battingProb.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-nexus-rose font-mono font-bold text-lg">
              {bowlingProb.toFixed(1)}%
            </span>
            <span className="text-gray-300">{bowlingTeam}</span>
            <span className="w-3 h-3 rounded-full bg-nexus-rose shadow-glow-rose"></span>
          </div>
        </div>

        {/* Visual percentage meter */}
        <div className="h-4 w-full bg-nexus-card rounded-full overflow-hidden p-0.5 border border-nexus-border flex">
          <div
            style={{ width: `${battingProb}%` }}
            className="h-full bg-gradient-to-r from-nexus-cyan to-nexus-electric rounded-l-full transition-all duration-700 shadow-glow"
          />
          <div
            style={{ width: `${bowlingProb}%` }}
            className="h-full bg-gradient-to-r from-nexus-rose to-red-600 rounded-r-full transition-all duration-700"
          />
        </div>
      </div>

      {/* Pressure Meter */}
      <div className="mt-4 p-3 rounded-xl bg-nexus-surface/60 border border-nexus-border/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className={`p-1.5 rounded-lg ${pressureIndex >= 70 ? "bg-nexus-rose/20 text-nexus-rose" : "bg-nexus-gold/20 text-nexus-gold"}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-mono">DYNAMIC PRESSURE INDEX (DPI)</span>
            <span className="text-sm font-bold text-white tracking-wide">
              {pressureIndex >= 70 ? "CRITICAL CRUNCH STAGE" : "MODERATE PRESSURE"}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xl font-mono font-extrabold ${pressureIndex >= 70 ? "text-nexus-rose" : "text-nexus-gold"}`}>
            {pressureIndex.toFixed(1)}
          </span>
          <span className="text-[10px] text-gray-400 block font-mono">/ 100</span>
        </div>
      </div>

      {/* Counterfactual Explanations */}
      {counterfactuals.length > 0 && (
        <div className="mt-4 pt-3 border-t border-nexus-border/60">
          <div className="flex items-center space-x-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-nexus-gold" />
            <span className="text-[11px] font-mono uppercase text-gray-300 tracking-wider">
              Explainable AI Counterfactual Sensitivity
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {counterfactuals.map((cf, idx) => {
              const isNegative = cf.impact.startsWith("-");
              return (
                <div
                  key={idx}
                  className="bg-nexus-surface/80 rounded-lg p-2.5 border border-nexus-border hover:border-nexus-border/80 transition-all"
                >
                  <span className="text-[10px] text-gray-400 block truncate">{cf.scenario}</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-mono font-bold text-white">
                      {cf.projected_win_prob.toFixed(1)}%
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                        isNegative
                          ? "bg-red-500/10 text-nexus-rose"
                          : "bg-emerald-500/10 text-nexus-emerald"
                      }`}
                    >
                      {cf.impact}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
