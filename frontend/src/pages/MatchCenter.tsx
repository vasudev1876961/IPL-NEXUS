import { useEffect, useState, useRef } from "react";
import {
  Flame,
  AlertTriangle,
  Award,
  Calendar,
  ChevronDown,
  Check,
  Search,
  Play,
  Pause,
  RotateCcw,
  Activity,
  Layers,
  ArrowRight,
  Shield,
  Target,
  Clock,
} from "lucide-react";
import { fetchMatchDetail, fetchMatches } from "../services/api";
import { MatchSummary, MatchDetailResponse, OverDelivery, OverTimeline } from "../types";
import { MomentumWave } from "../components/charts/MomentumWave";
import { getTeamInfo } from "../utils/teamData";

interface MatchCenterProps {
  selectedMatchId: string | null;
  setSelectedMatchId: (id: string) => void;
  setSelectedPlayer: (name: string) => void;
  setActiveTab: (tab: string) => void;
}

const FRANCHISE_FILTERS = [
  { label: "All Franchises", value: "ALL" },
  { label: "CSK", value: "Chennai Super Kings" },
  { label: "MI", value: "Mumbai Indians" },
  { label: "RCB", value: "Royal Challengers" },
  { label: "KKR", value: "Kolkata Knight Riders" },
  { label: "RR", value: "Rajasthan Royals" },
  { label: "SRH", value: "Sunrisers Hyderabad" },
  { label: "DC", value: "Delhi Capitals" },
  { label: "PBKS", value: "Punjab Kings" },
  { label: "GT", value: "Gujarat Titans" },
  { label: "LSG", value: "Lucknow Super Giants" },
];

