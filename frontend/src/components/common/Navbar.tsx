import React from "react";
import {
  Activity,
  Flame,
  Gauge,
  Users,
  Swords,
  Dices,
  Target,
  BotMessageSquare,
  Sparkles,
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: "home", label: "Live Center", icon: Activity },
    { id: "matches", label: "Match Explorer", icon: Flame },
    { id: "players", label: "Player DNA", icon: Users },
    { id: "matchups", label: "Matchup Duel", icon: Swords },
    { id: "simulator", label: "What-If Simulator", icon: Dices },
    { id: "strategy", label: "Strategy Lab", icon: Target },
    { id: "assistant", label: "Cricket AI", icon: BotMessageSquare },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#070B14]/90 backdrop-blur-md border-b border-nexus-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab("home")}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-nexus-cyan to-nexus-electric flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform duration-300">
                <Gauge className="w-5 h-5 text-nexus-bg font-bold" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nexus-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-nexus-cyan"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xl tracking-wider text-white">
                  IPL <span className="gradient-text-cyan">NEXUS</span>
                </span>
                <span className="bg-nexus-cyan/10 text-nexus-cyan text-[10px] font-mono px-2 py-0.5 rounded-full border border-nexus-cyan/30">
                  DECISION AI
                </span>
              </div>
              <p className="text-[10px] font-mono text-gray-400 tracking-wider">
                EXPLAINABLE T20 CRICKET PLATFORM
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive
                      ? "bg-nexus-cyan/15 text-nexus-cyan border border-nexus-cyan/40 shadow-glow"
                      : "text-gray-400 hover:text-gray-200 hover:bg-nexus-surface/80"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-nexus-cyan" : "text-gray-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Telemetry Status Indicator */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 bg-nexus-surface px-3 py-1.5 rounded-full border border-nexus-border text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-nexus-emerald animate-pulse"></span>
              <span className="text-gray-300">295K BALLS INDEXED</span>
            </div>
            <button
              onClick={() => setActiveTab("assistant")}
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs font-medium rounded-lg group bg-gradient-to-br from-nexus-cyan to-nexus-electric group-hover:from-nexus-cyan group-hover:to-nexus-electric hover:text-white text-white shadow-glow"
            >
              <span className="relative px-3 py-1.5 transition-all ease-in duration-75 bg-nexus-bg rounded-md group-hover:bg-opacity-0 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-nexus-cyan group-hover:text-white" />
                <span className="font-semibold">Ask Cricket AI</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav strip */}
      <div className="lg:hidden flex overflow-x-auto px-4 py-2 border-t border-nexus-border space-x-2 no-scrollbar bg-nexus-surface/90">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                isActive
                  ? "bg-nexus-cyan text-nexus-bg font-bold"
                  : "text-gray-400 hover:text-gray-200 bg-nexus-card"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
