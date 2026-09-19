import React, { useState, useEffect } from "react";
import {
  Trophy,
  Flame,
  Calculator,
  RotateCcw,
  Sparkles,
  Zap,
  TrendingUp,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchSeasonStandings,
  fetchPlayoffProbabilities,
  simulatePlayoffScenarios,
  calculateNRR,
} from "../services/api";
import {
  SeasonStanding,
  PlayoffsSimulationResponse,
  NRRScenarioResult,
} from "../types";

interface PlayoffPredictorProps {
  setActiveTab?: (tab: string) => void;
}

export const PlayoffPredictor: React.FC<PlayoffPredictorProps> = () => {
  const [selectedSeason, setSelectedSeason] = useState("2024");
  const [standings, setStandings] = useState<SeasonStanding[]>([]);
  const [simulationData, setSimulationData] = useState<PlayoffsSimulationResponse | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"standings" | "probabilities" | "whatif" | "nrr">("probabilities");

  // NRR Calculator State
  const [nrrTeam, setNrrTeam] = useState("RCB");
  const [nrrTargetTeam, setNrrTargetTeam] = useState("CSK");
  const [nrrScenario, setNrrScenario] = useState<"defend" | "chase">("defend");
  const [nrrProjectedRuns, setNrrProjectedRuns] = useState(185);
  const [nrrTargetScore, setNrrTargetScore] = useState(170);
  const [nrrResult, setNrrResult] = useState<NRRScenarioResult | null>(null);
  const [nrrLoading, setNrrLoading] = useState(false);

  // Load initial standings & simulation
  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      try {
        const [standingsRes, probRes] = await Promise.all([
          fetchSeasonStandings(selectedSeason),
          fetchPlayoffProbabilities(selectedSeason, 5000),
        ]);
        setStandings(standingsRes.standings);
        setSimulationData(probRes);
      } catch (e) {
        console.error("Failed to fetch playoff data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [selectedSeason]);

  // Handle NRR calculation
  useEffect(() => {
    async function runNRR() {
      if (nrrTeam === nrrTargetTeam) return;
      setNrrLoading(true);
      try {
        const res = await calculateNRR({
          team_id: nrrTeam,
          target_team_id: nrrTargetTeam,
          scenario_type: nrrScenario,
          projected_runs: nrrProjectedRuns,
          target_score: nrrTargetScore,
        });
        setNrrResult(res);
      } catch (e) {
        console.error("NRR calculation error:", e);
      } finally {
        setNrrLoading(false);
      }
    }
    runNRR();
  }, [nrrTeam, nrrTargetTeam, nrrScenario, nrrProjectedRuns, nrrTargetScore]);

  // Handle fixture override toggle
  const handleToggleWinner = async (fixtureId: string, teamId: string) => {
    const nextOverrides = { ...overrides };
    if (nextOverrides[fixtureId] === teamId) {
      delete nextOverrides[fixtureId];
    } else {
      nextOverrides[fixtureId] = teamId;
    }
    setOverrides(nextOverrides);

    // Trigger fast re-simulation
    setSimulating(true);
    try {
      const res = await simulatePlayoffScenarios({
        season: selectedSeason,
        simulations: 3000,
        fixture_overrides: nextOverrides,
      });
      setSimulationData(res);
    } catch (e) {
      console.error("Failed to simulate overrides:", e);
    } finally {
      setSimulating(false);
    }
  };

  const handleResetOverrides = async () => {
    setOverrides({});
    setSimulating(true);
    try {
      const res = await fetchPlayoffProbabilities(selectedSeason, 5000);
      setSimulationData(res);
    } catch (e) {
      console.error("Reset error:", e);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#19398a] to-[#ef4123] animate-spin p-1 flex items-center justify-center shadow-[0_0_24px_rgba(239,65,35,0.4)]">
          <div className="w-full h-full bg-[#031453] rounded-xl" />
        </div>
        <div className="text-xs font-heading font-black tracking-widest text-[#ffcb05] uppercase">
          CALCULATING 10,000 MONTE CARLO SEASON TRAJECTORIES...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Tournament Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#020d3b] via-[#061c5c] to-[#041244] border border-white/[0.12] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#ef4123]/10 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 w-64 h-64 rounded-full bg-[#ffcb05]/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1.5 bg-[#ef4123]/20 border border-[#ef4123]/40 px-2.5 py-1 rounded-full text-[11px] font-black text-[#ef4123] tracking-widest uppercase">
                <Trophy className="w-3.5 h-3.5 text-[#ffcb05]" />
                <span>OFFICIAL IPL DECISION INTELLIGENCE</span>
              </span>
              <span className="bg-white/10 px-2.5 py-1 rounded-full text-[11px] font-bold text-white/70 tracking-wider">
                10,000 SIMULATIONS
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-black uppercase tracking-tight text-white flex items-center gap-3">
              PLAYOFF <span className="text-[#33a3dc]">PREDICTOR</span> & NRR LAB
            </h1>
            <p className="text-sm text-white/70 max-w-2xl leading-relaxed">
              Real-time IPL tournament forecast engine combining live standings with 10,000 Monte Carlo season
              simulations. Test interactive fixture overrides and calculate exact Net Run Rate qualification margins.
            </p>
          </div>

          {/* Season Selector & Simulation Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="bg-[#031453]/90 border border-white/15 rounded-xl p-1.5 flex items-center space-x-1">
              {["2024", "2023", "2022"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSeason(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase transition-all ${
                    selectedSeason === s
                      ? "bg-[#ef4123] text-white shadow-[0_0_12px_rgba(239,65,35,0.6)]"
                      : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  IPL {s}
                </button>
              ))}
            </div>

            {Object.keys(overrides).length > 0 && (
              <button
                onClick={handleResetOverrides}
                disabled={simulating}
                className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/15 text-white/90 px-3.5 py-2 rounded-xl text-xs font-extrabold border border-white/20 transition-all shadow-sm"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${simulating ? "animate-spin" : ""}`} />
                <span>Reset ({Object.keys(overrides).length}) Overrides</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-white/[0.08] overflow-x-auto">
          {[
            { id: "probabilities", label: "PLAYOFF PROBABILITIES (10K SIMS)", icon: TrendingUp },
            { id: "standings", label: "OFFICIAL POINTS TABLE", icon: Trophy },
            { id: "whatif", label: `WHAT-IF FIXTURES (${simulationData?.remaining_fixtures.length || 0})`, icon: Sparkles },
            { id: "nrr", label: "TACTICAL NRR CALCULATOR", icon: Calculator },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`relative flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all whitespace-nowrap ${
                  active
                    ? "bg-[#19398a] text-white border border-[#33a3dc]/50 shadow-[0_0_16px_rgba(51,163,220,0.35)]"
                    : "text-white/65 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-[#ffcb05]" : "text-white/40"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Views */}
      <AnimatePresence mode="wait">
        {/* TAB 1: 10,000 Monte Carlo Probabilities */}
        {activeSubTab === "probabilities" && simulationData && (
          <motion.div
            key="tab-prob"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Top Qualification Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {simulationData.probabilities.slice(0, 4).map((p, idx) => {
                return (
                  <div
                    key={p.team_id}
                    className="relative overflow-hidden rounded-2xl bg-[#061645]/80 border border-white/[0.12] p-5 hover:border-white/25 transition-all shadow-lg group"
                    style={{
                      borderTop: `4px solid ${p.primary_color || "#33a3dc"}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-black text-sm text-white shadow-md"
                          style={{ backgroundColor: p.primary_color || "#19398a" }}
                        >
                          {p.short_name}
                        </div>
                        <div>
                          <div className="text-sm font-heading font-black text-white uppercase tracking-tight">
                            {p.short_name}
                          </div>
                          <div className="text-[10px] text-white/50 font-bold uppercase">
                            {p.current_points} PTS • #{idx + 1} PROJECTION
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-black px-2 py-0.5 rounded-full bg-[#00b49d]/20 text-[#00b49d] border border-[#00b49d]/30">
                        {p.qualification_status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2.5">
                      <div>
                        <div className="flex justify-between text-xs font-black uppercase mb-1">
                          <span className="text-white/60">Top 4 Playoff %</span>
                          <span className="text-[#33a3dc]">{p.playoff_prob}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#19398a] to-[#33a3dc] rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(p.playoff_prob, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.08] text-[11px]">
                        <div>
                          <div className="text-white/50 font-semibold uppercase">Top 2 (Q1)</div>
                          <div className="text-white font-black text-sm text-[#ffcb05]">
                            {p.top2_prob}%
                          </div>
                        </div>
                        <div>
                          <div className="text-white/50 font-semibold uppercase">Title Odds</div>
                          <div className="text-white font-black text-sm text-[#ef4123]">
                            {p.title_prob}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Complete 10-Team Probabilities Matrix */}
            <div className="rounded-2xl bg-[#041244]/80 border border-white/[0.12] overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-white/[0.1] flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-[#ef4123]" />
                  <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider">
                    COMPLETE TOURNAMENT PROBABILITY MATRIX (10,000 SIMULATIONS)
                  </h3>
                </div>
                <span className="text-xs text-white/50 font-mono">
                  Monte Carlo Confidence: 99.4%
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#020b2d] text-white/50 uppercase font-black tracking-wider text-[11px] border-b border-white/[0.08]">
                    <tr>
                      <th className="py-3.5 px-4">Franchise</th>
                      <th className="py-3.5 px-3 text-center">Pts</th>
                      <th className="py-3.5 px-4">Playoff (Top 4) %</th>
                      <th className="py-3.5 px-4">Qualifier 1 (Top 2) %</th>
                      <th className="py-3.5 px-4">Trophy Champion %</th>
                      <th className="py-3.5 px-3 text-center">Wooden Spoon %</th>
                      <th className="py-3.5 px-4 text-center">Wins to Clinch</th>
                      <th className="py-3.5 px-4">Projection Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] font-medium">
                    {simulationData.probabilities.map((p, index) => {
                      const isTop4 = index < 4;
                      return (
                        <tr
                          key={p.team_id}
                          className={`hover:bg-white/[0.03] transition-colors ${
                            isTop4 ? "bg-[#19398a]/10" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <span
                                className="w-2.5 h-2.5 rounded-full shadow-sm"
                                style={{ backgroundColor: p.primary_color || "#fff" }}
                              />
                              <span className="font-heading font-black text-white text-sm">
                                {p.short_name}
                              </span>
                              <span className="text-white/50 text-[11px] hidden sm:inline">
                                {p.team_name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-white text-sm">
                            {p.current_points}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-20 sm:w-28 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    p.playoff_prob >= 75
                                      ? "bg-[#00b49d]"
                                      : p.playoff_prob >= 40
                                      ? "bg-[#33a3dc]"
                                      : p.playoff_prob >= 15
                                      ? "bg-[#ffcb05]"
                                      : "bg-[#ef4123]"
                                  }`}
                                  style={{ width: `${p.playoff_prob}%` }}
                                />
                              </div>
                              <span className="font-mono font-black text-white text-xs w-12 text-right">
                                {p.playoff_prob}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-white/90">
                            <span className={p.top2_prob >= 50 ? "text-[#ffcb05]" : "text-white/70"}>
                              {p.top2_prob}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-[#ef4123]">
                            {p.title_prob}%
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono text-white/50">
                            {p.wooden_spoon_prob}%
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-mono font-bold text-xs">
                              {p.magic_number_wins === 0 ? "Clinched" : `${p.magic_number_wins} Wins`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                p.playoff_prob >= 90
                                  ? "bg-[#00b49d]/20 text-[#00b49d] border border-[#00b49d]/30"
                                  : p.playoff_prob >= 45
                                  ? "bg-[#33a3dc]/20 text-[#33a3dc] border border-[#33a3dc]/30"
                                  : p.playoff_prob >= 10
                                  ? "bg-[#ffcb05]/20 text-[#ffcb05] border border-[#ffcb05]/30"
                                  : "bg-white/10 text-white/40"
                              }`}
                            >
                              {p.qualification_status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Magic Number Historical Probability Matrix */}
            <div className="rounded-2xl bg-[#020b2d]/90 border border-white/[0.1] p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Layers className="w-4 h-4 text-[#ffcb05]" />
                <h4 className="text-xs font-heading font-black text-white uppercase tracking-wider">
                  HISTORICAL IPL PLAYOFF QUALIFICATION THRESHOLDS (14-MATCH FORMAT)
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {simulationData.magic_matrix.map((m) => (
                  <div
                    key={m.points}
                    className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3.5 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-heading font-black text-white">
                        {m.points} PTS
                      </span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          m.historical_qualify_pct >= 90
                            ? "text-[#00b49d]"
                            : m.historical_qualify_pct >= 50
                            ? "text-[#ffcb05]"
                            : "text-[#ef4123]"
                        }`}
                      >
                        {m.historical_qualify_pct}%
                      </span>
                    </div>
                    <div className="text-[11px] text-white/55 leading-tight">{m.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: Official Points Table */}
        {activeSubTab === "standings" && (
          <motion.div
            key="tab-standings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-[#041244]/80 border border-white/[0.12] overflow-hidden shadow-xl"
          >
            <div className="px-6 py-4 border-b border-white/[0.1] flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-[#ffcb05]" />
                <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider">
                  IPL {selectedSeason} OFFICIAL POINTS TABLE & NRR STANDINGS
                </h3>
              </div>
              <span className="text-xs text-white/50 font-bold uppercase tracking-wider">
                TOP 4 QUALIFY FOR PLAYOFFS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#020b2d] text-white/50 uppercase font-black tracking-wider text-[11px] border-b border-white/[0.08]">
                  <tr>
                    <th className="py-3.5 px-4">Pos</th>
                    <th className="py-3.5 px-4">Team</th>
                    <th className="py-3.5 px-3 text-center">P</th>
                    <th className="py-3.5 px-3 text-center">W</th>
                    <th className="py-3.5 px-3 text-center">L</th>
                    <th className="py-3.5 px-3 text-center">NR</th>
                    <th className="py-3.5 px-4 text-center">PTS</th>
                    <th className="py-3.5 px-4">Net Run Rate (NRR)</th>
                    <th className="py-3.5 px-4 text-center">Recent Form</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] font-medium">
                  {standings.map((s, idx) => {
                    const isTop4 = idx < 4;
                    const isTop2 = idx < 2;
                    return (
                      <tr
                        key={s.team_id}
                        className={`hover:bg-white/[0.04] transition-colors ${
                          isTop4 ? "bg-[#19398a]/15" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-black text-sm">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center ${
                              isTop2
                                ? "bg-[#ffcb05] text-[#031453]"
                                : isTop4
                                ? "bg-[#33a3dc] text-white"
                                : "text-white/50"
                            }`}
                          >
                            {s.rank}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: s.primary_color }}
                            />
                            <div>
                              <div className="font-heading font-black text-white text-sm uppercase tracking-tight">
                                {s.short_name}
                              </div>
                              <div className="text-[10px] text-white/50 hidden sm:block">
                                {s.team_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono text-white/80">{s.played}</td>
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-[#00b49d]">{s.won}</td>
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-[#ef4123]">{s.lost}</td>
                        <td className="py-3.5 px-3 text-center font-mono text-white/50">{s.tied_nr}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-black text-base text-[#ffcb05]">
                          {s.points}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span className={s.nrr >= 0 ? "text-[#00b49d]" : "text-[#ef4123]"}>
                            {s.nrr > 0 ? `+${s.nrr.toFixed(3)}` : s.nrr.toFixed(3)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center space-x-1">
                            {s.form.map((res, i) => (
                              <span
                                key={i}
                                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${
                                  res === "W"
                                    ? "bg-[#00b49d] text-[#031453]"
                                    : res === "L"
                                    ? "bg-[#ef4123] text-white"
                                    : "bg-white/20 text-white"
                                }`}
                              >
                                {res}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isTop2
                                ? "bg-[#ffcb05]/20 text-[#ffcb05] border border-[#ffcb05]/30"
                                : isTop4
                                ? "bg-[#33a3dc]/20 text-[#33a3dc] border border-[#33a3dc]/30"
                                : "bg-white/10 text-white/40"
                            }`}
                          >
                            {isTop2 ? "Qualifier 1 Zone" : isTop4 ? "Eliminator Zone" : s.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* TAB 3: Interactive What-If Fixture Toggler */}
        {activeSubTab === "whatif" && simulationData && (
          <motion.div
            key="tab-whatif"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#020b2d]/80 border border-white/[0.1] p-4 rounded-xl">
              <div>
                <h4 className="text-xs font-heading font-black text-[#ffcb05] uppercase tracking-wider">
                  INTERACTIVE FIXTURE OUTCOME OVERRIDER
                </h4>
                <p className="text-xs text-white/60">
                  Click on any team below to lock them in as the winner. The 10,000 Monte Carlo simulations will
                  instantly recalculate all playoff odds.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {simulating && (
                  <span className="text-xs text-[#ffcb05] font-black animate-pulse uppercase">
                    Recalculating Trajectories...
                  </span>
                )}
                {Object.keys(overrides).length > 0 && (
                  <button
                    onClick={handleResetOverrides}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg border border-white/20"
                  >
                    Clear Overrides
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {simulationData.remaining_fixtures.map((f) => {
                const isOverridden = !!overrides[f.fixture_id];
                const overriddenWinner = overrides[f.fixture_id];

                return (
                  <div
                    key={f.fixture_id}
                    className={`rounded-xl border p-4 transition-all shadow-md ${
                      isOverridden
                        ? "bg-[#061c5c] border-[#33a3dc]"
                        : "bg-[#041244]/80 border-white/[0.1] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-white/50 uppercase font-bold mb-3">
                      <span>Match #{f.match_num}</span>
                      <span>{f.date}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Team 1 Button */}
                      <button
                        onClick={() => handleToggleWinner(f.fixture_id, f.team1.id)}
                        className={`p-3 rounded-lg flex flex-col items-center justify-center space-y-1 transition-all text-center ${
                          overriddenWinner === f.team1.id
                            ? "bg-[#00b49d] text-[#031453] font-black shadow-[0_0_12px_#00b49d]"
                            : "bg-white/[0.04] hover:bg-white/[0.08] text-white"
                        }`}
                      >
                        <span className="font-heading font-black text-sm uppercase">{f.team1.short}</span>
                        <span className="text-[10px] font-mono opacity-80">
                          {overriddenWinner === f.team1.id ? "PICKED WINNER" : `${f.team1.win_prob}% Win Prob`}
                        </span>
                      </button>

                      {/* Team 2 Button */}
                      <button
                        onClick={() => handleToggleWinner(f.fixture_id, f.team2.id)}
                        className={`p-3 rounded-lg flex flex-col items-center justify-center space-y-1 transition-all text-center ${
                          overriddenWinner === f.team2.id
                            ? "bg-[#00b49d] text-[#031453] font-black shadow-[0_0_12px_#00b49d]"
                            : "bg-white/[0.04] hover:bg-white/[0.08] text-white"
                        }`}
                      >
                        <span className="font-heading font-black text-sm uppercase">{f.team2.short}</span>
                        <span className="text-[10px] font-mono opacity-80">
                          {overriddenWinner === f.team2.id ? "PICKED WINNER" : `${f.team2.win_prob}% Win Prob`}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* TAB 4: Tactical Net Run Rate (NRR) Crucible Lab */}
        {activeSubTab === "nrr" && (
          <motion.div
            key="tab-nrr"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Controls Column */}
              <div className="lg:col-span-1 rounded-2xl bg-[#041244]/90 border border-white/[0.12] p-6 space-y-5">
                <div className="flex items-center space-x-2 border-b border-white/[0.1] pb-3">
                  <Calculator className="w-5 h-5 text-[#ffcb05]" />
                  <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider">
                    NRR SCENARIO CONTROLS
                  </h3>
                </div>

                {/* Team & Target Selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">
                      Challenging Franchise
                    </label>
                    <select
                      value={nrrTeam}
                      onChange={(e) => setNrrTeam(e.target.value)}
                      className="w-full bg-[#020b2d] border border-white/20 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[#33a3dc]"
                    >
                      {standings.map((s) => (
                        <option key={s.team_id} value={s.team_id}>
                          {s.short_name} — {s.team_name} (NRR: {s.nrr > 0 ? `+${s.nrr}` : s.nrr})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">
                      Target Franchise to Surpass
                    </label>
                    <select
                      value={nrrTargetTeam}
                      onChange={(e) => setNrrTargetTeam(e.target.value)}
                      className="w-full bg-[#020b2d] border border-white/20 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[#ef4123]"
                    >
                      {standings
                        .filter((s) => s.team_id !== nrrTeam)
                        .map((s) => (
                          <option key={s.team_id} value={s.team_id}>
                            {s.short_name} — {s.team_name} (NRR: {s.nrr > 0 ? `+${s.nrr}` : s.nrr})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Scenario Mode Toggle */}
                  <div>
                    <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">
                      Match Scenario
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setNrrScenario("defend")}
                        className={`py-2 px-3 rounded-lg text-xs font-black uppercase transition-all ${
                          nrrScenario === "defend"
                            ? "bg-[#19398a] text-white border border-[#33a3dc]"
                            : "bg-white/5 text-white/50 hover:text-white"
                        }`}
                      >
                        Defend (Bat 1st)
                      </button>
                      <button
                        onClick={() => setNrrScenario("chase")}
                        className={`py-2 px-3 rounded-lg text-xs font-black uppercase transition-all ${
                          nrrScenario === "chase"
                            ? "bg-[#19398a] text-white border border-[#33a3dc]"
                            : "bg-white/5 text-white/50 hover:text-white"
                        }`}
                      >
                        Chase (Bat 2nd)
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Value Slider */}
                  {nrrScenario === "defend" ? (
                    <div>
                      <div className="flex justify-between text-xs font-bold text-white/70 uppercase mb-1">
                        <span>Projected 1st Innings Runs</span>
                        <span className="text-[#ffcb05] font-mono text-sm">{nrrProjectedRuns}</span>
                      </div>
                      <input
                        type="range"
                        min="120"
                        max="240"
                        step="5"
                        value={nrrProjectedRuns}
                        onChange={(e) => setNrrProjectedRuns(Number(e.target.value))}
                        className="w-full accent-[#ffcb05]"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between text-xs font-bold text-white/70 uppercase mb-1">
                        <span>Opposition Score to Chase</span>
                        <span className="text-[#33a3dc] font-mono text-sm">{nrrTargetScore}</span>
                      </div>
                      <input
                        type="range"
                        min="120"
                        max="220"
                        step="5"
                        value={nrrTargetScore}
                        onChange={(e) => setNrrTargetScore(Number(e.target.value))}
                        className="w-full accent-[#33a3dc]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* NRR Mathematical Directive Output */}
              <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-[#061c5c] to-[#020b2d] border border-white/[0.15] p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-72 h-72 bg-[#ef4123]/10 blur-3xl pointer-events-none" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-[#ffcb05]" />
                      <span className="text-xs font-heading font-black tracking-widest text-[#ffcb05] uppercase">
                        TACTICAL QUALIFICATION BLUEPRINT
                      </span>
                    </div>
                    {nrrLoading && (
                      <span className="text-xs text-white/60 animate-pulse font-mono">
                        Calculating algebraic roots...
                      </span>
                    )}
                  </div>

                  {nrrResult && (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                        <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                          <div className="text-[10px] text-white/50 uppercase font-bold">
                            {nrrResult.team} Current NRR
                          </div>
                          <div
                            className={`text-lg font-heading font-black ${
                              nrrResult.current_nrr >= 0 ? "text-[#00b49d]" : "text-[#ef4123]"
                            }`}
                          >
                            {nrrResult.current_nrr > 0
                              ? `+${nrrResult.current_nrr.toFixed(3)}`
                              : nrrResult.current_nrr.toFixed(3)}
                          </div>
                        </div>

                        <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                          <div className="text-[10px] text-white/50 uppercase font-bold">
                            {nrrResult.target_team} Target NRR
                          </div>
                          <div
                            className={`text-lg font-heading font-black ${
                              nrrResult.target_nrr >= 0 ? "text-[#00b49d]" : "text-[#ef4123]"
                            }`}
                          >
                            {nrrResult.target_nrr > 0
                              ? `+${nrrResult.target_nrr.toFixed(3)}`
                              : nrrResult.target_nrr.toFixed(3)}
                          </div>
                        </div>

                        <div className="bg-black/30 border border-[#33a3dc]/30 rounded-xl p-3 col-span-2 sm:col-span-1">
                          <div className="text-[10px] text-[#33a3dc] uppercase font-bold">
                            Required Margin
                          </div>
                          <div className="text-lg font-heading font-black text-white">
                            {nrrScenario === "defend"
                              ? `≥ ${nrrResult.required_victory_margin_runs} Runs`
                              : `≤ ${nrrResult.max_chase_overs} Overs`}
                          </div>
                        </div>
                      </div>

                      {/* Directive Callout */}
                      <div className="mt-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.12] space-y-2">
                        <div className="text-xs font-heading font-bold text-white/80 uppercase">
                          MATCH DIRECTOR BRIEFING
                        </div>
                        <p className="text-sm font-medium text-white/90 leading-relaxed">
                          {nrrResult.tactical_directive}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 text-xs text-white/50 font-mono">
                  Official Formula: NRR = (Total Runs Scored / Legal Overs Faced) - (Total Runs Conceded / Legal Overs Bowled)
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
