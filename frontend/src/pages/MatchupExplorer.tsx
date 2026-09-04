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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-wide flex items-center space-x-2">
          <Swords className="w-6 h-6 text-nexus-cyan" />
          <span>Batter vs Bowler Duel Engine</span>
        </h2>
        <p className="text-xs text-gray-400 font-mono mt-0.5">
          Micro-level head-to-head delivery telemetry, phase splits, and tactical advantage detection
        </p>
      </div>

      {/* Preset Duels bar */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs font-mono text-gray-400 whitespace-nowrap">POPULAR DUELS:</span>
        {presets.map((p, i) => (
          <button
            key={i}
            onClick={() => {
              setBatter(p.b);
              setBowler(p.bo);
            }}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all ${
              batter === p.b && bowler === p.bo
                ? "bg-nexus-cyan text-nexus-bg font-bold border-nexus-cyan"
                : "bg-nexus-surface/80 hover:bg-nexus-card border-nexus-border text-gray-300"
            }`}
          >
            {p.b} vs {p.bo}
          </button>
        ))}
      </div>

      {/* Selectors card */}
      <div className="glass-panel rounded-2xl p-5 border border-nexus-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-mono text-nexus-cyan block mb-1 font-bold">
              SELECT BATTER
            </label>
            <input
              type="text"
              value={batter}
              onChange={(e) => setBatter(e.target.value)}
              placeholder="e.g. V Kohli"
              className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-nexus-cyan outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-nexus-rose block mb-1 font-bold">
              SELECT BOWLER
            </label>
            <input
              type="text"
              value={bowler}
              onChange={(e) => setBowler(e.target.value)}
              placeholder="e.g. JJ Bumrah"
              className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-nexus-rose outline-none"
            />
          </div>
        </div>
      </div>

      {loading || !matchup ? (
        <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-nexus-cyan border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-gray-400">ANALYZING BALL-BY-BALL MATCHUPS...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Duel Banner */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 border border-nexus-border relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Batter info */}
              <div className="flex-1">
                <span className="text-xs font-mono text-nexus-cyan font-bold block mb-1">STRIKER</span>
                <h3 className="text-3xl font-black text-white">{matchup.batter}</h3>
                <div className="mt-2 text-xs font-mono text-gray-400">
                  {matchup.runs_scored} runs off {matchup.balls_faced} balls
                </div>
              </div>

              {/* Center VS Telemetry */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-nexus-surface border border-nexus-border flex items-center justify-center font-black text-gray-300">
                  VS
                </div>
                <span className="text-xs font-mono text-nexus-gold font-bold mt-2 bg-nexus-gold/10 px-3 py-1 rounded-full border border-nexus-gold/30">
                  {matchup.tactical_edge}
                </span>
              </div>

              {/* Bowler info */}
              <div className="flex-1 text-left md:text-right">
                <span className="text-xs font-mono text-nexus-rose font-bold block mb-1">BOWLER</span>
                <h3 className="text-3xl font-black text-white">{matchup.bowler}</h3>
                <div className="mt-2 text-xs font-mono text-gray-400">
                  {matchup.dismissals} dismissals in {matchup.sample_size} deliveries
                </div>
              </div>
            </div>

            {/* Tactical Recommendation Box */}
            <div className="mt-6 pt-5 border-t border-nexus-border/60 bg-nexus-surface/60 rounded-2xl p-4 border border-nexus-border">
              <div className="flex items-center space-x-2 text-nexus-cyan mb-1.5">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  AI Tactical Decision Recommendation
                </span>
              </div>
              <p className="text-sm text-gray-200">{matchup.recommendation}</p>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-4 border border-nexus-border text-center">
              <span className="text-[10px] font-mono text-gray-400 uppercase block">HEAD-TO-HEAD SR</span>
              <span className="text-2xl font-black font-mono text-nexus-cyan mt-1 block">
                {matchup.strike_rate.toFixed(1)}
              </span>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-nexus-border text-center">
              <span className="text-[10px] font-mono text-gray-400 uppercase block">DISMISSALS</span>
              <span className="text-2xl font-black font-mono text-nexus-rose mt-1 block">
                {matchup.dismissals}
              </span>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-nexus-border text-center">
              <span className="text-[10px] font-mono text-gray-400 uppercase block">DOT BALL %</span>
              <span className="text-2xl font-black font-mono text-nexus-gold mt-1 block">
                {matchup.dot_pct.toFixed(1)}%
              </span>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-nexus-border text-center">
              <span className="text-[10px] font-mono text-gray-400 uppercase block">BOUNDARIES</span>
              <span className="text-2xl font-black font-mono text-nexus-emerald mt-1 block">
                {matchup.fours} 4s • {matchup.sixes} 6s
              </span>
            </div>
          </div>

          {/* Phase Splits */}
          {matchup.phase_splits && (
            <div className="glass-panel rounded-2xl p-6 border border-nexus-border">
              <h4 className="text-sm font-bold text-white mb-4">Phase-by-Phase Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-nexus-surface/80 rounded-xl p-4 border border-nexus-border">
                  <span className="text-xs font-mono text-nexus-cyan block font-bold">POWERPLAY (OV 0-5)</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-xl font-bold font-mono text-white">
                      {matchup.phase_splits.powerplay.runs} runs
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      ({matchup.phase_splits.powerplay.balls} balls)
                    </span>
                  </div>
                </div>
                <div className="bg-nexus-surface/80 rounded-xl p-4 border border-nexus-border">
                  <span className="text-xs font-mono text-nexus-gold block font-bold">MIDDLE (OV 6-14)</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-xl font-bold font-mono text-white">
                      {matchup.phase_splits.middle.runs} runs
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      ({matchup.phase_splits.middle.balls} balls)
                    </span>
                  </div>
                </div>
                <div className="bg-nexus-surface/80 rounded-xl p-4 border border-nexus-border">
                  <span className="text-xs font-mono text-nexus-rose block font-bold">DEATH (OV 15-20)</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-xl font-bold font-mono text-white">
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
