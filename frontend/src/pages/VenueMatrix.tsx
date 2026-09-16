import React, { useState, useEffect } from "react";
import {
  Landmark,
  Compass,
  Wind,
  Droplets,
  Flame,
  Activity,
  Award,
  Sparkles,
  Swords,
  TrendingUp,
  Target,
  ChevronRight,
} from "lucide-react";
import { VenueSummary, VenueInsights, VenuePhaseData } from "../types";
import { fetchVenues, fetchVenueInsights } from "../services/api";
import { getTeamInfo } from "../utils/teamData";

interface VenueMatrixProps {
  setSelectedMatchId?: (id: string) => void;
  setActiveTab?: (tab: string) => void;
}

export const VenueMatrix: React.FC<VenueMatrixProps> = ({
  setSelectedMatchId,
  setActiveTab,
}) => {
  const [venues, setVenues] = useState<VenueSummary[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>("wankhede");
  const [insights, setInsights] = useState<VenueInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(true);

  // Load venues catalog
  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await fetchVenues();
        setVenues(data.venues);
        if (data.venues.length > 0 && !selectedVenueId) {
          setSelectedVenueId(data.venues[0].id);
        }
      } catch (err) {
        console.error("Failed to load venues:", err);
      }
    }
    loadCatalog();
  }, []);

  // Load insights whenever selected venue changes
  useEffect(() => {
    async function loadDetails() {
      if (!selectedVenueId) return;
      try {
        setLoadingInsights(true);
        const data = await fetchVenueInsights(selectedVenueId);
        setInsights(data);
      } catch (err) {
        console.error("Failed to load venue insights:", err);
      } finally {
        setLoadingInsights(false);
      }
    }
    loadDetails();
  }, [selectedVenueId]);

  const currentFranchiseMeta = insights ? getTeamInfo(insights.franchise) : null;

  const handleMatchClick = (matchId: string) => {
    if (setSelectedMatchId && setActiveTab) {
      setSelectedMatchId(matchId);
      setActiveTab("matches");
    }
  };

  return (
    <div className="space-y-6 pb-20 pt-1 font-sans">
      {/* Top Header & Broadcast Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.1] pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#19398a] to-[#ef4123] text-white shadow-[0_0_16px_rgba(239,65,35,0.4)]">
              <Landmark className="w-6 h-6 text-[#ffcb05]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight uppercase">
                  STADIUM & PITCH MATRIX INTELLIGENCE
                </span>
                <span className="bg-[#ef4123]/20 text-[#ef4123] border border-[#ef4123]/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest hidden sm:inline-block">
                  TELEMETRY
                </span>
              </div>
              <p className="text-xs text-white/60 font-semibold tracking-wide uppercase mt-0.5">
                Ground conditions, toss & dew impact, pace vs spin splits, and phase run-rate curves
              </p>
            </div>
          </div>
        </div>

        {/* Live Match Venue Stats Pill */}
        {insights && (
          <div className="flex items-center space-x-3 bg-[#061645]/90 border border-white/[0.12] px-4 py-2 rounded-2xl shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00b49d] animate-pulse shadow-[0_0_8px_#00b49d]"></div>
            <div className="text-right">
              <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Tournament Sample</div>
              <div className="text-xs font-black text-[#ffcb05] uppercase">
                {insights.matches} Matches • 1,243 IPL History
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Marquee Stadium Selector Tabs */}
      <div className="relative">
        <div className="flex items-center space-x-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20">
          {venues.map((v: VenueSummary) => {
            const isSelected = v.id === selectedVenueId;
            const franchiseMeta = getTeamInfo(v.franchise);
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVenueId(v.id)}
                className={`flex-shrink-0 flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all duration-200 border ${
                  isSelected
                    ? "bg-[#19398a] border-[#ef4123] text-white shadow-[0_0_20px_rgba(239,65,35,0.45)] ring-1 ring-[#ef4123]"
                    : "bg-[#061645]/80 border-white/[0.08] text-white/70 hover:text-white hover:bg-[#132e73]/60"
                }`}
              >
                {franchiseMeta ? (
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: franchiseMeta.primaryColor }}
                  />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-white/40 flex-shrink-0" />
                )}
                <span className="whitespace-nowrap">{v.short_name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-white/60 font-mono">
                  {v.matches}m
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loadingInsights && (
        <div className="grid grid-cols-1 gap-6 animate-pulse">
          <div className="h-64 bg-[#061645]/80 rounded-2xl border border-white/[0.08]"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-48 bg-[#061645]/80 rounded-2xl"></div>
            <div className="h-48 bg-[#061645]/80 rounded-2xl"></div>
            <div className="h-48 bg-[#061645]/80 rounded-2xl"></div>
          </div>
        </div>
      )}

      {/* Main Stadium Telemetry Showcase */}
      {!loadingInsights && insights && (
        <div className="space-y-6">
          {/* Hero Stadium Banner */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#061645] via-[#0b1f5d] to-[#031453] border border-white/[0.12] p-6 shadow-2xl">
            {/* Background stadium light aura */}
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-[#ef4123]/15 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-[#33a3dc]/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-widest bg-[#ef4123] text-white shadow-[0_0_10px_rgba(239,65,35,0.6)]">
                    {insights.city}
                  </span>
                  {currentFranchiseMeta && (
                    <span
                      className="px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-widest text-white shadow-sm border border-white/20"
                      style={{ backgroundColor: currentFranchiseMeta.primaryColor }}
                    >
                      Home Fortress: {currentFranchiseMeta.name}
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold text-white/80 bg-white/[0.08] border border-white/[0.1]">
                    {insights.matches} Matches Hosted
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-heading font-black text-white tracking-tight">
                  {insights.name}
                </h1>

                <p className="text-sm text-white/80 font-medium leading-relaxed">
                  <span className="text-[#ffcb05] font-bold">Pitch Profile:</span> {insights.pitch_type}
                </p>

                {/* Toss & Dew Verdict Callout */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <div className="flex items-center space-x-2 bg-[#020b2d]/80 border border-[#ef4123]/40 px-3.5 py-1.5 rounded-xl shadow-inner">
                    <Compass className="w-4 h-4 text-[#ef4123]" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      {insights.toss_verdict}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 bg-[#020b2d]/80 border border-[#33a3dc]/40 px-3.5 py-1.5 rounded-xl shadow-inner">
                    <Droplets className="w-4 h-4 text-[#33a3dc]" />
                    <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                      Dew Risk: <span className="text-[#ffcb05]">{insights.dew_risk}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Broadcast Metric Pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 min-w-[280px]">
                <div className="bg-[#020b2d]/70 p-3.5 rounded-xl border border-white/[0.08] text-center">
                  <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Avg 1st Innings</div>
                  <div className="text-2xl font-heading font-black text-[#ffcb05] mt-0.5">
                    {insights.avg_1st_innings}
                  </div>
                  <div className="text-[10px] text-white/60 mt-0.5 font-medium">Tournament Par</div>
                </div>

                <div className="bg-[#020b2d]/70 p-3.5 rounded-xl border border-white/[0.08] text-center">
                  <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Avg 2nd Innings</div>
                  <div className="text-2xl font-heading font-black text-white mt-0.5">
                    {insights.avg_2nd_innings}
                  </div>
                  <div className="text-[10px] text-white/60 mt-0.5 font-medium">Chase Par</div>
                </div>

                <div className="bg-[#020b2d]/70 p-3.5 rounded-xl border border-white/[0.08] text-center">
                  <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Boundary Rate</div>
                  <div className="text-2xl font-heading font-black text-[#33a3dc] mt-0.5">
                    {insights.boundary_pct}%
                  </div>
                  <div className="text-[10px] text-white/60 mt-0.5 font-medium">Of All Deliveries</div>
                </div>

                <div className="bg-[#020b2d]/70 p-3.5 rounded-xl border border-white/[0.08] text-center">
                  <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Sixes / Match</div>
                  <div className="text-2xl font-heading font-black text-[#ef4123] mt-0.5">
                    {insights.sixes_per_match}
                  </div>
                  <div className="text-[10px] text-white/60 mt-0.5 font-medium">Aerial Intensity</div>
                </div>
              </div>
            </div>

            {/* Tactical Ground Dimensions Sub-Strip */}
            <div className="mt-6 pt-5 border-t border-white/[0.1] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-[#33a3dc]" />
                <span className="text-white/60 font-semibold uppercase">Straight Boundary:</span>
                <span className="font-bold text-white">{insights.dimensions.straight}m</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-[#ef4123]" />
                <span className="text-white/60 font-semibold uppercase">Square Off:</span>
                <span className="font-bold text-white">{insights.dimensions.square_off}m</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-[#ffcb05]" />
                <span className="text-white/60 font-semibold uppercase">Square Leg:</span>
                <span className="font-bold text-white">{insights.dimensions.square_leg}m</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-[#00b49d]" />
                <span className="text-white/60 font-semibold uppercase">Fine Leg:</span>
                <span className="font-bold text-white">{insights.dimensions.fine_third}m</span>
              </div>
            </div>
          </div>

          {/* Three-Column Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Toss & Chase Advantage Matrix */}
            <div className="bg-[#061645]/90 border border-white/[0.1] rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-[#ef4123]" />
                  <h2 className="font-heading font-black text-sm text-white uppercase tracking-wider">
                    Toss Impact & Chase Matrix
                  </h2>
                </div>
                <span className="text-[10px] text-white/50 uppercase font-mono">100% Normalized</span>
              </div>

              {/* Dual Progress Meter */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-[#33a3dc] uppercase">Chasing Won ({insights.chase_win_pct}%)</span>
                  <span className="text-[#ffcb05] uppercase">Bat 1st Won ({insights.bat_first_win_pct}%)</span>
                </div>

                <div className="h-4 bg-[#020b2d] rounded-full overflow-hidden flex p-0.5 border border-white/[0.1]">
                  <div
                    className="h-full bg-gradient-to-r from-[#19398a] to-[#33a3dc] rounded-l-full transition-all duration-500"
                    style={{ width: `${insights.chase_win_pct}%` }}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-[#ffcb05] to-[#ef4123] rounded-r-full transition-all duration-500"
                    style={{ width: `${insights.bat_first_win_pct}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-white/60 font-medium">
                  <span>Record High: <strong className="text-white">{insights.highest_score}</strong></span>
                  <span>Record Low: <strong className="text-white">{insights.lowest_score}</strong></span>
                </div>
              </div>

              {/* Tactical Ground Directives */}
              <div className="pt-2 border-t border-white/[0.08] space-y-2">
                <div className="text-[11px] font-black text-[#ffcb05] uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Strategic Curator Keys</span>
                </div>
                <ul className="space-y-2">
                  {insights.tactical_keys.map((key: string, idx: number) => (
                    <li key={idx} className="text-xs text-white/80 flex items-start space-x-2 leading-relaxed">
                      <span className="text-[#ef4123] font-bold mt-0.5">•</span>
                      <span>{key}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Column 2: Pace vs Spin Pitch Breakdown */}
            <div className="bg-[#061645]/90 border border-white/[0.1] rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-[#ffcb05]" />
                  <h2 className="font-heading font-black text-sm text-white uppercase tracking-wider">
                    Pace vs Spin Breakdown
                  </h2>
                </div>
                <span className="text-[10px] text-white/50 uppercase font-mono">Ball-by-Ball DuckDB</span>
              </div>

              {/* Pace vs Spin Split Bars */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#020b2d]/80 p-3 rounded-xl border border-[#ef4123]/30">
                  <div className="flex items-center justify-between text-[10px] text-white/60 uppercase font-bold">
                    <span>Fast Bowlers</span>
                    <Wind className="w-3 h-3 text-[#ef4123]" />
                  </div>
                  <div className="text-xl font-heading font-black text-white mt-1">
                    {insights.pace_vs_spin.pace_wickets_pct}%
                  </div>
                  <div className="text-[10px] text-white/50 mt-0.5">
                    {insights.pace_vs_spin.pace_wickets_total} Wickets • Econ: {insights.pace_vs_spin.pace_economy}
                  </div>
                </div>

                <div className="bg-[#020b2d]/80 p-3 rounded-xl border border-[#33a3dc]/30">
                  <div className="flex items-center justify-between text-[10px] text-white/60 uppercase font-bold">
                    <span>Spin Attack</span>
                    <Activity className="w-3 h-3 text-[#33a3dc]" />
                  </div>
                  <div className="text-xl font-heading font-black text-white mt-1">
                    {insights.pace_vs_spin.spin_wickets_pct}%
                  </div>
                  <div className="text-[10px] text-white/50 mt-0.5">
                    {insights.pace_vs_spin.spin_wickets_total} Wickets • Econ: {insights.pace_vs_spin.spin_economy}
                  </div>
                </div>
              </div>

              {/* Visual Split Bar */}
              <div className="space-y-1.5">
                <div className="h-3 bg-[#020b2d] rounded-full overflow-hidden flex p-0.5 border border-white/[0.08]">
                  <div
                    className="h-full bg-[#ef4123] rounded-l-full"
                    style={{ width: `${insights.pace_vs_spin.pace_wickets_pct}%` }}
                  />
                  <div
                    className="h-full bg-[#33a3dc] rounded-r-full"
                    style={{ width: `${insights.pace_vs_spin.spin_wickets_pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-white/50 font-bold uppercase">
                  <span>Pace Dominance</span>
                  <span>Spin Assistance</span>
                </div>
              </div>

              <div className="p-3 bg-[#020b2d]/60 rounded-xl border border-white/[0.06] text-xs text-white/70 leading-relaxed">
                {insights.pace_vs_spin.spin_wickets_pct > 35 ? (
                  <span className="text-[#33a3dc] font-bold">
                    Spinners are heavily influential at this venue, picking up over 35% of all dismissals with grip and bounce.
                  </span>
                ) : (
                  <span className="text-white/80">
                    Fast bowlers dominate wicket tallies here with express pace and hard lengths under floodlights.
                  </span>
                )}
              </div>
            </div>

            {/* Column 3: Phase Scoring Velocities */}
            <div className="bg-[#061645]/90 border border-white/[0.1] rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-[#33a3dc]" />
                  <h2 className="font-heading font-black text-sm text-white uppercase tracking-wider">
                    Phase Scoring Velocity
                  </h2>
                </div>
                <span className="text-[10px] text-white/50 uppercase font-mono">Vs IPL Average</span>
              </div>

              <div className="space-y-3">
                {insights.phases.map((p: VenuePhaseData) => {
                  const isPositive = p.delta_rr >= 0;
                  return (
                    <div
                      key={p.phase}
                      className="bg-[#020b2d]/80 p-3 rounded-xl border border-white/[0.08] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white uppercase">{p.phase}</span>
                        <span className="text-xs font-heading font-black text-[#ffcb05]">
                          {p.run_rate} <span className="text-[10px] text-white/50 font-sans font-normal">RPO</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-white/60">
                        <span>Boundaries: <strong className="text-white">{p.boundary_pct}%</strong></span>
                        <span className={`font-bold ${isPositive ? "text-[#00b49d]" : "text-[#ef4123]"}`}>
                          {isPositive ? `+${p.delta_rr}` : p.delta_rr} RPO vs Par
                        </span>
                      </div>

                      <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#33a3dc] to-[#ef4123] rounded-full"
                          style={{ width: `${Math.min(100, (p.run_rate / 12) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Grid: Venue All-Time Kings & Iconic Matches */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* All-Time Venue Kings (Batting & Bowling) */}
            <div className="bg-[#061645]/90 border border-white/[0.1] rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3">
                <Award className="w-4 h-4 text-[#ffcb05]" />
                <h2 className="font-heading font-black text-sm text-white uppercase tracking-wider">
                  Venue Run Kings & Leading Wicket-Takers
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Top Batters */}
                <div className="space-y-2">
                  <div className="text-[11px] font-black text-[#ffcb05] uppercase tracking-wider mb-1">
                    Leading Batters
                  </div>
                  {insights.top_batters.slice(0, 4).map((b, idx: number) => (
                    <div
                      key={b.name}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#020b2d]/60 border border-white/[0.05] text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-4 text-center font-mono text-white/40 text-[11px]">{idx + 1}</span>
                        <span className="font-bold text-white">{b.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-[#33a3dc]">{b.runs} runs</span>
                        <span className="text-[10px] text-white/50 block font-mono">SR {b.strike_rate}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top Bowlers */}
                <div className="space-y-2">
                  <div className="text-[11px] font-black text-[#33a3dc] uppercase tracking-wider mb-1">
                    Leading Bowlers
                  </div>
                  {insights.top_bowlers.slice(0, 4).map((bo, idx: number) => (
                    <div
                      key={bo.name}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#020b2d]/60 border border-white/[0.05] text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-4 text-center font-mono text-white/40 text-[11px]">{idx + 1}</span>
                        <span className="font-bold text-white">{bo.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-[#ef4123]">{bo.wickets} wkts</span>
                        <span className="text-[10px] text-white/50 block font-mono">Econ {bo.economy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent High-Stakes Matches at Venue */}
            <div className="bg-[#061645]/90 border border-white/[0.1] rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center space-x-2">
                  <Swords className="w-4 h-4 text-[#ef4123]" />
                  <h2 className="font-heading font-black text-sm text-white uppercase tracking-wider">
                    Recent Clashes at This Ground
                  </h2>
                </div>
                <span className="text-[10px] text-white/50 uppercase font-mono">Official Scorecards</span>
              </div>

              <div className="space-y-2.5">
                {insights.recent_matches.map((m) => (
                  <div
                    key={m.match_id}
                    onClick={() => handleMatchClick(m.match_id)}
                    className="p-3 rounded-xl bg-[#020b2d]/70 hover:bg-[#132e73]/60 border border-white/[0.06] hover:border-[#ef4123]/50 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="text-[10px] text-white/50 font-semibold uppercase">
                        {m.date} • Season {m.season}
                      </div>
                      <div className="text-xs font-bold text-white flex items-center space-x-2">
                        <span>{m.team1.name} <span className="text-white/60">({m.team1.score})</span></span>
                        <span className="text-[#ef4123] text-[10px]">vs</span>
                        <span>{m.team2.name} <span className="text-white/60">({m.team2.score})</span></span>
                      </div>
                      <div className="text-[11px] text-[#ffcb05] font-semibold">
                        Won by {m.winner}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-white/[0.05] group-hover:bg-[#ef4123] text-white/60 group-hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
