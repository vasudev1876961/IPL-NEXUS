import { useEffect, useState } from "react";
import { Users, Search, Swords, ArrowRight } from "lucide-react";
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

export const PlayerLab: React.FC<PlayerLabProps> = ({
  selectedPlayer,
  setSelectedPlayer,
  setActiveTab,
  setMatchupBatter,
  setMatchupBowler,
}) => {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("runs");
  const [dnaData, setDnaData] = useState<PlayerDNAResponse | null>(null);
  const [dnaLoading, setDnaLoading] = useState(false);

  useEffect(() => {
    async function loadList() {
      try {
        const res = await fetchPlayers(searchQuery, sortBy, 24);
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

  return (
    <div className="space-y-6 pb-16 pt-2">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide flex items-center space-x-2.5">
            <Users className="w-6 h-6 text-nexus-cyan" />
            <span>Player Intelligence & 10-Axis DNA</span>
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Situational multidimensional vectors, archetype classifications & pressure execution
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search player name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.1] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:border-nexus-cyan outline-none w-56 font-mono"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-nexus-cyan outline-none"
          >
            <option value="runs">Most Runs</option>
            <option value="wickets">Most Wickets</option>
            <option value="sr">Strike Rate</option>
            <option value="economy">Economy</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Player DNA Viewport */}
        <div className="lg:col-span-6 space-y-6">
          {dnaLoading || !dnaData ? (
            <div className="glass-panel rounded-3xl p-12 flex flex-col items-center justify-center space-y-3 min-h-[450px]">
              <div className="w-10 h-10 border-3 border-nexus-cyan border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-mono text-gray-400 tracking-wider">
                COMPUTING MULTIDIMENSIONAL DNA PROFILE...
              </span>
            </div>
          ) : (
            <>
              <PlayerDNARadar
                playerName={dnaData.player_name}
                role={dnaData.role}
                archetype={dnaData.archetype}
                axes={dnaData.radar_axes}
              />

              {/* Career Metrics Card */}
              <div className="glass-panel rounded-3xl p-6 border border-white/[0.08]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-mono uppercase text-gray-400 tracking-wider">
                    Historical Career Aggregates
                  </h4>
                  <span className="text-xs font-mono text-nexus-cyan font-bold">
                    Official IPL Database
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.05]">
                    <span className="text-[10px] font-mono text-gray-400 block">RUNS</span>
                    <span className="text-xl font-mono font-bold text-nexus-cyan mt-1 block">
                      {dnaData.career_summary.runs.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.05]">
                    <span className="text-[10px] font-mono text-gray-400 block">STRIKE RATE</span>
                    <span className="text-xl font-mono font-bold text-nexus-gold mt-1 block">
                      {dnaData.career_summary.strike_rate}
                    </span>
                  </div>
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.05]">
                    <span className="text-[10px] font-mono text-gray-400 block">WICKETS</span>
                    <span className="text-xl font-mono font-bold text-red-400 mt-1 block">
                      {dnaData.career_summary.wickets}
                    </span>
                  </div>
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.05]">
                    <span className="text-[10px] font-mono text-gray-400 block">ECONOMY</span>
                    <span className="text-xl font-mono font-bold text-emerald-400 mt-1 block">
                      {dnaData.career_summary.economy || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Quick duel launcher */}
                <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-mono">Test In Head-To-Head Duel</span>
                  <button
                    onClick={() => {
                      if (dnaData.role === "Batter") {
                        setMatchupBatter(dnaData.player_name);
                      } else {
                        setMatchupBowler(dnaData.player_name);
                      }
                      setActiveTab("matchups");
                    }}
                    className="bg-nexus-cyan/15 hover:bg-nexus-cyan/25 text-nexus-cyan text-xs font-bold px-4 py-2 rounded-xl border border-nexus-cyan/30 flex items-center space-x-2 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>Launch Matchup Duel</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Selectable Player Grid */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-6 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Select Player</h3>
            <span className="text-xs font-mono text-gray-400">
              {players.length} Players Listed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[660px] overflow-y-auto pr-1">
            {players.map((p) => {
              const isSelected = selectedPlayer === p.player_name;
              return (
                <div
                  key={p.player_name}
                  onClick={() => setSelectedPlayer(p.player_name)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-nexus-cyan/15 border-nexus-cyan text-white shadow-[0_0_20px_rgba(0,240,255,0.25)]"
                      : "bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold truncate">{p.player_name}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-nexus-cyan shadow-[0_0_8px_#00F0FF]"></span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2.5 text-xs font-mono text-gray-400">
                    <span>{p.total_runs.toLocaleString()} runs</span>
                    <span className="text-nexus-cyan font-semibold">SR {p.strike_rate}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs font-mono text-gray-400">
                    <span>{p.total_wickets} wkts</span>
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
