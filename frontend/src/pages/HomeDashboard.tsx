import { useEffect, useState } from "react";
import {
  Flame,
  AlertTriangle,
  Award,
  Dices,
  ChevronRight,
  Shield,
  Zap,
  Target,
  Clock,
  Sparkles,
  ArrowUpRight,
  Swords,
} from "lucide-react";
import { LiveMatchState, MatchSummary, PlayerProfile } from "../types";
import { fetchLiveMatch, fetchMatches, fetchPlayers } from "../services/api";
import { WinProbGauge } from "../components/charts/WinProbGauge";
import { getTeamInfo } from "../utils/teamData";

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
      <div className="flex items-center justify-center min-h-[60vh] font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-nexus-cyan border-t-transparent rounded-full animate-spin"></div>
            <Sparkles className="w-5 h-5 text-nexus-cyan absolute inset-0 m-auto" />
          </div>
          <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
            SYNCHRONIZING LIVE CRICKET TELEMETRY...
          </span>
        </div>
      </div>
    );
  }

  const team1Info = getTeamInfo(live.batting_team.name);
  const team2Info = getTeamInfo(live.bowling_team.name);

  return (
    <div className="space-y-8 pb-20 pt-1 font-sans">
      {/* ========================================================= */}
      {/* 1. BROADCAST LIVE TELEMETRY SHOWCASE                      */}
      {/* ========================================================= */}
      <section className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-b from-[#0C152B] via-[#091021] to-[#060B17] border border-white/[0.09] shadow-2xl overflow-hidden">
        {/* Stadium Glow Spotlights */}
        <div className="absolute -top-10 left-1/4 w-96 h-96 bg-nexus-cyan/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 right-1/4 w-96 h-96 bg-nexus-gold/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Live Broadcast Header Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10 pb-4 border-b border-white/[0.07]">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-red-500/15 border border-red-500/30 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.2)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[11px] font-bold text-red-400 tracking-wider uppercase">
                LIVE BROADCAST TELEMETRY
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-200">{live.title}</span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-gray-400 font-medium">
            <div className="flex items-center space-x-1.5 bg-white/[0.03] px-3 py-1 rounded-xl border border-white/[0.06]">
              <Clock className="w-3.5 h-3.5 text-nexus-cyan" />
              <span>{live.venue}</span>
            </div>
          </div>
        </div>

        {/* Scoreboard Dual Team Pillar Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch relative z-10">
          {/* Batting Team (Chasing) */}
          <div className="lg:col-span-6 rounded-2xl p-6 bg-gradient-to-br from-[#0E1A33] to-[#0A1325] border border-white/[0.08] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_10px_#FACC15]"></span>
                  <span className="text-xs font-bold text-yellow-400 tracking-wider uppercase">
                    CHASING ({team1Info.short})
                  </span>
                </div>
                <span className="text-xs font-num font-semibold text-gray-300 bg-white/[0.04] px-2.5 py-0.5 rounded-md border border-white/[0.06]">
                  CRR {live.batting_team.crr}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-display font-black text-white mt-2 tracking-tight">
                {live.batting_team.name}
              </h2>

              <div className="flex items-baseline space-x-3 mt-3">
                <span className="text-4xl sm:text-5xl font-display font-black text-white tracking-tight font-num">
                  {live.batting_team.score}
                </span>
                <span className="text-sm text-gray-400 font-medium font-num">
                  ({live.batting_team.overs} ov)
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-gray-400 font-medium">Target: <strong className="text-white font-num">{live.batting_team.target}</strong></span>
              <span className="text-yellow-400 font-bold bg-yellow-400/10 px-3 py-1 rounded-lg border border-yellow-400/25">
                Need {live.batting_team.runs_needed} off {live.batting_team.balls_remaining}b (RRR {live.batting_team.rrr})
              </span>
            </div>
          </div>

          {/* Bowling Team (Defending) */}
          <div className="lg:col-span-6 rounded-2xl p-6 bg-gradient-to-br from-[#0A1325] to-[#0E1A33] border border-white/[0.08] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-32 h-32 bg-sky-500/10 rounded-br-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 bg-white/[0.04] px-2.5 py-0.5 rounded-md border border-white/[0.06] uppercase tracking-wider">
                  1ST INNINGS TOTAL
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-sky-400 tracking-wider uppercase">
                    DEFENDING ({team2Info.short})
                  </span>
                  <span className="w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_10px_#38BDF8]"></span>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-display font-black text-white mt-2 tracking-tight">
                {live.bowling_team.name}
              </h2>

              <div className="flex items-baseline space-x-3 mt-3">
                <span className="text-3xl sm:text-4xl font-display font-black text-gray-200 font-num">
                  {live.bowling_team.score}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 font-medium">Bowler:</span>
                <span className="text-sky-400 font-bold">{live.active_bowler.name}</span>
              </div>
              <span className="text-gray-300 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06] font-medium font-num">
                {live.active_bowler.figures} (Econ {live.active_bowler.econ})
              </span>
            </div>
          </div>
        </div>

        {/* Current Over Delivery Sequence & Tactical Shortcuts */}
        <div className="mt-5 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">
              Current Over:
            </span>
            <div className="flex items-center space-x-2">
              {live.recent_balls.map((b, i) => {
                const isW = b === "W";
                const isFour = b === "4";
                const isSix = b === "6";
                return (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-display text-xs font-black transition-transform hover:scale-110 shadow-sm ${
                      isW
                        ? "bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                        : isSix
                        ? "bg-nexus-cyan/25 text-nexus-cyan border border-nexus-cyan/50 shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                        : isFour
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-white/[0.04] text-gray-300 border border-white/[0.08]"
                    }`}
                  >
                    {b}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("simulator")}
              className="flex-1 sm:flex-none bg-nexus-cyan/15 hover:bg-nexus-cyan/25 text-nexus-cyan text-xs font-bold py-2 px-4 rounded-xl border border-nexus-cyan/30 flex items-center justify-center space-x-1.5 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Simulate Over</span>
            </button>
            <button
              onClick={() => setActiveTab("strategy")}
              className="flex-1 sm:flex-none bg-nexus-gold/15 hover:bg-nexus-gold/25 text-nexus-gold text-xs font-bold py-2 px-4 rounded-xl border border-nexus-gold/30 flex items-center justify-center space-x-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Bowler Plan</span>
            </button>
          </div>
        </div>

        {/* Win Probability & Turning Point Alert Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 pt-6 border-t border-white/[0.06] relative z-10">
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

          {/* Crease Batters & Turning Point Cards */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            {/* Turning Point Alert Card */}
            <div className="rounded-2xl p-5 bg-amber-500/[0.08] border border-amber-500/25 backdrop-blur-md">
              <div className="flex items-center space-x-2 text-amber-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Critical Turning Point
                </span>
              </div>
              <p className="text-sm font-semibold text-white leading-relaxed">
                {live.recent_turning_point.event}
              </p>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-gray-400 font-medium">Over {live.recent_turning_point.over}</span>
                <span className="text-red-400 font-bold bg-red-500/15 px-2.5 py-0.5 rounded-md border border-red-500/30">
                  {live.recent_turning_point.impact}
                </span>
              </div>
            </div>

            {/* Active Crease Batters */}
            <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[11px] text-gray-400 block mb-3 uppercase tracking-wider font-bold">
                Batters at Crease
              </span>
              <div className="space-y-2">
                {live.active_batsmen.map((bat, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedPlayer(bat.name);
                      setActiveTab("players");
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] cursor-pointer transition-all group"
                  >
                    <div className="flex items-center space-x-2.5">
                      {bat.is_striker ? (
                        <span className="w-2 h-2 rounded-full bg-nexus-cyan shadow-[0_0_8px_#00F0FF] animate-pulse"></span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                      )}
                      <span className="text-xs font-bold text-white group-hover:text-nexus-cyan transition-colors">
                        {bat.name}
                      </span>
                      {bat.is_striker && (
                        <span className="text-[10px] text-nexus-cyan bg-nexus-cyan/10 px-1.5 py-0.5 rounded border border-nexus-cyan/20 font-bold uppercase">
                          striker
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-300 font-medium">
                      <span className="text-white font-bold font-num">{bat.runs}*</span> ({bat.balls}b, SR {bat.sr})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. MODERN INTERACTIVE FEATURE PORTALS                     */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Portal 1: Monte Carlo Simulator */}
        <div
          onClick={() => setActiveTab("simulator")}
          className="glass-panel-interactive rounded-3xl p-6 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-nexus-cyan/10 rounded-bl-full pointer-events-none group-hover:bg-nexus-cyan/20 transition-colors" />
          <div>
            <div className="w-12 h-12 rounded-2xl bg-nexus-cyan/15 text-nexus-cyan border border-nexus-cyan/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,240,255,0.25)]">
              <Dices className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-white text-lg group-hover:text-nexus-cyan transition-colors">
              What-If Simulator
            </h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed font-normal">
              Vectorized 10,000-run Monte Carlo probability engine with live sliders and shock hazard modifiers.
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-xs font-bold text-nexus-cyan mt-5 pt-3 border-t border-white/[0.06] tracking-wider uppercase">
            <span>10,000 MONTE CARLO</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Portal 2: Matchup Duel */}
        <div
          onClick={() => setActiveTab("matchups")}
          className="glass-panel-interactive rounded-3xl p-6 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-nexus-electric/10 rounded-bl-full pointer-events-none group-hover:bg-nexus-electric/20 transition-colors" />
          <div>
            <div className="w-12 h-12 rounded-2xl bg-nexus-electric/15 text-nexus-electric border border-nexus-electric/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.25)]">
              <Swords className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-white text-lg group-hover:text-nexus-electric transition-colors">
              Matchup Battlefield 2.0
            </h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed font-normal">
              Ball-by-ball historical encounter log, dismissal mode breakdown, and tactical combat blueprints.
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-xs font-bold text-nexus-electric mt-5 pt-3 border-t border-white/[0.06] tracking-wider uppercase">
            <span>HEAD-TO-HEAD MATRIX</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Portal 3: 10-Axis Player DNA */}
        <div
          onClick={() => setActiveTab("players")}
          className="glass-panel-interactive rounded-3xl p-6 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-nexus-gold/10 rounded-bl-full pointer-events-none group-hover:bg-nexus-gold/20 transition-colors" />
          <div>
            <div className="w-12 h-12 rounded-2xl bg-nexus-gold/15 text-nexus-gold border border-nexus-gold/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-white text-lg group-hover:text-nexus-gold transition-colors">
              Pro Scouting & Player DNA
            </h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed font-normal">
              Multidimensional player radars analyzing power, consistency, dot ball squeeze, and death economy.
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-xs font-bold text-nexus-gold mt-5 pt-3 border-t border-white/[0.06] tracking-wider uppercase">
            <span>RADAR ARCHETYPES</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Portal 4: Cricket AI Analyst */}
        <div
          onClick={() => setActiveTab("assistant")}
          className="glass-panel-interactive rounded-3xl p-6 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">
              Cricket AI Analyst
            </h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed font-normal">
              Natural language sports intelligence backed by 295K verifiable DuckDB ball-by-ball OLAP records.
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400 mt-5 pt-3 border-t border-white/[0.06] tracking-wider uppercase">
            <span>EVIDENCE-GROUNDED</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. RECENT MATCHES & ALL-TIME LEGENDS                      */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Recent Matches */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center space-x-2.5">
              <Flame className="w-5 h-5 text-nexus-cyan" />
              <h3 className="text-base font-bold text-white font-display">Recent IPL Matches</h3>
            </div>
            <button
              onClick={() => setActiveTab("matches")}
              className="text-xs font-semibold text-nexus-cyan hover:text-white transition-colors flex items-center space-x-1"
            >
              <span>EXPLORE ALL 1,243</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentMatches.map((m) => {
              const t1 = getTeamInfo(m.team1.name);
              const t2 = getTeamInfo(m.team2.name);
              return (
                <div
                  key={m.match_id}
                  onClick={() => {
                    setSelectedMatchId(m.match_id);
                    setActiveTab("matches");
                  }}
                  className="p-4 rounded-2xl bg-[#080D1A] hover:bg-[#0E172C] border border-white/[0.06] hover:border-nexus-cyan/40 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 text-[11px] text-gray-400 font-medium">
                      <span>{m.date}</span>
                      <span>•</span>
                      <span>{m.venue.split(",")[0]}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm font-bold text-white">
                      <span className={t1.textColor}>{t1.short}</span>
                      <span className="text-gray-400 text-xs font-num font-semibold">({m.team1.score})</span>
                      <span className="text-gray-500 text-xs">vs</span>
                      <span className={t2.textColor}>{t2.short}</span>
                      <span className="text-gray-400 text-xs font-num font-semibold">({m.team2.score})</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-nexus-cyan bg-nexus-cyan/10 px-3 py-1 rounded-lg border border-nexus-cyan/25 block font-sans">
                      {m.winner.split(" ")[0]} Won
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1 block group-hover:text-gray-200 font-medium">
                      Momentum &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (5 cols): All-time Legends Leaderboard */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center space-x-2.5">
              <Award className="w-5 h-5 text-nexus-gold" />
              <h3 className="text-base font-bold text-white font-display">IPL All-Time Legends</h3>
            </div>
            <button
              onClick={() => setActiveTab("players")}
              className="text-xs font-semibold text-nexus-gold hover:text-white transition-colors flex items-center space-x-1"
            >
              <span>INSPECT DNA</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topBatters.map((p, idx) => {
              const medals = [
                "text-amber-400 bg-amber-400/20 border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.3)]",
                "text-slate-200 bg-slate-400/20 border-slate-400/40",
                "text-amber-600 bg-amber-600/20 border-amber-600/40",
              ];
              const medalStyle = medals[idx] || "text-gray-400 bg-white/[0.04] border-white/[0.08]";

              return (
                <div
                  key={p.player_name}
                  onClick={() => {
                    setSelectedPlayer(p.player_name);
                    setActiveTab("players");
                  }}
                  className="p-3.5 rounded-2xl bg-[#080D1A] hover:bg-[#0E172C] border border-white/[0.06] hover:border-nexus-gold/40 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border font-display ${medalStyle}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-sm font-bold text-white group-hover:text-nexus-gold transition-colors block">
                        {p.player_name}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {p.matches_played} Matches • {p.total_sixes} Sixes
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-nexus-cyan block font-num">
                      {p.total_runs.toLocaleString()} runs
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">SR {p.strike_rate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
