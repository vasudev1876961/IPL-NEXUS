import { useState, lazy, Suspense } from "react";
import { Navbar } from "./components/common/Navbar";
import { Database, Cpu } from "lucide-react";

// Code-split dynamic page imports for optimal bundle size and sub-200ms page transitions
const HomeDashboard = lazy(() =>
  import("./pages/HomeDashboard").then((m) => ({ default: m.HomeDashboard }))
);
const MatchCenter = lazy(() =>
  import("./pages/MatchCenter").then((m) => ({ default: m.MatchCenter }))
);
const PlayerLab = lazy(() =>
  import("./pages/PlayerLab").then((m) => ({ default: m.PlayerLab }))
);
const MatchupExplorer = lazy(() =>
  import("./pages/MatchupExplorer").then((m) => ({ default: m.MatchupExplorer }))
);
const VenueMatrix = lazy(() =>
  import("./pages/VenueMatrix").then((m) => ({ default: m.VenueMatrix }))
);
const StrategySimulator = lazy(() =>
  import("./pages/StrategySimulator").then((m) => ({ default: m.StrategySimulator }))
);
const AIAssistantPage = lazy(() =>
  import("./pages/AIAssistantPage").then((m) => ({ default: m.AIAssistantPage }))
);

// High-fidelity official IPL broadcast skeleton fallback
function BroadcastLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] space-y-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#19398a] via-[#132e73] to-[#ef4123] animate-spin p-1 flex items-center justify-center shadow-[0_0_30px_rgba(239,65,35,0.45)]">
          <div className="w-full h-full bg-[#031453] rounded-xl" />
        </div>
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffcb05] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ffcb05]"></span>
        </span>
      </div>
      <div className="text-center space-y-1">
        <div className="text-xs font-heading font-black tracking-widest text-[#ffcb05] uppercase">
          SYNCHRONIZING TELEMETRY...
        </div>
        <div className="text-[11px] text-white/50 font-mono">
          Fetching calibrated models & DuckDB warehouse
        </div>
      </div>
    </div>
  );
}

export function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedPlayer, setSelectedPlayer] = useState("V Kohli");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchupBatter, setMatchupBatter] = useState("V Kohli");
  const [matchupBowler, setMatchupBowler] = useState("JJ Bumrah");

  return (
    <div className="min-h-screen bg-[#031453] text-white flex flex-col selection:bg-[#ef4123] selection:text-white font-sans">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container with Suspense Code-Splitting */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Suspense fallback={<BroadcastLoader />}>
          {activeTab === "home" && (
            <HomeDashboard
              setActiveTab={setActiveTab}
              setSelectedPlayer={setSelectedPlayer}
              setSelectedMatchId={setSelectedMatchId}
            />
          )}
          {activeTab === "matches" && (
            <MatchCenter
              selectedMatchId={selectedMatchId}
              setSelectedMatchId={setSelectedMatchId}
              setSelectedPlayer={setSelectedPlayer}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === "players" && (
            <PlayerLab
              selectedPlayer={selectedPlayer}
              setSelectedPlayer={setSelectedPlayer}
              setActiveTab={setActiveTab}
              setMatchupBatter={setMatchupBatter}
              setMatchupBowler={setMatchupBowler}
            />
          )}
          {activeTab === "matchups" && (
            <MatchupExplorer
              batter={matchupBatter}
              bowler={matchupBowler}
              setBatter={setMatchupBatter}
              setBowler={setMatchupBowler}
            />
          )}
          {activeTab === "venues" && (
            <VenueMatrix
              setSelectedMatchId={setSelectedMatchId}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === "simulator" && (
            <StrategySimulator initialSubTab="simulator" />
          )}
          {activeTab === "strategy" && (
            <StrategySimulator initialSubTab="strategy" />
          )}
          {activeTab === "assistant" && <AIAssistantPage />}
        </Suspense>
      </main>

      {/* Official System Telemetry Footer */}
      <footer className="border-t border-white/[0.1] bg-[#020b2d]/90 py-4 px-4 sm:px-6 lg:px-8 mt-auto font-sans">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60 font-semibold uppercase tracking-wider">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-[#33a3dc]">
              <Database className="w-3.5 h-3.5" />
              <span>DuckDB OLAP: 295,732 Ball-by-Ball Records</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1.5 text-[#ffcb05]">
              <Cpu className="w-3.5 h-3.5" />
              <span>Calibrated Gradient Boosting ML (Brier: 0.187)</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#00b49d] shadow-[0_0_8px_#00b49d]"></span>
            <span className="text-white/80">IPL Nexus Match Intelligence Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
