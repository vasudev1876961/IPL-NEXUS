import { useState } from "react";
import { Dices, Target, ShieldCheck, Play, RefreshCw } from "lucide-react";
import { SimulationResponse } from "../types";
import { runSimulation, fetchBowlerRecommendation } from "../services/api";
import { ScoreDistributionChart } from "../components/charts/ScoreDistributionChart";

export const StrategySimulator: React.FC = () => {
  // Simulator State
  const [currentScore, setCurrentScore] = useState(136);
  const [currentWickets, setCurrentWickets] = useState(4);
  const [ballsRemaining, setBallsRemaining] = useState(30);
  const [targetRuns, setTargetRuns] = useState(182);
  const [expectedNextOverRuns, setExpectedNextOverRuns] = useState<number>(14);
  const [wicketInNextOver, setWicketInNextOver] = useState(false);
  const [bowlingIntensity, setBowlingIntensity] = useState("medium");
  const [simResults, setSimResults] = useState<SimulationResponse | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Strategy Lab State
  const [striker, setStriker] = useState("V Kohli");
  const [nonStriker, setNonStriker] = useState("F du Plessis");
  const [phase, setPhase] = useState("Death");
  const [bowlerAdvice, setBowlerAdvice] = useState<any>(null);
  const [advising, setAdvising] = useState(false);

  async function handleSimulate() {
    setSimulating(true);
    try {
      const res = await runSimulation({
        current_score: currentScore,
        current_wickets: currentWickets,
        balls_remaining: ballsRemaining,
        target_runs: targetRuns,
        innings: 2,
        expected_next_over_runs: expectedNextOverRuns,
        wicket_in_next_over: wicketInNextOver,
        bowling_intensity: bowlingIntensity,
        num_simulations: 10000,
      });
      setSimResults(res);
    } catch (e) {
      console.error("Simulation failed:", e);
    } finally {
      setSimulating(false);
    }
  }

  async function handleGetBowlerAdvice() {
    setAdvising(true);
    try {
      const res = await fetchBowlerRecommendation({
        striker,
        non_striker: nonStriker,
        phase,
        available_bowlers: ["JJ Bumrah", "TA Boult", "SP Narine", "Rashid Khan", "HV Patel", "Mohammed Shami"],
      });
      setBowlerAdvice(res);
    } catch (e) {
      console.error("Bowler recommendation failed:", e);
    } finally {
      setAdvising(false);
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-wide flex items-center space-x-2">
          <Dices className="w-6 h-6 text-nexus-cyan" />
          <span>What-If Simulator & Strategy Laboratory</span>
        </h2>
        <p className="text-xs text-gray-400 font-mono mt-0.5">
          10,000-run Monte Carlo scenario modeling and tactical bowler deployment decision engine
        </p>
      </div>

      {/* Section 1: Monte Carlo What-If Simulator */}
      <section className="glass-panel rounded-3xl p-6 md:p-8 border border-nexus-border space-y-6">
        <div className="flex items-center space-x-2 pb-3 border-b border-nexus-border/60">
          <Dices className="w-5 h-5 text-nexus-cyan" />
          <h3 className="text-lg font-bold text-white">
            Vectorized Monte Carlo Match Simulator (10,000 Futures)
          </h3>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-nexus-surface/80 rounded-xl p-4 border border-nexus-border">
            <label className="text-xs font-mono text-gray-400 block mb-1">
              CURRENT SCORE: <span className="text-white font-bold">{currentScore}</span>
            </label>
            <input
              type="range"
              min="20"
              max="240"
              value={currentScore}
              onChange={(e) => setCurrentScore(Number(e.target.value))}
              className="w-full accent-nexus-cyan"
            />
          </div>

          <div className="bg-nexus-surface/80 rounded-xl p-4 border border-nexus-border">
            <label className="text-xs font-mono text-gray-400 block mb-1">
              WICKETS LOST: <span className="text-white font-bold">{currentWickets}</span>/10
            </label>
            <input
              type="range"
              min="0"
              max="9"
              value={currentWickets}
              onChange={(e) => setCurrentWickets(Number(e.target.value))}
              className="w-full accent-nexus-rose"
            />
          </div>

          <div className="bg-nexus-surface/80 rounded-xl p-4 border border-nexus-border">
            <label className="text-xs font-mono text-gray-400 block mb-1">
              BALLS REMAINING: <span className="text-white font-bold">{ballsRemaining}</span>b
            </label>
            <input
              type="range"
              min="6"
              max="120"
              step="6"
              value={ballsRemaining}
              onChange={(e) => setBallsRemaining(Number(e.target.value))}
              className="w-full accent-nexus-electric"
            />
          </div>

          <div className="bg-nexus-surface/80 rounded-xl p-4 border border-nexus-border">
            <label className="text-xs font-mono text-gray-400 block mb-1">
              TARGET RUNS: <span className="text-white font-bold">{targetRuns}</span>
            </label>
            <input
              type="range"
              min="100"
              max="260"
              value={targetRuns}
              onChange={(e) => setTargetRuns(Number(e.target.value))}
              className="w-full accent-nexus-gold"
            />
          </div>
        </div>

        {/* What-If Scenario Toggles */}
        <div className="p-4 rounded-2xl bg-nexus-surface/60 border border-nexus-border space-y-3">
          <span className="text-xs font-mono uppercase text-nexus-cyan font-bold tracking-wider block">
            Custom Scenario Modifiers
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <label className="text-xs font-mono text-gray-300 block mb-1">
                Expected Next Over Runs: <span className="text-nexus-cyan font-bold">{expectedNextOverRuns}</span>
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={expectedNextOverRuns}
                onChange={(e) => setExpectedNextOverRuns(Number(e.target.value))}
                className="w-full accent-nexus-cyan"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="wicketToggle"
                checked={wicketInNextOver}
                onChange={(e) => setWicketInNextOver(e.target.checked)}
                className="w-4 h-4 accent-nexus-rose rounded"
              />
              <label htmlFor="wicketToggle" className="text-xs text-gray-200 font-mono cursor-pointer">
                Loses wicket in next over
              </label>
            </div>

            <div>
              <label className="text-xs font-mono text-gray-300 block mb-1">
                Opposition Bowling Tier:
              </label>
              <select
                value={bowlingIntensity}
                onChange={(e) => setBowlingIntensity(e.target.value)}
                className="w-full bg-nexus-card border border-nexus-border rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-nexus-cyan outline-none"
              >
                <option value="high">Elite Death Bowlers (e.g. Bumrah/Narine)</option>
                <option value="medium">Average T20 Attack</option>
                <option value="low">Loose / Wet Ball Conditions</option>
              </select>
            </div>
          </div>
        </div>

        {/* Simulation Execution button */}
        <div className="flex justify-end">
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="bg-gradient-to-r from-nexus-cyan to-nexus-electric text-nexus-bg font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl flex items-center space-x-2 shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {simulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running 10,000 Simulations...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Execute 10,000 Monte Carlo Paths</span>
              </>
            )}
          </button>
        </div>

        {/* Results view */}
        {simResults && (
          <div className="space-y-6 pt-4 border-t border-nexus-border/60">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-panel rounded-2xl p-5 border border-nexus-border text-center">
                <span className="text-xs font-mono text-gray-400 block">PROJECTED WIN PROBABILITY</span>
                <span className="text-3xl font-black font-mono text-nexus-cyan mt-1 block">
                  {simResults.win_probability.toFixed(1)}%
                </span>
                <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                  Based on 10,000 simulated branches
                </span>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-nexus-border text-center">
                <span className="text-xs font-mono text-gray-400 block">EXPECTED FINAL SCORE</span>
                <span className="text-3xl font-black font-mono text-nexus-gold mt-1 block">
                  {simResults.expected_final_score}
                </span>
                <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                  Median empirical distribution
                </span>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-nexus-border text-center">
                <span className="text-xs font-mono text-gray-400 block">90% CONFIDENCE INTERVAL</span>
                <span className="text-3xl font-black font-mono text-nexus-emerald mt-1 block">
                  {simResults.score_confidence_interval[0]} - {simResults.score_confidence_interval[1]}
                </span>
                <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                  10th to 90th percentile bounds
                </span>
              </div>
            </div>

            {/* Distribution Chart */}
            <ScoreDistributionChart
              data={simResults.score_distribution}
              expectedScore={simResults.expected_final_score}
              confidenceInterval={simResults.score_confidence_interval}
            />
          </div>
        )}
      </section>

      {/* Section 2: Bowling Selection Advisor */}
      <section className="glass-panel rounded-3xl p-6 md:p-8 border border-nexus-border space-y-6">
        <div className="flex items-center space-x-2 pb-3 border-b border-nexus-border/60">
          <Target className="w-5 h-5 text-nexus-gold" />
          <h3 className="text-lg font-bold text-white">
            Algorithmic Bowler Deployment Advisor
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-mono text-gray-300 block mb-1">STRIKER</label>
            <input
              type="text"
              value={striker}
              onChange={(e) => setStriker(e.target.value)}
              className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-2 text-xs text-white font-mono focus:border-nexus-gold outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-gray-300 block mb-1">NON-STRIKER</label>
            <input
              type="text"
              value={nonStriker}
              onChange={(e) => setNonStriker(e.target.value)}
              className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-2 text-xs text-white font-mono focus:border-nexus-gold outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-gray-300 block mb-1">MATCH PHASE</label>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="w-full bg-nexus-surface border border-nexus-border rounded-xl px-4 py-2 text-xs text-white font-mono focus:border-nexus-gold outline-none"
            >
              <option value="Death">Death Overs (15–20)</option>
              <option value="Middle">Middle Overs (6–14)</option>
              <option value="Powerplay">Powerplay (0–5)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGetBowlerAdvice}
          disabled={advising}
          className="bg-nexus-gold/15 hover:bg-nexus-gold/25 text-nexus-gold text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl border border-nexus-gold/30 flex items-center space-x-2 transition-all shadow-glow-gold"
        >
          {advising ? <span>Evaluating Head-to-Head Telemetry...</span> : <span>Compute Optimal Bowler Choice &rarr;</span>}
        </button>

        {bowlerAdvice && (
          <div className="space-y-4 pt-4 border-t border-nexus-border/60">
            <div className="bg-nexus-surface/80 rounded-2xl p-5 border border-nexus-border">
              <div className="flex items-center space-x-2 text-nexus-gold mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-mono font-bold uppercase">Optimal Pick Identified</span>
              </div>
              <h4 className="text-xl font-black text-white">
                {bowlerAdvice.recommended_bowler}
              </h4>
              <p className="text-xs text-gray-300 mt-2 font-mono leading-relaxed">
                {bowlerAdvice.rationale}
              </p>
            </div>

            {/* Candidate Rankings */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-nexus-border pb-2">
                    <th className="pb-2">Bowler</th>
                    <th className="pb-2 text-right">Tactical Score</th>
                    <th className="pb-2 text-right">Phase Econ</th>
                    <th className="pb-2 text-right">Phase Dots</th>
                    <th className="pb-2 text-right">vs Striker Dismissals</th>
                    <th className="pb-2 text-right">Edge Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-border/40 font-mono">
                  {bowlerAdvice.rankings.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-nexus-surface/40">
                      <td className="py-2.5 font-bold text-white">{r.bowler}</td>
                      <td className="py-2.5 text-right font-bold text-nexus-cyan">{r.tactical_score}</td>
                      <td className="py-2.5 text-right text-gray-300">{r.phase_economy}</td>
                      <td className="py-2.5 text-right text-gray-300">{r.phase_dots_pct}%</td>
                      <td className="py-2.5 text-right font-bold text-nexus-rose">{r.vs_striker_dismissals}</td>
                      <td className="py-2.5 text-right text-nexus-gold text-[11px]">{r.h2h_edge}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
