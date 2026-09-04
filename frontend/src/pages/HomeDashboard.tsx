import { useEffect, useState } from "react";
import {
  Flame,
  AlertTriangle,
  Award,
  Swords,
  Dices,
  ChevronRight,
  Shield,
  Zap,
  Target,
} from "lucide-react";
import { LiveMatchState, MatchSummary, PlayerProfile } from "../types";
import { fetchLiveMatch, fetchMatches, fetchPlayers } from "../services/api";
import { WinProbGauge } from "../components/charts/WinProbGauge";

interface HomeDashboardProps {
  setActiveTab: (tab: string) => void;
  setSelectedPlayer: (name: string) => void;
  setSelectedMatchId: (id: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  setActiveTab,
  setSelectedPlayer,
  setSelectedMatchId,
}) => {
  const [live, setLive] = useState<LiveMatchState | null>(null);
  const [recentMatches, setRecentMatches] = useState<MatchSummary[]>([]);
  const [topBatters, setTopBatters] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [liveRes, matchesRes, playersRes] = await Promise.all([
          fetchLiveMatch(),
          fetchMatches(6),
          fetchPlayers("", "runs", 5),
        ]);
        setLive(liveRes);
        setRecentMatches(matchesRes.matches);
        setTopBatters(playersRes.players);
      } catch (e) {
        console.error("Error loading dashboard:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !live) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-nexus-cyan border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-mono text-gray-400">CONNECTING TELEMETRY ENGINE...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Broadcast Live Match Centerpiece */}
      <section className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[#0D1527] via-[#0A1020] to-[#070B14] border border-nexus-border overflow-hidden shadow-2xl">
        {/* Neon Glow orbs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-nexus-cyan/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-nexus-rose/15 rounded-full blur-3xl pointer-events-none" />

        {/* Live header tag */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="bg-red-500/15 text-red-400 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-red-500/30">
              LIVE BROADCAST
            </span>
            <span className="text-xs font-mono text-gray-400">{live.title}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
            <span>{live.venue}</span>
          </div>
        </div>

        {/* Live Match Scoreboard & Odds */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          {/* Batting Team Box */}
          <div className="lg:col-span-4 bg-nexus-surface/80 rounded-2xl p-5 border border-nexus-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-nexus-cyan font-bold tracking-wider">CHASING (INN 2)</span>
              <span className="text-xs text-gray-400 font-mono">CRR {live.batting_team.crr}</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1 tracking-wide">
              {live.batting_team.name}
            </h2>
            <div className="flex items-baseline space-x-3 mt-2">
              <span className="text-4xl font-extrabold font-mono text-nexus-cyan tracking-tight">
                {live.batting_team.score}
              </span>
              <span className="text-sm font-mono text-gray-400">
                ({live.batting_team.overs} ov)
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-nexus-border/60 flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">Target: {live.batting_team.target}</span>
              <span className="text-nexus-gold font-bold">
                Need {live.batting_team.runs_needed} from {live.batting_team.balls_remaining}b (RRR {live.batting_team.rrr})
              </span>
            </div>
          </div>

          {/* Center VS & Telemetry */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-nexus-surface border border-nexus-border flex items-center justify-center font-bold text-gray-400 text-sm">
              VS
            </div>
            {/* Recent Balls Ticker */}
            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">
                Current Over Deliveries
              </span>
              <div className="flex items-center space-x-1.5 justify-center">
                {live.recent_balls.map((b, i) => {
                  const isW = b === "W";
                  const isFour = b === "4";
                  const isSix = b === "6";
                  return (
                    <span
                      key={i}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold border ${
                        isW
                          ? "bg-red-500/20 text-red-400 border-red-500"
                          : isSix
                          ? "bg-nexus-cyan/20 text-nexus-cyan border-nexus-cyan"
                          : isFour
                          ? "bg-nexus-electric/20 text-nexus-electric border-nexus-electric"
                          : "bg-nexus-card text-gray-300 border-nexus-border"
                      }`}
                    >
                      {b}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={() => setActiveTab("simulator")}
                className="bg-nexus-cyan/15 hover:bg-nexus-cyan/25 text-nexus-cyan text-xs font-semibold px-3 py-1.5 rounded-lg border border-nexus-cyan/30 flex items-center space-x-1.5 transition-all shadow-glow"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Simulate Over</span>
              </button>
              <button
                onClick={() => setActiveTab("strategy")}
                className="bg-nexus-surface hover:bg-nexus-card text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-nexus-border flex items-center space-x-1.5 transition-all"
              >
                <Target className="w-3.5 h-3.5 text-nexus-gold" />
                <span>Bowler Strategy</span>
              </button>
            </div>
          </div>

          {/* Bowling Team Box */}
          <div className="lg:col-span-4 bg-nexus-surface/80 rounded-2xl p-5 border border-nexus-border text-right">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">1ST INNINGS TOTAL</span>
              <span className="text-xs font-mono text-nexus-rose font-bold tracking-wider">DEFENDING</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1 tracking-wide">
              {live.bowling_team.name}
            </h2>
            <div className="flex items-baseline space-x-3 justify-end mt-2">
              <span className="text-3xl font-bold font-mono text-gray-300">
                {live.bowling_team.score}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-nexus-border/60 flex items-center justify-between text-xs font-mono">
              <span className="text-nexus-cyan font-semibold">Bowler: {live.active_bowler.name}</span>
              <span className="text-gray-400">{live.active_bowler.figures} (Econ: {live.active_bowler.econ})</span>
            </div>
          </div>
        </div>

        {/* Live Win Prob and Turning Point Alert */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 pt-6 border-t border-nexus-border/60 relative z-10">
          <div className="lg:col-span-7">
            <WinProbGauge
              battingTeam={live.batting_team.name}
              bowlingTeam={live.bowling_team.name}
              battingProb={live.batting_team.win_probability || 63.8}
              bowlingProb={live.bowling_team.win_probability || 36.2}
              confidence={88.4}
              pressureIndex={live.current_pressure}
              counterfactuals={[
                {
                  scenario: "Wicket on next delivery",
                  projected_win_prob: 47.4,
                  impact: "-16.4%",
                  risk_level: "CRITICAL",
                },
                {
                  scenario: "Accelerated over (+14 runs)",
                  projected_win_prob: 78.2,
                  impact: "+14.4%",
                  risk_level: "FAVORABLE",
                },
                {
                  scenario: "Tight over (3 runs)",
                  projected_win_prob: 49.1,
                  impact: "-14.7%",
                  risk_level: "NEGATIVE",
                },
              ]}
            />
          </div>

          {/* Active Turning Point Alert */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="bg-nexus-surface/80 rounded-2xl p-5 border border-nexus-border">
              <div className="flex items-center space-x-2 text-nexus-gold mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-mono uppercase tracking-wider font-bold">
                  Major Turning Point Detected
                </span>
              </div>
              <p className="text-sm font-semibold text-white">
                {live.recent_turning_point.event}
              </p>
              <div className="flex items-center justify-between mt-3 text-xs font-mono">
                <span className="text-gray-400">Over: {live.recent_turning_point.over}</span>
                <span className="text-nexus-rose font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                  {live.recent_turning_point.impact}
                </span>
              </div>
            </div>

            {/* Crease Situation */}
            <div className="bg-nexus-surface/80 rounded-2xl p-5 border border-nexus-border">
              <span className="text-xs font-mono text-gray-400 block mb-2">BATTERS AT CREASE</span>
              <div className="space-y-2">
                {live.active_batsmen.map((bat, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedPlayer(bat.name);
                      setActiveTab("players");
                    }}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-nexus-card/60 hover:bg-nexus-card cursor-pointer transition-all"
                  >
                    <div className="flex items-center space-x-2">
                      {bat.is_striker && <span className="w-1.5 h-1.5 rounded-full bg-nexus-cyan"></span>}
                      <span className="font-bold text-white">{bat.name}</span>
                      {bat.is_striker && <span className="text-[10px] text-nexus-cyan font-mono">*striker</span>}
                    </div>
                    <span className="font-mono text-gray-300">
                      {bat.runs}* ({bat.balls}b, SR {bat.sr})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Navigation Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab("simulator")}
          className="glass-panel-interactive rounded-2xl p-5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-nexus-cyan/15 text-nexus-cyan flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Dices className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">What-If Simulator</h3>
          <p className="text-xs text-gray-400 mt-1">
            Simulate 10,000 match futures with custom run and wicket conditions.
          </p>
          <span className="text-xs font-mono text-nexus-cyan mt-3 inline-flex items-center space-x-1">
            <span>Explore 10k Monte Carlo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => setActiveTab("matchups")}
          className="glass-panel-interactive rounded-2xl p-5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-nexus-electric/15 text-nexus-electric flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Swords className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Batter vs Bowler Duel</h3>
          <p className="text-xs text-gray-400 mt-1">
            Historical delivery metrics, dismissals, dot %, and phase dominance.
          </p>
          <span className="text-xs font-mono text-nexus-electric mt-3 inline-flex items-center space-x-1">
            <span>Compare match-ups</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => setActiveTab("players")}
          className="glass-panel-interactive rounded-2xl p-5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-nexus-gold/15 text-nexus-gold flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">10-Axis Player DNA</h3>
          <p className="text-xs text-gray-400 mt-1">
            Situational radar vectors: Aggression, Pressure, Death SR, and Chasing.
          </p>
          <span className="text-xs font-mono text-nexus-gold mt-3 inline-flex items-center space-x-1">
            <span>Inspect Radar DNA</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => setActiveTab("assistant")}
          className="glass-panel-interactive rounded-2xl p-5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-nexus-emerald/15 text-nexus-emerald flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Cricket AI Analyst</h3>
          <p className="text-xs text-gray-400 mt-1">
            Ask complex queries backed by verifiable SQL proofs across 295K balls.
          </p>
          <span className="text-xs font-mono text-nexus-emerald mt-3 inline-flex items-center space-x-1">
            <span>Chat with Assistant</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </section>

      {/* Two Columns: Recent Matches & All-time Legends */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Matches */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-nexus-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-nexus-cyan" />
              <h3 className="text-base font-bold text-white">Recent IPL Matches</h3>
            </div>
            <button
              onClick={() => setActiveTab("matches")}
              className="text-xs font-mono text-nexus-cyan hover:underline"
            >
              VIEW ALL 1,243 MATCHES &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {recentMatches.map((m) => (
              <div
                key={m.match_id}
                onClick={() => {
                  setSelectedMatchId(m.match_id);
                  setActiveTab("matches");
                }}
                className="p-3.5 rounded-xl bg-nexus-surface/70 hover:bg-nexus-card border border-nexus-border/60 hover:border-nexus-cyan/40 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2 text-[11px] font-mono text-gray-400 mb-1">
                    <span>{m.date}</span>
                    <span>•</span>
                    <span>{m.venue.split(",")[0]}</span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {m.team1.name} <span className="text-gray-400 font-normal">({m.team1.score})</span> vs{" "}
                    {m.team2.name} <span className="text-gray-400 font-normal">({m.team2.score})</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-nexus-cyan block">
                    Winner: {m.winner}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">View Momentum &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All-time Run Leaders Leaderboard */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-nexus-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-nexus-gold" />
              <h3 className="text-base font-bold text-white">IPL All-Time Run Leaders</h3>
            </div>
            <button
              onClick={() => setActiveTab("players")}
              className="text-xs font-mono text-nexus-gold hover:underline"
            >
              EXPLORE DNA &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {topBatters.map((p, idx) => (
              <div
                key={p.player_name}
                onClick={() => {
                  setSelectedPlayer(p.player_name);
                  setActiveTab("players");
                }}
                className="p-3 rounded-xl bg-nexus-surface/70 hover:bg-nexus-card border border-nexus-border/60 hover:border-nexus-gold/40 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-nexus-card flex items-center justify-center font-mono text-xs font-bold text-nexus-gold">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-white block">{p.player_name}</span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {p.matches_played} Matches • {p.total_fours} 4s • {p.total_sixes} 6s
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-nexus-cyan block">
                    {p.total_runs.toLocaleString()} runs
                  </span>
                  <span className="text-[11px] font-mono text-gray-400">SR {p.strike_rate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
