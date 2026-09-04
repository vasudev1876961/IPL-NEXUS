import React from "react";
import {
  Activity,
  Flame,
  Users,
  Swords,
  Dices,
  Target,
  Sparkles,
  Layers,
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
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#050811]/85 backdrop-blur-xl border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab("home")}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-nexus-cyan via-sky-500 to-nexus-electric flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)] group-hover:scale-105 transition-transform duration-300">
                <Layers className="w-5 h-5 text-nexus-bg font-extrabold" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nexus-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-nexus-cyan"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-wider text-white">
                  IPL <span className="gradient-text-cyan font-black">NEXUS</span>
                </span>
                <span className="bg-nexus-cyan/10 text-nexus-cyan text-[10px] font-mono px-2 py-0.5 rounded-full border border-nexus-cyan/30 font-semibold tracking-wider">
                  AI DECISION PLATFORM
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive
                      ? "bg-nexus-cyan text-nexus-bg font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-nexus-bg" : "text-gray-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Telemetry + AI Assistant Button */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 bg-nexus-surface/80 px-3 py-1 rounded-full border border-white/[0.08] text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-gray-300">295K BALLS • 1,243 MATCHES</span>
            </div>

            <button
              onClick={() => setActiveTab("assistant")}
              className={`relative inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
                activeTab === "assistant"
                  ? "bg-gradient-to-r from-nexus-cyan to-nexus-electric text-nexus-bg border-nexus-cyan shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                  : "bg-nexus-cyan/10 hover:bg-nexus-cyan/20 text-nexus-cyan border-nexus-cyan/30 hover:border-nexus-cyan"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cricket AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Strip (Only visible on small devices) */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-white/[0.06] space-x-2 no-scrollbar bg-[#050811]/95">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-nexus-cyan text-nexus-bg font-bold"
                  : "text-gray-400 hover:text-white bg-white/[0.04]"
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
