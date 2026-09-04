import { useEffect, useState } from "react";
import { Flame, AlertTriangle, Award } from "lucide-react";
import { fetchMatchDetail, fetchMatches } from "../services/api";
import { MatchSummary } from "../types";
import { MomentumWave } from "../components/charts/MomentumWave";

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
    try {
      const detail = await fetchMatchDetail(id);
      setMatchData(detail);
    } catch (e) {
      console.error("Error fetching match detail:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Match Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide flex items-center space-x-2">
            <Flame className="w-6 h-6 text-nexus-cyan" />
            <span>Match Center & Situational Telemetry</span>
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Full over-by-over ball reconstruction, turning point detection & scorecards
          </p>
        </div>

        {/* Match Selector Dropdown */}
        <div className="w-full md:w-80">
          <select
            value={matchData?.match_id || ""}
            onChange={(e) => loadMatch(e.target.value)}
            className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-2 text-sm text-white font-mono focus:border-nexus-cyan outline-none"
          >
            {matches.map((m) => (
              <option key={m.match_id} value={m.match_id}>
                {m.date} - {m.team1.name} vs {m.team2.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-nexus-cyan border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : matchData ? (
        <>
          {/* Match Scoreboard Banner */}
          <div className="glass-panel rounded-3xl p-6 border border-nexus-border">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-gray-400 mb-4 pb-3 border-b border-nexus-border/60">
              <span>Date: {matchData.summary.match_date}</span>
              <span>Season: {matchData.summary.season}</span>
              <span>Venue: {matchData.summary.venue}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Team 1 */}
              <div className="bg-nexus-surface/80 rounded-2xl p-5 border border-nexus-border">
                <span className="text-xs font-mono text-gray-400">INNINGS 1</span>
                <h3 className="text-xl font-black text-white">{matchData.summary.team1}</h3>
                <div className="text-3xl font-extrabold font-mono text-nexus-cyan mt-1">
                  {matchData.summary.innings1_score}/{matchData.summary.innings1_wickets}
                </div>
              </div>

              {/* Team 2 */}
              <div className="bg-nexus-surface/80 rounded-2xl p-5 border border-nexus-border">
                <span className="text-xs font-mono text-gray-400">INNINGS 2 (CHASE)</span>
                <h3 className="text-xl font-black text-white">{matchData.summary.team2}</h3>
                <div className="text-3xl font-extrabold font-mono text-nexus-gold mt-1">
                  {matchData.summary.innings2_score}/{matchData.summary.innings2_wickets}
                </div>
              </div>
            </div>

            {/* Winner banner */}
            <div className="mt-4 p-3 rounded-xl bg-nexus-cyan/10 border border-nexus-cyan/30 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-nexus-cyan" />
                <span className="text-sm font-bold text-white">
                  Winner: {matchData.summary.match_winner}
                </span>
              </div>
              <span className="text-xs font-mono text-nexus-cyan">
                {matchData.total_deliveries} Legal Deliveries Processed
              </span>
            </div>
          </div>

          {/* Momentum Wave Chart */}
          <MomentumWave
            data={matchData.momentum_curve}
            battingTeam={matchData.summary.team2}
            bowlingTeam={matchData.summary.team1}
          />

          {/* Turning Points List */}
          <div className="glass-panel rounded-2xl p-6 border border-nexus-border">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-nexus-gold" />
              <h3 className="text-base font-bold text-white">
                Automated Critical Turning Points (Δ Win Prob &ge; 8.0%)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matchData.turning_points.length > 0 ? (
                matchData.turning_points.map((tp: any, i: number) => {
                  const isNegative = tp.delta_win_prob < 0;
                  return (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-nexus-surface/70 border border-nexus-border flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-mono font-bold text-nexus-cyan bg-nexus-cyan/10 px-2 py-0.5 rounded">
                            Over {tp.ball}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            Inn {tp.innings}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-white block">
                          {tp.event}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            isNegative
                              ? "bg-red-500/15 text-nexus-rose border border-red-500/30"
                              : "bg-emerald-500/15 text-nexus-emerald border border-emerald-500/30"
                          }`}
                        >
                          {tp.impact}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-400 font-mono col-span-2">
                  No sudden single-ball shocks above threshold. Match evolved through steady accumulation.
                </p>
              )}
            </div>
          </div>

          {/* Top Batters & Bowlers Scorecard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Batters */}
            <div className="glass-panel rounded-2xl p-6 border border-nexus-border">
              <h3 className="text-base font-bold text-white mb-4">Top Match Batters</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-nexus-border/60 pb-2">
                      <th className="pb-2">Batter</th>
                      <th className="pb-2">Team</th>
                      <th className="pb-2 text-right">R (B)</th>
                      <th className="pb-2 text-right">4s / 6s</th>
                      <th className="pb-2 text-right">SR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border/40 font-mono">
                    {matchData.scorecard.top_batters.map((b: any, i: number) => (
                      <tr
                        key={i}
                        onClick={() => {
                          setSelectedPlayer(b.striker);
                          setActiveTab("players");
                        }}
                        className="hover:bg-nexus-surface/60 cursor-pointer"
                      >
                        <td className="py-2.5 font-bold text-white flex items-center space-x-1">
                          <span>{b.striker}</span>
                          <span className="text-[10px] text-nexus-cyan">&rarr;</span>
                        </td>
                        <td className="py-2.5 text-gray-400">{b.batting_team.split(" ")[0]}</td>
                        <td className="py-2.5 text-right font-bold text-nexus-cyan">
                          {b.runs} ({b.balls})
                        </td>
                        <td className="py-2.5 text-right text-gray-300">
                          {b.fours} / {b.sixes}
                        </td>
                        <td className="py-2.5 text-right text-nexus-gold font-bold">{b.sr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Bowlers */}
            <div className="glass-panel rounded-2xl p-6 border border-nexus-border">
              <h3 className="text-base font-bold text-white mb-4">Top Match Bowlers</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-nexus-border/60 pb-2">
                      <th className="pb-2">Bowler</th>
                      <th className="pb-2">Team</th>
                      <th className="pb-2 text-right">O</th>
                      <th className="pb-2 text-right">W-R</th>
                      <th className="pb-2 text-right">Econ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border/40 font-mono">
                    {matchData.scorecard.top_bowlers.map((bo: any, i: number) => (
                      <tr
                        key={i}
                        onClick={() => {
                          setSelectedPlayer(bo.bowler);
                          setActiveTab("players");
                        }}
                        className="hover:bg-nexus-surface/60 cursor-pointer"
                      >
                        <td className="py-2.5 font-bold text-white flex items-center space-x-1">
                          <span>{bo.bowler}</span>
                          <span className="text-[10px] text-nexus-cyan">&rarr;</span>
                        </td>
                        <td className="py-2.5 text-gray-400">{bo.bowling_team.split(" ")[0]}</td>
                        <td className="py-2.5 text-right text-gray-300">{bo.overs}</td>
                        <td className="py-2.5 text-right font-bold text-nexus-rose">
                          {bo.wickets}-{bo.runs}
                        </td>
                        <td className="py-2.5 text-right text-nexus-gold font-bold">{bo.economy}</td>
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
