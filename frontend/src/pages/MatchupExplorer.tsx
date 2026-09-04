import { useEffect, useState } from "react";
import { Swords, Sparkles } from "lucide-react";
import { MatchupAnalysis } from "../types";
import { fetchMatchup } from "../services/api";

interface MatchupExplorerProps {
  batter: string;
  bowler: string;
  setBatter: (b: string) => void;
  setBowler: (bo: string) => void;
}

export const MatchupExplorer: React.FC<MatchupExplorerProps> = ({
  batter,
  bowler,
  setBatter,
  setBowler,
}) => {
  const [matchup, setMatchup] = useState<MatchupAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const presets = [
    { b: "V Kohli", bo: "JJ Bumrah" },
    { b: "RG Sharma", bo: "TA Boult" },
    { b: "MS Dhoni", bo: "Rashid Khan" },
    { b: "AB de Villiers", bo: "SP Narine" },
    { b: "DA Warner", bo: "R Ashwin" },
    { b: "S Dhawan", bo: "B Kumar" },
  ];

  useEffect(() => {
    async function loadData() {
      if (!batter || !bowler) return;
      setLoading(true);
      try {
        const res = await fetchMatchup(batter, bowler);
        setMatchup(res);
      } catch (e) {
        console.error("Error fetching matchup:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [batter, bowler]);

  return (
    <div className="space-y-8 pb-16 pt-2">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-wide flex items-center space-x-2.5">
          <Swords className="w-6 h-6 text-nexus-cyan" />
          <span>Batter vs Bowler Duel Engine</span>
        </h2>
        <p className="text-xs text-gray-400 font-mono mt-1">
          Direct head-to-head delivery records, phase dominance, and tactical deployment recommendations
        </p>
      </div>

      {/* Preset Duels bar */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs font-mono text-gray-400 whitespace-nowrap uppercase tracking-wider">
          POPULAR DUELS:
        </span>
        {presets.map((p, i) => (
          <button
            key={i}
            onClick={() => {
              setBatter(p.b);
              setBowler(p.bo);
            }}
            className={`text-xs font-mono px-3.5 py-1.5 rounded-xl border whitespace-nowrap transition-all ${
              batter === p.b && bowler === p.bo
                ? "bg-nexus-cyan text-nexus-bg font-bold border-nexus-cyan shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                : "bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] text-gray-300"
            }`}
          >
            {p.b} vs {p.bo}
          </button>
        ))}
      </div>

      {/* Dual Selectors Card */}
      <div className="glass-panel rounded-3xl p-6 border border-white/[0.08]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-mono text-nexus-cyan block mb-2 font-bold uppercase tracking-wider">
              SELECT BATTER
            </label>
            <input
              type="text"
              value={batter}
              onChange={(e) => setBatter(e.target.value)}
              placeholder="e.g. V Kohli"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-2xl px-4 py-3 text-sm text-white font-mono focus:border-nexus-cyan outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-red-400 block mb-2 font-bold uppercase tracking-wider">
              SELECT BOWLER
            </label>
            <input
              type="text"
              value={bowler}
              onChange={(e) => setBowler(e.target.value)}
              placeholder="e.g. JJ Bumrah"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-2xl px-4 py-3 text-sm text-white font-mono focus:border-red-400 outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {loading || !matchup ? (
        <div className="glass-panel rounded-3xl p-12 flex flex-col items-center justify-center space-y-3 min-h-[400px]">
          <div className="w-10 h-10 border-3 border-nexus-cyan border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-gray-400 tracking-wider">
            ANALYZING BALL-BY-BALL HISTORICAL INTERACTION...
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Broadcast Duel Banner */}
          <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              {/* Batter info */}
              <div className="flex-1">
                <span className="text-xs font-mono text-nexus-cyan font-bold tracking-wider uppercase block mb-1">
                  STRIKER
                </span>
                <h3 className="text-3xl font-black text-white tracking-tight">{matchup.batter}</h3>
                <div className="mt-2 text-xs font-mono text-gray-400">
                  <span className="text-white font-bold">{matchup.runs_scored} runs</span> scored off{" "}
                  <span className="text-white font-bold">{matchup.balls_faced} balls</span>
                </div>
              </div>

              {/* Center VS Telemetry */}
              <div className="flex flex-col items-center justify-center text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0D1527] to-[#152340] border border-white/[0.12] flex items-center justify-center font-black text-lg text-white shadow-xl">
                  VS
                </div>
                <span className="text-xs font-mono font-bold text-nexus-gold mt-3 bg-nexus-gold/10 px-3.5 py-1 rounded-full border border-nexus-gold/30">
                  {matchup.tactical_edge}
                </span>
              </div>

              {/* Bowler info */}
              <div className="flex-1 text-left md:text-right">
                <span className="text-xs font-mono text-red-400 font-bold tracking-wider uppercase block mb-1">
                  BOWLER
                </span>
                <h3 className="text-3xl font-black text-white tracking-tight">{matchup.bowler}</h3>
                <div className="mt-2 text-xs font-mono text-gray-400">
                  <span className="text-red-400 font-bold">{matchup.dismissals} dismissals</span> in{" "}
                  <span className="text-white font-bold">{matchup.sample_size} deliveries</span>
                </div>
              </div>
            </div>

            {/* Tactical AI Recommendation Box */}
            <div className="mt-8 pt-5 border-t border-white/[0.08] bg-white/[0.02] rounded-2xl p-4 border border-white/[0.05]">
              <div className="flex items-center space-x-2 text-nexus-cyan mb-1.5">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  AI Tactical Decision Recommendation
                </span>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed font-normal">
                {matchup.recommendation}
              </p>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] text-center">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                HEAD-TO-HEAD SR
              </span>
              <span className="text-2xl font-black font-mono text-nexus-cyan mt-1 block">
                {matchup.strike_rate.toFixed(1)}
              </span>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] text-center">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                DISMISSALS
              </span>
              <span className="text-2xl font-black font-mono text-red-400 mt-1 block">
                {matchup.dismissals}
              </span>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] text-center">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                DOT BALL %
              </span>
              <span className="text-2xl font-black font-mono text-nexus-gold mt-1 block">
                {matchup.dot_pct.toFixed(1)}%
              </span>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] text-center">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                BOUNDARIES
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
                {matchup.fours} 4s • {matchup.sixes} 6s
              </span>
            </div>
          </div>

          {/* Phase Splits */}
          {matchup.phase_splits && (
            <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/[0.08]">
              <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono">
                Phase-by-Phase Breakdown
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/[0.06]">
                  <span className="text-xs font-mono text-nexus-cyan block font-bold uppercase tracking-wider">
                    POWERPLAY (OV 0-5)
                  </span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-2xl font-black font-mono text-white">
                      {matchup.phase_splits.powerplay.runs} runs
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      ({matchup.phase_splits.powerplay.balls} balls)
                    </span>
                  </div>
                </div>

                <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/[0.06]">
                  <span className="text-xs font-mono text-nexus-gold block font-bold uppercase tracking-wider">
                    MIDDLE OVERS (OV 6-14)
                  </span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-2xl font-black font-mono text-white">
                      {matchup.phase_splits.middle.runs} runs
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      ({matchup.phase_splits.middle.balls} balls)
                    </span>
                  </div>
                </div>

                <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/[0.06]">
                  <span className="text-xs font-mono text-red-400 block font-bold uppercase tracking-wider">
                    DEATH OVERS (OV 15-20)
                  </span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-2xl font-black font-mono text-white">
                      {matchup.phase_splits.death.runs} runs
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      ({matchup.phase_splits.death.balls} balls)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
