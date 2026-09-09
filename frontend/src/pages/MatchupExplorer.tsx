import { useEffect, useState } from "react";
import {
  Swords,
  Sparkles,
  Search,
  ArrowLeftRight,
  Zap,
  Target,
  ShieldAlert,
  Flame,
  Activity,
  Calendar,
  Compass,
  BarChart3,
  Crosshair,
} from "lucide-react";
import {
  MatchupAnalysis,
  PlayerProfile,
  DuelDelivery,
} from "../types";
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

  // Filter state for delivery log
  const [deliveryFilter, setDeliveryFilter] = useState<"all" | "boundaries" | "wickets" | "crunch" | "dots">("all");
  const [selectedDelivery, setSelectedDelivery] = useState<DuelDelivery | null>(null);

  // Active section view
  const [viewTab, setViewTab] = useState<"overview" | "reel" | "blueprint" | "anatomy" | "venues">("overview");

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
      setSelectedDelivery(null);
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

  // Filtered deliveries list
  const filteredDeliveries = (matchup?.delivery_log || []).filter((d) => {
    if (deliveryFilter === "boundaries") return d.is_boundary;
    if (deliveryFilter === "wickets") return d.is_wicket;
    if (deliveryFilter === "crunch") return d.pressure_index >= 60.0;
    if (deliveryFilter === "dots") return d.is_dot;
    return true;
  });

  return (
    <div className="space-y-6 pb-20 pt-1">
      {/* ========================================================= */}
      {/* 1. BROADCAST HEADLINE & STATUS BANNER                      */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-nexus-cyan/20 to-nexus-electric/20 text-nexus-cyan border border-nexus-cyan/30 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Matchup Battlefield 2.0
              </h2>
              <span className="hidden sm:inline-block bg-nexus-cyan/15 text-nexus-cyan text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-nexus-cyan/30 font-bold tracking-wider uppercase">
                PRO FIGHT-CARD
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              Ball-by-ball encounter telemetry, dismissal anatomy, pressure crucible splits & tactical AI blueprint
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs font-mono text-nexus-cyan bg-nexus-cyan/10 px-3.5 py-1.5 rounded-xl border border-nexus-cyan/20 shadow-sm">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            <span>295,732 DELIVERIES EVALUATED</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. POPULAR PRESET RIVALRY DUELS                           */}
      {/* ========================================================= */}
      <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5 text-nexus-gold" />
            <span>FEATURED RIVALRY DUELS</span>
          </span>
          <span className="text-[10px] font-mono text-gray-500">Quick-load iconic IPL battles</span>
        </div>
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
                className={`text-xs font-mono px-3.5 py-2 rounded-xl border whitespace-nowrap transition-all flex items-center space-x-2.5 ${
                  isSelected
                    ? "bg-gradient-to-r from-nexus-cyan to-sky-400 text-nexus-bg font-extrabold border-nexus-cyan shadow-[0_0_18px_rgba(0,240,255,0.4)]"
                    : "bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.07] text-gray-300 hover:text-white"
                }`}
              >
                <span>{p.b}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isSelected ? "bg-black/20 text-nexus-bg" : "bg-nexus-gold/15 text-nexus-gold border border-nexus-gold/30"}`}>
                  VS
                </span>
                <span>{p.bo}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. DUAL SEARCHABLE PLAYER AUTOCOMPLETE COMBOBOXES         */}
      {/* ========================================================= */}
      <div className="glass-panel rounded-3xl p-6 border border-white/[0.08]">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* Batter Picker (5 cols) */}
          <div className="md:col-span-5 relative">
            <label className="text-xs font-mono text-nexus-cyan block mb-2 font-bold uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-nexus-cyan shadow-[0_0_8px_#00F0FF]"></span>
                <span>STRIKER (BATTER)</span>
              </span>
              <span className="text-[10px] text-gray-400 font-normal">Active: <strong className="text-white">{batter}</strong></span>
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
                placeholder="Search batter (e.g. V Kohli, RG Sharma)..."
                className="w-full bg-[#080D1A] border border-white/[0.12] focus:border-nexus-cyan rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white font-mono outline-none transition-colors shadow-inner"
              />
            </div>

            {showBatterMenu && batterOptions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-[#0B1221] border border-white/[0.15] rounded-2xl shadow-2xl p-2 z-50 max-h-60 overflow-y-auto space-y-1 backdrop-blur-xl">
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
                      <span className="text-[10px] text-gray-500">({p.matches_played}m)</span>
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
              className="w-11 h-11 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-nexus-cyan border border-white/[0.1] flex items-center justify-center transition-all shadow-md active:scale-95 group"
            >
              <ArrowLeftRight className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            </button>
          </div>

          {/* Bowler Picker (5 cols) */}
          <div className="md:col-span-5 relative">
            <label className="text-xs font-mono text-red-400 block mb-2 font-bold uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#EF4444]"></span>
                <span>ATTACKING BOWLER</span>
              </span>
              <span className="text-[10px] text-gray-400 font-normal">Active: <strong className="text-white">{bowler}</strong></span>
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
                placeholder="Search bowler (e.g. JJ Bumrah, TA Boult)..."
                className="w-full bg-[#080D1A] border border-white/[0.12] focus:border-red-400 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white font-mono outline-none transition-colors shadow-inner"
              />
            </div>

            {showBowlerMenu && bowlerOptions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-[#0B1221] border border-white/[0.15] rounded-2xl shadow-2xl p-2 z-50 max-h-60 overflow-y-auto space-y-1 backdrop-blur-xl">
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
                      <span className="text-[10px] text-gray-500">({p.matches_played}m)</span>
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

      {/* ========================================================= */}
      {/* 4. DUEL ARENA CONTENT                                     */}
      {/* ========================================================= */}
      {loading || !matchup ? (
        <div className="glass-panel rounded-3xl p-16 flex flex-col items-center justify-center space-y-4 min-h-[350px]">
          <div className="relative">
            <div className="w-14 h-14 border-3 border-nexus-cyan border-t-transparent rounded-full animate-spin"></div>
            <Swords className="w-6 h-6 text-nexus-cyan absolute inset-0 m-auto" />
          </div>
          <span className="text-xs font-mono text-gray-400 tracking-wider">
            CROSS-EXAMINING DUCKDB HEAD-TO-HEAD MATRIX (295K DELIVERIES)...
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 4.1 BROADCAST FIGHT-CARD CLASH HERO BANNER */}
          <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-b from-[#0C162D] via-[#081021] to-[#050A14] border border-white/[0.09] shadow-2xl overflow-hidden">
            {/* Ambient Lighting */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-nexus-cyan/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              {/* Batter Pillar */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-nexus-cyan shadow-[0_0_10px_#00F0FF]"></span>
                  <span className="text-xs font-mono font-black text-nexus-cyan uppercase tracking-wider">
                    STRIKER TITAN
                  </span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {matchup.batter}
                </h3>
                <div className="text-xs font-mono text-gray-300 flex items-center space-x-2 pt-1">
                  <span className="text-white font-extrabold bg-white/[0.06] px-3 py-1 rounded-xl border border-white/[0.08]">
                    {matchup.runs_scored} Runs
                  </span>
                  <span>off</span>
                  <span className="text-nexus-cyan font-extrabold bg-nexus-cyan/10 px-3 py-1 rounded-xl border border-nexus-cyan/20">
                    {matchup.balls_faced} Balls
                  </span>
                </div>
              </div>

              {/* Center Duel Clash Badge */}
              <div className="flex flex-col items-center justify-center text-center px-4">
                <div className="relative">
                  <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-[#101E3A] via-[#16274E] to-[#0B152B] border border-white/[0.15] flex items-center justify-center font-black text-2xl text-white shadow-2xl">
                    VS
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-nexus-cyan animate-ping"></div>
                </div>

                <div className={`text-xs font-mono font-bold mt-3 px-4 py-1.5 rounded-full border shadow-lg ${
                  matchup.tactical_edge.includes("Batter")
                    ? "bg-nexus-cyan/15 text-nexus-cyan border-nexus-cyan/30 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                    : matchup.tactical_edge.includes("Bowler")
                    ? "bg-red-500/15 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                    : "bg-nexus-gold/15 text-nexus-gold border-nexus-gold/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                }`}>
                  {matchup.tactical_edge}
                </div>
                <span className="text-[10px] font-mono text-gray-400 mt-1.5">
                  Sample: {matchup.sample_size} legal deliveries ({matchup.delivery_log?.length || 0} total balls)
                </span>
              </div>

              {/* Bowler Pillar */}
              <div className="flex-1 space-y-2 text-left md:text-right">
                <div className="flex items-center space-x-2 md:justify-end">
                  <span className="text-xs font-mono font-black text-red-400 uppercase tracking-wider">
                    DEFENDING BOWLER
                  </span>
                  <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_#EF4444]"></span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {matchup.bowler}
                </h3>
                <div className="text-xs font-mono text-gray-300 flex items-center space-x-2 md:justify-end pt-1">
                  <span className="text-red-400 font-extrabold bg-red-500/10 px-3 py-1 rounded-xl border border-red-500/20">
                    {matchup.dismissals} Dismissals
                  </span>
                  <span>in</span>
                  <span className="text-white font-extrabold bg-white/[0.06] px-3 py-1 rounded-xl border border-white/[0.08]">
                    {matchup.sample_size} Balls
                  </span>
                </div>
              </div>
            </div>

            {/* Strategic Directive Callout */}
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

          {/* 4.2 BROADCAST KPI TILES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] text-center relative overflow-hidden">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                HEAD-TO-HEAD STRIKE RATE
              </span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-nexus-cyan mt-1.5 block">
                {matchup.strike_rate.toFixed(1)}
              </span>
              <span className="text-[10px] font-mono text-gray-400 mt-1 block">
                {matchup.strike_rate >= 140 ? "🔥 Rapid Batter Acceleration" : "🛡️ Contained by Bowler"}
              </span>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] text-center relative overflow-hidden">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                DISMISSAL THREAT
              </span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-red-400 mt-1.5 block">
                {matchup.dismissals} <span className="text-xs text-gray-400 font-normal">wickets</span>
              </span>
              <span className="text-[10px] font-mono text-gray-400 mt-1 block">
                Avg: {matchup.average ? `${matchup.average.toFixed(1)} r/w` : "Never Dismissed"}
              </span>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] text-center relative overflow-hidden">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                DOT BALL CHOKE %
              </span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-nexus-gold mt-1.5 block">
                {matchup.dot_pct.toFixed(1)}%
              </span>
              <span className="text-[10px] font-mono text-gray-400 mt-1 block">
                {matchup.dots} dot deliveries
              </span>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] text-center relative overflow-hidden">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                BOUNDARY POWER %
              </span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 mt-1.5 block">
                {matchup.boundary_pct.toFixed(1)}%
              </span>
              <span className="text-[10px] font-mono text-gray-400 mt-1 block">
                {matchup.fours} Fours • {matchup.sixes} Sixes
              </span>
            </div>
          </div>

          {/* 4.3 SECTION NAVIGATION TABS */}
          <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3 overflow-x-auto no-scrollbar">
            {[
              { id: "overview", label: "Battlefield Overview", icon: Target },
              { id: "reel", label: `Delivery Reel (${matchup.delivery_log?.length || 0})`, icon: Activity },
              { id: "blueprint", label: "Tactical AI Blueprint", icon: Crosshair },
              { id: "anatomy", label: `Dismissal Anatomy (${matchup.dismissals})`, icon: ShieldAlert },
              { id: "venues", label: "Venue Battlegrounds", icon: Compass },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = viewTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-nexus-cyan text-nexus-bg shadow-[0_0_15px_rgba(0,240,255,0.35)]"
                      : "bg-white/[0.03] hover:bg-white/[0.07] text-gray-400 hover:text-white border border-white/[0.05]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ========================================================= */}
          {/* TAB 1: BATTLEFIELD OVERVIEW                              */}
          {/* ========================================================= */}
          {(viewTab === "overview" || viewTab === "blueprint") && (
            <div className="space-y-6">
              {/* Tactical AI Combat Blueprint */}
              {matchup.tactical_blueprint && (
                <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/[0.08] space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-nexus-cyan/15 text-nexus-cyan border border-nexus-cyan/30">
                        <Crosshair className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white tracking-wide">
                          AI Franchise Tactical Blueprint & Battle Dossier
                        </h4>
                        <span className="text-xs font-mono text-gray-400">
                          Data-synthesized bowling plan & batter counter-strategy
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs font-mono">
                      <span className="bg-white/[0.04] text-gray-300 px-3 py-1 rounded-lg border border-white/[0.06]">
                        Battleground: <strong className="text-nexus-cyan">{matchup.tactical_blueprint.key_battleground_phase}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Bowler Execution Trap */}
                    <div className="p-5 rounded-2xl bg-red-500/[0.06] border border-red-500/25 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-red-400">
                          <ShieldAlert className="w-4 h-4" />
                          <span className="text-xs font-mono font-bold uppercase tracking-wider">
                            Bowler Execution Trap
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                          matchup.tactical_blueprint.dismissal_risk_rating === "CRITICAL"
                            ? "bg-red-500/20 text-red-400 border-red-500/40"
                            : matchup.tactical_blueprint.dismissal_risk_rating === "HIGH"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                            : "bg-gray-500/20 text-gray-300 border-gray-500/40"
                        }`}>
                          Risk: {matchup.tactical_blueprint.dismissal_risk_rating}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-gray-200 leading-relaxed">
                        {matchup.tactical_blueprint.bowler_trap}
                      </p>
                      <div className="pt-2 border-t border-red-500/15 flex items-center justify-between text-[11px] font-mono text-gray-400">
                        <span>Pressure Vulnerability:</span>
                        <span className="text-red-400 font-bold">{matchup.tactical_blueprint.pressure_vulnerability}</span>
                      </div>
                    </div>

                    {/* Batter Counter-Plan */}
                    <div className="p-5 rounded-2xl bg-nexus-cyan/[0.06] border border-nexus-cyan/25 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-nexus-cyan">
                          <Zap className="w-4 h-4" />
                          <span className="text-xs font-mono font-bold uppercase tracking-wider">
                            Batter Counter-Strategy
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                          matchup.tactical_blueprint.boundary_lethal_rating === "EXTREME"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : matchup.tactical_blueprint.boundary_lethal_rating === "HIGH"
                            ? "bg-nexus-cyan/20 text-nexus-cyan border-nexus-cyan/40"
                            : "bg-gray-500/20 text-gray-300 border-gray-500/40"
                        }`}>
                          Lethality: {matchup.tactical_blueprint.boundary_lethal_rating}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-gray-200 leading-relaxed">
                        {matchup.tactical_blueprint.batter_counter}
                      </p>
                      <div className="pt-2 border-t border-nexus-cyan/15 flex items-center justify-between text-[11px] font-mono text-gray-400">
                        <span>Boundary Ratio:</span>
                        <span className="text-nexus-cyan font-bold">{matchup.boundary_pct.toFixed(1)}% of total runs</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Phase-by-Phase Dominance Cards */}
              {matchup.phase_splits && (
                <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/[0.08] space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center space-x-2.5">
                      <Target className="w-4 h-4 text-nexus-cyan" />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                        Phase-by-Phase Match-Up Dominance
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-gray-400">
                      POWERPLAY • MIDDLE • DEATH
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Powerplay */}
                    <div className="bg-[#090F1E] rounded-2xl p-5 border border-white/[0.06] space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono text-nexus-cyan font-bold uppercase tracking-wider">
                          POWERPLAY (OV 0–5)
                        </span>
                        <span className="text-[10px] font-mono bg-nexus-cyan/10 text-nexus-cyan px-2 py-0.5 rounded border border-nexus-cyan/20">
                          {matchup.phase_splits.powerplay.wickets || 0} Wickets
                        </span>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-black font-mono text-white">
                          {matchup.phase_splits.powerplay.runs} runs
                        </span>
                        <span className="text-xs font-mono text-gray-400">
                          off {matchup.phase_splits.powerplay.balls} balls
                        </span>
                      </div>
                      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-400">Strike Rate:</span>
                        <span className="text-white font-bold">
                          {matchup.phase_splits.powerplay.balls > 0
                            ? ((matchup.phase_splits.powerplay.runs / matchup.phase_splits.powerplay.balls) * 100).toFixed(1)
                            : "0.0"}
                        </span>
                      </div>
                    </div>

                    {/* Middle */}
                    <div className="bg-[#090F1E] rounded-2xl p-5 border border-white/[0.06] space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono text-nexus-gold font-bold uppercase tracking-wider">
                          MIDDLE OVERS (OV 6–14)
                        </span>
                        <span className="text-[10px] font-mono bg-nexus-gold/10 text-nexus-gold px-2 py-0.5 rounded border border-nexus-gold/20">
                          {matchup.phase_splits.middle.wickets || 0} Wickets
                        </span>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-black font-mono text-white">
                          {matchup.phase_splits.middle.runs} runs
                        </span>
                        <span className="text-xs font-mono text-gray-400">
                          off {matchup.phase_splits.middle.balls} balls
                        </span>
                      </div>
                      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-400">Strike Rate:</span>
                        <span className="text-white font-bold">
                          {matchup.phase_splits.middle.balls > 0
                            ? ((matchup.phase_splits.middle.runs / matchup.phase_splits.middle.balls) * 100).toFixed(1)
                            : "0.0"}
                        </span>
                      </div>
                    </div>

                    {/* Death */}
                    <div className="bg-[#090F1E] rounded-2xl p-5 border border-white/[0.06] space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider">
                          DEATH OVERS (OV 15–20)
                        </span>
                        <span className="text-[10px] font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">
                          {matchup.phase_splits.death.wickets || 0} Wickets
                        </span>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-black font-mono text-white">
                          {matchup.phase_splits.death.runs} runs
                        </span>
                        <span className="text-xs font-mono text-gray-400">
                          off {matchup.phase_splits.death.balls} balls
                        </span>
                      </div>
                      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-400">Strike Rate:</span>
                        <span className="text-white font-bold">
                          {matchup.phase_splits.death.balls > 0
                            ? ((matchup.phase_splits.death.runs / matchup.phase_splits.death.balls) * 100).toFixed(1)
                            : "0.0"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pressure Crucible Telemetry */}
              {matchup.pressure_splits && matchup.pressure_splits.length > 0 && (
                <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/[0.08] space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center space-x-2.5">
                      <Flame className="w-4 h-4 text-nexus-gold" />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                        Pressure Crucible Telemetry (Dynamic Pressure Index)
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-gray-400">
                      Normal vs High-Pressure Performance
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {matchup.pressure_splits.map((ps, idx) => (
                      <div
                        key={idx}
                        className={`rounded-2xl p-5 border space-y-3 ${
                          idx === 2
                            ? "bg-red-500/[0.05] border-red-500/25"
                            : idx === 1
                            ? "bg-amber-500/[0.04] border-amber-500/20"
                            : "bg-white/[0.02] border-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-white">
                            {ps.tier_name}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                            {ps.range_desc}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div>
                            <span className="text-[10px] font-mono text-gray-400 block">Deliveries</span>
                            <span className="text-lg font-bold font-mono text-white">{ps.balls}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-gray-400 block">Strike Rate</span>
                            <span className={`text-lg font-bold font-mono ${ps.strike_rate >= 140 ? "text-nexus-cyan" : "text-gray-300"}`}>
                              {ps.strike_rate.toFixed(1)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-gray-400 block">Dot Ball %</span>
                            <span className="text-sm font-bold font-mono text-nexus-gold">{ps.dot_pct.toFixed(0)}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-gray-400 block">Dismissals</span>
                            <span className={`text-sm font-bold font-mono ${ps.wickets > 0 ? "text-red-400" : "text-gray-400"}`}>
                              {ps.wickets}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outcome Distribution Breakdown */}
              {matchup.outcome_distribution && (
                <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/[0.08] space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center space-x-2.5">
                      <BarChart3 className="w-4 h-4 text-nexus-cyan" />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                        Ball Outcome Distribution
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-gray-400">
                      Dot Balls, Strike Rotation & Boundaries
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    <div className="bg-[#090F1E] p-4 rounded-xl border border-white/[0.06] text-center">
                      <span className="text-[10px] font-mono text-gray-400 block">DOTS</span>
                      <span className="text-2xl font-black font-mono text-nexus-gold mt-1 block">
                        {matchup.outcome_distribution.dots}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {matchup.outcome_distribution.dot_pct.toFixed(0)}% of balls
                      </span>
                    </div>

                    <div className="bg-[#090F1E] p-4 rounded-xl border border-white/[0.06] text-center">
                      <span className="text-[10px] font-mono text-gray-400 block">SINGLES</span>
                      <span className="text-2xl font-black font-mono text-sky-400 mt-1 block">
                        {matchup.outcome_distribution.singles}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">Strike rotation</span>
                    </div>

                    <div className="bg-[#090F1E] p-4 rounded-xl border border-white/[0.06] text-center">
                      <span className="text-[10px] font-mono text-gray-400 block">DOUBLES / 3S</span>
                      <span className="text-2xl font-black font-mono text-cyan-400 mt-1 block">
                        {matchup.outcome_distribution.doubles + matchup.outcome_distribution.threes}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">Running runs</span>
                    </div>

                    <div className="bg-[#090F1E] p-4 rounded-xl border border-white/[0.06] text-center">
                      <span className="text-[10px] font-mono text-gray-400 block">FOURS (4s)</span>
                      <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
                        {matchup.outcome_distribution.fours}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">{matchup.outcome_distribution.fours * 4} runs</span>
                    </div>

                    <div className="bg-[#090F1E] p-4 rounded-xl border border-white/[0.06] text-center">
                      <span className="text-[10px] font-mono text-gray-400 block">SIXES (6s)</span>
                      <span className="text-2xl font-black font-mono text-nexus-cyan mt-1 block">
                        {matchup.outcome_distribution.sixes}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">{matchup.outcome_distribution.sixes * 6} runs</span>
                    </div>

                    <div className="bg-[#090F1E] p-4 rounded-xl border border-white/[0.06] text-center">
                      <span className="text-[10px] font-mono text-gray-400 block">DISMISSALS</span>
                      <span className="text-2xl font-black font-mono text-red-400 mt-1 block">
                        {matchup.outcome_distribution.wickets}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">Wickets taken</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: INTERACTIVE BALL-BY-BALL ENCOUNTER REEL            */}
          {/* ========================================================= */}
          {viewTab === "reel" && (
            <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/[0.08] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                <div>
                  <h4 className="text-base font-bold text-white tracking-wide flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-nexus-cyan" />
                    <span>Ball-by-Ball Encounter Telemetry Reel</span>
                  </h4>
                  <span className="text-xs font-mono text-gray-400">
                    Chronological delivery sequence across all historical IPL meetings
                  </span>
                </div>

                {/* Reel Filter Buttons */}
                <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
                  {[
                    { id: "all", label: "All Balls", count: matchup.delivery_log?.length || 0 },
                    { id: "boundaries", label: "Boundaries", count: (matchup.fours + matchup.sixes) },
                    { id: "wickets", label: "Wickets", count: matchup.dismissals },
                    { id: "crunch", label: "Crunch (DPI ≥ 60)", count: (matchup.delivery_log?.filter(d => d.pressure_index >= 60).length || 0) },
                    { id: "dots", label: "Dots", count: matchup.dots },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setDeliveryFilter(btn.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                        deliveryFilter === btn.id
                          ? "bg-nexus-cyan/20 text-nexus-cyan border border-nexus-cyan/40 font-bold"
                          : "bg-white/[0.03] text-gray-400 hover:text-white border border-white/[0.05]"
                      }`}
                    >
                      <span>{btn.label}</span>
                      <span className="text-[10px] opacity-70">({btn.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reel Grid / Cards */}
              {filteredDeliveries.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-gray-500">
                  No deliveries match the selected filter.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredDeliveries.map((deliv, idx) => {
                    const isSelected = selectedDelivery === deliv;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedDelivery(deliv)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 group ${
                          deliv.is_wicket
                            ? "bg-red-500/15 border-red-500/40 hover:bg-red-500/25 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                            : deliv.is_boundary
                            ? "bg-nexus-cyan/15 border-nexus-cyan/40 hover:bg-nexus-cyan/25 shadow-[0_0_12px_rgba(0,240,255,0.25)]"
                            : deliv.is_dot
                            ? "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
                            : "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07]"
                        } ${isSelected ? "ring-2 ring-nexus-cyan scale-105" : ""}`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                          <span>{deliv.season}</span>
                          <span>{deliv.over_ball_label}</span>
                        </div>

                        <div className="flex items-center justify-center py-1">
                          <span className={`text-xl font-black font-mono ${
                            deliv.is_wicket
                              ? "text-red-400"
                              : deliv.is_boundary
                              ? "text-nexus-cyan"
                              : deliv.is_dot
                              ? "text-gray-500"
                              : "text-white"
                          }`}>
                            {deliv.result_badge}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 pt-1 border-t border-white/[0.04]">
                          <span className="truncate">{deliv.phase.slice(0, 4)}</span>
                          <span className={`${deliv.pressure_index >= 60 ? "text-red-400 font-bold" : "text-gray-500"}`}>
                            {deliv.pressure_index.toFixed(0)} DPI
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Inspector drawer for selected delivery */}
              {selectedDelivery && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-nexus-cyan/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
                  <div className="flex items-center space-x-3">
                    <span className={`w-3 h-3 rounded-full ${selectedDelivery.is_wicket ? "bg-red-500" : "bg-nexus-cyan"}`}></span>
                    <div>
                      <span className="text-white font-bold">
                        Encounter at {selectedDelivery.venue}
                      </span>
                      <span className="text-gray-400 block text-[11px]">
                        Date: {selectedDelivery.match_date} • Season {selectedDelivery.season} • Innings {selectedDelivery.innings}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="bg-white/[0.05] px-3 py-1.5 rounded-lg border border-white/[0.08] text-gray-300">
                      Over: <strong className="text-white">{selectedDelivery.over_ball_label}</strong> ({selectedDelivery.phase})
                    </span>
                    <span className="bg-white/[0.05] px-3 py-1.5 rounded-lg border border-white/[0.08] text-gray-300">
                      Pressure: <strong className="text-nexus-cyan">{selectedDelivery.pressure_index} DPI</strong>
                    </span>
                    {selectedDelivery.is_wicket && (
                      <span className="bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/40 font-bold">
                        Dismissal: {selectedDelivery.dismissal_kind}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: DISMISSAL ANATOMY & MODE OF OUT MATRIX             */}
          {/* ========================================================= */}
          {viewTab === "anatomy" && (
            <div className="space-y-6">
              <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/[0.08] space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <div>
                    <h4 className="text-base font-bold text-white tracking-wide flex items-center space-x-2">
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                      <span>Dismissal Anatomy & Mode of Out Matrix</span>
                    </h4>
                    <span className="text-xs font-mono text-gray-400">
                      Technical breakdown of how {bowler} dismissed {batter} in IPL matches
                    </span>
                  </div>

                  <span className="text-xs font-mono text-red-400 bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/25 font-bold">
                    {matchup.dismissals} Career Dismissals
                  </span>
                </div>

                {/* Dismissal Mode Counts */}
                {matchup.dismissal_modes && Object.keys(matchup.dismissal_modes).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(matchup.dismissal_modes).map(([mode, count]) => (
                      <div key={mode} className="bg-[#090F1E] rounded-2xl p-4 border border-white/[0.06] text-center">
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                          {mode.toUpperCase()}
                        </span>
                        <span className="text-3xl font-black font-mono text-red-400 mt-1 block">
                          {count}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {((count / matchup.dismissals) * 100).toFixed(0)}% of outs
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs font-mono text-emerald-400 bg-emerald-500/[0.05] rounded-2xl border border-emerald-500/20">
                    🛡️ {batter} has NEVER been dismissed by {bowler} in official IPL history!
                  </div>
                )}

                {/* Chronological Dismissal Events List */}
                {matchup.dismissal_events && matchup.dismissal_events.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-wider font-bold block">
                      Chronological Dismissal Log
                    </span>
                    <div className="space-y-2">
                      {matchup.dismissal_events.map((evt, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono hover:bg-white/[0.04] transition-all"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#EF4444]"></span>
                            <div>
                              <span className="text-white font-bold">{evt.venue}</span>
                              <span className="text-gray-400 block text-[11px]">
                                {evt.match_date} • IPL {evt.season} (Innings {evt.innings})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06] text-gray-300">
                              Over {evt.over_ball} ({evt.phase})
                            </span>
                            <span className="bg-red-500/15 text-red-400 px-3 py-1 rounded-lg border border-red-500/30 font-bold uppercase">
                              {evt.dismissal_kind}
                            </span>
                            <span className="bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06] text-nexus-cyan font-bold">
                              {evt.pressure_index} DPI
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: VENUE BATTLEGROUNDS & SEASON PROGRESSION           */}
          {/* ========================================================= */}
          {viewTab === "venues" && (
            <div className="space-y-6">
              {/* Venue Battlegrounds */}
              <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/[0.08] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div>
                    <h4 className="text-base font-bold text-white tracking-wide flex items-center space-x-2">
                      <Compass className="w-5 h-5 text-nexus-cyan" />
                      <span>Venue Battleground Rivalry Splits</span>
                    </h4>
                    <span className="text-xs font-mono text-gray-400">
                      Stadium-by-stadium comparison of scoring and dismissal threat
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(matchup.venue_splits || []).map((v, i) => (
                    <div key={i} className="bg-[#090F1E] rounded-2xl p-5 border border-white/[0.06] space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-white truncate max-w-[200px]" title={v.venue}>
                          {v.venue}
                        </h5>
                        <span className="text-[10px] font-mono text-gray-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                          {v.balls} balls
                        </span>
                      </div>

                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-black font-mono text-white">
                          {v.runs} runs
                        </span>
                        <span className="text-xs font-mono text-nexus-cyan font-bold">
                          (SR {v.strike_rate.toFixed(1)})
                        </span>
                      </div>

                      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-400">Dismissals:</span>
                        <span className={`font-bold ${v.dismissals > 0 ? "text-red-400" : "text-emerald-400"}`}>
                          {v.dismissals}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Season Trajectory */}
              {matchup.season_trajectory && matchup.season_trajectory.length > 0 && (
                <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/[0.08] space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <div>
                      <h4 className="text-base font-bold text-white tracking-wide flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-nexus-gold" />
                        <span>Year-over-Year Duel Evolution Arc</span>
                      </h4>
                      <span className="text-xs font-mono text-gray-400">
                        Season-by-season trajectory of this iconic rivalry
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="text-[10px] uppercase text-gray-400 border-b border-white/[0.08] pb-2">
                        <tr>
                          <th className="py-2.5 px-3">Season</th>
                          <th className="py-2.5 px-3">Balls</th>
                          <th className="py-2.5 px-3">Runs</th>
                          <th className="py-2.5 px-3">Strike Rate</th>
                          <th className="py-2.5 px-3">4s / 6s</th>
                          <th className="py-2.5 px-3">Dots</th>
                          <th className="py-2.5 px-3">Wickets</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {matchup.season_trajectory.map((s, i) => (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-3 font-bold text-white">{s.season}</td>
                            <td className="py-3 px-3 text-gray-300">{s.balls}</td>
                            <td className="py-3 px-3 text-white font-bold">{s.runs}</td>
                            <td className="py-3 px-3">
                              <span className={`font-bold ${s.strike_rate >= 140 ? "text-nexus-cyan" : "text-gray-300"}`}>
                                {s.strike_rate.toFixed(1)}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-gray-300">{s.fours} / {s.sixes}</td>
                            <td className="py-3 px-3 text-nexus-gold">{s.dots}</td>
                            <td className="py-3 px-3">
                              <span className={`font-bold ${s.dismissals > 0 ? "text-red-400" : "text-gray-500"}`}>
                                {s.dismissals}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
