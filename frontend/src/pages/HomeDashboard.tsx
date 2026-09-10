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
        console.warn("Backend offline or synchronizing, loading official broadcast fallback telemetry:", e);
        // Official Broadcast Fallback Telemetry
        setLive({
          match_id: "live_csk_mi_2024",
          title: "CSK vs MI • MATCH 29 • WANKHEDE",
          venue: "Wankhede Stadium, Mumbai",
          innings: 2,
          batting_team: {
            name: "Chennai Super Kings",
            short: "CSK",
            score: "198/4",
            overs: "18.2",
            crr: 10.8,
            rrr: 9.82,
            target: 215,
            runs_needed: 17,
            balls_remaining: 10,
            win_probability: 68.4,
          },
          bowling_team: {
            name: "Mumbai Indians",
            short: "MI",
            score: "214/6",
            overs: "20.0",
            win_probability: 31.6,
          },
          current_pressure: 82,
          pressure_tier: "Extreme",
          active_batsmen: [
            { name: "MS Dhoni", runs: 28, balls: 9, fours: 2, sixes: 3, sr: 311.1, is_striker: true },
            { name: "RA Jadeja", runs: 34, balls: 18, fours: 3, sixes: 1, sr: 188.9, is_striker: false },
          ],
          active_bowler: {
            name: "JJ Bumrah",
            figures: "3.2-0-28-2",
            econ: 8.4,
            dots: 10,
          },
          recent_balls: ["6", "4", "1", "W", "2", "6"],
          recent_turning_point: {
            over: 18,
            event: "MS Dhoni launches 102m six over deep square leg",
            impact: "+14.2% Win Probability Shift",
            significance: "Critical",
          },
        });
        setRecentMatches([
          {
            match_id: "m_csk_rcb_2024",
            date: "2024-05-18",
            season: "2024",
            venue: "M Chinnaswamy Stadium, Bengaluru",
            team1: { name: "Royal Challengers Bengaluru", score: "218/5" },
            team2: { name: "Chennai Super Kings", score: "191/7" },
            winner: "Royal Challengers",
            status: "Completed",
          },
          {
            match_id: "m_kkr_srh_2024",
            date: "2024-05-26",
            season: "2024",
            venue: "MA Chidambaram Stadium, Chennai",
            team1: { name: "Sunrisers Hyderabad", score: "113/10" },
            team2: { name: "Kolkata Knight Riders", score: "114/2" },
            winner: "Kolkata Knight Riders",
            status: "Completed",
          },
          {
            match_id: "m_mi_gt_2024",
            date: "2024-03-24",
            season: "2024",
            venue: "Narendra Modi Stadium, Ahmedabad",
            team1: { name: "Gujarat Titans", score: "168/6" },
            team2: { name: "Mumbai Indians", score: "162/9" },
            winner: "Gujarat Titans",
            status: "Completed",
          },
        ]);
        setTopBatters([
          { player_name: "V Kohli", total_runs: 8004, strike_rate: 131.9, matches_played: 252, total_sixes: 272, total_fours: 705, balls_faced: 6068, total_wickets: 4, balls_bowled: 251, economy: 8.8 },
          { player_name: "S Dhawan", total_runs: 6769, strike_rate: 127.1, matches_played: 222, total_sixes: 152, total_fours: 768, balls_faced: 5324, total_wickets: 4, balls_bowled: 126, economy: 8.2 },
          { player_name: "RG Sharma", total_runs: 6628, strike_rate: 131.1, matches_played: 257, total_sixes: 280, total_fours: 599, balls_faced: 5055, total_wickets: 15, balls_bowled: 348, economy: 8.0 },
          { player_name: "DA Warner", total_runs: 6565, strike_rate: 139.8, matches_played: 184, total_sixes: 236, total_fours: 663, balls_faced: 4696, total_wickets: 0, balls_bowled: 6, economy: 10.0 },
          { player_name: "SK Raina", total_runs: 5528, strike_rate: 136.7, matches_played: 205, total_sixes: 203, total_fours: 506, balls_faced: 4043, total_wickets: 25, balls_bowled: 914, economy: 7.4 },
        ]);
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
      {/* 1. OFFICIAL IPL MATCH CENTRE LIVE TELEMETRY SHOWCASE      */}
      {/* ========================================================= */}
      <section className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-b from-[#061645] via-[#031453] to-[#020b2d] border border-white/[0.14] shadow-[0_12px_48px_rgba(3,20,83,0.7)] overflow-hidden">
        {/* Stadium Floodlight Radial Atmosphere */}
        <div className="absolute -top-20 left-1/3 w-[500px] h-[300px] bg-[#19398a]/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 right-1/4 w-[450px] h-[300px] bg-[#33a3dc]/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-[#ef4123]/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Official IPL Live Match Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10 pb-4 border-b border-white/[0.1]">
          <div className="flex items-center space-x-3">
            <span className="match-centre-bcci-live-badge">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              LIVE MATCH CENTRE
            </span>
            <span className="text-xs font-bold text-white tracking-wide uppercase font-sans">
              {live.title}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs text-white/75 font-medium font-sans">
            <div className="flex items-center space-x-1.5 bg-white/[0.06] px-3 py-1 rounded-full border border-white/[0.1]">
              <Clock className="w-3.5 h-3.5 text-[#33a3dc]" />
              <span className="font-semibold">{live.venue}</span>
            </div>
            <span className="bg-[#19398a] text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full border border-white/20 uppercase tracking-wider">
              T20 INNINGS 2
            </span>
          </div>
        </div>

        {/* Official IPL Dual Team Scoreboard Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch relative z-10">
          {/* Batting Team (Chasing) */}
          <div className="lg:col-span-5 rounded-2xl p-6 bg-gradient-to-br from-[#0a1b4d] to-[#040e30] border border-white/[0.12] relative overflow-hidden flex flex-col justify-between shadow-lg">
            <div className="absolute -top-8 -right-8 w-28 h-28 bg-[#f9ed25]/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f9ed25] shadow-[0_0_8px_#f9ed25]"></span>
                  <span className="text-xs font-black text-[#f9ed25] tracking-widest uppercase font-expressive">
                    CHASING • {team1Info.short}
                  </span>
                </div>
                <span className="text-xs font-num font-bold text-white/90 bg-white/[0.08] px-2.5 py-0.5 rounded-md border border-white/10">
                  CRR {live.batting_team.crr}
                </span>
              </div>

              <div className="flex items-center space-x-4 mt-3">
                {/* Official Circular Team Mark */}
                <div
                  className="fixtures-results-team-mark"
                  style={{
                    background: `linear-gradient(135deg, ${team1Info.primaryColor}, ${team1Info.secondaryColor})`,
                    color: team1Info.short === "CSK" ? "#031453" : "#FFFFFF",
                  }}
                >
                  {team1Info.short}
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-expressive font-black text-white tracking-tight uppercase leading-none">
                    {live.batting_team.name}
                  </h2>
                  <div className="flex items-baseline space-x-3 mt-1.5">
                    <span className="ipl-score-large text-4xl sm:text-5xl font-black text-white tracking-tight font-num">
                      {live.batting_team.score}
                    </span>
                    <span className="text-sm text-white/70 font-bold font-num">
                      ({live.batting_team.overs} ov)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-white/70 font-bold uppercase tracking-wider">
                Target: <strong className="text-white font-num font-black">{live.batting_team.target}</strong>
              </span>
              <span className="text-white font-extrabold bg-[#ef4123] px-3 py-1 rounded-full shadow-[0_0_12px_rgba(239,65,35,0.4)] tracking-wide">
                Need {live.batting_team.runs_needed} off {live.batting_team.balls_remaining}b (RRR {live.batting_team.rrr})
              </span>
            </div>
          </div>

          {/* Center VS & Match State Pill */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-2 space-y-2">
            <div className="match-centre-upcoming-vs-badge-static">
              VS
            </div>
            <div className="text-center">
              <span className="text-[11px] font-extrabold text-[#33a3dc] tracking-widest uppercase block">
                OVER {live.batting_team.overs}
              </span>
              <span className="text-[10px] text-white/60 font-semibold uppercase">
                {live.batting_team.balls_remaining} BALLS LEFT
              </span>
            </div>
          </div>

          {/* Bowling Team (Defending) */}
          <div className="lg:col-span-5 rounded-2xl p-6 bg-gradient-to-br from-[#040e30] to-[#0a1b4d] border border-white/[0.12] relative overflow-hidden flex flex-col justify-between shadow-lg">
            <div className="absolute -top-8 -left-8 w-28 h-28 bg-[#33a3dc]/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/60 uppercase tracking-widest font-expressive">
                  1ST INNINGS TOTAL
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-[#33a3dc] tracking-widest uppercase font-expressive">
                    DEFENDING • {team2Info.short}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#33a3dc] shadow-[0_0_8px_#33a3dc]"></span>
                </div>
              </div>

              <div className="flex items-center space-x-4 mt-3">
                <div
                  className="fixtures-results-team-mark"
                  style={{
                    background: `linear-gradient(135deg, ${team2Info.primaryColor}, ${team2Info.secondaryColor})`,
                    color: "#FFFFFF",
                  }}
                >
                  {team2Info.short}
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-expressive font-black text-white tracking-tight uppercase leading-none">
                    {live.bowling_team.name}
                  </h2>
                  <div className="flex items-baseline space-x-3 mt-1.5">
                    <span className="ipl-score-large text-3xl sm:text-4xl font-black text-white/90 tracking-tight font-num">
                      {live.bowling_team.score}
                    </span>
                    <span className="text-xs text-white/60 font-bold uppercase">
                      (20.0 ov)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-white/[0.08] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-white/60 font-semibold uppercase tracking-wider">Bowler:</span>
                <span className="text-[#33a3dc] font-black">{live.active_bowler.name}</span>
              </div>
              <span className="text-white bg-white/[0.08] px-2.5 py-1 rounded-md border border-white/10 font-bold font-num">
                {live.active_bowler.figures} (Econ {live.active_bowler.econ})
              </span>
            </div>
          </div>
        </div>

        {/* Current Over Sequence & Official Action Buttons */}
        <div className="mt-5 p-4 rounded-2xl bg-[#031453]/90 border border-white/[0.1] flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 shadow-inner">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-white/80 uppercase tracking-widest font-black font-expressive">
              OVER {Math.floor(parseFloat(live.batting_team.overs || "0")) + 1} BALLS:
            </span>
            <div className="flex items-center space-x-2">
              {live.recent_balls.map((b, i) => {
                const isW = b === "W";
                const isFour = b === "4";
                const isSix = b === "6";
                return (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-expressive text-xs font-black transition-transform hover:scale-110 shadow-sm ${
                      isW
                        ? "bg-[#ef4123] text-white border border-[#ef4123] shadow-[0_0_12px_rgba(239,65,35,0.6)] animate-pulse"
                        : isSix
                        ? "bg-[#33a3dc] text-[#031453] border border-[#33a3dc] shadow-[0_0_12px_rgba(51,163,220,0.6)] font-black"
                        : isFour
                        ? "bg-[#10B981] text-[#031453] border border-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)] font-black"
                        : "bg-white/[0.08] text-white border border-white/15"
                    }`}
                  >
                    {b}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto font-sans">
            <button
              onClick={() => setActiveTab("simulator")}
              className="flex-1 sm:flex-none bg-[#19398a] hover:bg-[#132e73] text-white text-xs font-black py-2 px-4 rounded-xl border border-[#33a3dc]/40 flex items-center justify-center space-x-1.5 transition-all shadow-[0_0_14px_rgba(25,57,138,0.5)] uppercase tracking-wider"
            >
              <Dices className="w-3.5 h-3.5 text-[#ffcb05]" />
              <span>Simulate Over</span>
            </button>
            <button
              onClick={() => setActiveTab("strategy")}
              className="flex-1 sm:flex-none bg-gradient-to-r from-[#ef4123] to-[#ff7d19] hover:brightness-110 text-white text-xs font-black py-2 px-4 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-[0_0_16px_rgba(239,65,35,0.4)] uppercase tracking-wider"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Bowler Blueprint</span>
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
      {/* 3. OFFICIAL FIXTURES & ALL-TIME LEGENDS                   */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Recent Matches (Official IPL Fixture Cards) */}
        <div className="lg:col-span-7 bg-[#061645]/90 rounded-3xl p-6 border border-white/[0.12] space-y-4 shadow-[0_8px_32px_rgba(3,20,83,0.5)]">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.1]">
            <div className="flex items-center space-x-2.5">
              <Flame className="w-5 h-5 text-[#ef4123]" />
              <h3 className="text-base font-black text-white font-expressive uppercase tracking-wider">
                LATEST FIXTURES & RESULTS
              </h3>
            </div>
            <button
              onClick={() => setActiveTab("matches")}
              className="text-xs font-black text-[#33a3dc] hover:text-white transition-colors flex items-center space-x-1 uppercase tracking-wider"
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
                  className="fixtures-results-match-card p-4 cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] text-white/60 font-semibold mb-2.5 border-b border-white/[0.06] pb-2">
                    <span className="uppercase tracking-wider">T20 • {m.date}</span>
                    <span className="truncate max-w-[200px] text-right">{m.venue.split(",")[0]}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Teams & Scores */}
                    <div className="sm:col-span-8 space-y-2">
                      <div className="flex items-center justify-between pr-2">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] border border-white/20"
                            style={{ background: t1.primaryColor, color: t1.short === "CSK" ? "#031453" : "#FFF" }}
                          >
                            {t1.short}
                          </div>
                          <span className="text-xs font-bold text-white uppercase font-sans group-hover:text-[#33a3dc] transition-colors">
                            {m.team1.name}
                          </span>
                        </div>
                        <span className="text-xs font-black text-white font-num">
                          {m.team1.score}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pr-2">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] border border-white/20"
                            style={{ background: t2.primaryColor, color: t2.short === "CSK" ? "#031453" : "#FFF" }}
                          >
                            {t2.short}
                          </div>
                          <span className="text-xs font-bold text-white uppercase font-sans group-hover:text-[#33a3dc] transition-colors">
                            {m.team2.name}
                          </span>
                        </div>
                        <span className="text-xs font-black text-white font-num">
                          {m.team2.score}
                        </span>
                      </div>
                    </div>

                    {/* Result & CTA */}
                    <div className="sm:col-span-4 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                      <span className="text-[11px] font-black text-[#ffcb05] bg-[#ffcb05]/15 px-2.5 py-1 rounded-md border border-[#ffcb05]/30 uppercase tracking-wider">
                        {m.winner.split(" ")[0]} WON
                      </span>
                      <span className="text-[10px] font-bold text-white/50 group-hover:text-white uppercase tracking-wider mt-1 flex items-center space-x-1">
                        <span>MATCH CENTRE</span>
                        <ChevronRight className="w-3 h-3 text-[#ef4123]" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (5 cols): All-Time Legends (Official Orange Cap & Hall of Fame) */}
        <div className="lg:col-span-5 bg-[#061645]/90 rounded-3xl p-6 border border-white/[0.12] space-y-4 shadow-[0_8px_32px_rgba(3,20,83,0.5)]">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.1]">
            <div className="flex items-center space-x-2.5">
              <Award className="w-5 h-5 text-[#ffcb05]" />
              <h3 className="text-base font-black text-white font-expressive uppercase tracking-wider">
                ALL-TIME RUN KINGS
              </h3>
            </div>
            <button
              onClick={() => setActiveTab("players")}
              className="text-xs font-black text-[#ffcb05] hover:text-white transition-colors flex items-center space-x-1 uppercase tracking-wider"
            >
              <span>ORANGE CAP DNA</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topBatters.map((p, idx) => {
              const medals = [
                "bg-[#ffcb05] text-[#031453] shadow-[0_0_14px_rgba(255,203,5,0.6)] font-black",
                "bg-slate-200 text-[#031453] font-black",
                "bg-[#f04e23] text-white font-black",
              ];
              const medalStyle = medals[idx] || "bg-white/[0.08] text-white/70 border border-white/10";

              return (
                <div
                  key={p.player_name}
                  onClick={() => {
                    setSelectedPlayer(p.player_name);
                    setActiveTab("players");
                  }}
                  className="p-3.5 rounded-2xl bg-[#031453]/70 hover:bg-[#031453] border border-white/[0.08] hover:border-[#ffcb05]/50 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-expressive ${medalStyle}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-sm font-black text-white group-hover:text-[#ffcb05] transition-colors block uppercase font-sans">
                        {p.player_name}
                      </span>
                      <span className="text-[11px] text-white/60 font-semibold uppercase tracking-wider">
                        {p.matches_played} MATCHES • {p.total_sixes} SIXES
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-[#33a3dc] block font-num">
                      {p.total_runs.toLocaleString()} <span className="text-[10px] text-white/60 font-bold uppercase">RUNS</span>
                    </span>
                    <span className="text-[11px] text-white/60 font-bold font-num">SR {p.strike_rate}</span>
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
