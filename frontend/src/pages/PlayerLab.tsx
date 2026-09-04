import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Swords,
  Sparkles,
  Zap,
} from "lucide-react";
import { PlayerProfile, PlayerDNAResponse } from "../types";
import { fetchPlayers, fetchPlayerDNA } from "../services/api";
import { PlayerDNARadar } from "../components/charts/PlayerDNARadar";

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

export const PlayerLab: React.FC<PlayerLabProps> = ({
  selectedPlayer,
  setSelectedPlayer,
  setActiveTab,
  setMatchupBatter,
  setMatchupBowler,
}) => {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "batters" | "bowlers" | "allrounders">("all");
  const [sortBy, setSortBy] = useState("runs");
  const [dnaData, setDnaData] = useState<PlayerDNAResponse | null>(null);
  const [dnaLoading, setDnaLoading] = useState(false);

  useEffect(() => {
    async function loadList() {
      try {
        const res = await fetchPlayers(searchQuery, sortBy, 36);
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

  useEffect(() => {
    async function loadDNA() {
      if (!selectedPlayer) return;
      setDnaLoading(true);
      try {
        const dna = await fetchPlayerDNA(selectedPlayer);
        setDnaData(dna);
      } catch (e) {
        console.error("Error loading DNA:", e);
      } finally {
        setDnaLoading(false);
      }
    }
    loadDNA();
  }, [selectedPlayer]);

  // Filter players by role tab
  const filteredPlayers = players.filter((p) => {
    if (roleFilter === "batters") return p.total_runs >= 1000 && p.total_wickets < 20;
    if (roleFilter === "bowlers") return p.total_wickets >= 30 && p.total_runs < 800;
    if (roleFilter === "allrounders") return p.total_runs >= 800 && p.total_wickets >= 20;
    return true;
  });

  return (
    <div className="space-y-6 pb-20 pt-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-nexus-gold/15 text-nexus-gold border border-nexus-gold/30 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-wide">
                Player Intelligence & 10-Axis DNA
              </h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Situational multidimensional vectors, archetype classifications & pressure execution ratings
              </p>
            </div>
          </div>
        </div>

        {/* Search & Sort Command Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search player name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#080D1A] border border-white/[0.12] focus:border-nexus-cyan rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none w-56 font-mono transition-colors"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#080D1A] border border-white/[0.12] rounded-2xl px-3.5 py-2 text-xs text-white font-mono focus:border-nexus-cyan outline-none"
          >
            <option value="runs">Most Runs</option>
            <option value="wickets">Most Wickets</option>
            <option value="sr">Strike Rate</option>
            <option value="economy">Economy</option>
          </select>
        </div>
      </div>

      {/* Star Player Quick Pick Carousel */}
      <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
        <div className="flex items-center space-x-2 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-nexus-gold" />
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
            FEATURED IPL MARQUEE STARS
          </span>
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
                    ? "bg-nexus-gold text-nexus-bg font-bold border-nexus-gold shadow-[0_0_15px_rgba(245,158,11,0.35)]"
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
      </div>

      {/* Main Grid: Master-Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (6 cols): Player DNA Profile Card */}
        <div className="lg:col-span-6 space-y-6">
          {dnaLoading || !dnaData ? (
            <div className="glass-panel rounded-3xl p-16 flex flex-col items-center justify-center space-y-4 min-h-[460px]">
              <div className="w-12 h-12 border-3 border-nexus-cyan border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-mono text-gray-400 tracking-wider">
                COMPUTING MULTIDIMENSIONAL 10-AXIS DNA PROFILE...
              </span>
            </div>
          ) : (
            <>
              {/* Radar Chart Component */}
              <PlayerDNARadar
                playerName={dnaData.player_name}
                role={dnaData.role}
                archetype={dnaData.archetype}
                axes={dnaData.radar_axes}
              />

              {/* Career Aggregates Card */}
              <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase text-gray-400 tracking-wider font-bold">
                    Official Career Aggregates (2008–2025)
                  </h4>
                  <span className="text-[11px] font-mono text-nexus-cyan font-bold bg-nexus-cyan/10 px-2.5 py-0.5 rounded border border-nexus-cyan/20">
                    VERIFIED STATS
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#080D1A] rounded-2xl p-4 border border-white/[0.06] text-center">
                    <span className="text-[10px] font-mono text-gray-400 block uppercase">TOTAL RUNS</span>
                    <span className="text-2xl font-black font-mono text-nexus-cyan mt-1 block">
                      {dnaData.career_summary.runs.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-[#080D1A] rounded-2xl p-4 border border-white/[0.06] text-center">
                    <span className="text-[10px] font-mono text-gray-400 block uppercase">CAREER SR</span>
                    <span className="text-2xl font-black font-mono text-nexus-gold mt-1 block">
                      {dnaData.career_summary.strike_rate}
                    </span>
                  </div>

                  <div className="bg-[#080D1A] rounded-2xl p-4 border border-white/[0.06] text-center">
                    <span className="text-[10px] font-mono text-gray-400 block uppercase">WICKETS</span>
                    <span className="text-2xl font-black font-mono text-red-400 mt-1 block">
                      {dnaData.career_summary.wickets}
                    </span>
                  </div>

                  <div className="bg-[#080D1A] rounded-2xl p-4 border border-white/[0.06] text-center">
                    <span className="text-[10px] font-mono text-gray-400 block uppercase">ECONOMY</span>
                    <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
                      {dnaData.career_summary.economy || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Quick Action Shortcuts */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06]">
                  <span className="text-xs text-gray-400 font-mono">
                    Tactical Analysis Shortcuts:
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (dnaData.role === "Batter") {
                          setMatchupBatter(dnaData.player_name);
                        } else {
                          setMatchupBowler(dnaData.player_name);
                        }
                        setActiveTab("matchups");
                      }}
                      className="bg-nexus-cyan/15 hover:bg-nexus-cyan/25 text-nexus-cyan text-xs font-bold px-4 py-2 rounded-xl border border-nexus-cyan/30 flex items-center space-x-1.5 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Launch Duel</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("strategy")}
                      className="bg-nexus-gold/15 hover:bg-nexus-gold/25 text-nexus-gold text-xs font-bold px-4 py-2 rounded-xl border border-nexus-gold/30 flex items-center space-x-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Strategy Lab</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column (6 cols): Filterable Player Directory */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-6 border border-white/[0.08] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
            <div>
              <h3 className="text-base font-bold text-white">Player Roster</h3>
              <span className="text-xs font-mono text-gray-400">
                {filteredPlayers.length} Profiles matching filters
              </span>
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center space-x-1 bg-[#080D1A] p-1 rounded-xl border border-white/[0.08]">
              {[
                { id: "all", label: "All" },
                { id: "batters", label: "Batters" },
                { id: "bowlers", label: "Bowlers" },
                { id: "allrounders", label: "All-Rounders" },
              ].map((rf) => (
                <button
                  key={rf.id}
                  onClick={() => setRoleFilter(rf.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                    roleFilter === rf.id
                      ? "bg-nexus-cyan text-nexus-bg font-extrabold"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Player Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredPlayers.map((p) => {
              const isSelected = selectedPlayer === p.player_name;
              return (
                <div
                  key={p.player_name}
                  onClick={() => setSelectedPlayer(p.player_name)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-nexus-cyan/15 border-nexus-cyan text-white shadow-[0_0_20px_rgba(0,240,255,0.25)]"
                      : "bg-[#080D1A] hover:bg-white/[0.04] border-white/[0.06] text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold truncate">{p.player_name}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-nexus-cyan shadow-[0_0_8px_#00F0FF]"></span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2 text-xs font-mono text-gray-400">
                    <span className="text-nexus-cyan font-bold">{p.total_runs.toLocaleString()} runs</span>
                    <span>SR {p.strike_rate}</span>
                  </div>

                  <div className="flex items-center justify-between mt-1 text-xs font-mono text-gray-400">
                    <span className="text-red-400 font-bold">{p.total_wickets} wkts</span>
                    <span>{p.matches_played} matches</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
