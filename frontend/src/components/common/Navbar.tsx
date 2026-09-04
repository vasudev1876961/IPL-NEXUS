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
import { motion } from "framer-motion";

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
    <header className="sticky top-0 z-50 bg-[#040711]/90 backdrop-blur-2xl border-b border-white/[0.08] transition-all shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab("home")}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-nexus-cyan via-sky-500 to-nexus-electric flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.45)] group-hover:scale-105 transition-transform duration-300">
                <Layers className="w-5 h-5 text-nexus-bg font-extrabold" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nexus-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-nexus-cyan"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-xl tracking-wider text-white">
                  IPL <span className="gradient-text-cyan font-black">NEXUS</span>
                </span>
                <span className="hidden sm:inline-block bg-nexus-cyan/10 text-nexus-cyan text-[9px] font-mono px-2 py-0.5 rounded-full border border-nexus-cyan/30 font-bold tracking-wider">
                  AI DECISION ENGINE
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs with Framer Motion Sliding Pill */}
          <nav className="hidden md:flex items-center space-x-1 bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.06] relative">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-colors duration-200 z-10 ${
                    isActive ? "text-nexus-bg font-black" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute inset-0 bg-gradient-to-r from-nexus-cyan to-sky-400 rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.4)] -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-nexus-bg" : "text-gray-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Telemetry + AI Assistant Button */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 bg-[#080D1A] px-3.5 py-1.5 rounded-full border border-white/[0.08] text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]"></span>
              <span className="text-gray-300 font-semibold">295K BALLS • 1,243 MATCHES</span>
            </div>

            <button
              onClick={() => setActiveTab("assistant")}
              className={`relative inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 border ${
                activeTab === "assistant"
                  ? "bg-gradient-to-r from-nexus-cyan to-nexus-electric text-nexus-bg border-nexus-cyan shadow-[0_0_20px_rgba(0,240,255,0.5)]"
                  : "bg-nexus-cyan/10 hover:bg-nexus-cyan/20 text-nexus-cyan border-nexus-cyan/30 hover:border-nexus-cyan"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cricket AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Strip */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-white/[0.06] space-x-2 no-scrollbar bg-[#040711]/95">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-nexus-cyan text-nexus-bg font-extrabold shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                  : "text-gray-400 hover:text-white bg-white/[0.04]"
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
