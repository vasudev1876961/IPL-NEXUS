import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Swords,
  Sparkles,
  Zap,
  ArrowLeftRight,
  TrendingUp,
  ShieldAlert,
  Flame,
  Activity,
  Award,
  Target,
  Clock,
  Crosshair,
} from "lucide-react";
import {
  PlayerProfile,
  PlayerDossierResponse,
  PlayerComparisonResponse,
  PhaseBreakdownEntry,
  NemesisEntry,
} from "../types";
import {
  fetchPlayers,
  fetchPlayerDossier,
  fetchPlayerComparison,
} from "../services/api";
import { PlayerDNARadar } from "../components/charts/PlayerDNARadar";
import { DualRadarCompare } from "../components/charts/DualRadarCompare";

interface PlayerLabProps {
  selectedPlayer: string;
  setSelectedPlayer: (name: string) => void;
  setActiveTab: (tab: string) => void;
  setMatchupBatter: (name: string) => void;
  setMatchupBowler: (name: string) => void;
}

const STAR_PLAYERS = [
  { name: "V Kohli", role: "Batter" },
  { name: "JJ Bumrah", role: "Bowler" },
  { name: "RG Sharma", role: "Batter" },
  { name: "MS Dhoni", role: "Batter / Finisher" },
  { name: "Rashid Khan", role: "Bowler" },
  { name: "SP Narine", role: "All-Rounder" },
  { name: "AD Russell", role: "All-Rounder" },
  { name: "KL Rahul", role: "Batter" },
  { name: "SA Yadav", role: "Batter" },
  { name: "TA Boult", role: "Bowler" },
];

const COMPARISON_PRESETS = [
  { p1: "V Kohli", p2: "RG Sharma", label: "Kohli vs Rohit (Batting Titans)" },
  { p1: "JJ Bumrah", p2: "TA Boult", label: "Bumrah vs Boult (Pace Maestros)" },
  { p1: "MS Dhoni", p2: "AD Russell", label: "Dhoni vs Russell (Clutch Finishers)" },
  { p1: "SP Narine", p2: "Rashid Khan", label: "Narine vs Rashid (Spin Masters)" },
  { p1: "V Kohli", p2: "JJ Bumrah", label: "Kohli vs Bumrah (King vs Yorker King)" },
  { p1: "KL Rahul", p2: "SA Yadav", label: "Rahul vs Suryakumar (Anchor vs 360°)" },
];

