import React, { useState, useEffect } from "react";
import {
  Shield,
  Trophy,
  Swords,
  Users,
  Coins,
  Crown,
  Sparkles,
  Activity,
  Flame,
  ChevronRight,
  Dices,
  Landmark,
  Layers,
  Search,
} from "lucide-react";
import {
  FranchiseSummary,
  FranchiseDossier,
  RivalryDetails,
  RivalryMatrix,
  PlayingXIClashResult,
  AuctionResponse,
} from "../types";
import {
  fetchFranchises,
  fetchFranchiseDossier,
  fetchRivalry,
  fetchRivalryMatrix,
  simulatePlayingXIClash,
  fetchAuctionTargets,
} from "../services/api";
import { getTeamInfo } from "../utils/teamData";

interface FranchiseWarRoomProps {
  setSelectedPlayer?: (name: string) => void;
  setSelectedMatchId?: (id: string) => void;
  setActiveTab?: (tab: string) => void;
  initialSubTab?: "dossier" | "rivalry" | "lineup" | "auction";
}

const VENUES = [
  { id: "wankhede", name: "Wankhede Stadium, Mumbai" },
  { id: "chidambaram", name: "MA Chidambaram Stadium, Chennai" },
  { id: "chinnaswamy", name: "M Chinnaswamy Stadium, Bengaluru" },
  { id: "eden", name: "Eden Gardens, Kolkata" },
  { id: "modi", name: "Narendra Modi Stadium, Ahmedabad" },
  { id: "ekana", name: "Ekana Cricket Stadium, Lucknow" },
];

