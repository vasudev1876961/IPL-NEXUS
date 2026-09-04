import { useState } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Terminal,
} from "lucide-react";
import { ChatResponse } from "../types";
import { askAssistant } from "../services/api";

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<
    Array<{ sender: "user" | "assistant"; text: string; data?: ChatResponse }>
  >([
    {
      sender: "assistant",
      text: "👋 Welcome to **IPL Nexus Cricket AI Analyst**. I have real-time access to our DuckDB analytical warehouse containing **295,732 ball-by-ball deliveries** across all **1,243 IPL matches** (2008–2025).\n\nAsk me factual statistics, player head-to-head match-ups, live win probability scenarios, or tactical bowling advice. All claims are backed by verifiable database evidence.",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestions = [
    "Who has hit the most sixes in IPL history?",
    "Compare V Kohli vs JJ Bumrah head-to-head",
    "Simulate 142/4 needing 46 from 30 balls",
    "What is the optimal batting posture at 11.2 RRR?",
    "Who are the leading wicket-takers in IPL history?",
    "Show highest strike rate batters with over 1,000 runs",
  ];

  async function handleSend(queryText?: string) {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    const userMsg = { sender: "user" as const, text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await askAssistant(q);
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant" as const,
          text: res.answer,
          data: res,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant" as const,
          text: "⚠️ Encountered an error communicating with the intelligence engine. Ensure backend is active.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 pt-2">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 bg-nexus-cyan/10 px-3.5 py-1 rounded-full border border-nexus-cyan/30 text-nexus-cyan text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>EVIDENCE-GROUNDED MULTI-AGENT ARCHITECTURE</span>
        </div>
        <h2 className="text-3xl font-black text-white tracking-wide">
          Cricket Intelligence AI Analyst
        </h2>
        <p className="text-xs text-gray-400 font-mono">
          Natural Language Engine powered by DuckDB OLAP & Calibrated ML Models
        </p>
      </div>

      {/* Suggestion Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            className="text-xs font-mono bg-white/[0.03] hover:bg-white/[0.08] text-gray-300 px-3.5 py-2 rounded-xl border border-white/[0.08] whitespace-nowrap transition-all hover:border-nexus-cyan/40 hover:text-white"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chat Messages Box */}
      <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] min-h-[500px] max-h-[600px] overflow-y-auto space-y-5 shadow-2xl">
        {messages.map((m, i) => {
          const isUser = m.sender === "user";
          return (
            <div
              key={i}
              className={`flex items-start space-x-3 ${isUser ? "flex-row-reverse space-x-reverse" : "flex-row"}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? "bg-nexus-cyan text-nexus-bg font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                    : "bg-white/[0.06] text-nexus-cyan border border-white/[0.1]"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[82%] rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? "bg-gradient-to-r from-nexus-cyan to-sky-400 text-nexus-bg font-semibold rounded-tr-none shadow-[0_4px_20px_rgba(0,240,255,0.25)]"
                    : "bg-[#0C1527] text-gray-200 border border-white/[0.08] rounded-tl-none shadow-xl"
                }`}
              >
                {/* Intent Badge */}
                {m.data && (
                  <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-white/[0.08]">
                    <span className="bg-nexus-cyan/15 text-nexus-cyan text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-nexus-cyan/30 uppercase">
                      AGENT: {m.data.intent}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {m.data.confidence}
                    </span>
                  </div>
                )}

                {/* Body text with markdown-style linebreaks */}
                <div className="whitespace-pre-line font-normal">
                  {m.text}
                </div>

                {/* Evidence Drawer */}
                {m.data?.evidence && (
                  <div className="mt-3.5 pt-3 border-t border-white/[0.08] bg-[#070B14]/80 p-3 rounded-xl border border-white/[0.06]">
                    <div className="flex items-center space-x-2 text-emerald-400 mb-1.5 font-mono text-[11px] font-bold">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>VERIFIED DUCKDB OLAP EVIDENCE (295K BALLS)</span>
                    </div>
                    <pre className="text-[10px] text-gray-400 overflow-x-auto font-mono max-h-36 no-scrollbar">
                      {JSON.stringify(m.data.evidence, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.06] text-nexus-cyan border border-white/[0.1] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-[#0C1527] rounded-2xl p-4 border border-white/[0.08] flex items-center space-x-3 text-xs font-mono text-nexus-cyan">
              <div className="w-4 h-4 border-2 border-nexus-cyan border-t-transparent rounded-full animate-spin"></div>
              <span>Querying analytical warehouse & compiling proof...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask anything (e.g. 'Compare Kohli vs Bumrah in death overs')..."
          className="w-full bg-[#0C1527] border border-white/[0.1] rounded-2xl pl-5 pr-14 py-4 text-sm text-white placeholder-gray-500 focus:border-nexus-cyan outline-none font-mono transition-colors shadow-2xl"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputQuery.trim() || loading}
          className="absolute right-2.5 p-2.5 rounded-xl bg-nexus-cyan text-nexus-bg hover:opacity-90 transition-opacity disabled:opacity-30 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
        >
          <Send className="w-4 h-4 font-bold" />
        </button>
      </div>
    </div>
  );
};
