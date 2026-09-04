import { useEffect, useState } from "react";
import { Flame, AlertTriangle, Award, Calendar, ChevronDown, Check } from "lucide-react";
import { fetchMatchDetail, fetchMatches } from "../services/api";
import { MatchSummary } from "../types";
import { MomentumWave } from "../components/charts/MomentumWave";
import { getTeamInfo } from "../utils/teamData";

interface MatchCenterProps {
  selectedMatchId: string | null;
  setSelectedMatchId: (id: string) => void;
  setSelectedPlayer: (name: string) => void;
  setActiveTab: (tab: string) => void;
}

export const MatchCenter: React.FC<MatchCenterProps> = ({
  selectedMatchId,
  setSelectedMatchId,
  setSelectedPlayer,
  setActiveTab,
}) => {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadList() {
      try {
        const res = await fetchMatches(25);
        setMatches(res.matches);
        const matchToLoad = selectedMatchId || res.matches[0]?.match_id;
        if (matchToLoad) {
          loadMatch(matchToLoad);
        }
      } catch (e) {
        console.error("Error loading matches:", e);
      } finally {
        setLoading(false);
      }
    }
    loadList();
  }, [selectedMatchId]);

  async function loadMatch(id: string) {
    setLoading(true);
    setSelectedMatchId(id);
    setDropdownOpen(false);
    try {
      const detail = await fetchMatchDetail(id);
      setMatchData(detail);
    } catch (e) {
      console.error("Error fetching match detail:", e);
    } finally {
      setLoading(false);
    }
  }

  const team1Info = matchData ? getTeamInfo(matchData.summary.team1) : null;
  const team2Info = matchData ? getTeamInfo(matchData.summary.team2) : null;

  return (
    <div className="space-y-6 pb-16 pt-2">
      {/* Header & Custom Match Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide flex items-center space-x-2.5">
            <Flame className="w-6 h-6 text-nexus-cyan" />
            <span>Match Explorer & Telemetry</span>
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Over-by-over ball-by-ball reconstruction, momentum swing detection & scorecards
          </p>
        </div>

        {/* Custom Styled Dropdown Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full md:w-80 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.1] rounded-2xl px-4 py-2.5 text-xs text-white font-mono flex items-center justify-between transition-all"
          >
            <div className="flex items-center space-x-2 truncate">
              <Calendar className="w-4 h-4 text-nexus-cyan shrink-0" />
              <span className="truncate">
                {matchData ? `${matchData.summary.match_date} • ${matchData.summary.team1} vs ${matchData.summary.team2}` : "Select Match"}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-full md:w-96 bg-[#0B1221] border border-white/[0.15] rounded-2xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto space-y-1">
              {matches.map((m) => {
                const isCurrent = matchData?.match_id === m.match_id;
                return (
                  <div
                    key={m.match_id}
                    onClick={() => loadMatch(m.match_id)}
                    className={`p-2.5 rounded-xl cursor-pointer text-xs font-mono transition-all flex items-center justify-between ${
                      isCurrent
                        ? "bg-nexus-cyan/15 text-nexus-cyan border border-nexus-cyan/30 font-bold"
                        : "text-gray-300 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div>
                      <div className="text-[10px] text-gray-400">{m.date} • {m.venue.split(",")[0]}</div>
                      <div className="text-white font-semibold mt-0.5">{m.team1.name} vs {m.team2.name}</div>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-nexus-cyan shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 border-3 border-nexus-cyan border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : matchData && team1Info && team2Info ? (
        <>
          {/* Match Scorecard Banner */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/[0.08]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-gray-400 mb-6 pb-4 border-b border-white/[0.06]">
              <span>Date: <span className="text-white">{matchData.summary.match_date}</span></span>
              <span>Season: <span className="text-white">{matchData.summary.season}</span></span>
              <span>Venue: <span className="text-white">{matchData.summary.venue}</span></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Team 1 */}
              <div className="rounded-2xl p-6 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400">1ST INNINGS</span>
                  <span className={`text-xs font-mono font-bold ${team1Info.textColor}`}>{team1Info.short}</span>
                </div>
                <h3 className="text-2xl font-black text-white mt-1">{matchData.summary.team1}</h3>
                <div className="text-4xl font-extrabold font-mono text-nexus-cyan mt-3">
                  {matchData.summary.innings1_score}/{matchData.summary.innings1_wickets}
                </div>
              </div>

              {/* Team 2 */}
              <div className="rounded-2xl p-6 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400">2ND INNINGS (CHASE)</span>
                  <span className={`text-xs font-mono font-bold ${team2Info.textColor}`}>{team2Info.short}</span>
                </div>
                <h3 className="text-2xl font-black text-white mt-1">{matchData.summary.team2}</h3>
                <div className="text-4xl font-extrabold font-mono text-nexus-gold mt-3">
                  {matchData.summary.innings2_score}/{matchData.summary.innings2_wickets}
                </div>
              </div>
            </div>

            {/* Winner Banner */}
            <div className="mt-6 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <Award className="w-5 h-5 text-nexus-gold" />
                <span className="text-sm font-bold text-white">
                  Match Winner: <span className="text-nexus-cyan">{matchData.summary.match_winner}</span>
                </span>
              </div>
              <span className="text-xs font-mono text-gray-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.06]">
                {matchData.total_deliveries} Ball-by-Ball Records Evaluated
              </span>
            </div>
          </div>

          {/* Momentum Wave Chart */}
          <MomentumWave
            data={matchData.momentum_curve}
            battingTeam={matchData.summary.team2}
            bowlingTeam={matchData.summary.team1}
          />

          {/* Critical Turning Points */}
          <div className="glass-panel rounded-3xl p-6 border border-white/[0.08]">
            <div className="flex items-center space-x-2.5 mb-5">
              <AlertTriangle className="w-5 h-5 text-nexus-gold" />
              <h3 className="text-base font-bold text-white">
                Automated Turning Point Detection (Δ Win Prob &ge; 8.0%)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matchData.turning_points.length > 0 ? (
                matchData.turning_points.map((tp: any, i: number) => {
                  const isNegative = tp.delta_win_prob < 0;
                  return (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-nexus-cyan bg-nexus-cyan/10 px-2 py-0.5 rounded border border-nexus-cyan/20">
                            Over {tp.ball}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            Inn {tp.innings}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-white block">
                          {tp.event}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                          isNegative
                            ? "bg-red-500/15 text-red-400 border-red-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {tp.impact}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-400 font-mono col-span-2">
                  Match evolved continuously without abrupt single-ball probability shocks.
                </p>
              )}
            </div>
          </div>

          {/* Top Batters & Bowlers Scorecard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Batters */}
            <div className="glass-panel rounded-3xl p-6 border border-white/[0.08]">
              <h3 className="text-base font-bold text-white mb-4">Leading Batting Impact</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-white/[0.08] pb-2 font-mono">
                      <th className="pb-2">Batter</th>
                      <th className="pb-2">Franchise</th>
                      <th className="pb-2 text-right">R (B)</th>
                      <th className="pb-2 text-right">4s / 6s</th>
                      <th className="pb-2 text-right">SR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] font-mono">
                    {matchData.scorecard.top_batters.map((b: any, i: number) => (
                      <tr
                        key={i}
                        onClick={() => {
                          setSelectedPlayer(b.striker);
                          setActiveTab("players");
                        }}
                        className="hover:bg-white/[0.04] cursor-pointer transition-colors"
                      >
                        <td className="py-3 font-bold text-white flex items-center space-x-1.5">
                          <span>{b.striker}</span>
                          <span className="text-[10px] text-nexus-cyan">&rarr;</span>
                        </td>
                        <td className="py-3 text-gray-400">{b.batting_team.split(" ")[0]}</td>
                        <td className="py-3 text-right font-bold text-nexus-cyan">
                          {b.runs} ({b.balls})
                        </td>
                        <td className="py-3 text-right text-gray-300">
                          {b.fours} / {b.sixes}
                        </td>
                        <td className="py-3 text-right text-nexus-gold font-bold">{b.sr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Bowlers */}
            <div className="glass-panel rounded-3xl p-6 border border-white/[0.08]">
              <h3 className="text-base font-bold text-white mb-4">Leading Bowling Impact</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-white/[0.08] pb-2 font-mono">
                      <th className="pb-2">Bowler</th>
                      <th className="pb-2">Franchise</th>
                      <th className="pb-2 text-right">Overs</th>
                      <th className="pb-2 text-right">W-R</th>
                      <th className="pb-2 text-right">Econ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] font-mono">
                    {matchData.scorecard.top_bowlers.map((bo: any, i: number) => (
                      <tr
                        key={i}
                        onClick={() => {
                          setSelectedPlayer(bo.bowler);
                          setActiveTab("players");
                        }}
                        className="hover:bg-white/[0.04] cursor-pointer transition-colors"
                      >
                        <td className="py-3 font-bold text-white flex items-center space-x-1.5">
                          <span>{bo.bowler}</span>
                          <span className="text-[10px] text-nexus-cyan">&rarr;</span>
                        </td>
                        <td className="py-3 text-gray-400">{bo.bowling_team.split(" ")[0]}</td>
                        <td className="py-3 text-right text-gray-300">{bo.overs}</td>
                        <td className="py-3 text-right font-bold text-red-400">
                          {bo.wickets}-{bo.runs}
                        </td>
                        <td className="py-3 text-right text-nexus-gold font-bold">{bo.economy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
