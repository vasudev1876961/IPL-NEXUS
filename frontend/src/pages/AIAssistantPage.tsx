import { useState } from "react";
import {
  Sparkles,
  Send,
  CheckCircle2,
} from "lucide-react";
import { ChatResponse } from "../types";
import { askAssistant } from "../services/api";

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<
    Array<{ sender: "user" | "assistant"; text: string; data?: ChatResponse }>
  >([
    {
      sender: "assistant",
      text: "👋 Welcome to **IPL Nexus AI Analyst**. Ask any complex analytical query regarding IPL matches, player matchups, what-if scenarios, or tactical strategies. All answers are grounded in 295,732 ball-by-ball deliveries with verifiable SQL proof.",
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 bg-nexus-cyan/10 px-3 py-1 rounded-full border border-nexus-cyan/30 text-nexus-cyan text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>EVIDENCE-GROUNDED MULTI-AGENT ARCHITECTURE</span>
        </div>
        <h2 className="text-3xl font-black text-white tracking-wide">
          Cricket Intelligence AI Assistant
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
            className="text-xs font-mono bg-nexus-surface hover:bg-nexus-card text-gray-300 px-3 py-1.5 rounded-lg border border-nexus-border whitespace-nowrap transition-all hover:border-nexus-cyan/40"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="glass-panel rounded-3xl p-6 border border-nexus-border min-h-[480px] max-h-[580px] overflow-y-auto space-y-4">
        {messages.map((m, i) => {
          const isUser = m.sender === "user";
          return (
            <div
              key={i}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                  isUser
                    ? "bg-nexus-cyan text-nexus-bg font-semibold rounded-br-none"
                    : "bg-nexus-surface/90 text-gray-200 border border-nexus-border rounded-bl-none shadow-lg"
                }`}
              >
                {/* Intent Badge if available */}
                {m.data && (
                  <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-nexus-border/60">
                    <span className="bg-nexus-cyan/15 text-nexus-cyan text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-nexus-cyan/30">
                      AGENT: {m.data.intent}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {m.data.confidence}
                    </span>
                  </div>
                )}

                {/* Markdown-style formatted text */}
                <div className="whitespace-pre-line leading-relaxed">
                  {m.text}
                </div>

                {/* Evidence Card if provided */}
                {m.data?.evidence && (
                  <div className="mt-3 pt-2 border-t border-nexus-border/60 text-xs font-mono bg-nexus-card/60 p-2.5 rounded-lg border border-nexus-border/40">
                    <div className="flex items-center space-x-1.5 text-nexus-emerald mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="font-bold text-[11px]">VERIFIABLE DATABASE EVIDENCE</span>
                    </div>
                    <pre className="text-[10px] text-gray-400 overflow-x-auto">
                      {JSON.stringify(m.data.evidence, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-nexus-surface rounded-2xl p-4 border border-nexus-border flex items-center space-x-2 text-xs font-mono text-nexus-cyan">
              <div className="w-4 h-4 border-2 border-nexus-cyan border-t-transparent rounded-full animate-spin"></div>
              <span>Querying DuckDB Warehouse & Computing Probabilities...</span>
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
          className="w-full bg-nexus-surface border border-nexus-border rounded-2xl pl-5 pr-14 py-3.5 text-sm text-white placeholder-gray-500 focus:border-nexus-cyan outline-none font-mono"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputQuery.trim() || loading}
          className="absolute right-2 p-2.5 rounded-xl bg-nexus-cyan text-nexus-bg hover:opacity-90 transition-opacity disabled:opacity-40 shadow-glow"
        >
          <Send className="w-4 h-4 font-bold" />
        </button>
      </div>
    </div>
  );
};
