import { useEffect, useState } from "react";
import {
  Swords,
  Sparkles,
  Search,
  ArrowLeftRight,
  Zap,
  Target,
} from "lucide-react";
import { MatchupAnalysis, PlayerProfile } from "../types";
import { fetchMatchup, fetchPlayers } from "../services/api";

interface MatchupExplorerProps {
  batter: string;
  bowler: string;
  setBatter: (b: string) => void;
  setBowler: (bo: string) => void;
}

const PRESET_DUELS = [
  { b: "V Kohli", bo: "JJ Bumrah", label: "King vs Yorker King" },
  { b: "RG Sharma", bo: "TA Boult", label: "Hitman vs Inswinger" },
  { b: "MS Dhoni", bo: "Rashid Khan", label: "Finisher vs Leg Spin" },
  { b: "AB de Villiers", bo: "SP Narine", label: "360° vs Mystery Spin" },
  { b: "DA Warner", bo: "R Ashwin", label: "Southpaw vs Carrom Ball" },
  { b: "AD Russell", bo: "Mohammed Shami", label: "Power vs Seam Pace" },
  { b: "SA Yadav", bo: "YS Chahal", label: "Sweep Master vs Leggie" },
  { b: "KL Rahul", bo: "B Kumar", label: "Anchor vs Swing Specialist" },
];

