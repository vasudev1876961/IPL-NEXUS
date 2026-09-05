import { useState, useRef, useEffect } from "react";
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
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Share2,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { ChatResponse } from "../types";
import { askAssistant } from "../services/api";

interface MessageItem {
  sender: "user" | "assistant";
  text: string;
  data?: ChatResponse;
  timestamp: string;
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
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [openEvidenceIdx, setOpenEvidenceIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isExported, setIsExported] = useState(false);

  // Voice Query (Speech-to-Text)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Audio Commentary (Text-to-Speech)
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputQuery(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech recognition error:", e);
      }
    }
  }

  function toggleSpeechCommentary(text: string, idx: number) {
    if (!window.speechSynthesis) return;

    if (speakingMsgIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown formatting for clean narration
    const cleanText = text
      .replace(/[#*`_~]/g, "")
      .replace(/\n+/g, ". ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMsgIdx(null);
    utterance.onerror = () => setSpeakingMsgIdx(null);

    setSpeakingMsgIdx(idx);
    window.speechSynthesis.speak(utterance);
  }

  async function handleSend(queryText?: string) {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIdx(null);
    }

    const userMsg: MessageItem = {
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

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
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "⚠️ Encountered an error communicating with the intelligence engine. Ensure the FastAPI backend is running on port 8000.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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

  function exportChatBrief() {
    const brief = messages
      .map((m) => `### ${m.sender === "user" ? "USER INQUIRY" : "CRICKET AI ANALYST"}\n${m.text}\n`)
      .join("\n---\n\n");
    navigator.clipboard.writeText(brief);
    setIsExported(true);
    setTimeout(() => setIsExported(false), 2500);
  }

  function resetChat() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMsgIdx(null);
    setMessages([
      {
        sender: "assistant",
        text: "👋 Welcome to **IPL Nexus Cricket AI Analyst**.\n\nI have continuous access to our analytical warehouse indexing **295,732 ball-by-ball deliveries** across all **1,243 IPL matches** (2008–2025).\n\nAsk me about all-time franchise records, head-to-head matchup history, tactical bowler deployments, or live match scenarios. Every answer is backed by verifiable DuckDB OLAP evidence.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }

  // Get contextual follow-up chips based on intent and query
  function getFollowUpChips(data?: ChatResponse): string[] {
    if (!data) return [];
    if (data.intent === "MATCHUP") {
      return [
        `What is the bowler's economy in the death overs?`,
        `Simulate chasing 45 from 24 balls against this bowling attack`,
        `Compare against another marquee bowler`,
      ];
    }
    if (data.intent === "STATS") {
      return [
        "Compare the top two legends head-to-head",
        "Who has the best economy rate in powerplay overs?",
        "Show most sixes in a single IPL season",
      ];
    }
    if (data.intent === "SIMULATION") {
      return [
        "What if 14 runs are scored in the next over?",
        "What happens to win odds if a wicket falls next over?",
        "Recommend the best death bowler to defend this score",
      ];
    }
    if (data.intent === "STRATEGY") {
      return [
        "Recommend optimal bowler against top order in powerplay",
        "Simulate target defense with 10.5 required run rate",
        "Show head-to-head matchup between striker and strike bowler",
      ];
    }
    return [
      "Compare V Kohli vs JJ Bumrah head-to-head",
      "Simulate 142/4 needing 46 from 30 balls",
      "Leading wicket-takers in IPL history",
    ];
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 pt-1">
      {/* Header with Telemetry & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div className="text-center sm:text-left space-y-1">
          <div className="inline-flex items-center space-x-2 bg-nexus-cyan/10 px-3 py-1 rounded-full border border-nexus-cyan/30 text-nexus-cyan text-[11px] font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EVIDENCE-GROUNDED MULTI-AGENT ARCHITECTURE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            Cricket Intelligence AI Analyst
          </h2>
          <p className="text-xs text-gray-400 font-mono">
            Deterministic Natural Language Engine backed by 295,732 DuckDB Deliveries
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={exportChatBrief}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/[0.08] text-xs font-mono transition-all"
            title="Export Entire Analytical Briefing"
          >
            {isExported ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{isExported ? "Copied Brief!" : "Export Brief"}</span>
          </button>

          <button
            onClick={resetChat}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white border border-white/[0.08] transition-all"
            title="Reset Chat Session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Curated Analytical Inquiries */}
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
      <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] min-h-[500px] max-h-[640px] overflow-y-auto space-y-6 shadow-2xl">
        {messages.map((m, i) => {
          const isUser = m.sender === "user";
          const isEvidenceOpen = openEvidenceIdx === i;
          const isSpeaking = speakingMsgIdx === i;
          const followUps = !isUser && m.data ? getFollowUpChips(m.data) : [];

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
                className={`max-w-[85%] rounded-2xl p-5 text-sm leading-relaxed space-y-3 ${
                  isUser
                    ? "bg-gradient-to-r from-nexus-cyan to-sky-400 text-nexus-bg font-semibold rounded-tr-none shadow-[0_4px_20px_rgba(0,240,255,0.25)]"
                    : "bg-[#091021] text-gray-200 border border-white/[0.08] rounded-tl-none shadow-xl"
                }`}
              >
                {/* Agent Header & Action Tools */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08] text-xs font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="bg-nexus-cyan/15 text-nexus-cyan text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-nexus-cyan/30 uppercase">
                        AGENT: {m.data?.intent || "INTEL"}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {m.data?.confidence || "100% Deterministic Proof"}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Voice Commentary Toggle */}
                      <button
                        onClick={() => toggleSpeechCommentary(m.text, i)}
                        className={`p-1.5 rounded-lg border transition-all flex items-center space-x-1 text-[10px] font-mono ${
                          isSpeaking
                            ? "bg-nexus-cyan text-nexus-bg border-nexus-cyan shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                            : "bg-white/[0.04] text-gray-400 hover:text-white border-white/[0.06]"
                        }`}
                        title={isSpeaking ? "Pause Audio Commentary" : "Play Broadcast Commentary"}
                      >
                        {isSpeaking ? (
                          <>
                            <div className="flex items-center space-x-0.5 h-3">
                              <span className="soundwave-bar"></span>
                              <span className="soundwave-bar" style={{ animationDelay: "0.2s" }}></span>
                              <span className="soundwave-bar" style={{ animationDelay: "0.4s" }}></span>
                            </div>
                            <VolumeX className="w-3.5 h-3.5 ml-1" />
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Listen</span>
                          </>
                        )}
                      </button>

                      {/* Copy Answer */}
                      <button
                        onClick={() => copyText(m.text, i)}
                        title="Copy Answer"
                        className="text-gray-400 hover:text-white transition-colors p-1"
                      >
                        {copiedIdx === i ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Structured Multi-Agent UI Visualizers */}
                {m.data?.intent === "MATCHUP" && m.data?.evidence?.batter && (
                  <div className="p-4 rounded-xl bg-[#070D1B] border border-nexus-electric/30 space-y-3 font-mono">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-xs">
                      <div className="flex items-center space-x-1.5 font-bold text-white">
                        <Swords className="w-4 h-4 text-nexus-cyan" />
                        <span>{m.data.evidence.batter} vs {m.data.evidence.bowler}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {m.data.evidence.balls} legal balls
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-white/[0.03] p-2 rounded-lg">
                        <span className="text-[10px] text-gray-400 block">RUNS</span>
                        <span className="font-bold text-nexus-cyan text-sm">{m.data.evidence.runs}</span>
                      </div>
                      <div className="bg-white/[0.03] p-2 rounded-lg">
                        <span className="text-[10px] text-gray-400 block">DISMISSALS</span>
                        <span className="font-bold text-red-400 text-sm">{m.data.evidence.dismissals}</span>
                      </div>
                      <div className="bg-white/[0.03] p-2 rounded-lg">
                        <span className="text-[10px] text-gray-400 block">STRIKE RATE</span>
                        <span className="font-bold text-nexus-gold text-sm">{m.data.evidence.strike_rate}</span>
                      </div>
                      <div className="bg-white/[0.03] p-2 rounded-lg">
                        <span className="text-[10px] text-gray-400 block">DOT %</span>
                        <span className="font-bold text-white text-sm">{m.data.evidence.dot_pct}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {m.data?.intent === "SIMULATION" && m.data?.evidence?.win_probability !== undefined && (
                  <div className="p-4 rounded-xl bg-[#070D1B] border border-nexus-cyan/30 space-y-3 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">PROJECTED WIN PROBABILITY:</span>
                      <span className="font-bold text-nexus-cyan text-base">
                        {m.data.evidence.win_probability}%
                      </span>
                    </div>
                    <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-nexus-cyan h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,240,255,0.6)]"
                        style={{ width: `${m.data.evidence.win_probability}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                      <span>Expected Score: <strong className="text-white">{m.data.evidence.expected_score}</strong></span>
                      <span>90% Range: <strong className="text-white">{m.data.evidence.confidence_interval?.[0]} - {m.data.evidence.confidence_interval?.[1]}</strong></span>
                    </div>
                  </div>
                )}

                {m.data?.intent === "STRATEGY" && m.data?.evidence?.tactical_posture && (
                  <div className="p-4 rounded-xl bg-[#070D1B] border border-nexus-gold/30 space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">TACTICAL POSTURE:</span>
                      <span className="font-bold text-nexus-gold bg-nexus-gold/15 px-2 py-0.5 rounded border border-nexus-gold/30">
                        {m.data.evidence.tactical_posture}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-300">
                      <span>Risk Profile: <strong>{m.data.evidence.risk_profile}</strong></span>
                      <span>Boundary Target: <strong className="text-nexus-cyan">{m.data.evidence.target_boundaries_per_over}/over</strong></span>
                    </div>
                  </div>
                )}

                {/* Text Body */}
                <div className="whitespace-pre-line font-normal text-[13px] leading-relaxed">
                  {m.text}
                </div>

                {/* Structured Evidence Drawer */}
                {m.data?.evidence && (
                  <div className="pt-2 border-t border-white/[0.08]">
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
                        {m.data.evidence.dataset && (
                          <div className="text-[10px] font-mono text-gray-400 flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>Dataset: {m.data.evidence.dataset} • {m.data.evidence.total_deliveries_analyzed} deliveries verified</span>
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] font-mono text-gray-500 uppercase block">
                            Raw Evidence Payload:
                          </span>
                          <pre className="text-[10px] text-gray-300 font-mono bg-black/40 p-2 rounded-lg overflow-x-auto max-h-48 mt-1 no-scrollbar">
                            {JSON.stringify(m.data.evidence, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Contextual Smart Follow-Up Chips */}
                {followUps.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block font-bold">
                      RECOMMENDED FOLLOW-UP QUESTIONS:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {followUps.map((chip, chipIdx) => (
                        <button
                          key={chipIdx}
                          onClick={() => handleSend(chip)}
                          className="text-left text-[11px] font-mono text-nexus-cyan hover:text-white bg-nexus-cyan/10 hover:bg-nexus-cyan/20 border border-nexus-cyan/25 px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1"
                        >
                          <span>{chip}</span>
                          <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-[10px] font-mono text-gray-500 text-right pt-1">
                  {m.timestamp}
                </div>
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

        <div ref={chatBottomRef} />
      </div>

      {/* Voice Listening Active Strip */}
      {isListening && (
        <div className="p-3 rounded-2xl bg-nexus-cyan/15 border border-nexus-cyan/40 flex items-center justify-between text-xs font-mono text-nexus-cyan animate-pulse">
          <div className="flex items-center space-x-2">
            <Mic className="w-4 h-4 text-nexus-cyan" />
            <span>Listening to voice query... Speak now</span>
          </div>
          <button
            onClick={toggleListening}
            className="text-[10px] bg-nexus-cyan text-nexus-bg font-bold px-2 py-0.5 rounded"
          >
            STOP
          </button>
        </div>
      )}

      {/* Input Bar with Voice Recognition */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative flex items-center space-x-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Ask anything about IPL history, player matchups, or match simulations..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={loading}
            className="w-full bg-[#080D1A] border border-white/[0.12] focus:border-nexus-cyan rounded-2xl pl-5 pr-14 py-4 text-xs text-white placeholder-gray-500 outline-none transition-colors font-mono shadow-2xl disabled:opacity-50"
          />

          {/* Microphone Voice Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
              isListening
                ? "bg-red-500 text-white animate-bounce shadow-[0_0_12px_rgba(239,68,68,0.7)]"
                : "text-gray-400 hover:text-nexus-cyan"
            }`}
            title="Speak query (Speech-to-Text)"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        {/* Submit Send Button */}
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="bg-gradient-to-r from-nexus-cyan to-sky-500 hover:from-cyan-400 hover:to-blue-500 text-nexus-bg p-4 rounded-2xl transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-30 disabled:shadow-none shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
