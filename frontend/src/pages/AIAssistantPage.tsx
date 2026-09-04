import { useState } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Terminal,
  ChevronDown,
  ChevronUp,
  Flame,
  Swords,
  Dices,
  Copy,
  Check,
} from "lucide-react";
import { ChatResponse } from "../types";
import { askAssistant } from "../services/api";

interface MessageItem {
  sender: "user" | "assistant";
  text: string;
  data?: ChatResponse;
}

const PROMPT_CATEGORIES = [
  {
    category: "IPL All-Time Records",
    icon: Flame,
    color: "text-nexus-cyan",
    prompts: [
      "Who has hit the most sixes in IPL history?",
      "Who are the leading wicket-takers in IPL history?",
      "Show highest strike rate batters with over 1,000 runs",
    ],
  },
  {
    category: "Player Head-to-Head",
    icon: Swords,
    color: "text-nexus-electric",
    prompts: [
      "Compare V Kohli vs JJ Bumrah head-to-head",
      "How does MS Dhoni perform against Rashid Khan?",
      "Show RG Sharma record against TA Boult",
    ],
  },
  {
    category: "Tactics & Simulation",
    icon: Dices,
    color: "text-nexus-gold",
    prompts: [
      "Simulate 142/4 needing 46 from 30 balls",
      "What is the optimal batting posture at 11.2 RRR?",
      "Who should bowl in the death overs against V Kohli?",
    ],
  },
];

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      sender: "assistant",
      text: "👋 Welcome to **IPL Nexus Cricket AI Analyst**.\n\nI have continuous access to our analytical warehouse indexing **295,732 ball-by-ball deliveries** across all **1,243 IPL matches** (2008–2025).\n\nAsk me about all-time franchise records, head-to-head matchup history, tactical bowler deployments, or live match scenarios. Every answer is backed by verifiable DuckDB OLAP evidence.",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [openEvidenceIdx, setOpenEvidenceIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function handleSend(queryText?: string) {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    const userMsg: MessageItem = { sender: "user", text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await askAssistant(q);
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: res.answer,
          data: res,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "⚠️ Encountered an error communicating with the intelligence engine. Ensure the FastAPI backend is running on port 8000.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 pt-1">
      {/* Header */}
      <div className="text-center space-y-2 pb-2">
        <div className="inline-flex items-center space-x-2 bg-nexus-cyan/10 px-4 py-1.5 rounded-full border border-nexus-cyan/30 text-nexus-cyan text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>EVIDENCE-GROUNDED MULTI-AGENT ARCHITECTURE</span>
        </div>
        <h2 className="text-3xl font-black text-white tracking-wide">
          Cricket Intelligence AI Analyst
        </h2>
        <p className="text-xs text-gray-400 font-mono">
          Natural Language Engine grounded on 295,732 DuckDB Ball-by-Ball Records
        </p>
      </div>

      {/* Grouped Suggestion Prompts */}
      <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] space-y-3">
        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold block">
          CURATED ANALYTICAL INQUIRIES
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PROMPT_CATEGORIES.map((cat, catIdx) => {
            const Icon = cat.icon;
            return (
              <div key={catIdx} className="bg-[#080D1A] rounded-xl p-3 border border-white/[0.05] space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-white">
                  <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                  <span>{cat.category}</span>
                </div>
                <div className="space-y-1.5">
                  {cat.prompts.map((p, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSend(p)}
                      className="w-full text-left text-[11px] font-mono text-gray-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] p-2 rounded-lg border border-white/[0.04] transition-all line-clamp-2"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] min-h-[500px] max-h-[640px] overflow-y-auto space-y-5 shadow-2xl">
        {messages.map((m, i) => {
          const isUser = m.sender === "user";
          const isEvidenceOpen = openEvidenceIdx === i;

          return (
            <div
              key={i}
              className={`flex items-start space-x-3 ${isUser ? "flex-row-reverse space-x-reverse" : "flex-row"}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  isUser
                    ? "bg-nexus-cyan text-nexus-bg font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                    : "bg-[#0A1325] text-nexus-cyan border border-white/[0.1]"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-5 text-sm leading-relaxed ${
                  isUser
                    ? "bg-gradient-to-r from-nexus-cyan to-sky-400 text-nexus-bg font-semibold rounded-tr-none shadow-[0_4px_20px_rgba(0,240,255,0.25)]"
                    : "bg-[#091021] text-gray-200 border border-white/[0.08] rounded-tl-none shadow-xl"
                }`}
              >
                {/* Intent Badge */}
                {m.data && (
                  <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/[0.08]">
                    <div className="flex items-center space-x-2">
                      <span className="bg-nexus-cyan/15 text-nexus-cyan text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-nexus-cyan/30 uppercase">
                        AGENT: {m.data.intent}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {m.data.confidence}
                      </span>
                    </div>

                    <button
                      onClick={() => copyText(m.text, i)}
                      title="Copy Answer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {copiedIdx === i ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                {/* Body text with markdown-style linebreaks */}
                <div className="whitespace-pre-line font-normal text-[13px] leading-relaxed">
                  {m.text}
                </div>

                {/* Structured Evidence Drawer */}
                {m.data?.evidence && (
                  <div className="mt-4 pt-3 border-t border-white/[0.08]">
                    <button
                      onClick={() => setOpenEvidenceIdx(isEvidenceOpen ? null : i)}
                      className="flex items-center justify-between w-full text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors bg-[#060B17] px-3 py-2 rounded-xl border border-white/[0.06]"
                    >
                      <div className="flex items-center space-x-2">
                        <Terminal className="w-3.5 h-3.5" />
                        <span className="font-bold">VERIFIED DUCKDB OLAP EVIDENCE</span>
                      </div>
                      {isEvidenceOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isEvidenceOpen && (
                      <div className="mt-2 bg-[#040813] p-3 rounded-xl border border-white/[0.06] space-y-2">
                        {m.data.evidence.sql && (
                          <div>
                            <span className="text-[10px] font-mono text-gray-500 uppercase block">
                              Executed Analytical SQL:
                            </span>
                            <pre className="text-[11px] text-nexus-cyan font-mono bg-black/40 p-2 rounded-lg overflow-x-auto mt-1 no-scrollbar">
                              {m.data.evidence.sql}
                            </pre>
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] font-mono text-gray-500 uppercase block">
                            Raw Records Output:
                          </span>
                          <pre className="text-[10px] text-gray-300 font-mono bg-black/40 p-2 rounded-lg overflow-x-auto max-h-48 mt-1 no-scrollbar">
                            {JSON.stringify(m.data.evidence.result || m.data.evidence, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#0A1325] text-nexus-cyan border border-white/[0.1] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-[#091021] text-gray-400 border border-white/[0.08] rounded-2xl rounded-tl-none p-4 text-xs font-mono flex items-center space-x-3 shadow-xl">
              <div className="w-2 h-2 rounded-full bg-nexus-cyan animate-ping"></div>
              <span>Querying DuckDB analytical warehouse across 295,732 deliveries...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative flex items-center"
      >
        <input
          type="text"
          placeholder="Ask anything about IPL history, player matchups, or match simulations..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          disabled={loading}
          className="w-full bg-[#080D1A] border border-white/[0.12] focus:border-nexus-cyan rounded-2xl pl-5 pr-14 py-4 text-xs text-white placeholder-gray-500 outline-none transition-colors font-mono shadow-2xl disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="absolute right-2.5 bg-gradient-to-r from-nexus-cyan to-sky-500 hover:from-cyan-400 hover:to-blue-500 text-nexus-bg p-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-30 disabled:shadow-none"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