export const PlayerLab: React.FC<PlayerLabProps> = ({
  selectedPlayer,
  setSelectedPlayer,
  setActiveTab,
  setMatchupBatter,
  setMatchupBowler,
}) => {
  // Mode selection: "dossier" vs "compare"
  const [activeMode, setActiveMode] = useState<"dossier" | "compare">("dossier");

  // Roster listing state
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "batters" | "bowlers" | "allrounders">("all");
  const [sortBy, setSortBy] = useState("runs");

  // Dossier state
  const [dossier, setDossier] = useState<PlayerDossierResponse | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);

  // Compare state
  const [comparePlayer1, setComparePlayer1] = useState(selectedPlayer || "V Kohli");
  const [comparePlayer2, setComparePlayer2] = useState("RG Sharma");
  const [comparisonData, setComparisonData] = useState<PlayerComparisonResponse | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Load player directory
  useEffect(() => {
    async function loadList() {
      try {
        const res = await fetchPlayers(searchQuery, sortBy, 50);
        setPlayers(res.players);
        if (res.players.length > 0 && !selectedPlayer) {
          setSelectedPlayer(res.players[0].player_name);
        }
      } catch (e) {
        console.error("Error fetching players:", e);
      }
    }
    loadList();
  }, [searchQuery, sortBy]);

  // Load deep dossier when selectedPlayer changes
  useEffect(() => {
    async function loadDossier() {
      if (!selectedPlayer) return;
      setDossierLoading(true);
      try {
        const data = await fetchPlayerDossier(selectedPlayer);
        setDossier(data);
      } catch (e) {
        console.error("Error loading player dossier:", e);
      } finally {
        setDossierLoading(false);
      }
    }
    loadDossier();
  }, [selectedPlayer]);

  // Load comparison data when players change in compare mode
  useEffect(() => {
    async function loadComparison() {
      if (!comparePlayer1 || !comparePlayer2 || comparePlayer1 === comparePlayer2) return;
      setCompareLoading(true);
      try {
        const res = await fetchPlayerComparison(comparePlayer1, comparePlayer2);
        setComparisonData(res);
      } catch (e) {
        console.error("Error loading player comparison:", e);
      } finally {
        setCompareLoading(false);
      }
    }
    if (activeMode === "compare") {
      loadComparison();
    }
  }, [comparePlayer1, comparePlayer2, activeMode]);

  // Filter players by role
  const filteredPlayers = players.filter((p) => {
    if (roleFilter === "batters") return p.total_runs >= 800 && p.total_wickets < 20;
    if (roleFilter === "bowlers") return p.total_wickets >= 25 && p.total_runs < 600;
    if (roleFilter === "allrounders") return p.total_runs >= 600 && p.total_wickets >= 20;
    return true;
  });

  // Shortcut to launch direct matchup duel
  const handleLaunchDuel = (batterName: string, bowlerName: string) => {
    setMatchupBatter(batterName);
    setMatchupBowler(bowlerName);
    setActiveTab("matchups");
  };

  return (
    <div className="space-y-6 pb-20 pt-1">
      {/* Top Header & Mode Toggle Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-nexus-gold/15 text-nexus-gold border border-nexus-gold/30 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-wide">
                Pro Player Intelligence & Scouting Lab
              </h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Situational 10-axis DNA, phase telemetry, nemesis threat matrices & comparative scouting
              </p>
            </div>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center space-x-1 bg-[#080D1A] p-1.5 rounded-2xl border border-white/[0.12]">
          <button
            onClick={() => setActiveMode("dossier")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all ${
              activeMode === "dossier"
                ? "bg-nexus-cyan text-nexus-bg font-extrabold shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Deep Dossier</span>
          </button>

          <button
            onClick={() => {
              setActiveMode("compare");
              if (!comparePlayer1) setComparePlayer1(selectedPlayer || "V Kohli");
              if (!comparePlayer2) setComparePlayer2("RG Sharma");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all ${
              activeMode === "compare"
                ? "bg-nexus-gold text-nexus-bg font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Scouting Comparator</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: DEEP DOSSIER & PHASE TELEMETRY                                   */}
      {/* ========================================================================= */}
      {activeMode === "dossier" && (
        <div className="space-y-6">
          {/* Quick Pick Marquee Bar */}
          <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-nexus-gold" />
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                  FEATURED MARQUEE STARS & ROSTER
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1 bg-[#080D1A] p-1 rounded-xl border border-white/[0.08]">
                  {(["all", "batters", "bowlers", "allrounders"] as const).map((rf) => (
                    <button
                      key={rf}
                      onClick={() => setRoleFilter(rf)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                        roleFilter === rf
                          ? "bg-nexus-cyan text-nexus-bg font-extrabold"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {rf === "all" ? "All" : rf === "batters" ? "Batters" : rf === "bowlers" ? "Bowlers" : "All-Rounders"}
                    </button>
                  ))}
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#080D1A] border border-white/[0.12] rounded-xl px-2.5 py-1 text-[11px] text-white font-mono focus:border-nexus-cyan outline-none"
                >
                  <option value="runs">Most Runs</option>
                  <option value="wickets">Most Wickets</option>
                  <option value="sr">Strike Rate</option>
                  <option value="economy">Economy</option>
                </select>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1.5" />
                  <input
                    type="text"
                    placeholder="Search player..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#080D1A] border border-white/[0.12] focus:border-nexus-cyan rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-gray-500 outline-none w-36 font-mono transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
              {STAR_PLAYERS.map((sp) => {
                const isSelected = selectedPlayer === sp.name;
                return (
                  <button
                    key={sp.name}
                    onClick={() => setSelectedPlayer(sp.name)}
                    className={`text-xs font-mono px-3.5 py-1.5 rounded-xl border whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? "bg-nexus-cyan text-nexus-bg font-extrabold border-nexus-cyan shadow-[0_0_15px_rgba(0,240,255,0.35)]"
                        : "bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.07] text-gray-300"
                    }`}
                  >
                    <span>{sp.name}</span>
                    <span className={`text-[9px] ${isSelected ? "text-nexus-bg/80" : "text-gray-500"}`}>
                      ({sp.role})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Player Dropdown / Filtered Roster Picker */}
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-gray-400">
              <span className="text-[10px] uppercase tracking-wider">
                Active Dossier: <strong className="text-white">{selectedPlayer}</strong> ({filteredPlayers.length} profiles matching filters)
              </span>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="bg-[#080D1A] border border-white/[0.12] rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-nexus-cyan outline-none max-w-xs"
              >
                {filteredPlayers.map((p) => (
                  <option key={p.player_name} value={p.player_name}>
                    {p.player_name} ({p.total_runs} runs, {p.total_wickets} wkts)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Master Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (5 cols): Radar Chart, Bio & Career Aggregates */}
            <div className="lg:col-span-5 space-y-6">
              {dossierLoading || !dossier ? (
                <div className="glass-panel rounded-3xl p-16 flex flex-col items-center justify-center space-y-4 min-h-[460px]">
                  <div className="w-12 h-12 border-3 border-nexus-cyan border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-mono text-gray-400 tracking-wider">
                    COMPUTING PRO SCOUTING DOSSIER...
                  </span>
                </div>
              ) : (
                <>
                  {/* 10-Axis DNA Radar */}
                  <PlayerDNARadar
                    playerName={dossier.player_name}
                    role={dossier.role}
                    archetype={dossier.archetype}
                    axes={dossier.radar_axes}
                  />

                  {/* Career Aggregates Card */}
                  <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-nexus-gold" />
                        <h4 className="text-xs font-mono uppercase text-gray-300 tracking-wider font-bold">
                          Career Aggregates (2008–2025)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-nexus-cyan font-bold bg-nexus-cyan/10 px-2.5 py-0.5 rounded border border-nexus-cyan/20">
                        DUCKDB VERIFIED
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="bg-[#080D1A] rounded-2xl p-3.5 border border-white/[0.06] text-center">
                        <span className="text-[10px] font-mono text-gray-400 block uppercase">TOTAL RUNS</span>
                        <span className="text-xl font-black font-mono text-nexus-cyan mt-1 block">
                          {dossier.career_summary.runs.toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-[#080D1A] rounded-2xl p-3.5 border border-white/[0.06] text-center">
                        <span className="text-[10px] font-mono text-gray-400 block uppercase">STRIKE RATE</span>
                        <span className="text-xl font-black font-mono text-nexus-gold mt-1 block">
                          {dossier.career_summary.strike_rate}
                        </span>
                      </div>

                      <div className="bg-[#080D1A] rounded-2xl p-3.5 border border-white/[0.06] text-center">
                        <span className="text-[10px] font-mono text-gray-400 block uppercase">WICKETS</span>
                        <span className="text-xl font-black font-mono text-red-400 mt-1 block">
                          {dossier.career_summary.wickets}
                        </span>
                      </div>

                      <div className="bg-[#080D1A] rounded-2xl p-3.5 border border-white/[0.06] text-center">
                        <span className="text-[10px] font-mono text-gray-400 block uppercase">ECONOMY</span>
                        <span className="text-xl font-black font-mono text-emerald-400 mt-1 block">
                          {dossier.career_summary.economy || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Innings & Pressure Quick Strip */}
                    <div className="bg-[#080D1A] rounded-2xl p-4 border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono border-b border-white/[0.06] pb-2">
                        <span className="text-gray-400 flex items-center space-x-1.5">
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                          <span>High Pressure SR (Index ≥ 60):</span>
                        </span>
                        <span className="font-bold text-nexus-gold">
                          {dossier.pressure_performance.strike_rate || dossier.pressure_performance.economy || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono pt-1">
                        <span className="text-gray-400">Target Chasing (Innings 2):</span>
                        <span className="font-bold text-nexus-cyan">
                          {dossier.innings_split.chasing.runs
                            ? `${dossier.innings_split.chasing.runs} runs (SR ${dossier.innings_split.chasing.strike_rate})`
                            : `${dossier.innings_split.chasing.wickets || 0} wkts (Econ ${dossier.innings_split.chasing.economy})`}
                        </span>
                      </div>
                    </div>

                    {/* Tactical Action Shortcuts */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06]">
                      <button
                        onClick={() => {
                          setComparePlayer1(dossier.player_name);
                          setComparePlayer2(dossier.player_name === "V Kohli" ? "RG Sharma" : "V Kohli");
                          setActiveMode("compare");
                        }}
                        className="bg-nexus-gold/15 hover:bg-nexus-gold/25 text-nexus-gold text-xs font-bold px-4 py-2 rounded-xl border border-nexus-gold/30 flex items-center space-x-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        <span>Compare in Scouting Duel</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("strategy")}
                        className="bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 text-xs font-bold px-4 py-2 rounded-xl border border-white/[0.1] flex items-center space-x-1.5 transition-all"
                      >
                        <Zap className="w-3.5 h-3.5 text-nexus-cyan" />
                        <span>Strategy Lab</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Column (7 cols): Phase Telemetry, Nemesis Matrix & Season Trajectory */}
            <div className="lg:col-span-7 space-y-6">
              {dossierLoading || !dossier ? (
                <div className="glass-panel rounded-3xl p-16 flex flex-col items-center justify-center space-y-4 min-h-[460px]">
                  <div className="w-12 h-12 border-3 border-nexus-gold border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-mono text-gray-400 tracking-wider">
                    LOADING PHASE TELEMETRY & MATCHUP MATRICES...
                  </span>
                </div>
              ) : (
                <>
                  {/* Phase Mastery Telemetry */}
                  <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                          SITUATIONAL BREAKDOWN
                        </span>
                        <h3 className="text-base font-bold text-white flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-nexus-cyan" />
                          <span>Phase Mastery (Powerplay, Middle, Death)</span>
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-gray-400">
                        {dossier.role === "Batter" ? "Strike Rate & Boundaries" : "Economy & Wickets"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {dossier.phase_breakdown.map((pb: PhaseBreakdownEntry) => {
                        const isPP = pb.phase === "Powerplay";
                        const isDeath = pb.phase === "Death";
                        const accentColor = isPP ? "text-nexus-cyan" : isDeath ? "text-red-400" : "text-nexus-gold";
                        const borderColor = isPP ? "border-nexus-cyan/30" : isDeath ? "border-red-500/30" : "border-nexus-gold/30";

                        return (
                          <div
                            key={pb.phase}
                            className={`bg-[#080D1A] rounded-2xl p-4 border ${borderColor} space-y-2`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white uppercase tracking-wider">
                                {pb.phase}
                              </span>
                              <span className="text-[10px] font-mono text-gray-500">
                                {pb.balls} balls
                              </span>
                            </div>

                            {dossier.role === "Batter" ? (
                              <>
                                <div className="flex items-baseline justify-between pt-1">
                                  <span className="text-xs text-gray-400 font-mono">Strike Rate:</span>
                                  <span className={`text-xl font-black font-mono ${accentColor}`}>
                                    {pb.strike_rate}
                                  </span>
                                </div>

                                <div className="space-y-1.5 text-xs font-mono text-gray-400 pt-1 border-t border-white/[0.06]">
                                  <div className="flex justify-between">
                                    <span>Runs:</span>
                                    <span className="text-white font-bold">{pb.runs}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Boundaries:</span>
                                    <span className="text-nexus-cyan">{pb.fours}×4, {pb.sixes}×6</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Dot Ball %:</span>
                                    <span className="text-gray-300">{pb.dot_pct}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Dismissals:</span>
                                    <span className="text-red-400">{pb.dismissals}</span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-baseline justify-between pt-1">
                                  <span className="text-xs text-gray-400 font-mono">Economy:</span>
                                  <span className={`text-xl font-black font-mono ${accentColor}`}>
                                    {pb.economy}
                                  </span>
                                </div>

                                <div className="space-y-1.5 text-xs font-mono text-gray-400 pt-1 border-t border-white/[0.06]">
                                  <div className="flex justify-between">
                                    <span>Wickets:</span>
                                    <span className="text-nexus-cyan font-bold">{pb.wickets}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Runs Conceded:</span>
                                    <span className="text-white">{pb.runs_conceded}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Dot Ball %:</span>
                                    <span className="text-emerald-400">{pb.dot_pct}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Dot Balls:</span>
                                    <span className="text-gray-300">{pb.dots}</span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nemesis & Bunny Threat Matrix */}
                  <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                          HISTORICAL MATCHUP INTELLIGENCE
                        </span>
                        <h3 className="text-base font-bold text-white flex items-center space-x-2">
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                          <span>
                            {dossier.threat_matrix.primary_type === "batter"
                              ? "Nemesis & Dominated Bowlers Matrix"
                              : "Bunny Batters & High Concession Matrix"}
                          </span>
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">
                        CLICK "DUEL" TO TEST HEAD-TO-HEAD
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sub-Card 1: Nemesis Bowlers / Bunny Batters */}
                      <div className="bg-[#080D1A] rounded-2xl p-4 border border-red-500/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-red-400 font-mono uppercase flex items-center space-x-1.5">
                            <Target className="w-3.5 h-3.5" />
                            <span>
                              {dossier.threat_matrix.primary_type === "batter"
                                ? "Top Nemesis Bowlers"
                                : "Top Bunnies (Most Wickets)"}
                            </span>
                          </span>
                          <span className="text-[10px] font-mono text-gray-500">Dismissals</span>
                        </div>

                        <div className="space-y-2">
                          {dossier.threat_matrix.nemesis_opponents.map((opp: NemesisEntry) => {
                            const name = opp.bowler || opp.batter || "Unknown";
                            const runs = opp.runs !== undefined ? opp.runs : opp.runs_conceded;

                            return (
                              <div
                                key={name}
                                className="flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.05] p-2.5 rounded-xl border border-white/[0.05] transition-all"
                              >
                                <div>
                                  <span className="text-xs font-bold text-white block">{name}</span>
                                  <span className="text-[10px] font-mono text-gray-400">
                                    {runs} runs off {opp.balls} balls (SR {opp.strike_rate})
                                  </span>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-mono font-black text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20">
                                    {opp.dismissals}× Out
                                  </span>

                                  <button
                                    onClick={() => {
                                      if (dossier.threat_matrix.primary_type === "batter") {
                                        handleLaunchDuel(dossier.player_name, name);
                                      } else {
                                        handleLaunchDuel(name, dossier.player_name);
                                      }
                                    }}
                                    className="p-1 rounded-lg bg-nexus-cyan/15 hover:bg-nexus-cyan/30 text-nexus-cyan transition-colors"
                                    title="Open head-to-head duel"
                                  >
                                    <Swords className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sub-Card 2: Dominated Bowlers / Punishing Batters */}
                      <div className="bg-[#080D1A] rounded-2xl p-4 border border-nexus-cyan/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-nexus-cyan font-mono uppercase flex items-center space-x-1.5">
                            <Crosshair className="w-3.5 h-3.5" />
                            <span>
                              {dossier.threat_matrix.primary_type === "batter"
                                ? "Dominated Bowlers (Most Runs)"
                                : "Punishing Batters (Most Runs)"}
                            </span>
                          </span>
                          <span className="text-[10px] font-mono text-gray-500">Run Plunder</span>
                        </div>

                        <div className="space-y-2">
                          {dossier.threat_matrix.dominated_opponents.map((opp: NemesisEntry) => {
                            const name = opp.bowler || opp.batter || "Unknown";
                            const runs = opp.runs !== undefined ? opp.runs : opp.runs_conceded;

                            return (
                              <div
                                key={name}
                                className="flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.05] p-2.5 rounded-xl border border-white/[0.05] transition-all"
                              >
                                <div>
                                  <span className="text-xs font-bold text-white block">{name}</span>
                                  <span className="text-[10px] font-mono text-gray-400">
                                    {opp.balls} balls • SR {opp.strike_rate}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-mono font-black text-nexus-cyan bg-nexus-cyan/10 px-2 py-0.5 rounded border border-nexus-cyan/20">
                                    {runs} Runs
                                  </span>

                                  <button
                                    onClick={() => {
                                      if (dossier.threat_matrix.primary_type === "batter") {
                                        handleLaunchDuel(dossier.player_name, name);
                                      } else {
                                        handleLaunchDuel(name, dossier.player_name);
                                      }
                                    }}
                                    className="p-1 rounded-lg bg-nexus-gold/15 hover:bg-nexus-gold/30 text-nexus-gold transition-colors"
                                    title="Open head-to-head duel"
                                  >
                                    <Swords className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Career Season Progression Trajectory */}
                  <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                          HISTORICAL TIME SERIES
                        </span>
                        <h3 className="text-base font-bold text-white flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-nexus-gold" />
                          <span>Career Season Trajectory (2008–2025)</span>
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-gray-400">
                        {dossier.season_trajectory.length} Seasons active
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-white/[0.08] text-gray-400">
                            <th className="py-2 px-3">SEASON</th>
                            <th className="py-2 px-3">{dossier.role === "Batter" ? "RUNS" : "BALLS"}</th>
                            <th className="py-2 px-3">{dossier.role === "Batter" ? "BALLS" : "RUNS CONCEDED"}</th>
                            <th className="py-2 px-3">{dossier.role === "Batter" ? "STRIKE RATE" : "ECONOMY"}</th>
                            <th className="py-2 px-3">{dossier.role === "Batter" ? "BOUNDARIES" : "WICKETS"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {dossier.season_trajectory.map((st) => (
                            <tr key={st.season} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-2 px-3 font-bold text-nexus-gold">{st.season}</td>
                              <td className="py-2 px-3 font-black text-white">
                                {st.runs !== undefined ? st.runs : st.balls}
                              </td>
                              <td className="py-2 px-3 text-gray-300">
                                {st.runs_conceded !== undefined ? st.runs_conceded : st.balls}
                              </td>
                              <td className="py-2 px-3 font-bold text-nexus-cyan">
                                {st.strike_rate !== undefined ? st.strike_rate : st.economy}
                              </td>
                              <td className="py-2 px-3 text-gray-300">
                                {st.fours !== undefined
                                  ? `${st.fours}×4, ${st.sixes}×6`
                                  : `${st.wickets} wkts`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: HEAD-TO-HEAD SCOUTING COMPARATOR (DUAL CLASH)                    */}
      {/* ========================================================================= */}
      {activeMode === "compare" && (
        <div className="space-y-6">
          {/* Comparison Selector Bar */}
          <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-nexus-gold block">
                  SCOUTING DUEL COMPARATOR
                </span>
                <h3 className="text-xl font-black text-white">Side-by-Side Player Intelligence</h3>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
                {COMPARISON_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setComparePlayer1(preset.p1);
                      setComparePlayer2(preset.p2);
                    }}
                    className="text-[11px] font-mono px-3 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 whitespace-nowrap transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dual Input Controls */}
            <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
              {/* Player 1 Selector */}
              <div className="md:col-span-5 bg-[#080D1A] rounded-2xl p-4 border border-nexus-cyan/40">
                <span className="text-[10px] font-mono text-nexus-cyan uppercase block font-bold">
                  PLAYER 1 (CYAN OVERLAY)
                </span>
                <select
                  value={comparePlayer1}
                  onChange={(e) => setComparePlayer1(e.target.value)}
                  className="w-full bg-transparent text-lg font-black text-white font-mono mt-1 outline-none cursor-pointer"
                >
                  {players.map((p) => (
                    <option key={p.player_name} value={p.player_name} className="bg-[#080D1A]">
                      {p.player_name} ({p.total_runs} runs, {p.total_wickets} wkts)
                    </option>
                  ))}
                </select>
              </div>

              {/* Swap Button */}
              <div className="md:col-span-1 flex justify-center">
                <button
                  onClick={() => {
                    const temp = comparePlayer1;
                    setComparePlayer1(comparePlayer2);
                    setComparePlayer2(temp);
                  }}
                  className="p-3 rounded-2xl bg-white/[0.05] hover:bg-nexus-cyan/20 text-gray-300 hover:text-nexus-cyan border border-white/[0.1] transition-all"
                  title="Swap players"
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </button>
              </div>

              {/* Player 2 Selector */}
              <div className="md:col-span-5 bg-[#080D1A] rounded-2xl p-4 border border-nexus-gold/40">
                <span className="text-[10px] font-mono text-nexus-gold uppercase block font-bold">
                  PLAYER 2 (AMBER OVERLAY)
                </span>
                <select
                  value={comparePlayer2}
                  onChange={(e) => setComparePlayer2(e.target.value)}
                  className="w-full bg-transparent text-lg font-black text-white font-mono mt-1 outline-none cursor-pointer"
                >
                  {players.map((p) => (
                    <option key={p.player_name} value={p.player_name} className="bg-[#080D1A]">
                      {p.player_name} ({p.total_runs} runs, {p.total_wickets} wkts)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Comparison Body */}
          {compareLoading || !comparisonData ? (
            <div className="glass-panel rounded-3xl p-16 flex flex-col items-center justify-center space-y-4 min-h-[460px]">
              <div className="w-12 h-12 border-3 border-nexus-cyan border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-mono text-gray-400 tracking-wider">
                COMPUTING COMPARATIVE RADAR & DIRECT ENCOUNTER TELEMETRY...
              </span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Direct Head-to-Head Encounter Telemetry (if available) */}
              {comparisonData.head_to_head.has_direct_encounter && (
                <div className="glass-panel rounded-3xl p-6 border border-nexus-cyan/30 bg-nexus-cyan/[0.02] space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center space-x-2">
                      <Swords className="w-5 h-5 text-nexus-cyan" />
                      <h4 className="text-base font-black text-white">
                        Direct Historical Encounter Telemetry
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-nexus-cyan bg-nexus-cyan/10 px-2.5 py-0.5 rounded-full border border-nexus-cyan/20">
                      BALL-BY-BALL CLASH RECORDED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {comparisonData.head_to_head.p1_bat_vs_p2_bowl && (
                      <div className="bg-[#080D1A] rounded-2xl p-4 border border-white/[0.06] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-nexus-cyan">
                            {comparePlayer1} (Batting) vs {comparePlayer2} (Bowling)
                          </span>
                          <span className="text-xs font-mono font-black text-red-400">
                            {comparisonData.head_to_head.p1_bat_vs_p2_bowl.dismissals} Dismissals
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center pt-2">
                          <div className="bg-white/[0.02] p-2 rounded-xl">
                            <span className="text-[10px] text-gray-400 block">RUNS</span>
                            <span className="text-base font-bold text-white">
                              {comparisonData.head_to_head.p1_bat_vs_p2_bowl.runs_scored}
                            </span>
                          </div>
                          <div className="bg-white/[0.02] p-2 rounded-xl">
                            <span className="text-[10px] text-gray-400 block">BALLS</span>
                            <span className="text-base font-bold text-white">
                              {comparisonData.head_to_head.p1_bat_vs_p2_bowl.balls_faced}
                            </span>
                          </div>
                          <div className="bg-white/[0.02] p-2 rounded-xl">
                            <span className="text-[10px] text-gray-400 block">SR</span>
                            <span className="text-base font-bold text-nexus-gold">
                              {comparisonData.head_to_head.p1_bat_vs_p2_bowl.strike_rate}
                            </span>
                          </div>
                          <div className="bg-white/[0.02] p-2 rounded-xl">
                            <span className="text-[10px] text-gray-400 block">DOTS</span>
                            <span className="text-base font-bold text-emerald-400">
                              {comparisonData.head_to_head.p1_bat_vs_p2_bowl.dot_pct}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {comparisonData.head_to_head.p2_bat_vs_p1_bowl && (
                      <div className="bg-[#080D1A] rounded-2xl p-4 border border-white/[0.06] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-nexus-gold">
                            {comparePlayer2} (Batting) vs {comparePlayer1} (Bowling)
                          </span>
                          <span className="text-xs font-mono font-black text-red-400">
                            {comparisonData.head_to_head.p2_bat_vs_p1_bowl.dismissals} Dismissals
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center pt-2">
                          <div className="bg-white/[0.02] p-2 rounded-xl">
                            <span className="text-[10px] text-gray-400 block">RUNS</span>
                            <span className="text-base font-bold text-white">
                              {comparisonData.head_to_head.p2_bat_vs_p1_bowl.runs_scored}
                            </span>
                          </div>
                          <div className="bg-white/[0.02] p-2 rounded-xl">
                            <span className="text-[10px] text-gray-400 block">BALLS</span>
                            <span className="text-base font-bold text-white">
                              {comparisonData.head_to_head.p2_bat_vs_p1_bowl.balls_faced}
                            </span>
                          </div>
                          <div className="bg-white/[0.02] p-2 rounded-xl">
                            <span className="text-[10px] text-gray-400 block">SR</span>
                            <span className="text-base font-bold text-nexus-cyan">
                              {comparisonData.head_to_head.p2_bat_vs_p1_bowl.strike_rate}
                            </span>
                          </div>
                          <div className="bg-white/[0.02] p-2 rounded-xl">
                            <span className="text-[10px] text-gray-400 block">DOTS</span>
                            <span className="text-base font-bold text-emerald-400">
                              {comparisonData.head_to_head.p2_bat_vs_p1_bowl.dot_pct}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dual Radar Chart */}
              <DualRadarCompare
                player1Name={comparisonData.player1.player_name}
                player1Role={comparisonData.player1.role}
                player1Axes={comparisonData.player1.radar_axes}
                player2Name={comparisonData.player2.player_name}
                player2Role={comparisonData.player2.role}
                player2Axes={comparisonData.player2.radar_axes}
              />

              {/* Career Aggregates Differential Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase text-gray-400 block">TOTAL RUNS DELTA</span>
                  <div className="flex items-center justify-center space-x-2 text-xl font-black font-mono">
                    <span className="text-nexus-cyan">{comparisonData.player1.career_summary.runs}</span>
                    <span className="text-gray-500">vs</span>
                    <span className="text-nexus-gold">{comparisonData.player2.career_summary.runs}</span>
                  </div>
                  <span className="text-xs font-mono text-gray-400 block">
                    {comparisonData.metric_deltas.runs > 0
                      ? `+${comparisonData.metric_deltas.runs} for ${comparePlayer1}`
                      : `${Math.abs(comparisonData.metric_deltas.runs)} more for ${comparePlayer2}`}
                  </span>
                </div>

                <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase text-gray-400 block">STRIKE RATE DELTA</span>
                  <div className="flex items-center justify-center space-x-2 text-xl font-black font-mono">
                    <span className="text-nexus-cyan">{comparisonData.player1.career_summary.strike_rate}</span>
                    <span className="text-gray-500">vs</span>
                    <span className="text-nexus-gold">{comparisonData.player2.career_summary.strike_rate}</span>
                  </div>
                  <span className="text-xs font-mono text-gray-400 block">
                    {comparisonData.metric_deltas.strike_rate > 0
                      ? `+${comparisonData.metric_deltas.strike_rate} SR for ${comparePlayer1}`
                      : `+${Math.abs(comparisonData.metric_deltas.strike_rate)} SR for ${comparePlayer2}`}
                  </span>
                </div>

                <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase text-gray-400 block">TOTAL WICKETS</span>
                  <div className="flex items-center justify-center space-x-2 text-xl font-black font-mono">
                    <span className="text-nexus-cyan">{comparisonData.player1.career_summary.wickets}</span>
                    <span className="text-gray-500">vs</span>
                    <span className="text-nexus-gold">{comparisonData.player2.career_summary.wickets}</span>
                  </div>
                  <span className="text-xs font-mono text-gray-400 block">
                    {comparisonData.metric_deltas.wickets > 0
                      ? `+${comparisonData.metric_deltas.wickets} wkts for ${comparePlayer1}`
                      : `+${Math.abs(comparisonData.metric_deltas.wickets)} wkts for ${comparePlayer2}`}
                  </span>
                </div>

                <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase text-gray-400 block">ECONOMY RATE</span>
                  <div className="flex items-center justify-center space-x-2 text-xl font-black font-mono">
                    <span className="text-nexus-cyan">{comparisonData.player1.career_summary.economy}</span>
                    <span className="text-gray-500">vs</span>
                    <span className="text-nexus-gold">{comparisonData.player2.career_summary.economy}</span>
                  </div>
                  <span className="text-xs font-mono text-gray-400 block">
                    {comparisonData.metric_deltas.economy < 0
                      ? `${Math.abs(comparisonData.metric_deltas.economy)} more economical (${comparePlayer1})`
                      : `${comparisonData.metric_deltas.economy} more economical (${comparePlayer2})`}
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