export const MatchCenter: React.FC<MatchCenterProps> = ({
  selectedMatchId,
  setSelectedMatchId,
  setSelectedPlayer,
  setActiveTab,
}) => {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [matchData, setMatchData] = useState<MatchDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [matchSearch, setMatchSearch] = useState("");
  const [franchiseFilter, setFranchiseFilter] = useState("ALL");
  
  // Scorecard & Scroller State
  const [activeScorecardTab, setActiveScorecardTab] = useState<1 | 2>(1);
  const [activeOverInnings, setActiveOverInnings] = useState<1 | 2>(2);
  const [selectedOverNum, setSelectedOverNum] = useState<number>(1);
  const [selectedBall, setSelectedBall] = useState<OverDelivery | null>(null);

  // Live Replay Simulator State
  const [replayMode, setReplayMode] = useState(false);
  const [replayIdx, setReplayIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState<1 | 2 | 5>(1);
  const playIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    async function loadList() {
      try {
        setLoading(true);
        const res = await fetchMatches({
          limit: 50,
          team: franchiseFilter === "ALL" ? undefined : franchiseFilter,
        });
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
  }, [selectedMatchId, franchiseFilter]);

  async function loadMatch(id: string) {
    setLoading(true);
    setSelectedMatchId(id);
    setDropdownOpen(false);
    setSelectedBall(null);
    setIsPlaying(false);
    setReplayIdx(0);
    try {
      const detail = await fetchMatchDetail(id);
      setMatchData(detail);
      // Default over scroller to final over of 2nd innings or 1st innings
      if (detail.overs_timeline && detail.overs_timeline[2]?.length > 0) {
        setActiveOverInnings(2);
        setSelectedOverNum(detail.overs_timeline[2][0]?.over_num || 1);
      } else if (detail.overs_timeline && detail.overs_timeline[1]?.length > 0) {
        setActiveOverInnings(1);
        setSelectedOverNum(detail.overs_timeline[1][0]?.over_num || 1);
      }
    } catch (e) {
      console.error("Error fetching match detail:", e);
    } finally {
      setLoading(false);
    }
  }

  // Replay playback ticker
  useEffect(() => {
    if (isPlaying && matchData?.momentum_curve?.length) {
      const intervalMs = Math.max(200, 1000 / replaySpeed);
      playIntervalRef.current = window.setInterval(() => {
        setReplayIdx((prev) => {
          if (prev >= matchData.momentum_curve.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, replaySpeed, matchData]);

  const team1Info = matchData ? getTeamInfo(matchData.summary.team1) : null;
  const team2Info = matchData ? getTeamInfo(matchData.summary.team2) : null;

  const filteredMatches = matches.filter((m) => {
    const q = matchSearch.toLowerCase();
    return (
      m.team1.name.toLowerCase().includes(q) ||
      m.team2.name.toLowerCase().includes(q) ||
      m.venue.toLowerCase().includes(q) ||
      m.season.toLowerCase().includes(q)
    );
  });

  // Current over in the interactive ball scroller
  const currentOversList: OverTimeline[] = matchData?.overs_timeline?.[activeOverInnings] || [];
  const currentOver = currentOversList.find((ov) => ov.over_num === selectedOverNum) || currentOversList[0];

  // Current replay point
  const currentReplayPoint = matchData?.momentum_curve?.[replayIdx] || null;

  function jumpToTurningPoint(tp: any) {
    const inn = (tp.innings === 1 || tp.innings === 2) ? tp.innings : 2;
    const overNum = Math.floor(tp.ball) + 1;
    setActiveOverInnings(inn as 1 | 2);
    setSelectedOverNum(overNum);
    // Find matching ball if available
    const ov = matchData?.overs_timeline?.[inn]?.find((o) => o.over_num === overNum);
    if (ov && ov.balls.length > 0) {
      const ballInOver = Math.round((tp.ball % 1) * 10);
      const matched = ov.balls.find((b) => b.ball_in_over === ballInOver) || ov.balls[0];
      setSelectedBall(matched);
    }
  }

  return (
    <div className="space-y-6 pb-20 pt-1">
      {/* Top Header & Searchable Match Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-nexus-cyan/15 text-nexus-cyan border border-nexus-cyan/30 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-wide">
                Match Explorer & Telemetry
              </h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Over-by-over ball reconstruction, interactive replay scroller & full scorecards
              </p>
            </div>
          </div>
        </div>

        {/* Custom Match Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full md:w-96 bg-[#080D1A] hover:bg-[#0E172C] border border-white/[0.12] hover:border-nexus-cyan/40 rounded-2xl px-4 py-2.5 text-xs text-white font-mono flex items-center justify-between transition-all shadow-md"
          >
            <div className="flex items-center space-x-2 truncate">
              <Calendar className="w-4 h-4 text-nexus-cyan shrink-0" />
              <span className="truncate font-semibold">
                {matchData
                  ? `${matchData.summary.match_date} • ${matchData.summary.team1} vs ${matchData.summary.team2}`
                  : "Select Match"}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-full md:w-[420px] bg-[#0B1221] border border-white/[0.15] rounded-2xl shadow-2xl p-3 z-50 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by team, season, or venue..."
                  value={matchSearch}
                  onChange={(e) => setMatchSearch(e.target.value)}
                  className="w-full bg-[#060A14] border border-white/[0.1] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white font-mono outline-none focus:border-nexus-cyan"
                  autoFocus
                />
              </div>

              {/* Franchise Quick Chips inside Dropdown */}
              <div className="flex items-center space-x-1.5 overflow-x-auto py-1 no-scrollbar">
                {FRANCHISE_FILTERS.slice(0, 6).map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFranchiseFilter(f.value)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap transition-colors ${
                      franchiseFilter === f.value
                        ? "bg-nexus-cyan text-nexus-bg font-bold"
                        : "bg-white/[0.04] text-gray-400 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                {filteredMatches.map((m) => {
                  const isCurrent = matchData?.match_id === m.match_id;
                  const t1 = getTeamInfo(m.team1.name);
                  const t2 = getTeamInfo(m.team2.name);
                  return (
                    <div
                      key={m.match_id}
                      onClick={() => loadMatch(m.match_id)}
                      className={`p-3 rounded-xl cursor-pointer text-xs font-mono transition-all flex items-center justify-between ${
                        isCurrent
                          ? "bg-nexus-cyan/15 text-nexus-cyan border border-nexus-cyan/30 font-bold"
                          : "text-gray-300 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div>
                        <div className="text-[10px] text-gray-400">
                          {m.date} • {m.venue.split(",")[0]}
                        </div>
                        <div className="text-white font-semibold mt-1 flex items-center space-x-2">
                          <span className={t1.textColor}>{t1.short}</span>
                          <span className="text-gray-500">vs</span>
                          <span className={t2.textColor}>{t2.short}</span>
                          <span className="text-gray-400 text-[10px]">
                            ({m.team1.score} vs {m.team2.score})
                          </span>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-nexus-cyan shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Franchise Quick Filter Pill Strip */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[10px] font-mono text-gray-400 shrink-0 font-bold uppercase tracking-wider mr-1">
          FILTER:
        </span>
        {FRANCHISE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFranchiseFilter(f.value)}
            className={`px-3 py-1 rounded-xl text-xs font-mono whitespace-nowrap transition-all border ${
              franchiseFilter === f.value
                ? "bg-nexus-cyan/20 border-nexus-cyan text-nexus-cyan font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                : "bg-[#080D1A] border-white/[0.08] text-gray-400 hover:text-white hover:border-white/[0.2]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 border-3 border-nexus-cyan border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-mono text-gray-400 tracking-wider">
              LOADING BALL-BY-BALL MATCH DATA...
            </span>
          </div>
        </div>
      ) : matchData && team1Info && team2Info ? (
        <>
          {/* Match Scorecard Banner */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/[0.08] space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-gray-400 pb-4 border-b border-white/[0.06]">
              <span className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-nexus-cyan" />
                <span>Date: <strong className="text-white">{matchData.summary.match_date}</strong></span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-nexus-electric" />
                <span>Season: <strong className="text-nexus-cyan">{matchData.summary.season}</strong></span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-nexus-gold" />
                <span>Venue: <strong className="text-white">{matchData.summary.venue}</strong></span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
              {/* Team 1 (Innings 1) */}
              <div className="rounded-2xl p-6 bg-gradient-to-br from-[#0C152B] to-[#080D1A] border border-white/[0.08] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-nexus-cyan/5 rounded-full blur-2xl group-hover:bg-nexus-cyan/10 transition-all pointer-events-none"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400">1ST INNINGS</span>
                  <span className={`text-xs font-mono font-bold ${team1Info.textColor}`}>{team1Info.short}</span>
                </div>
                <h3 className="text-2xl font-black text-white mt-2">{matchData.summary.team1}</h3>
                <div className="text-4xl font-extrabold font-mono text-nexus-cyan mt-3 tracking-tight">
                  {matchData.summary.innings1_score}{" "}
                  <span className="text-lg text-gray-400 font-normal">/ {matchData.summary.innings1_wickets}</span>
                </div>
                <div className="text-[11px] font-mono text-gray-400 mt-2">
                  CRR: {(matchData.summary.innings1_score / 20.0).toFixed(2)} RPO • 20.0 Overs
                </div>
              </div>

              {/* Team 2 (Innings 2 Chase) */}
              <div className="rounded-2xl p-6 bg-gradient-to-br from-[#0C152B] to-[#080D1A] border border-white/[0.08] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all pointer-events-none"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400">2ND INNINGS (CHASE)</span>
                  <span className={`text-xs font-mono font-bold ${team2Info.textColor}`}>{team2Info.short}</span>
                </div>
                <h3 className="text-2xl font-black text-white mt-2">{matchData.summary.team2}</h3>
                <div className="text-4xl font-extrabold font-mono text-nexus-gold mt-3 tracking-tight">
                  {matchData.summary.innings2_score}{" "}
                  <span className="text-lg text-gray-400 font-normal">/ {matchData.summary.innings2_wickets}</span>
                </div>
                <div className="text-[11px] font-mono text-gray-400 mt-2">
                  Target: {matchData.summary.innings1_score + 1} runs • {matchData.summary.innings2_score >= matchData.summary.innings1_score + 1 ? "Target Achieved" : "Target Defended"}
                </div>
              </div>
            </div>

            {/* Winner Laurel & Telemetry Bar */}
            <div className="p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-500/25 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <Award className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold text-white">
                  Match Winner: <span className="text-nexus-cyan font-black">{matchData.summary.match_winner}</span>
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-gray-300 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
                  {matchData.total_deliveries} Ball-by-Ball Records Evaluated
                </span>
                <button
                  onClick={() => setReplayMode(!replayMode)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all border ${
                    replayMode
                      ? "bg-nexus-cyan text-nexus-bg border-nexus-cyan shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                      : "bg-white/[0.04] text-gray-300 border-white/[0.1] hover:text-white"
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{replayMode ? "Close Replay Mode" : "Live Replay Mode"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Live Match Replay Mode HUD */}
          {replayMode && matchData.momentum_curve?.length > 0 && (
            <div className="glass-panel rounded-3xl p-6 border border-nexus-cyan/40 bg-gradient-to-br from-[#060D1F] to-[#040813] space-y-5 shadow-[0_0_25px_rgba(0,240,255,0.15)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-nexus-cyan/20 text-nexus-cyan border border-nexus-cyan/40">
                    <Activity className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white tracking-wide">
                      Live Telemetry Replay Engine
                    </h3>
                    <p className="text-xs font-mono text-gray-400">
                      Step through every over to observe win probability shifts and pressure dynamics
                    </p>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-nexus-cyan text-nexus-bg font-mono font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:brightness-110 transition-all"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPlaying ? "PAUSE" : "PLAY"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setReplayIdx(0);
                    }}
                    className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 border border-white/[0.1]"
                    title="Reset to Ball 1"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Speed Selector */}
                  <div className="flex items-center space-x-1 bg-[#080D1A] p-1 rounded-xl border border-white/[0.08] text-xs font-mono">
                    {([1, 2, 5] as const).map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setReplaySpeed(spd)}
                        className={`px-2 py-1 rounded-lg transition-all ${
                          replaySpeed === spd
                            ? "bg-nexus-cyan text-nexus-bg font-bold"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Replay Scrubber Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                  <span>Start (Over 1)</span>
                  <span className="text-nexus-cyan font-bold">
                    Innings {currentReplayPoint?.innings || 1} • Over {currentReplayPoint?.over || 1} of 20
                  </span>
                  <span>End of Match</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={matchData.momentum_curve.length - 1}
                  value={replayIdx}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setReplayIdx(Number(e.target.value));
                  }}
                  className="w-full accent-nexus-cyan cursor-pointer"
                />
              </div>

              {/* Telemetry Snapshot Cards */}
              {currentReplayPoint && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-[#080D1A] border border-white/[0.08]">
                    <span className="text-[10px] font-mono text-gray-400 block uppercase">SCORE AT OVER {currentReplayPoint.over}</span>
                    <span className="text-xl font-bold font-mono text-white mt-1 block">
                      {currentReplayPoint.runs} / {currentReplayPoint.wickets}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      CRR: {(currentReplayPoint.runs / Math.max(1, currentReplayPoint.over)).toFixed(2)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#080D1A] border border-nexus-cyan/30">
                    <span className="text-[10px] font-mono text-nexus-cyan block uppercase">CHASING WIN PROBABILITY</span>
                    <span className="text-xl font-black font-mono text-nexus-cyan mt-1 block">
                      {currentReplayPoint.win_prob}%
                    </span>
                    <div className="w-full bg-white/[0.06] h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-nexus-cyan h-full rounded-full transition-all duration-300"
                        style={{ width: `${currentReplayPoint.win_prob}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#080D1A] border border-nexus-gold/30">
                    <span className="text-[10px] font-mono text-nexus-gold block uppercase">DYNAMIC PRESSURE (DPI)</span>
                    <span className="text-xl font-black font-mono text-nexus-gold mt-1 block">
                      {currentReplayPoint.pressure} / 100
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {currentReplayPoint.pressure > 70 ? "HIGH STRESS" : currentReplayPoint.pressure > 40 ? "BALANCED" : "CONTROLLED"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#080D1A] border border-white/[0.08]">
                    <span className="text-[10px] font-mono text-gray-400 block uppercase">INNINGS PHASE</span>
                    <span className="text-xl font-bold font-mono text-white mt-1 block">
                      {currentReplayPoint.over <= 6 ? "Powerplay" : currentReplayPoint.over <= 15 ? "Middle Overs" : "Death Overs"}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {20 - currentReplayPoint.over} overs remaining
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Momentum Wave Chart */}
          <MomentumWave
            data={matchData.momentum_curve}
            battingTeam={matchData.summary.team2}
            bowlingTeam={matchData.summary.team1}
          />

          {/* Critical Turning Points */}
          <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] space-y-4">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-white/[0.06]">
              <AlertTriangle className="w-5 h-5 text-nexus-gold" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Automated Turning Point Detection (|Δ Win Prob| &ge; 8.0%)
                </h3>
                <p className="text-[11px] text-gray-400 font-mono">
                  Click any turning point to jump directly into that over's ball-by-ball telemetry
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {matchData.turning_points.length > 0 ? (
                matchData.turning_points.map((tp: any, i: number) => {
                  const isNegative = tp.delta_win_prob < 0;
                  return (
                    <div
                      key={i}
                      onClick={() => jumpToTurningPoint(tp)}
                      className="p-4 rounded-2xl bg-[#080D1A] border border-white/[0.06] hover:border-nexus-cyan/40 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between space-y-2 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-nexus-cyan bg-nexus-cyan/10 px-2 py-0.5 rounded border border-nexus-cyan/20">
                            Over {tp.ball}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            Inn {tp.innings}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-white block mt-1">
                          {tp.event}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border ${
                            isNegative
                              ? "bg-red-500/15 text-red-400 border-red-500/30"
                              : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          }`}
                        >
                          {tp.impact}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-nexus-cyan group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-400 font-mono col-span-4">
                  Match evolved continuously without abrupt single-ball probability shocks.
                </p>
              )}
            </div>
          </div>

          {/* Interactive Ball-by-Ball Over Scroller & Telemetry Inspector */}
          {matchData.overs_timeline && (
            <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-nexus-electric/15 text-nexus-electric border border-nexus-electric/30">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">
                      Interactive Ball-by-Ball Over Scroller
                    </h3>
                    <p className="text-xs font-mono text-gray-400">
                      Select an over and inspect each delivery's strike rate, bowler execution, and win odds swing
                    </p>
                  </div>
                </div>

                {/* Innings Toggle for Scroller */}
                <div className="flex items-center space-x-1 bg-[#080D1A] p-1 rounded-xl border border-white/[0.08]">
                  <button
                    onClick={() => {
                      setActiveOverInnings(1);
                      setSelectedOverNum(1);
                      setSelectedBall(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      activeOverInnings === 1
                        ? "bg-nexus-cyan text-nexus-bg font-bold"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    1st Inn: {team1Info.short}
                  </button>
                  <button
                    onClick={() => {
                      setActiveOverInnings(2);
                      setSelectedOverNum(1);
                      setSelectedBall(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      activeOverInnings === 2
                        ? "bg-nexus-gold text-nexus-bg font-bold"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    2nd Inn: {team2Info.short} (Chase)
                  </button>
                </div>
              </div>

              {/* Horizontal Over Selector Strip (Overs 1 to 20) */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
                {currentOversList.map((ov) => {
                  const isSelected = ov.over_num === selectedOverNum;
                  return (
                    <button
                      key={ov.over_num}
                      onClick={() => {
                        setSelectedOverNum(ov.over_num);
                        setSelectedBall(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl font-mono text-xs whitespace-nowrap transition-all border shrink-0 flex flex-col items-center ${
                        isSelected
                          ? "bg-nexus-cyan/20 text-nexus-cyan border-nexus-cyan font-black shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                          : "bg-[#080D1A] border-white/[0.08] text-gray-400 hover:text-white hover:border-white/[0.2]"
                      }`}
                    >
                      <span className="text-[10px] text-gray-400 uppercase">Ov {ov.over_num}</span>
                      <span className="font-bold text-white mt-0.5">
                        {ov.runs}r {ov.wickets > 0 ? `• ${ov.wickets}w` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Over Deliveries Ribbon */}
              {currentOver && (
                <div className="rounded-2xl p-5 bg-[#080D1A] border border-white/[0.08] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">Bowler:</span>
                      <span
                        onClick={() => {
                          setSelectedPlayer(currentOver.bowler);
                          setActiveTab("players");
                        }}
                        className="text-white font-bold hover:text-nexus-cyan cursor-pointer underline decoration-dotted"
                      >
                        {currentOver.bowler}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-300">
                      <span>Runs: <strong className="text-nexus-cyan">{currentOver.runs}</strong></span>
                      <span>Wickets: <strong className="text-red-400">{currentOver.wickets}</strong></span>
                    </div>
                  </div>

                  {/* Ball Badges Strip */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {currentOver.balls.map((b, idx) => {
                      let chipClass = "ball-chip-dot";
                      let label = ".";
                      if (b.is_wicket) {
                        chipClass = "ball-chip-wicket";
                        label = "W";
                      } else if (b.is_six) {
                        chipClass = "ball-chip-six";
                        label = "6";
                      } else if (b.is_four) {
                        chipClass = "ball-chip-four";
                        label = "4";
                      } else if (b.total_runs > 0) {
                        chipClass = "ball-chip-single";
                        label = String(b.total_runs);
                      }

                      const isBallSelected = selectedBall?.ball_label === b.ball_label;

                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedBall(b)}
                          className={`ball-chip w-10 h-10 text-xs cursor-pointer ${chipClass} ${
                            isBallSelected ? "ring-2 ring-white scale-110" : "hover:scale-105"
                          }`}
                          title={`Ball ${b.ball_label}: ${b.runs_off_bat} runs by ${b.striker}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Ball Telemetry Drawer */}
                  {selectedBall && (
                    <div className="p-4 rounded-xl bg-nexus-cyan/[0.05] border border-nexus-cyan/30 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono animate-fadeIn">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="bg-nexus-cyan text-nexus-bg font-black px-2 py-0.5 rounded text-[10px]">
                            BALL {selectedBall.ball_label}
                          </span>
                          <span className="text-gray-300">
                            <strong>{selectedBall.bowler}</strong> to <strong>{selectedBall.striker}</strong>
                          </span>
                        </div>
                        <p className="text-gray-400 text-[11px]">
                          {selectedBall.is_wicket
                            ? `⚠️ WICKET! ${selectedBall.player_dismissed || selectedBall.striker} (${selectedBall.dismissal_kind})`
                            : selectedBall.is_six
                            ? "🚀 MAXIMUM! Six runs scored!"
                            : selectedBall.is_four
                            ? "✨ FOUR! Cracking boundary!"
                            : selectedBall.total_runs === 0
                            ? "🎯 Dot ball. Tight length delivery."
                            : `${selectedBall.total_runs} run(s) taken.`}
                        </p>
                      </div>

                      <div className="flex items-center space-x-4 shrink-0">
                        <div>
                          <span className="text-[10px] text-gray-400 block">SCORE AFTER BALL</span>
                          <span className="font-bold text-white">
                            {selectedBall.current_score} / {selectedBall.current_wickets}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block">WIN PROB</span>
                          <span className="font-bold text-nexus-cyan">{selectedBall.win_prob}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block">Δ PROB</span>
                          <span
                            className={`font-bold ${
                              selectedBall.delta_win_prob >= 0 ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {selectedBall.delta_win_prob >= 0 ? `+${selectedBall.delta_win_prob}` : selectedBall.delta_win_prob}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Full Dual-Innings Scorecard Switcher */}
          <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-nexus-gold/15 text-nexus-gold border border-nexus-gold/30">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    Official Match Scorecards
                  </h3>
                  <p className="text-xs font-mono text-gray-400">
                    Complete batting order, bowling economy analysis, and fall of wickets
                  </p>
                </div>
              </div>

              {/* Scorecard Innings Selector Tabs */}
              <div className="flex items-center space-x-1 bg-[#080D1A] p-1 rounded-xl border border-white/[0.08]">
                <button
                  onClick={() => setActiveScorecardTab(1)}
                  className={`px-4 py-2 rounded-lg text-xs font-mono transition-all ${
                    activeScorecardTab === 1
                      ? "bg-gradient-to-r from-nexus-cyan to-sky-400 text-nexus-bg font-extrabold shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  1st Inn: {matchData.summary.team1} ({matchData.summary.innings1_score}/{matchData.summary.innings1_wickets})
                </button>
                <button
                  onClick={() => setActiveScorecardTab(2)}
                  className={`px-4 py-2 rounded-lg text-xs font-mono transition-all ${
                    activeScorecardTab === 2
                      ? "bg-gradient-to-r from-nexus-gold to-amber-400 text-nexus-bg font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  2nd Inn: {matchData.summary.team2} ({matchData.summary.innings2_score}/{matchData.summary.innings2_wickets})
                </button>
              </div>
            </div>

            {/* Render Selected Innings Card */}
            {(() => {
              const currentCard = activeScorecardTab === 1 ? matchData.innings1_card : matchData.innings2_card;
              const battingTeam = activeScorecardTab === 1 ? matchData.summary.team1 : matchData.summary.team2;
              const bowlingTeam = activeScorecardTab === 1 ? matchData.summary.team2 : matchData.summary.team1;

              if (!currentCard || currentCard.batting.length === 0) {
                // Fallback to legacy scorecard if detailed innings is empty
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold font-mono text-gray-400 uppercase">Top Batters</h4>
                      <table className="w-full text-xs font-mono">
                        <thead>
                          <tr className="text-gray-400 border-b border-white/[0.08] pb-2 text-left">
                            <th>Batter</th>
                            <th className="text-right">R (B)</th>
                            <th className="text-right">SR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {matchData.scorecard.top_batters.map((b, i) => (
                            <tr key={i} className="hover:bg-white/[0.02]">
                              <td className="py-2 text-white font-bold">{b.striker}</td>
                              <td className="py-2 text-right text-nexus-cyan">{b.runs} ({b.balls})</td>
                              <td className="py-2 text-right text-nexus-gold">{b.sr}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {/* Batting Card */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold font-mono text-nexus-cyan uppercase tracking-wider">
                        {battingTeam} Batting Order
                      </h4>
                      <span className="text-xs font-mono text-gray-400">
                        Extras: <strong className="text-white">{currentCard.extras.total}</strong>
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono">
                        <thead>
                          <tr className="text-left text-gray-400 border-b border-white/[0.08] pb-2 font-mono">
                            <th className="pb-2.5">Batter</th>
                            <th className="pb-2.5">Dismissal</th>
                            <th className="pb-2.5 text-right">R (B)</th>
                            <th className="pb-2.5 text-right">4s / 6s</th>
                            <th className="pb-2.5 text-right">SR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {currentCard.batting.map((b, i) => {
                            const isHighScorer = b.runs >= 50;
                            return (
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
                                  {isHighScorer && (
                                    <span className="text-[10px] bg-nexus-gold/20 text-nexus-gold px-1.5 py-0.2 rounded border border-nexus-gold/40">
                                      ★ {b.runs >= 100 ? "100" : "50"}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-nexus-cyan opacity-0 hover:opacity-100">&rarr;</span>
                                </td>
                                <td className="py-3 text-gray-400 text-[11px]">{b.dismissal}</td>
                                <td className="py-3 text-right font-bold text-nexus-cyan">
                                  {b.runs} <span className="text-gray-400 font-normal">({b.balls})</span>
                                </td>
                                <td className="py-3 text-right text-gray-300">
                                  {b.fours} / {b.sixes}
                                </td>
                                <td className="py-3 text-right text-nexus-gold font-bold">{b.sr}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bowling Card */}
                  <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                    <h4 className="text-xs font-bold font-mono text-nexus-electric uppercase tracking-wider">
                      {bowlingTeam} Bowling Figures
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono">
                        <thead>
                          <tr className="text-left text-gray-400 border-b border-white/[0.08] pb-2">
                            <th className="pb-2.5">Bowler</th>
                            <th className="pb-2.5 text-right">Overs</th>
                            <th className="pb-2.5 text-right">Maidens</th>
                            <th className="pb-2.5 text-right">Runs</th>
                            <th className="pb-2.5 text-right">Wickets</th>
                            <th className="pb-2.5 text-right">Dots</th>
                            <th className="pb-2.5 text-right">Economy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {currentCard.bowling.map((bo, i) => (
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
                                {bo.wickets >= 3 && (
                                  <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded border border-red-500/40">
                                    🔥 {bo.wickets}w
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-right text-gray-300">{bo.overs}</td>
                              <td className="py-3 text-right text-gray-400">{bo.maidens}</td>
                              <td className="py-3 text-right text-gray-300">{bo.runs}</td>
                              <td className="py-3 text-right font-bold text-red-400">{bo.wickets}</td>
                              <td className="py-3 text-right text-gray-400">{bo.dots}</td>
                              <td className="py-3 text-right text-nexus-gold font-bold">{bo.economy}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Fall of Wickets Timeline */}
                  {currentCard.fall_of_wickets.length > 0 && (
                    <div className="pt-4 border-t border-white/[0.06] space-y-2">
                      <span className="text-[11px] font-mono text-gray-400 uppercase font-bold block">
                        FALL OF WICKETS
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {currentCard.fall_of_wickets.map((f, i) => (
                          <div
                            key={i}
                            className="bg-[#080D1A] border border-white/[0.08] px-3 py-1.5 rounded-xl text-xs font-mono flex items-center space-x-2"
                          >
                            <span className="font-bold text-red-400">{f.score}/{f.wickets}</span>
                            <span className="text-gray-400 text-[11px]">
                              ({f.player}, {f.over} ov)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </>
      ) : null}
    </div>
  );
};
