import { useState } from "react";
import { Navbar } from "./components/common/Navbar";
import { HomeDashboard } from "./pages/HomeDashboard";
import { MatchCenter } from "./pages/MatchCenter";
import { PlayerLab } from "./pages/PlayerLab";
import { MatchupExplorer } from "./pages/MatchupExplorer";
import { StrategySimulator } from "./pages/StrategySimulator";
import { AIAssistantPage } from "./pages/AIAssistantPage";
import { Database, Cpu } from "lucide-react";

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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
        {activeTab === "simulator" && <StrategySimulator initialSubTab="simulator" />}
        {activeTab === "strategy" && <StrategySimulator initialSubTab="strategy" />}
        {activeTab === "assistant" && <AIAssistantPage />}
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
