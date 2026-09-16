import React from "react";
import {
  Activity,
  Flame,
  Users,
  Swords,
  Dices,
  Target,
  Sparkles,
  Trophy,
  Landmark,
} from "lucide-react";
import { motion } from "framer-motion";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: "home", label: "MATCH CENTRE", icon: Activity },
    { id: "matches", label: "FIXTURES & RESULTS", icon: Flame },
    { id: "players", label: "PLAYER DNA", icon: Users },
    { id: "matchups", label: "HEAD-TO-HEAD", icon: Swords },
    { id: "venues", label: "STADIUM MATRIX", icon: Landmark },
    { id: "simulator", label: "WHAT-IF SIMULATOR", icon: Dices },
    { id: "strategy", label: "STRATEGY LAB", icon: Target },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#031453]/95 backdrop-blur-2xl border-b border-white/[0.12] transition-all shadow-[0_4px_24px_rgba(3,20,83,0.6)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo - Official IPL Aesthetic */}
          <div
            onClick={() => setActiveTab("home")}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#19398a] via-[#132e73] to-[#ef4123] p-[2px] shadow-[0_0_18px_rgba(51,163,220,0.4)] group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-[#031453] rounded-[10px] flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#ffcb05]" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ef4123] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ef4123]"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-expressive text-xl tracking-wider text-white uppercase">
                  IPL <span className="text-[#33a3dc]">NEXUS</span>
                </span>
                <span className="hidden sm:inline-block bg-[#ef4123]/15 text-[#ef4123] text-[10px] font-sans px-2.5 py-0.5 rounded-full border border-[#ef4123]/35 font-extrabold tracking-widest uppercase">
                  MATCH CENTRE
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs with Official IPL Sindoor Underline */}
          <nav className="hidden md:flex items-center space-x-1 font-sans">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-xs font-extrabold tracking-wider uppercase transition-all duration-200 z-10 ${
                    isActive
                      ? "text-white"
                      : "text-white/65 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#33a3dc]" : "text-white/50"}`} />
                  <span>{item.label}</span>

                  {isActive && (
                    <motion.div
                      layoutId="iplActiveUnderline"
                      className="absolute bottom-0 inset-x-2 h-[3px] bg-[#ef4123] rounded-full shadow-[0_0_10px_rgba(239,65,35,0.85)]"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action: Telemetry + AI Assistant Button */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 bg-[#061645]/80 px-3.5 py-1.5 rounded-full border border-white/[0.1] text-[11px] font-sans">
              <span className="w-2 h-2 rounded-full bg-[#00b49d] animate-pulse shadow-[0_0_8px_#00b49d]"></span>
              <span className="text-white/80 font-bold tracking-wider uppercase">295K BALLS • 10 TEAMS</span>
            </div>

            <button
              onClick={() => setActiveTab("assistant")}
              className={`relative inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 border ${
                activeTab === "assistant"
                  ? "bg-gradient-to-r from-[#ef4123] to-[#ff7d19] text-white border-[#ef4123] shadow-[0_0_20px_rgba(239,65,35,0.6)]"
                  : "bg-white/[0.06] hover:bg-[#ef4123]/20 text-white border-white/[0.15] hover:border-[#ef4123]/50"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ffcb05]" />
              <span>Cricket AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Strip */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-white/[0.08] space-x-2 no-scrollbar bg-[#031453]/98">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all uppercase tracking-wider ${
                isActive
                  ? "bg-[#19398a] text-white border-b-2 border-[#ef4123] shadow-[0_0_12px_rgba(25,57,138,0.5)]"
                  : "text-white/60 hover:text-white bg-white/[0.04]"
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

