import { useState, useEffect } from "react";
import {
  Dices,
  Target,
  ShieldCheck,
  Play,
  RefreshCw,
  Zap,
  TrendingUp,
  AlertTriangle,
  Flame,
  Plus,
  Minus,
  Sparkles,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { SimulationResponse, BowlerRecommendationResponse, BattingPlanResponse } from "../types";
import { runSimulation, fetchBowlerRecommendation, fetchBattingTacticalPlan } from "../services/api";
import { ScoreDistributionChart } from "../components/charts/ScoreDistributionChart";

interface StrategySimulatorProps {
  initialSubTab?: "simulator" | "strategy";
}

const PRESET_SCENARIOS = [
  {
    name: "Final Over Thriller",
    desc: "15 runs needed from 6 balls (6 wickets down)",
    score: 168,
    wickets: 6,
    balls: 6,
    target: 183,
  },
  {
    name: "Death Overs Squeeze",
    desc: "36 runs needed from 18 balls (4 wickets down)",
    score: 147,
    wickets: 4,
    balls: 18,
    target: 183,
  },
  {
    name: "Powerplay Counter-Attack",
    desc: "48 runs needed from 36 balls (2 wickets down)",
    score: 42,
    wickets: 2,
    balls: 36,
    target: 90,
  },
  {
    name: "Middle Overs Consolidation",
    desc: "78 runs needed from 54 balls (3 wickets down)",
    score: 105,
    wickets: 3,
    balls: 54,
    target: 183,
  },
];

const POPULAR_BATTERS = [
  "V Kohli",
  "RG Sharma",
  "MS Dhoni",
  "F du Plessis",
  "KL Rahul",
  "SA Yadav",
  "AD Russell",
  "Shubman Gill",
];

const AVAILABLE_BOWLER_POOL = [
  { name: "JJ Bumrah", role: "Pace / Death Specialist", team: "MI" },
  { name: "SP Narine", role: "Mystery Spin / Choke", team: "KKR" },
  { name: "Rashid Khan", role: "Leg Spin / Wicket-Taker", team: "GT" },
  { name: "TA Boult", role: "Left-Arm Swing", team: "RR" },
  { name: "Mohammed Shami", role: "Seam / Powerplay", team: "SRH" },
  { name: "HV Patel", role: "Slower Ball / Death", team: "PBKS" },
  { name: "Arshdeep Singh", role: "Left-Arm Yorker", team: "PBKS" },
  { name: "Kuldeep Yadav", role: "Chinaman Spin", team: "DC" },
];

export const StrategySimulator: React.FC<StrategySimulatorProps> = ({ initialSubTab = "simulator" }) => {
  const [activeSubTab, setActiveSubTab] = useState<"simulator" | "strategy">(initialSubTab);

  // Sync if prop changes
  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  // ==================== SIMULATOR STATE ====================
  const [currentScore, setCurrentScore] = useState(142);
  const [currentWickets, setCurrentWickets] = useState(4);
  const [ballsRemaining, setBallsRemaining] = useState(24);
  const [targetRuns, setTargetRuns] = useState(185);
  const [expectedNextOverRuns, setExpectedNextOverRuns] = useState<number>(12);
  const [wicketInNextOver, setWicketInNextOver] = useState(false);
  const [bowlingIntensity, setBowlingIntensity] = useState<"high" | "medium" | "low">("medium");
  const [simResults, setSimResults] = useState<SimulationResponse | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Derived Match Math
  const runsNeeded = Math.max(0, targetRuns - currentScore);
  const oversRemaining = (ballsRemaining / 6).toFixed(1);
  const requiredRunRate = ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : "0.00";
  const currentRunRate = (120 - ballsRemaining > 0) ? ((currentScore / (120 - ballsRemaining)) * 6).toFixed(2) : "0.00";

  // ==================== STRATEGY LAB STATE ====================
  const [striker, setStriker] = useState("V Kohli");
  const [nonStriker, setNonStriker] = useState("F du Plessis");
  const [phase, setPhase] = useState<"Powerplay" | "Middle" | "Death">("Death");
  const [selectedBowlers, setSelectedBowlers] = useState<string[]>([
    "JJ Bumrah",
    "SP Narine",
    "Rashid Khan",
    "TA Boult",
    "HV Patel",
  ]);
  const [bowlerAdvice, setBowlerAdvice] = useState<BowlerRecommendationResponse | null>(null);
  const [advisingBowler, setAdvisingBowler] = useState(false);

  // Batting Tactical Plan State
  const [battingPlan, setBattingPlan] = useState<BattingPlanResponse | null>(null);
  const [advisingBatting, setAdvisingBatting] = useState(false);

  // Auto-run initial simulation once on mount
  useEffect(() => {
    handleSimulate();
  }, []);

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

  function applyPreset(preset: typeof PRESET_SCENARIOS[0]) {
    setCurrentScore(preset.score);
    setCurrentWickets(preset.wickets);
    setBallsRemaining(preset.balls);
    setTargetRuns(preset.target);
  }

  function toggleBowler(name: string) {
    if (selectedBowlers.includes(name)) {
      if (selectedBowlers.length > 2) {
        setSelectedBowlers(selectedBowlers.filter((b) => b !== name));
      }
    } else {
      setSelectedBowlers([...selectedBowlers, name]);
    }
  }

  async function handleGetBowlerAdvice() {
    setAdvisingBowler(true);
    try {
      const res = await fetchBowlerRecommendation({
        striker,
        non_striker: nonStriker,
        phase,
        available_bowlers: selectedBowlers,
      });
      setBowlerAdvice(res);
    } catch (e) {
      console.error("Bowler recommendation failed:", e);
    } finally {
      setAdvisingBowler(false);
    }
  }

  async function handleGetBattingPlan() {
    setAdvisingBatting(true);
    try {
      const rrr = ballsRemaining > 0 ? (runsNeeded / ballsRemaining) * 6 : 9.0;
      const res = await fetchBattingTacticalPlan({
        required_rr: Number(rrr.toFixed(2)),
        wickets_lost: currentWickets,
        overs_remaining: Number((ballsRemaining / 6).toFixed(1)),
        current_score: currentScore,
        target_runs: targetRuns,
      });
      setBattingPlan(res);
    } catch (e) {
      console.error("Batting plan failed:", e);
    } finally {
      setAdvisingBatting(false);
    }
  }

  return (
    <div className="space-y-6 pb-20 pt-1">
      {/* Top Header & Sub-Tab Navigation Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-nexus-cyan/15 text-nexus-cyan border border-nexus-cyan/30 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
              {activeSubTab === "simulator" ? <Dices className="w-5 h-5" /> : <Target className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-wide">
                {activeSubTab === "simulator"
                  ? "Vectorized Monte Carlo Match Engine"
                  : "Tactical Strategy & Decision Lab"}
              </h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {activeSubTab === "simulator"
                  ? "10,000 probabilistic synthetic futures modeled in <80ms via NumPy random walks"
                  : "Algorithmic bowling matchup optimizer and situational batting risk matrix"}
              </p>
            </div>
          </div>
        </div>

        {/* High-End Segmented Control */}
        <div className="inline-flex p-1.5 rounded-2xl bg-[#090F1E] border border-white/[0.1] shadow-inner self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab("simulator")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeSubTab === "simulator"
                ? "bg-gradient-to-r from-nexus-cyan to-sky-500 text-nexus-bg font-extrabold shadow-[0_0_15px_rgba(0,240,255,0.35)]"
                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>Monte Carlo Simulator</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab("strategy");
              if (!bowlerAdvice) handleGetBowlerAdvice();
              if (!battingPlan) handleGetBattingPlan();
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeSubTab === "strategy"
                ? "bg-gradient-to-r from-nexus-gold to-amber-500 text-nexus-bg font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.35)]"
                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Tactical Strategy Lab</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: MONTE CARLO WHAT-IF SIMULATOR                     */}
      {/* ========================================================= */}
      {activeSubTab === "simulator" && (
        <div className="space-y-6">
          {/* Quick Scenario Preset Chips */}
          <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-4 h-4 text-nexus-cyan" />
              <span className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">
                Instant Match Scenario Presets
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {PRESET_SCENARIOS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(p)}
                  className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-nexus-cyan/40 text-left transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-nexus-cyan transition-colors">
                      {p.name}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-nexus-cyan transition-colors" />
                  </div>
                  <span className="text-[11px] font-mono text-gray-400 mt-1 block">
                    {p.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Chase Math Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] text-center">
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">
                RUNS NEEDED
              </span>
              <span className="text-2xl font-black font-mono text-nexus-cyan mt-1 block">
                {runsNeeded} runs
              </span>
              <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                Off {ballsRemaining} balls ({oversRemaining} ov)
              </span>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] text-center">
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">
                REQUIRED RUN RATE
              </span>
              <span className={`text-2xl font-black font-mono mt-1 block ${
                Number(requiredRunRate) >= 12 ? "text-nexus-rose" : Number(requiredRunRate) >= 9 ? "text-nexus-gold" : "text-nexus-emerald"
              }`}>
                {requiredRunRate} RPO
              </span>
              <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                Current CRR: {currentRunRate}
              </span>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] text-center">
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">
                WICKETS IN HAND
              </span>
              <span className="text-2xl font-black font-mono text-white mt-1 block">
                {10 - currentWickets} <span className="text-xs text-gray-400 font-normal">/ 10</span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                {currentWickets} wickets fallen
              </span>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] text-center">
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">
                MONTE CARLO SAMPLE
              </span>
              <span className="text-2xl font-black font-mono text-nexus-gold mt-1 block">
                10,000 Paths
              </span>
              <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                Vectorized Execution
              </span>
            </div>
          </div>

          {/* Interactive Match Variable HUD Sliders */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/[0.08] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center space-x-2.5">
                <Sliders className="w-5 h-5 text-nexus-cyan" />
                <h3 className="text-base font-bold text-white">
                  Match State Dynamic Controls
                </h3>
              </div>
              <span className="text-[11px] font-mono text-nexus-cyan bg-nexus-cyan/10 px-3 py-1 rounded-full border border-nexus-cyan/20">
                DRAG OR USE +/- STEP BUTTONS
              </span>
            </div>

            {/* 4 Interactive Sliders with Step Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Slider 1: Current Score */}
              <div className="bg-[#090F1E] rounded-2xl p-4 border border-white/[0.08] flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-mono text-gray-400 uppercase">Current Score</span>
                  <span className="text-base font-mono font-bold text-nexus-cyan">{currentScore}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="250"
                  value={currentScore}
                  onChange={(e) => setCurrentScore(Number(e.target.value))}
                  className="w-full my-3"
                />
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/[0.04]">
                  <button
                    onClick={() => setCurrentScore(Math.max(20, currentScore - 5))}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs font-mono transition-colors"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => setCurrentScore(Math.max(20, currentScore - 1))}
                    className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs font-mono transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentScore(Math.min(250, currentScore + 1))}
                    className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs font-mono transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentScore(Math.min(250, currentScore + 5))}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs font-mono transition-colors"
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* Slider 2: Wickets Lost */}
              <div className="bg-[#090F1E] rounded-2xl p-4 border border-white/[0.08] flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-mono text-gray-400 uppercase">Wickets Lost</span>
                  <span className="text-base font-mono font-bold text-red-400">{currentWickets} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="9"
                  value={currentWickets}
                  onChange={(e) => setCurrentWickets(Number(e.target.value))}
                  className="w-full my-3 accent-nexus-rose"
                />
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/[0.04]">
                  <button
                    onClick={() => setCurrentWickets(Math.max(0, currentWickets - 1))}
                    className="px-3 py-1 w-full rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs font-mono flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Wicket</span>
                  </button>
                  <button
                    onClick={() => setCurrentWickets(Math.min(9, currentWickets + 1))}
                    className="px-3 py-1 w-full rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-mono flex items-center justify-center space-x-1 border border-red-500/20 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Wicket</span>
                  </button>
                </div>
              </div>

              {/* Slider 3: Balls Remaining */}
              <div className="bg-[#090F1E] rounded-2xl p-4 border border-white/[0.08] flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-mono text-gray-400 uppercase">Balls Left</span>
                  <span className="text-base font-mono font-bold text-sky-400">
                    {ballsRemaining}b <span className="text-xs text-gray-400 font-normal">({oversRemaining} ov)</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="120"
                  step="6"
                  value={ballsRemaining}
                  onChange={(e) => setBallsRemaining(Number(e.target.value))}
                  className="w-full my-3 accent-nexus-electric"
                />
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/[0.04]">
                  <button
                    onClick={() => setBallsRemaining(Math.max(6, ballsRemaining - 6))}
                    className="px-3 py-1 w-full rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs font-mono transition-colors"
                  >
                    -1 Over
                  </button>
                  <button
                    onClick={() => setBallsRemaining(Math.min(120, ballsRemaining + 6))}
                    className="px-3 py-1 w-full rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs font-mono transition-colors"
                  >
                    +1 Over
                  </button>
                </div>
              </div>

              {/* Slider 4: Target Runs */}
              <div className="bg-[#090F1E] rounded-2xl p-4 border border-white/[0.08] flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-mono text-gray-400 uppercase">Target Score</span>
                  <span className="text-base font-mono font-bold text-nexus-gold">{targetRuns}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="260"
                  value={targetRuns}
                  onChange={(e) => setTargetRuns(Number(e.target.value))}
                  className="w-full my-3 accent-nexus-gold"
                />
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/[0.04]">
                  <button
                    onClick={() => setTargetRuns(Math.max(100, targetRuns - 5))}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs font-mono transition-colors"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => setTargetRuns(Math.max(100, targetRuns - 1))}
                    className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs font-mono transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setTargetRuns(Math.min(260, targetRuns + 1))}
                    className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs font-mono transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setTargetRuns(Math.min(260, targetRuns + 5))}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs font-mono transition-colors"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>

            {/* Tactical Scenario Modifiers Panel */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-white/[0.02] to-white/[0.01] border border-white/[0.06] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-nexus-cyan font-bold tracking-wider flex items-center space-x-2">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Tactical Condition Modifiers</span>
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  AFFECTS TRANSITION PROBABILITIES
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                {/* Modifier 1: Next Over Run Burst */}
                <div>
                  <div className="flex justify-between text-xs font-mono text-gray-300 mb-2">
                    <span>Expected Runs in Upcoming Over:</span>
                    <span className="text-nexus-cyan font-bold">+{expectedNextOverRuns} runs</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={expectedNextOverRuns}
                    onChange={(e) => setExpectedNextOverRuns(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Modifier 2: Upcoming Wicket Hazard Toggle */}
                <div
                  onClick={() => setWicketInNextOver(!wicketInNextOver)}
                  className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex items-center space-x-3 ${
                    wicketInNextOver
                      ? "bg-red-500/15 border-red-500/40 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                      : "bg-white/[0.03] border-white/[0.06] text-gray-400 hover:border-white/[0.15]"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                    wicketInNextOver ? "bg-red-500 border-red-400 text-white" : "border-gray-500"
                  }`}>
                    {wicketInNextOver && <Flame className="w-3.5 h-3.5 fill-current" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Wicket Hazard in Next Over
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 block">
                      {wicketInNextOver ? "Simulates a key dismissal shock" : "Normal wicket hazard rate"}
                    </span>
                  </div>
                </div>

                {/* Modifier 3: Opposition Attack Tier */}
                <div>
                  <label className="text-xs font-mono text-gray-300 block mb-1.5 font-bold">
                    Opposition Attack Strength:
                  </label>
                  <select
                    value={bowlingIntensity}
                    onChange={(e) => setBowlingIntensity(e.target.value as any)}
                    className="w-full bg-[#080D1A] border border-white/[0.1] rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-nexus-cyan outline-none"
                  >
                    <option value="high">Elite Attack (Bumrah / Narine / Rashid)</option>
                    <option value="medium">Average League Baseline</option>
                    <option value="low">Under-Pressure / Wet Ball Conditions</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Big Action Run Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="text-xs font-mono text-gray-400">
                Target: <span className="text-nexus-gold font-bold">{targetRuns}</span> • Need{" "}
                <span className="text-white font-bold">{runsNeeded}</span> off{" "}
                <span className="text-sky-400 font-bold">{ballsRemaining}b</span> (RRR {requiredRunRate})
              </div>

              <button
                onClick={handleSimulate}
                disabled={simulating}
                className="bg-gradient-to-r from-nexus-cyan via-sky-500 to-nexus-electric hover:from-cyan-400 hover:to-blue-500 text-nexus-bg font-black text-xs uppercase tracking-wider px-8 py-3.5 rounded-2xl flex items-center justify-center space-x-2 shadow-[0_0_25px_rgba(0,240,255,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {simulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing 10,000 Monte Carlo Paths...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Execute 10,000 Probabilistic Futures</span>
                  </>
                )}
              </button>
            </div>

            {/* Simulation Results Display */}
            {simResults && (
              <div className="space-y-6 pt-6 border-t border-white/[0.08]">
                {/* Result KPI Gauges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Projected Win Probability */}
                  <div className="glass-panel-elevated rounded-2xl p-6 border border-nexus-cyan/30 relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-nexus-cyan/10 rounded-bl-full pointer-events-none" />
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-wider block">
                      PROJECTED WIN PROBABILITY
                    </span>
                    <span className="text-4xl font-black font-mono text-nexus-cyan mt-2 block tracking-tight">
                      {simResults.win_probability.toFixed(1)}%
                    </span>
                    <div className="w-full bg-white/[0.06] rounded-full h-2.5 mt-3 overflow-hidden p-0.5 border border-white/[0.1]">
                      <div
                        style={{ width: `${Math.min(100, simResults.win_probability)}%` }}
                        className="h-full bg-gradient-to-r from-nexus-cyan to-sky-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                      />
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono mt-2 block">
                      {simResults.win_probability >= 50 ? "Favors Batting Side" : "Favors Defending Attack"}
                    </span>
                  </div>

                  {/* Expected Final Score */}
                  <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] text-center">
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-wider block">
                      MEDIAN PROJECTED SCORE
                    </span>
                    <span className="text-4xl font-black font-mono text-nexus-gold mt-2 block tracking-tight">
                      {simResults.expected_final_score}
                    </span>
                    <span className="text-xs font-mono text-gray-400 mt-3 block">
                      Target: <span className="text-white font-bold">{targetRuns}</span> ({simResults.expected_final_score >= targetRuns ? "Above Target" : "Below Target"})
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono mt-1 block">
                      50th Percentile Outcome
                    </span>
                  </div>

                  {/* 90% Confidence Spread */}
                  <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] text-center">
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-wider block">
                      90% CONFIDENCE BAND
                    </span>
                    <span className="text-4xl font-black font-mono text-emerald-400 mt-2 block tracking-tight">
                      {simResults.score_confidence_interval[0]} - {simResults.score_confidence_interval[1]}
                    </span>
                    <span className="text-xs font-mono text-gray-400 mt-3 block">
                      Spread: ±{Math.round((simResults.score_confidence_interval[1] - simResults.score_confidence_interval[0]) / 2)} runs
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono mt-1 block">
                      10th to 90th percentile envelope
                    </span>
                  </div>
                </div>

                {/* Outcome Histogram Bar Chart */}
                <ScoreDistributionChart
                  data={simResults.score_distribution}
                  expectedScore={simResults.expected_final_score}
                  confidenceInterval={simResults.score_confidence_interval}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: TACTICAL STRATEGY COMMAND LAB                     */}
      {/* ========================================================= */}
      {activeSubTab === "strategy" && (
        <div className="space-y-6">
          {/* Top Two-Section Grid: Bowler Deployment + Batting Chase Planner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (7 cols): Bowler Deployment Optimizer */}
            <div className="lg:col-span-7 glass-panel rounded-3xl p-6 md:p-8 border border-white/[0.08] space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <div className="flex items-center space-x-2.5">
                  <Target className="w-5 h-5 text-nexus-gold" />
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Algorithmic Bowler Deployment Optimizer
                    </h3>
                    <p className="text-[11px] text-gray-400 font-mono">
                      Ranks available bowlers using head-to-head match-up DNA & phase economy
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                  DUCKDB HEAD-TO-HEAD
                </span>
              </div>

              {/* Striker & Non-Striker Setup */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-nexus-cyan block mb-1.5 font-bold uppercase tracking-wider">
                      Current Striker
                    </label>
                    <input
                      type="text"
                      value={striker}
                      onChange={(e) => setStriker(e.target.value)}
                      placeholder="e.g. V Kohli"
                      className="w-full bg-[#080D1A] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-nexus-cyan outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono text-gray-400 block mb-1.5 font-bold uppercase tracking-wider">
                      Non-Striker
                    </label>
                    <input
                      type="text"
                      value={nonStriker}
                      onChange={(e) => setNonStriker(e.target.value)}
                      placeholder="e.g. F du Plessis"
                      className="w-full bg-[#080D1A] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-nexus-cyan outline-none"
                    />
                  </div>
                </div>

                {/* Quick Batter Chips */}
                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pt-1">
                  <span className="text-[10px] font-mono text-gray-500 uppercase whitespace-nowrap">
                    Presets:
                  </span>
                  {POPULAR_BATTERS.map((b) => (
                    <button
                      key={b}
                      onClick={() => setStriker(b)}
                      className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                        striker === b
                          ? "bg-nexus-cyan/20 text-nexus-cyan border-nexus-cyan/40 font-bold"
                          : "bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.06] text-gray-400"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>

                {/* Match Phase Selection Pills */}
                <div>
                  <label className="text-xs font-mono text-nexus-gold block mb-2 font-bold uppercase tracking-wider">
                    Upcoming Over Phase
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: "Powerplay", label: "Powerplay", overs: "Overs 0–5" },
                      { id: "Middle", label: "Middle Overs", overs: "Overs 6–14" },
                      { id: "Death", label: "Death Overs", overs: "Overs 15–20" },
                    ].map((p) => {
                      const isSelected = phase === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setPhase(p.id as any)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            isSelected
                              ? "bg-nexus-gold/15 border-nexus-gold text-white shadow-[0_0_15px_rgba(245,158,11,0.25)] font-bold"
                              : "bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] text-gray-400"
                          }`}
                        >
                          <span className="text-xs block">{p.label}</span>
                          <span className="text-[10px] font-mono text-gray-400 mt-0.5 block">{p.overs}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Bowling Squad Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-mono text-gray-300 font-bold uppercase tracking-wider">
                      Available Bowling Attack ({selectedBowlers.length} Selected)
                    </label>
                    <span className="text-[10px] font-mono text-gray-400">
                      Click to toggle in/out of attack
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {AVAILABLE_BOWLER_POOL.map((bowler) => {
                      const active = selectedBowlers.includes(bowler.name);
                      return (
                        <div
                          key={bowler.name}
                          onClick={() => toggleBowler(bowler.name)}
                          className={`p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                            active
                              ? "bg-sky-500/15 border-sky-400/40 text-white"
                              : "bg-white/[0.02] border-white/[0.05] text-gray-500 opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold truncate">{bowler.name}</span>
                            <span className="text-[9px] font-mono text-gray-400">{bowler.team}</span>
                          </div>
                          <span className="text-[10px] font-mono text-gray-400 block truncate mt-0.5">
                            {bowler.role.split("/")[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleGetBowlerAdvice}
                disabled={advisingBowler}
                className="w-full bg-gradient-to-r from-nexus-gold to-amber-500 text-nexus-bg font-extrabold text-xs uppercase tracking-wider py-3 px-6 rounded-2xl flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:opacity-95 transition-all disabled:opacity-50"
              >
                {advisingBowler ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Evaluating Head-to-Head Records...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Compute Optimal Bowler Deployment</span>
                  </>
                )}
              </button>

              {/* Recommendation View */}
              {bowlerAdvice && (
                <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                  {/* Top Pick Highlight Card */}
                  <div className="p-5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/30 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 text-amber-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-xs font-mono font-bold uppercase tracking-wider">
                          Optimal Bowler Deployment
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded border border-emerald-400/20">
                        {bowlerAdvice.estimated_win_prob_lift}
                      </span>
                    </div>
                    <h4 className="text-2xl font-black text-white">
                      {bowlerAdvice.recommended_bowler}
                    </h4>
                    <p className="text-xs text-gray-300 mt-2 font-mono leading-relaxed">
                      {bowlerAdvice.rationale}
                    </p>
                  </div>

                  {/* Candidate Rankings Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-white/[0.08] pb-2 font-mono">
                          <th className="pb-2">Ranked Bowler</th>
                          <th className="pb-2 text-right">Score</th>
                          <th className="pb-2 text-right">Phase Econ</th>
                          <th className="pb-2 text-right">Dots %</th>
                          <th className="pb-2 text-right">vs {striker.split(" ")[0]} Wkts</th>
                          <th className="pb-2 text-right">H2H Edge</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] font-mono">
                        {bowlerAdvice.rankings.map((r, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.03]">
                            <td className="py-2.5 font-bold text-white flex items-center space-x-2">
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                                idx === 0 ? "bg-amber-400 text-nexus-bg font-black" : "bg-white/[0.05] text-gray-400"
                              }`}>
                                {idx + 1}
                              </span>
                              <span>{r.bowler}</span>
                            </td>
                            <td className="py-2.5 text-right font-bold text-nexus-cyan">{r.tactical_score}</td>
                            <td className="py-2.5 text-right text-gray-300">{r.phase_economy}</td>
                            <td className="py-2.5 text-right text-gray-300">{r.phase_dots_pct}%</td>
                            <td className="py-2.5 text-right font-bold text-red-400">{r.vs_striker_dismissals}</td>
                            <td className="py-2.5 text-right text-nexus-gold text-[11px]">{r.h2h_edge}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (5 cols): Tactical Batting Chase Planner */}
            <div className="lg:col-span-5 glass-panel rounded-3xl p-6 md:p-8 border border-white/[0.08] space-y-6">
              <div className="flex items-center space-x-2.5 pb-4 border-b border-white/[0.06]">
                <TrendingUp className="w-5 h-5 text-nexus-cyan" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Batting Chase Risk Posture Matrix
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    Calibrates scoring aggression and boundary frequency based on match leverage
                  </p>
                </div>
              </div>

              {/* Current Context Card */}
              <div className="bg-[#080D1A] rounded-2xl p-4 border border-white/[0.08] space-y-3">
                <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">
                  Match Context Under Evaluation
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-gray-400 block">Required Rate</span>
                    <span className="text-base font-bold text-nexus-gold">{requiredRunRate} RPO</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Wickets in Hand</span>
                    <span className="text-base font-bold text-white">{10 - currentWickets} wkts</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Runs Needed</span>
                    <span className="text-base font-bold text-nexus-cyan">{runsNeeded} runs</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Overs Remaining</span>
                    <span className="text-base font-bold text-sky-400">{oversRemaining} ov</span>
                  </div>
                </div>

                <button
                  onClick={handleGetBattingPlan}
                  disabled={advisingBatting}
                  className="w-full mt-2 bg-white/[0.05] hover:bg-white/[0.1] text-nexus-cyan font-bold text-xs py-2.5 px-4 rounded-xl border border-nexus-cyan/30 flex items-center justify-center space-x-2 transition-all"
                >
                  {advisingBatting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>Recalculate Batting Risk Posture</span>
                </button>
              </div>

              {/* Batting Plan Output */}
              {battingPlan && (
                <div className="space-y-4">
                  {/* Tactical Posture Badge */}
                  <div className="p-4 rounded-2xl bg-nexus-cyan/[0.06] border border-nexus-cyan/20">
                    <span className="text-[10px] font-mono text-nexus-cyan uppercase tracking-wider block">
                      RECOMMENDED TACTICAL POSTURE
                    </span>
                    <h4 className="text-base font-black text-white mt-1">
                      {battingPlan.tactical_posture}
                    </h4>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        battingPlan.risk_profile.includes("Critical") || battingPlan.risk_profile.includes("Extreme")
                          ? "bg-red-500/15 text-red-400 border-red-500/30"
                          : battingPlan.risk_profile.includes("Moderate")
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      }`}>
                        {battingPlan.risk_profile}
                      </span>
                      <span className="text-[11px] font-mono text-gray-300">
                        Target: {battingPlan.target_boundaries_per_over} boundaries / over
                      </span>
                    </div>
                  </div>

                  {/* Strategic Coaching Advice */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center space-x-2 text-gray-300 mb-2">
                      <AlertTriangle className="w-4 h-4 text-nexus-gold" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider">
                        Coaching Directive
                      </span>
                    </div>
                    <p className="text-xs text-gray-200 leading-relaxed font-mono">
                      {battingPlan.strategic_advice}
                    </p>
                  </div>

                  {/* Tactical Checklist */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs font-mono text-gray-300">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-nexus-cyan"></span>
                      <span>Target 5th bowler matchups early in the phase</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-nexus-gold"></span>
                      <span>Keep strike rotation above 65% of legal deliveries</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>Preserve designated anchor through 18th over</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