export const MatchupExplorer: React.FC<MatchupExplorerProps> = ({
  batter,
  bowler,
  setBatter,
  setBowler,
}) => {
  const [matchup, setMatchup] = useState<MatchupAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  // Autocomplete Player Lists
  const [batterQuery, setBatterQuery] = useState(batter);
  const [bowlerQuery, setBowlerQuery] = useState(bowler);
  const [batterOptions, setBatterOptions] = useState<PlayerProfile[]>([]);
  const [bowlerOptions, setBowlerOptions] = useState<PlayerProfile[]>([]);
  const [showBatterMenu, setShowBatterMenu] = useState(false);
  const [showBowlerMenu, setShowBowlerMenu] = useState(false);

  // Sync text queries with external props
  useEffect(() => {
    setBatterQuery(batter);
  }, [batter]);

  useEffect(() => {
    setBowlerQuery(bowler);
  }, [bowler]);

  // Load candidate players on search
  useEffect(() => {
    async function searchBatters() {
      try {
        const res = await fetchPlayers(batterQuery, "runs", 8);
        setBatterOptions(res.players);
      } catch (e) {
        console.error(e);
      }
    }
    const timer = setTimeout(searchBatters, 150);
    return () => clearTimeout(timer);
  }, [batterQuery]);

  useEffect(() => {
    async function searchBowlers() {
      try {
        const res = await fetchPlayers(bowlerQuery, "wickets", 8);
        setBowlerOptions(res.players);
      } catch (e) {
        console.error(e);
      }
    }
    const timer = setTimeout(searchBowlers, 150);
    return () => clearTimeout(timer);
  }, [bowlerQuery]);

  // Fetch matchup data
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

  function handleSwap() {
    const temp = batter;
    setBatter(bowler);
    setBowler(temp);
  }

  function selectBatter(name: string) {
    setBatter(name);
    setBatterQuery(name);
    setShowBatterMenu(false);
  }

  function selectBowler(name: string) {
    setBowler(name);
    setBowlerQuery(name);
    setShowBowlerMenu(false);
  }

  return (
    <div className="space-y-6 pb-20 pt-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-nexus-cyan/15 text-nexus-cyan border border-nexus-cyan/30 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-wide">
                Batter vs Bowler Duel Engine
              </h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Ball-by-ball head-to-head records, boundary frequency, dismissals & tactical edges
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-nexus-cyan bg-nexus-cyan/10 px-3 py-1.5 rounded-full border border-nexus-cyan/20">
          <Zap className="w-3.5 h-3.5" />
          <span>295,732 DELIVERIES EVALUATED</span>
        </div>
      </div>

      {/* Popular Presets Carousel / Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
        <span className="text-[10px] font-mono text-gray-400 block mb-2.5 uppercase tracking-wider font-bold">
          FEATURED RIVALRY DUELS
        </span>
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
          {PRESET_DUELS.map((p, idx) => {
            const isSelected = batter === p.b && bowler === p.bo;
            return (
              <button
                key={idx}
                onClick={() => {
                  setBatter(p.b);
                  setBowler(p.bo);
                }}
                className={`text-xs font-mono px-3 py-2 rounded-xl border whitespace-nowrap transition-all flex items-center space-x-2 ${
                  isSelected
                    ? "bg-nexus-cyan text-nexus-bg font-bold border-nexus-cyan shadow-[0_0_15px_rgba(0,240,255,0.35)]"
                    : "bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.07] text-gray-300"
                }`}
              >
                <span>{p.b}</span>
                <span className={`text-[10px] font-bold ${isSelected ? "text-nexus-bg" : "text-nexus-gold"}`}>vs</span>
                <span>{p.bo}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dual Searchable Player Autocomplete Comboboxes */}
      <div className="glass-panel rounded-3xl p-6 border border-white/[0.08]">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* Batter Autocomplete Picker (5 cols) */}
          <div className="md:col-span-5 relative">
            <label className="text-xs font-mono text-nexus-cyan block mb-2 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>SELECT BATTER (STRIKER)</span>
              <span className="text-[10px] text-gray-500 font-normal">Active: {batter}</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={batterQuery}
                onFocus={() => setShowBatterMenu(true)}
                onChange={(e) => {
                  setBatterQuery(e.target.value);
                  setShowBatterMenu(true);
                }}
                placeholder="Search batter (e.g. V Kohli)..."
                className="w-full bg-[#080D1A] border border-white/[0.12] focus:border-nexus-cyan rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white font-mono outline-none transition-colors"
              />
            </div>

            {/* Dropdown Menu */}
            {showBatterMenu && batterOptions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-[#0B1221] border border-white/[0.15] rounded-2xl shadow-2xl p-2 z-50 max-h-60 overflow-y-auto space-y-1">
                {batterOptions.map((p) => (
                  <div
                    key={p.player_name}
                    onClick={() => selectBatter(p.player_name)}
                    className={`p-2.5 rounded-xl cursor-pointer text-xs font-mono transition-all flex items-center justify-between ${
                      batter === p.player_name
                        ? "bg-nexus-cyan/15 text-nexus-cyan border border-nexus-cyan/30 font-bold"
                        : "text-gray-300 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{p.player_name}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {p.total_runs.toLocaleString()} runs • SR {p.strike_rate}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button (1 col) */}
          <div className="md:col-span-1 flex justify-center py-2 md:py-0">
            <button
              onClick={handleSwap}
              title="Swap Roles"
              className="w-10 h-10 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/[0.1] flex items-center justify-center transition-all shadow-md active:scale-95"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Bowler Autocomplete Picker (5 cols) */}
          <div className="md:col-span-5 relative">
            <label className="text-xs font-mono text-red-400 block mb-2 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>SELECT BOWLER</span>
              <span className="text-[10px] text-gray-500 font-normal">Active: {bowler}</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={bowlerQuery}
                onFocus={() => setShowBowlerMenu(true)}
                onChange={(e) => {
                  setBowlerQuery(e.target.value);
                  setShowBowlerMenu(true);
                }}
                placeholder="Search bowler (e.g. JJ Bumrah)..."
                className="w-full bg-[#080D1A] border border-white/[0.12] focus:border-red-400 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white font-mono outline-none transition-colors"
              />
            </div>

            {/* Dropdown Menu */}
            {showBowlerMenu && bowlerOptions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-[#0B1221] border border-white/[0.15] rounded-2xl shadow-2xl p-2 z-50 max-h-60 overflow-y-auto space-y-1">
                {bowlerOptions.map((p) => (
                  <div
                    key={p.player_name}
                    onClick={() => selectBowler(p.player_name)}
                    className={`p-2.5 rounded-xl cursor-pointer text-xs font-mono transition-all flex items-center justify-between ${
                      bowler === p.player_name
                        ? "bg-red-500/15 text-red-400 border border-red-500/30 font-bold"
                        : "text-gray-300 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{p.player_name}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {p.total_wickets} wkts • Econ {p.economy || "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Duel Arena Results */}
      {loading || !matchup ? (
        <div className="glass-panel rounded-3xl p-16 flex flex-col items-center justify-center space-y-4 min-h-[350px]">
          <div className="w-12 h-12 border-3 border-nexus-cyan border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-gray-400 tracking-wider">
            CROSS-EXAMINING DUCKDB HEAD-TO-HEAD MATRIX...
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Broadcast Arena Banner */}
          <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-b from-[#0B1326] to-[#070B14] border border-white/[0.09] shadow-2xl overflow-hidden">
            {/* Ambient Lighting */}
            <div className="absolute top-0 left-1/4 w-80 h-80 bg-nexus-cyan/10 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-[90px] pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              {/* Batter Box */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-nexus-cyan shadow-[0_0_8px_#00F0FF]"></span>
                  <span className="text-xs font-mono font-bold text-nexus-cyan uppercase tracking-wider">
                    BATTER
                  </span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {matchup.batter}
                </h3>
                <div className="text-xs font-mono text-gray-300 flex items-center space-x-2 pt-1">
                  <span className="text-white font-bold bg-white/[0.06] px-2.5 py-1 rounded-lg border border-white/[0.08]">
                    {matchup.runs_scored} Runs
                  </span>
                  <span>off</span>
                  <span className="text-nexus-cyan font-bold bg-nexus-cyan/10 px-2.5 py-1 rounded-lg border border-nexus-cyan/20">
                    {matchup.balls_faced} Balls
                  </span>
                </div>
              </div>

              {/* Center Clash Badge */}
              <div className="flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0F1C36] via-[#142347] to-[#0A1325] border border-white/[0.15] flex items-center justify-center font-black text-xl text-white shadow-2xl">
                  VS
                </div>
                <span className={`text-xs font-mono font-bold mt-3 px-4 py-1 rounded-full border shadow-md ${
                  matchup.tactical_edge.includes("Batter")
                    ? "bg-nexus-cyan/15 text-nexus-cyan border-nexus-cyan/30"
                    : matchup.tactical_edge.includes("Bowler")
                    ? "bg-red-500/15 text-red-400 border-red-500/30"
                    : "bg-nexus-gold/15 text-nexus-gold border-nexus-gold/30"
                }`}>
                  {matchup.tactical_edge}
                </span>
                <span className="text-[10px] font-mono text-gray-500 mt-1">
                  Sample: {matchup.sample_size} legal deliveries
                </span>
              </div>

              {/* Bowler Box */}
              <div className="flex-1 space-y-2 text-left md:text-right">
                <div className="flex items-center space-x-2 md:justify-end">
                  <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                    BOWLER
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#EF4444]"></span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {matchup.bowler}
                </h3>
                <div className="text-xs font-mono text-gray-300 flex items-center space-x-2 md:justify-end pt-1">
                  <span className="text-red-400 font-bold bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
                    {matchup.dismissals} Dismissals
                  </span>
                  <span>in</span>
                  <span className="text-white font-bold bg-white/[0.06] px-2.5 py-1 rounded-lg border border-white/[0.08]">
                    {matchup.sample_size} Balls
                  </span>
                </div>
              </div>
            </div>

            {/* AI Tactical Directive Card */}
            <div className="mt-8 pt-5 border-t border-white/[0.08] bg-white/[0.02] rounded-2xl p-5 border border-white/[0.05]">
              <div className="flex items-center space-x-2 text-nexus-cyan mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  Tactical Match-Up Intelligence Directive
                </span>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed font-mono">
                {matchup.recommendation}
              </p>
            </div>
          </div>

          {/* 4 Broadcast KPI Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] text-center">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                HEAD-TO-HEAD STRIKE RATE
              </span>
              <span className="text-3xl font-black font-mono text-nexus-cyan mt-1.5 block">
                {matchup.strike_rate.toFixed(1)}
              </span>
              <span className="text-[10px] font-mono text-gray-400 mt-1 block">
                {matchup.strike_rate >= 140 ? "Fast Scoring Advantage" : "Contained by Bowler"}
              </span>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] text-center">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                DISMISSAL THREAT
              </span>
              <span className="text-3xl font-black font-mono text-red-400 mt-1.5 block">
                {matchup.dismissals} <span className="text-xs text-gray-400 font-normal">outs</span>
              </span>
              <span className="text-[10px] font-mono text-gray-400 mt-1 block">
                Avg: {matchup.average ? matchup.average.toFixed(1) : "N/A"} runs / wkt
              </span>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] text-center">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                DOT BALL CHOKE %
              </span>
              <span className="text-3xl font-black font-mono text-nexus-gold mt-1.5 block">
                {matchup.dot_pct.toFixed(1)}%
              </span>
              <span className="text-[10px] font-mono text-gray-400 mt-1 block">
                {matchup.dots} dot deliveries
              </span>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] text-center">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                BOUNDARY EXPLOITATION
              </span>
              <span className="text-3xl font-black font-mono text-emerald-400 mt-1.5 block">
                {matchup.boundary_pct.toFixed(1)}%
              </span>
              <span className="text-[10px] font-mono text-gray-400 mt-1 block">
                {matchup.fours} Fours • {matchup.sixes} Sixes
              </span>
            </div>
          </div>

          {/* Phase-by-Phase Splits */}
          {matchup.phase_splits && (
            <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/[0.08]">
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
                  <Target className="w-4 h-4 text-nexus-cyan" />
                  <span>Phase-by-Phase Match-up Dominance</span>
                </h4>
                <span className="text-xs font-mono text-gray-400">
                  POWERPLAY • MIDDLE • DEATH
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Powerplay */}
                <div className="bg-[#090F1E] rounded-2xl p-5 border border-white/[0.06] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-nexus-cyan font-bold uppercase tracking-wider">
                      POWERPLAY (OV 0–5)
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-2xl font-black font-mono text-white">
                      {matchup.phase_splits.powerplay.runs} runs
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      off {matchup.phase_splits.powerplay.balls} balls
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400 block pt-1 border-t border-white/[0.04]">
                    Phase SR:{" "}
                    <span className="text-white font-bold">
                      {matchup.phase_splits.powerplay.balls > 0
                        ? ((matchup.phase_splits.powerplay.runs / matchup.phase_splits.powerplay.balls) * 100).toFixed(1)
                        : "0.0"}
                    </span>
                  </span>
                </div>

                {/* Middle */}
                <div className="bg-[#090F1E] rounded-2xl p-5 border border-white/[0.06] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-nexus-gold font-bold uppercase tracking-wider">
                      MIDDLE OVERS (OV 6–14)
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-2xl font-black font-mono text-white">
                      {matchup.phase_splits.middle.runs} runs
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      off {matchup.phase_splits.middle.balls} balls
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400 block pt-1 border-t border-white/[0.04]">
                    Phase SR:{" "}
                    <span className="text-white font-bold">
                      {matchup.phase_splits.middle.balls > 0
                        ? ((matchup.phase_splits.middle.runs / matchup.phase_splits.middle.balls) * 100).toFixed(1)
                        : "0.0"}
                    </span>
                  </span>
                </div>

                {/* Death */}
                <div className="bg-[#090F1E] rounded-2xl p-5 border border-white/[0.06] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider">
                      DEATH OVERS (OV 15–20)
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-2xl font-black font-mono text-white">
                      {matchup.phase_splits.death.runs} runs
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      off {matchup.phase_splits.death.balls} balls
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400 block pt-1 border-t border-white/[0.04]">
                    Phase SR:{" "}
                    <span className="text-white font-bold">
                      {matchup.phase_splits.death.balls > 0
                        ? ((matchup.phase_splits.death.runs / matchup.phase_splits.death.balls) * 100).toFixed(1)
                        : "0.0"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