export const FranchiseWarRoom: React.FC<FranchiseWarRoomProps> = ({
  setSelectedPlayer,
  setSelectedMatchId,
  setActiveTab,
  initialSubTab = "dossier",
}) => {
  const [subTab, setSubTab] = useState<"dossier" | "rivalry" | "lineup" | "auction">(initialSubTab);

  // Franchises catalog
  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>("CSK");
  const [dossier, setDossier] = useState<FranchiseDossier | null>(null);
  const [loadingDossier, setLoadingDossier] = useState<boolean>(true);

  // Rivalry state
  const [rivalryTeam1, setRivalryTeam1] = useState<string>("MI");
  const [rivalryTeam2, setRivalryTeam2] = useState<string>("CSK");
  const [rivalryDetails, setRivalryDetails] = useState<RivalryDetails | null>(null);
  const [rivalryMatrix, setRivalryMatrix] = useState<RivalryMatrix | null>(null);
  const [loadingRivalry, setLoadingRivalry] = useState<boolean>(false);

  // Playing XI Simulator state
  const [simTeam1Id, setSimTeam1Id] = useState<string>("CSK");
  const [simTeam2Id, setSimTeam2Id] = useState<string>("MI");
  const [team1Lineup, setTeam1Lineup] = useState<string[]>([]);
  const [team1ImpactSub, setTeam1ImpactSub] = useState<string>("");
  const [team2Lineup, setTeam2Lineup] = useState<string[]>([]);
  const [team2ImpactSub, setTeam2ImpactSub] = useState<string>("");
  const [selectedVenue, setSelectedVenue] = useState<string>("wankhede");
  const [simulationResult, setSimulationResult] = useState<PlayingXIClashResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Auction Lab state
  const [auctionData, setAuctionData] = useState<AuctionResponse | null>(null);
  const [auctionSearch, setAuctionSearch] = useState<string>("");
  const [auctionRoleFilter, setAuctionRoleFilter] = useState<string>("ALL");
  const [loadingAuction, setLoadingAuction] = useState<boolean>(false);

  // Load franchises on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await fetchFranchises();
        setFranchises(data.franchises);
        if (data.franchises.length > 0 && !selectedFranchiseId) {
          setSelectedFranchiseId(data.franchises[0].id);
        }
      } catch (err) {
        console.error("Failed to load franchises:", err);
      }
    }
    loadCatalog();
  }, []);

  // Load dossier when selectedFranchiseId changes
  useEffect(() => {
    async function loadDossier() {
      if (!selectedFranchiseId) return;
      try {
        setLoadingDossier(true);
        const data = await fetchFranchiseDossier(selectedFranchiseId);
        setDossier(data);

        // Pre-populate Playing XI lineup defaults if on lineup tab
        if (data.roster_pool && data.roster_pool.length >= 12) {
          const top11 = data.roster_pool.slice(0, 11).map((p) => p.player_name);
          const impact = data.roster_pool[11]?.player_name || "";
          if (simTeam1Id === selectedFranchiseId && team1Lineup.length === 0) {
            setTeam1Lineup(top11);
            setTeam1ImpactSub(impact);
          }
        }
      } catch (err) {
        console.error("Failed to load dossier:", err);
      } finally {
        setLoadingDossier(false);
      }
    }
    loadDossier();
  }, [selectedFranchiseId]);

  // Load rivalry details
  useEffect(() => {
    async function loadRivalry() {
      if (!rivalryTeam1 || !rivalryTeam2 || rivalryTeam1 === rivalryTeam2) return;
      try {
        setLoadingRivalry(true);
        const [details, matrix] = await Promise.all([
          fetchRivalry(rivalryTeam1, rivalryTeam2),
          fetchRivalryMatrix(),
        ]);
        setRivalryDetails(details);
        setRivalryMatrix(matrix);
      } catch (err) {
        console.error("Failed to load rivalry:", err);
      } finally {
        setLoadingRivalry(false);
      }
    }
    if (subTab === "rivalry") {
      loadRivalry();
    }
  }, [rivalryTeam1, rivalryTeam2, subTab]);

  // Load lineups for Playing XI simulator
  useEffect(() => {
    async function initSimLineups() {
      try {
        const [t1Dossier, t2Dossier] = await Promise.all([
          fetchFranchiseDossier(simTeam1Id),
          fetchFranchiseDossier(simTeam2Id),
        ]);
        if (t1Dossier.roster_pool.length >= 12) {
          setTeam1Lineup(t1Dossier.roster_pool.slice(0, 11).map((p) => p.player_name));
          setTeam1ImpactSub(t1Dossier.roster_pool[11].player_name);
        }
        if (t2Dossier.roster_pool.length >= 12) {
          setTeam2Lineup(t2Dossier.roster_pool.slice(0, 11).map((p) => p.player_name));
          setTeam2ImpactSub(t2Dossier.roster_pool[11].player_name);
        }
      } catch (err) {
        console.error("Failed to init sim lineups:", err);
      }
    }
    if (subTab === "lineup") {
      initSimLineups();
    }
  }, [simTeam1Id, simTeam2Id, subTab]);

  // Load Auction data
  useEffect(() => {
    async function loadAuction() {
      try {
        setLoadingAuction(true);
        const data = await fetchAuctionTargets(selectedFranchiseId);
        setAuctionData(data);
      } catch (err) {
        console.error("Failed to load auction data:", err);
      } finally {
        setLoadingAuction(false);
      }
    }
    if (subTab === "auction") {
      loadAuction();
    }
  }, [selectedFranchiseId, subTab]);

  // Execute Playing XI Clash Simulation
  const handleRunSimulation = async () => {
    if (team1Lineup.length !== 11 || team2Lineup.length !== 11) return;
    try {
      setIsSimulating(true);
      const res = await simulatePlayingXIClash({
        team1_id: simTeam1Id,
        team1_lineup: team1Lineup,
        team1_impact_sub: team1ImpactSub || undefined,
        team2_id: simTeam2Id,
        team2_lineup: team2Lineup,
        team2_impact_sub: team2ImpactSub || undefined,
        venue_id: selectedVenue,
      });
      setSimulationResult(res);
    } catch (err) {
      console.error("Clash simulation failed:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 pt-1 font-sans">
      {/* Top Header & Broadcast Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.1] pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#19398a] to-[#ef4123] text-white shadow-[0_0_16px_rgba(239,65,35,0.4)]">
              <Shield className="w-6 h-6 text-[#ffcb05]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight uppercase">
                  FRANCHISE WAR ROOM & SQUAD HQ
                </span>
                <span className="bg-[#ef4123]/20 text-[#ef4123] border border-[#ef4123]/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest hidden sm:inline-block">
                  TELEMETRY
                </span>
              </div>
              <p className="text-xs text-white/60 font-semibold tracking-wide uppercase mt-0.5">
                Executive franchise dossiers, 10x10 rivalry battlefield, Playing XI clash simulator, and mega auction lab
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center bg-[#061645]/90 p-1 rounded-xl border border-white/[0.1] shadow-inner text-xs font-bold uppercase tracking-wider overflow-x-auto">
          <button
            onClick={() => setSubTab("dossier")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all ${
              subTab === "dossier"
                ? "bg-gradient-to-r from-[#19398a] to-[#ef4123] text-white shadow-[0_0_12px_rgba(239,65,35,0.4)]"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-[#ffcb05]" />
            <span>FRANCHISE DOSSIER</span>
          </button>
          <button
            onClick={() => setSubTab("rivalry")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all ${
              subTab === "rivalry"
                ? "bg-gradient-to-r from-[#19398a] to-[#ef4123] text-white shadow-[0_0_12px_rgba(239,65,35,0.4)]"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-[#33a3dc]" />
            <span>RIVALRY BATTLEFIELD</span>
          </button>
          <button
            onClick={() => setSubTab("lineup")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all ${
              subTab === "lineup"
                ? "bg-gradient-to-r from-[#19398a] to-[#ef4123] text-white shadow-[0_0_12px_rgba(239,65,35,0.4)]"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#00b49d]" />
            <span>PLAYING XI SIMULATOR</span>
          </button>
          <button
            onClick={() => setSubTab("auction")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all ${
              subTab === "auction"
                ? "bg-gradient-to-r from-[#19398a] to-[#ef4123] text-white shadow-[0_0_12px_rgba(239,65,35,0.4)]"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-[#ffcb05]" />
            <span>MEGA AUCTION LAB</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: FRANCHISE DOSSIER & TEAM FINGERPRINT                           */}
      {/* ========================================================================= */}
      {subTab === "dossier" && (
        <div className="space-y-6">
          {/* Franchise Selector Bar */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
            {franchises.map((f) => {
              const isSelected = selectedFranchiseId === f.id;
              const fMeta = getTeamInfo(f.name);
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFranchiseId(f.id)}
                  className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                    isSelected
                      ? `${fMeta.bgTint} ${fMeta.borderTint} text-white shadow-[0_0_16px_rgba(25,57,138,0.5)] ring-1 ring-white/30 scale-105`
                      : "bg-[#061645]/60 border-white/[0.08] text-white/60 hover:text-white hover:border-white/20"
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-white/40 shadow-sm"
                    style={{ backgroundColor: f.primary_color }}
                  />
                  <span>{f.short}</span>
                  {f.titles_count > 0 && (
                    <span className="flex items-center space-x-0.5 text-[#ffcb05] text-[10px] font-black">
                      <Trophy className="w-3 h-3" />
                      <span>{f.titles_count}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {loadingDossier || !dossier ? (
            <div className="p-16 text-center text-white/50 text-xs font-mono uppercase tracking-widest animate-pulse">
              Aggregating Franchise Dossier from DuckDB OLAP Warehouse...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Franchise Hero Banner */}
              <div className="relative rounded-2xl bg-[#061645]/90 border border-white/[0.1] p-6 sm:p-8 overflow-hidden shadow-[0_4px_30px_rgba(3,20,83,0.7)]">
                <div
                  className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{ backgroundColor: dossier.primary_color }}
                />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest text-black shadow-md"
                        style={{ backgroundColor: dossier.primary_color }}
                      >
                        {dossier.short}
                      </span>
                      <span className="text-white/60 text-xs font-mono uppercase tracking-wider">
                        EST. {dossier.established} • {dossier.city.toUpperCase()}
                      </span>
                      <span className="text-[#33a3dc] text-xs font-mono tracking-wider italic">
                        "{dossier.motto}"
                      </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-black font-heading text-white uppercase tracking-tight">
                      {dossier.name}
                    </h1>

                    <div className="flex items-center space-x-2 text-xs text-white/70">
                      <Landmark className="w-3.5 h-3.5 text-[#ffcb05]" />
                      <span className="font-semibold">Fortress:</span>
                      <span className="text-white/90">{dossier.home_ground}</span>
                    </div>
                  </div>

                  {/* Trophy Cabinet */}
                  <div className="flex flex-col items-start md:items-end space-y-2">
                    <div className="flex items-center space-x-2 bg-black/40 border border-[#ffcb05]/30 px-4 py-2 rounded-xl">
                      <Trophy className="w-5 h-5 text-[#ffcb05]" />
                      <div className="text-left">
                        <div className="text-[10px] text-[#ffcb05] font-black uppercase tracking-widest">
                          IPL CHAMPIONSHIPS
                        </div>
                        <div className="text-xl font-heading font-black text-white">
                          {dossier.titles_count}{" "}
                          <span className="text-xs text-white/60 font-sans">
                            {dossier.titles_count === 1 ? "TITLE" : "TITLES"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {dossier.trophies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {dossier.trophies.map((yr) => (
                          <span
                            key={yr}
                            className="bg-[#ffcb05]/15 border border-[#ffcb05]/40 text-[#ffcb05] text-[10px] font-black px-2 py-0.5 rounded-md"
                          >
                            {yr}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* KPI Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-[#061645]/80 border border-white/[0.08] p-4 rounded-xl space-y-1">
                  <div className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
                    MATCHES PLAYED
                  </div>
                  <div className="text-2xl font-black text-white font-heading">
                    {dossier.matches_played}
                  </div>
                  <div className="text-[11px] text-white/60 font-mono">
                    {dossier.wins}W • {dossier.losses}L
                  </div>
                </div>

                <div className="bg-[#061645]/80 border border-white/[0.08] p-4 rounded-xl space-y-1">
                  <div className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
                    ALL-TIME WIN %
                  </div>
                  <div className="text-2xl font-black text-[#00b49d] font-heading">
                    {dossier.win_rate}%
                  </div>
                  <div className="text-[11px] text-white/60 font-mono">League Baseline: 50.0%</div>
                </div>

                <div className="bg-[#061645]/80 border border-white/[0.08] p-4 rounded-xl space-y-1">
                  <div className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
                    DEFEND WIN %
                  </div>
                  <div className="text-2xl font-black text-[#ffcb05] font-heading">
                    {dossier.defend_win_pct}%
                  </div>
                  <div className="text-[11px] text-white/60 font-mono">Batting 1st Record</div>
                </div>

                <div className="bg-[#061645]/80 border border-white/[0.08] p-4 rounded-xl space-y-1">
                  <div className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
                    CHASE WIN %
                  </div>
                  <div className="text-2xl font-black text-[#33a3dc] font-heading">
                    {dossier.chase_win_pct}%
                  </div>
                  <div className="text-[11px] text-white/60 font-mono">Target Pursuits</div>
                </div>

                <div className="bg-[#061645]/80 border border-white/[0.08] p-4 rounded-xl space-y-1">
                  <div className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
                    TOTAL RUNS
                  </div>
                  <div className="text-2xl font-black text-white font-heading">
                    {dossier.total_runs.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-white/60 font-mono">
                    {dossier.sixes} Sixes Hit
                  </div>
                </div>

                <div className="bg-[#061645]/80 border border-white/[0.08] p-4 rounded-xl space-y-1">
                  <div className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
                    TOTAL WICKETS
                  </div>
                  <div className="text-2xl font-black text-[#ef4123] font-heading">
                    {dossier.total_wickets}
                  </div>
                  <div className="text-[11px] text-white/60 font-mono">Opposition Dismissals</div>
                </div>
              </div>

              {/* Fortress Analysis & Phase Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fortress Analysis Card */}
                <div className="bg-[#061645]/80 border border-white/[0.1] rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center space-x-2">
                      <Landmark className="w-4 h-4 text-[#ffcb05]" />
                      <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider">
                        HOME FORTRESS VS AWAY DOMINANCE
                      </h3>
                    </div>
                    <span
                      className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full border ${
                        dossier.fortress.fortress_differential >= 5
                          ? "bg-[#00b49d]/15 border-[#00b49d]/40 text-[#00b49d]"
                          : "bg-white/10 border-white/20 text-white/70"
                      }`}
                    >
                      {dossier.fortress.fortress_differential >= 0 ? "+" : ""}
                      {dossier.fortress.fortress_differential}% Fortress Delta
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/30 border border-white/[0.08] p-4 rounded-xl space-y-2">
                      <div className="text-[10px] text-white/50 font-mono uppercase">
                        AT HOME FORTRESS
                      </div>
                      <div className="text-3xl font-black text-white font-heading">
                        {dossier.fortress.home_win_pct}%
                      </div>
                      <div className="text-xs text-white/60">
                        {dossier.fortress.home_wins} Wins / {dossier.fortress.home_matches} Matches
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#00b49d] h-full rounded-full"
                          style={{ width: `${dossier.fortress.home_win_pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-black/30 border border-white/[0.08] p-4 rounded-xl space-y-2">
                      <div className="text-[10px] text-white/50 font-mono uppercase">
                        AWAY / NEUTRAL
                      </div>
                      <div className="text-3xl font-black text-white font-heading">
                        {dossier.fortress.away_win_pct}%
                      </div>
                      <div className="text-xs text-white/60">
                        {dossier.fortress.away_wins} Wins / {dossier.fortress.away_matches} Matches
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#33a3dc] h-full rounded-full"
                          style={{ width: `${dossier.fortress.away_win_pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tactical Insights */}
                  <div className="space-y-2 pt-2">
                    <div className="text-[10px] font-mono text-white/50 uppercase tracking-wider">
                      OPERATIONAL WAR ROOM BRIEFING
                    </div>
                    {dossier.tactical_insights.map((note, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-2 text-xs text-white/80 bg-white/[0.02] border border-white/[0.05] p-2.5 rounded-lg"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-[#ef4123] flex-shrink-0 mt-0.5" />
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phase-by-Phase Performance Matrix */}
                <div className="bg-[#061645]/80 border border-white/[0.1] rounded-2xl p-6 space-y-5">
                  <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3">
                    <Activity className="w-4 h-4 text-[#33a3dc]" />
                    <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider">
                      PHASE-BY-PHASE SCORING & BOWLING CURVES
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Powerplay */}
                    <div className="bg-black/30 border border-white/[0.08] p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white uppercase">
                        <span className="text-[#33a3dc]">POWERPLAY (OVERS 1 - 6)</span>
                        <span className="font-mono text-white/60">
                          {dossier.phase_radar.batting.powerplay.boundary_pct}% Boundary Rate
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-white/[0.04] p-2 rounded-lg">
                          <span className="text-white/50 text-[10px] block">BATTING RUN RATE</span>
                          <span className="text-base font-black text-white font-mono">
                            {dossier.phase_radar.batting.powerplay.run_rate} RPO
                          </span>
                        </div>
                        <div className="bg-white/[0.04] p-2 rounded-lg">
                          <span className="text-white/50 text-[10px] block">BOWLING ECONOMY</span>
                          <span className="text-base font-black text-white font-mono">
                            {dossier.phase_radar.bowling.powerplay.economy} RPO
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle */}
                    <div className="bg-black/30 border border-white/[0.08] p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white uppercase">
                        <span className="text-[#ffcb05]">MIDDLE OVERS (OVERS 7 - 15)</span>
                        <span className="font-mono text-white/60">
                          {dossier.phase_radar.batting.middle.dot_pct}% Dot Balls
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-white/[0.04] p-2 rounded-lg">
                          <span className="text-white/50 text-[10px] block">BATTING RUN RATE</span>
                          <span className="text-base font-black text-white font-mono">
                            {dossier.phase_radar.batting.middle.run_rate} RPO
                          </span>
                        </div>
                        <div className="bg-white/[0.04] p-2 rounded-lg">
                          <span className="text-white/50 text-[10px] block">BOWLING ECONOMY</span>
                          <span className="text-base font-black text-white font-mono">
                            {dossier.phase_radar.bowling.middle.economy} RPO
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Death */}
                    <div className="bg-black/30 border border-white/[0.08] p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white uppercase">
                        <span className="text-[#ef4123]">DEATH OVERS (OVERS 16 - 20)</span>
                        <span className="font-mono text-white/60">
                          {dossier.phase_radar.batting.death.boundary_pct}% Boundary Hit Rate
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-white/[0.04] p-2 rounded-lg">
                          <span className="text-white/50 text-[10px] block">BATTING RUN RATE</span>
                          <span className="text-base font-black text-white font-mono">
                            {dossier.phase_radar.batting.death.run_rate} RPO
                          </span>
                        </div>
                        <div className="bg-white/[0.04] p-2 rounded-lg">
                          <span className="text-white/50 text-[10px] block">BOWLING ECONOMY</span>
                          <span className="text-base font-black text-white font-mono">
                            {dossier.phase_radar.bowling.death.economy} RPO
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Franchise Hall of Fame (Top Batters & Bowlers) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Batters */}
                <div className="bg-[#061645]/80 border border-white/[0.1] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3">
                    <Crown className="w-4 h-4 text-[#ffcb05]" />
                    <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider">
                      ALL-TIME FRANCHISE RUN SCORERS
                    </h3>
                  </div>
                  <div className="space-y-2.5">
                    {dossier.top_batters.map((b, i) => (
                      <div
                        key={b.player}
                        onClick={() => {
                          if (setSelectedPlayer && setActiveTab) {
                            setSelectedPlayer(b.player);
                            setActiveTab("players");
                          }
                        }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.06] cursor-pointer transition-all group"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono font-bold text-[#ffcb05]">
                            {i + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-[#ffcb05] transition-colors">
                              {b.player}
                            </div>
                            <div className="text-[10px] text-white/50 font-mono">
                              {b.matches} Matches • {b.sixes} Sixes
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-white font-mono">
                            {b.runs.toLocaleString()}{" "}
                            <span className="text-[10px] text-white/60 font-sans">RUNS</span>
                          </div>
                          <div className="text-[10px] text-[#00b49d] font-mono">
                            SR {b.strike_rate}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Bowlers */}
                <div className="bg-[#061645]/80 border border-white/[0.1] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3">
                    <Flame className="w-4 h-4 text-[#ef4123]" />
                    <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider">
                      ALL-TIME FRANCHISE WICKET TAKERS
                    </h3>
                  </div>
                  <div className="space-y-2.5">
                    {dossier.top_bowlers.map((bw, i) => (
                      <div
                        key={bw.player}
                        onClick={() => {
                          if (setSelectedPlayer && setActiveTab) {
                            setSelectedPlayer(bw.player);
                            setActiveTab("players");
                          }
                        }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.06] cursor-pointer transition-all group"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono font-bold text-[#ef4123]">
                            {i + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-[#ef4123] transition-colors">
                              {bw.player}
                            </div>
                            <div className="text-[10px] text-white/50 font-mono">
                              {bw.matches} Matches • {bw.overs} Overs
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-white font-mono">
                            {bw.wickets}{" "}
                            <span className="text-[10px] text-white/60 font-sans">WKTS</span>
                          </div>
                          <div className="text-[10px] text-[#33a3dc] font-mono">
                            ECON {bw.economy}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: HEAD-TO-HEAD RIVALRY BATTLEFIELD                              */}
      {/* ========================================================================= */}
      {subTab === "rivalry" && (
        <div className="space-y-6">
          {/* Dual Team Selector Bar */}
          <div className="bg-[#061645]/90 border border-white/[0.1] rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <span className="text-xs font-mono uppercase tracking-wider text-white/60">
                TEAM 1:
              </span>
              <select
                value={rivalryTeam1}
                onChange={(e) => {
                  if (e.target.value !== rivalryTeam2) setRivalryTeam1(e.target.value);
                }}
                className="bg-black/50 border border-white/20 rounded-xl px-4 py-2 text-white text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#ef4123]"
              >
                {franchises.map((f) => (
                  <option key={f.id} value={f.id} disabled={f.id === rivalryTeam2}>
                    {f.name} ({f.short})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-2 rounded-full bg-gradient-to-r from-[#19398a] to-[#ef4123] text-white shadow-md">
              <Swords className="w-5 h-5 text-[#ffcb05]" />
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <span className="text-xs font-mono uppercase tracking-wider text-white/60">
                TEAM 2:
              </span>
              <select
                value={rivalryTeam2}
                onChange={(e) => {
                  if (e.target.value !== rivalryTeam1) setRivalryTeam2(e.target.value);
                }}
                className="bg-black/50 border border-white/20 rounded-xl px-4 py-2 text-white text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#ef4123]"
              >
                {franchises.map((f) => (
                  <option key={f.id} value={f.id} disabled={f.id === rivalryTeam1}>
                    {f.name} ({f.short})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingRivalry || !rivalryDetails ? (
            <div className="p-16 text-center text-white/50 text-xs font-mono uppercase tracking-widest animate-pulse">
              Computing Head-to-Head Clash Matrix from DuckDB...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Rivalry Tale of the Tape */}
              <div className="bg-[#061645]/90 border border-white/[0.1] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
                <div className="text-center space-y-1 mb-6">
                  <div className="text-[10px] font-mono text-[#ffcb05] font-black uppercase tracking-widest">
                    {rivalryDetails.derby_name}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-heading font-black text-white uppercase tracking-wide">
                    {rivalryDetails.rivalry_title}
                  </h2>
                  <div className="text-xs text-white/60 font-mono">
                    {rivalryDetails.total_clashes} ALL-TIME ENCOUNTERS • AVG 1ST INNINGS:{" "}
                    {rivalryDetails.avg_1st_innings}
                  </div>
                </div>

                {/* Clash Win Bar */}
                <div className="space-y-2 max-w-2xl mx-auto">
                  <div className="flex justify-between text-xs font-bold text-white uppercase">
                    <span style={{ color: rivalryDetails.team1.primary_color }}>
                      {rivalryDetails.team1.name} ({rivalryDetails.team1.wins} WINS •{" "}
                      {rivalryDetails.team1.win_pct}%)
                    </span>
                    <span style={{ color: rivalryDetails.team2.primary_color }}>
                      {rivalryDetails.team2.name} ({rivalryDetails.team2.wins} WINS •{" "}
                      {rivalryDetails.team2.win_pct}%)
                    </span>
                  </div>

                  <div className="w-full h-4 bg-black/60 rounded-full flex overflow-hidden border border-white/20 p-0.5">
                    <div
                      className="h-full rounded-l-full transition-all duration-500"
                      style={{
                        width: `${rivalryDetails.team1.win_pct}%`,
                        backgroundColor: rivalryDetails.team1.primary_color,
                      }}
                    />
                    <div
                      className="h-full rounded-r-full transition-all duration-500"
                      style={{
                        width: `${rivalryDetails.team2.win_pct}%`,
                        backgroundColor: rivalryDetails.team2.primary_color,
                      }}
                    />
                  </div>
                </div>

                {/* Highest and Lowest Records */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 max-w-3xl mx-auto">
                  <div className="bg-black/30 border border-white/[0.08] p-3 rounded-xl text-center">
                    <div className="text-[10px] text-white/50 font-mono uppercase">
                      {rivalryDetails.team1.short} HIGHEST
                    </div>
                    <div className="text-xl font-black text-white font-mono">
                      {rivalryDetails.team1.max_score}
                    </div>
                  </div>
                  <div className="bg-black/30 border border-white/[0.08] p-3 rounded-xl text-center">
                    <div className="text-[10px] text-white/50 font-mono uppercase">
                      {rivalryDetails.team1.short} LOWEST
                    </div>
                    <div className="text-xl font-black text-white font-mono">
                      {rivalryDetails.team1.min_score}
                    </div>
                  </div>
                  <div className="bg-black/30 border border-white/[0.08] p-3 rounded-xl text-center">
                    <div className="text-[10px] text-white/50 font-mono uppercase">
                      {rivalryDetails.team2.short} HIGHEST
                    </div>
                    <div className="text-xl font-black text-white font-mono">
                      {rivalryDetails.team2.max_score}
                    </div>
                  </div>
                  <div className="bg-black/30 border border-white/[0.08] p-3 rounded-xl text-center">
                    <div className="text-[10px] text-white/50 font-mono uppercase">
                      {rivalryDetails.team2.short} LOWEST
                    </div>
                    <div className="text-xl font-black text-white font-mono">
                      {rivalryDetails.team2.min_score}
                    </div>
                  </div>
                </div>
              </div>

              {/* Venue Splits & Rivalry Heroes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Venue Splits Table */}
                <div className="bg-[#061645]/80 border border-white/[0.1] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3">
                    <Landmark className="w-4 h-4 text-[#33a3dc]" />
                    <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider">
                      VENUE BREAKDOWN IN CLASHES
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {rivalryDetails.venue_splits.map((vs) => (
                      <div
                        key={vs.venue}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs"
                      >
                        <span className="font-semibold text-white/90 truncate max-w-[200px]">
                          {vs.venue}
                        </span>
                        <div className="flex items-center space-x-3 font-mono">
                          <span className="text-white/60">{vs.matches} Matches</span>
                          <span style={{ color: rivalryDetails.team1.primary_color }}>
                            {vs.team1_wins} {rivalryDetails.team1.short}
                          </span>
                          <span className="text-white/30">•</span>
                          <span style={{ color: rivalryDetails.team2.primary_color }}>
                            {vs.team2_wins} {rivalryDetails.team2.short}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Encounters */}
                <div className="bg-[#061645]/80 border border-white/[0.1] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3">
                    <Flame className="w-4 h-4 text-[#ef4123]" />
                    <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider">
                      RECENT HEAD-TO-HEAD MATCHES
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {rivalryDetails.recent_matches.map((rm) => (
                      <div
                        key={rm.match_id}
                        onClick={() => {
                          if (setSelectedMatchId && setActiveTab) {
                            setSelectedMatchId(rm.match_id);
                            setActiveTab("matches");
                          }
                        }}
                        className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/20 cursor-pointer transition-all space-y-1 group"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
                          <span>{rm.match_date} • {rm.season}</span>
                          <span className="text-[#ffcb05] font-bold">WINNER: {rm.winner}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span>{rm.team1} ({rm.innings1})</span>
                          <span className="text-white/40">vs</span>
                          <span>{rm.team2} ({rm.innings2})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 10x10 Interactive Team Rivalry Grid */}
              {rivalryMatrix && (
                <div className="bg-[#061645]/80 border border-white/[0.1] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-[#ffcb05]" />
                      <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider">
                        10x10 ALL-FRANCHISE CLASH MATRIX (CLICK TO LOAD)
                      </h3>
                    </div>
                    <span className="text-[10px] text-white/50 font-mono">Row Wins vs Col</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-center text-xs border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 text-left font-mono text-white/40">TEAM</th>
                          {rivalryMatrix.teams.map((t) => (
                            <th
                              key={t.id}
                              className="p-2 font-mono font-bold"
                              style={{ color: t.color }}
                            >
                              {t.short}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rivalryMatrix.teams.map((rowTeam) => (
                          <tr key={rowTeam.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                            <td className="p-2 text-left font-bold font-mono text-white">
                              {rowTeam.short}
                            </td>
                            {rivalryMatrix.teams.map((colTeam) => {
                              if (rowTeam.id === colTeam.id) {
                                return (
                                  <td key={colTeam.id} className="p-2 bg-white/[0.02] text-white/20">
                                    —
                                  </td>
                                );
                              }
                              const cell = rivalryMatrix.grid[rowTeam.id]?.[colTeam.id];
                              const isSelected =
                                (rivalryTeam1 === rowTeam.id && rivalryTeam2 === colTeam.id) ||
                                (rivalryTeam1 === colTeam.id && rivalryTeam2 === rowTeam.id);
                              return (
                                <td
                                  key={colTeam.id}
                                  onClick={() => {
                                    setRivalryTeam1(rowTeam.id);
                                    setRivalryTeam2(colTeam.id);
                                  }}
                                  className={`p-2 cursor-pointer font-mono font-bold transition-all ${
                                    isSelected
                                      ? "bg-[#ef4123]/30 text-white ring-1 ring-[#ef4123]"
                                      : "hover:bg-white/10 text-white/80"
                                  }`}
                                  title={`${rowTeam.short} vs ${colTeam.short}: ${cell?.t1_wins || 0}W - ${cell?.t2_wins || 0}L`}
                                >
                                  {cell?.t1_wins || 0}
                                </td>
                              );
                            })}
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

      {/* ========================================================================= */}
      {/* SUB-TAB 3: PLAYING XI ARCHITECT & CLASH SIMULATOR                         */}
      {/* ========================================================================= */}
      {subTab === "lineup" && (
        <div className="space-y-6">
          {/* Lineup Control Bar */}
          <div className="bg-[#061645]/90 border border-white/[0.1] rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono uppercase text-white/60">MATCH VENUE:</span>
              <select
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="bg-black/50 border border-white/20 rounded-xl px-4 py-2 text-white text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#00b49d]"
              >
                {VENUES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00b49d] via-[#33a3dc] to-[#ef4123] text-white font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,180,157,0.4)] hover:scale-105 transition-transform flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Dices className="w-4 h-4 animate-spin-slow" />
              <span>{isSimulating ? "SIMULATING CLASH..." : "EXECUTE TACTICAL CLASH"}</span>
            </button>
          </div>

          {/* Dual Lineup Builder Boards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team 1 Lineup */}
            <div className="bg-[#061645]/80 border border-white/[0.1] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center space-x-2">
                  <select
                    value={simTeam1Id}
                    onChange={(e) => setSimTeam1Id(e.target.value)}
                    className="bg-black/50 border border-white/20 rounded-lg px-3 py-1 text-white text-xs font-bold uppercase tracking-wider"
                  >
                    {franchises.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.short})
                      </option>
                    ))}
                  </select>
                  <span className="text-xs font-mono text-white/50">PLAYING XI</span>
                </div>
                <span className="text-[10px] font-mono text-[#ffcb05] font-black uppercase">
                  11 STARTERS + 1 IMPACT SUB
                </span>
              </div>

              {/* Player Slots */}
              <div className="space-y-2">
                {team1Lineup.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-white/70">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-white">{p}</span>
                    </div>
                    <span className="text-[10px] font-mono text-white/50">
                      {idx < 3 ? "Top-Order" : idx < 7 ? "Middle-Order" : "Bowler"}
                    </span>
                  </div>
                ))}

                {/* Impact Player Slot */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#00b49d]/15 border border-[#00b49d]/40 text-xs mt-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#00b49d]" />
                    <span className="font-bold text-white">IMPACT SUB: {team1ImpactSub || "Not Assigned"}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#00b49d] font-bold uppercase">
                    TACTICAL ENFORCER
                  </span>
                </div>
              </div>
            </div>

            {/* Team 2 Lineup */}
            <div className="bg-[#061645]/80 border border-white/[0.1] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center space-x-2">
                  <select
                    value={simTeam2Id}
                    onChange={(e) => setSimTeam2Id(e.target.value)}
                    className="bg-black/50 border border-white/20 rounded-lg px-3 py-1 text-white text-xs font-bold uppercase tracking-wider"
                  >
                    {franchises.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.short})
                      </option>
                    ))}
                  </select>
                  <span className="text-xs font-mono text-white/50">PLAYING XI</span>
                </div>
                <span className="text-[10px] font-mono text-[#33a3dc] font-black uppercase">
                  11 STARTERS + 1 IMPACT SUB
                </span>
              </div>

              {/* Player Slots */}
              <div className="space-y-2">
                {team2Lineup.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-white/70">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-white">{p}</span>
                    </div>
                    <span className="text-[10px] font-mono text-white/50">
                      {idx < 3 ? "Top-Order" : idx < 7 ? "Middle-Order" : "Bowler"}
                    </span>
                  </div>
                ))}

                {/* Impact Player Slot */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#33a3dc]/15 border border-[#33a3dc]/40 text-xs mt-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#33a3dc]" />
                    <span className="font-bold text-white">IMPACT SUB: {team2ImpactSub || "Not Assigned"}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#33a3dc] font-bold uppercase">
                    TACTICAL ENFORCER
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Output Results */}
          {simulationResult && (
            <div className="bg-[#061645]/95 border border-white/[0.15] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3">
                <Dices className="w-5 h-5 text-[#00b49d]" />
                <h3 className="text-base font-heading font-black text-white uppercase tracking-wider">
                  TACTICAL CLASH SIMULATION RESULTS
                </h3>
              </div>

              {/* Win Probabilities & Projected Scores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/40 border border-white/[0.08] p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-heading font-black text-white uppercase">
                      {simulationResult.team1.name}
                    </span>
                    <span className="text-2xl font-black font-mono text-[#00b49d]">
                      {simulationResult.team1.win_probability}%
                    </span>
                  </div>
                  <div className="text-xs text-white/60 font-mono">
                    Projected Score:{" "}
                    <span className="text-white font-bold">
                      {simulationResult.team1.projected_score}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/50">
                    Overseas Slots: {simulationResult.team1.overseas_count}/4 • WK:{" "}
                    {simulationResult.team1.wk_count} • Bowling Options:{" "}
                    {simulationResult.team1.bowling_options}
                  </div>
                </div>

                <div className="bg-black/40 border border-white/[0.08] p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-heading font-black text-white uppercase">
                      {simulationResult.team2.name}
                    </span>
                    <span className="text-2xl font-black font-mono text-[#33a3dc]">
                      {simulationResult.team2.win_probability}%
                    </span>
                  </div>
                  <div className="text-xs text-white/60 font-mono">
                    Projected Score:{" "}
                    <span className="text-white font-bold">
                      {simulationResult.team2.projected_score}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/50">
                    Overseas Slots: {simulationResult.team2.overseas_count}/4 • WK:{" "}
                    {simulationResult.team2.wk_count} • Bowling Options:{" "}
                    {simulationResult.team2.bowling_options}
                  </div>
                </div>
              </div>

              {/* Phase Dominance Badges */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/[0.03] border border-white/[0.08] p-3 rounded-xl">
                  <div className="text-[10px] text-white/50 font-mono uppercase">
                    POWERPLAY WINNER
                  </div>
                  <div className="text-sm font-black text-[#ffcb05] font-heading mt-1">
                    {simulationResult.phase_battle.powerplay}
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.08] p-3 rounded-xl">
                  <div className="text-[10px] text-white/50 font-mono uppercase">
                    MIDDLE OVERS WINNER
                  </div>
                  <div className="text-sm font-black text-[#33a3dc] font-heading mt-1">
                    {simulationResult.phase_battle.middle}
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.08] p-3 rounded-xl">
                  <div className="text-[10px] text-white/50 font-mono uppercase">
                    DEATH OVERS WINNER
                  </div>
                  <div className="text-sm font-black text-[#ef4123] font-heading mt-1">
                    {simulationResult.phase_battle.death}
                  </div>
                </div>
              </div>

              {/* Tactical Blueprint Verdict */}
              <div className="p-4 rounded-xl bg-[#00b49d]/10 border border-[#00b49d]/30 text-xs text-white/90 leading-relaxed font-sans">
                <span className="font-black text-[#00b49d] uppercase mr-2">
                  TACTICAL BLUEPRINT:
                </span>
                {simulationResult.tactical_verdict}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: MEGA AUCTION LAB                                              */}
      {/* ========================================================================= */}
      {subTab === "auction" && (
        <div className="space-y-6">
          {loadingAuction || !auctionData ? (
            <div className="p-16 text-center text-white/50 text-xs font-mono uppercase tracking-widest animate-pulse">
              Calculating Expected Auction Valuations (EAV) from DuckDB...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Purse Tracker Header */}
              <div className="bg-[#061645]/90 border border-white/[0.1] rounded-2xl p-6 sm:p-8 shadow-xl grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] text-white/50 font-mono uppercase">
                    TOTAL SQUAD PURSE
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-heading">
                    ₹{auctionData.total_purse_cr} Cr
                  </div>
                  <div className="text-[11px] text-white/60">IPL Salary Cap</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-white/50 font-mono uppercase">
                    AVAILABLE PURSE
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#00b49d] font-heading">
                    ₹{auctionData.available_purse_cr} Cr
                  </div>
                  <div className="text-[11px] text-white/60">To spend at auction</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-white/50 font-mono uppercase">
                    SQUAD CAPACITY
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#ffcb05] font-heading">
                    {auctionData.current_squad_size} / {auctionData.squad_size_limit}
                  </div>
                  <div className="text-[11px] text-white/60">Max 25 Players</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-white/50 font-mono uppercase">
                    OVERSEAS SLOTS
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#33a3dc] font-heading">
                    {auctionData.current_overseas} / {auctionData.max_overseas}
                  </div>
                  <div className="text-[11px] text-white/60">Max 8 in squad</div>
                </div>
              </div>

              {/* Player Pool Search & Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#061645]/80 border border-white/[0.08] p-4 rounded-xl">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search player pool..."
                    value={auctionSearch}
                    onChange={(e) => setAuctionSearch(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#ef4123]"
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
                  {["ALL", "Batter", "Bowler", "All-Rounder", "Wicket-Keeper"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setAuctionRoleFilter(r)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                        auctionRoleFilter === r
                          ? "bg-[#ef4123] text-white shadow-md"
                          : "bg-white/[0.04] text-white/60 hover:text-white"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auction Player Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {auctionData.auction_pool
                  .filter((p) => {
                    const matchName = p.name.toLowerCase().includes(auctionSearch.toLowerCase());
                    const matchRole =
                      auctionRoleFilter === "ALL" || p.role.toLowerCase().includes(auctionRoleFilter.toLowerCase());
                    return matchName && matchRole;
                  })
                  .map((p) => (
                    <div
                      key={p.name}
                      onClick={() => {
                        if (setSelectedPlayer && setActiveTab) {
                          setSelectedPlayer(p.name);
                          setActiveTab("players");
                        }
                      }}
                      className="bg-[#061645]/80 border border-white/[0.08] hover:border-white/25 p-4 rounded-xl space-y-3 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-[#ffcb05] transition-colors">
                            {p.name}
                          </div>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-[10px] text-white/50 font-mono">{p.role}</span>
                            {p.is_overseas && (
                              <span className="text-[9px] bg-[#33a3dc]/15 border border-[#33a3dc]/40 text-[#33a3dc] px-1.5 py-0.2 rounded font-mono">
                                OVERSEAS
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              p.tier === "Marquee"
                                ? "bg-[#ffcb05]/15 border-[#ffcb05]/40 text-[#ffcb05]"
                                : p.tier === "Gold"
                                ? "bg-[#33a3dc]/15 border-[#33a3dc]/40 text-[#33a3dc]"
                                : "bg-white/10 border-white/20 text-white/70"
                            }`}
                          >
                            {p.tier}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-black/30 p-2.5 rounded-lg text-center text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-white/40 block">RUNS</span>
                          <span className="font-bold text-white">{p.runs}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-white/40 block">WKTS</span>
                          <span className="font-bold text-white">{p.wickets}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-white/40 block">SR / ECON</span>
                          <span className="font-bold text-[#00b49d]">
                            {p.strike_rate ? p.strike_rate : p.economy}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-white/50 font-mono text-[10px]">
                          EXPECTED VALUATION (EAV):
                        </span>
                        <span className="font-heading font-black text-white text-sm">
                          ₹{p.expected_auction_price_cr} Cr
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
