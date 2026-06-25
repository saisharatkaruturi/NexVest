import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Send, TrendingUp, Brain, Mic, BarChart3, Loader2, Volume2, Bot, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { useMarket, lookupQuote } from "@/lib/market-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/ai")({
  component: AI,
});

type ChatMsg = { role: "ai" | "user"; text: string; ts: number };

const PROMPTS = [
  "Analyze my portfolio",
  "Best SIP for 10 years",
  "Should I buy Reliance?",
  "Tax optimization tips",
  "Crypto outlook",
  "Top 3 momentum stocks",
  "Diversification check",
  "Rebalance my portfolio",
];

function AI() {
  const { state, quote: qFn, baseAsset, holdings } = useMarket();
  const quote = (s: string) => lookupQuote(state, s);

  const [conv, setConv] = useState<ChatMsg[]>([
    { role: "ai", text: "Hi 👋 I'm your NexVest AI copilot. I can analyze your portfolio, generate trade ideas, and explain market moves. Ask me anything.", ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conv, thinking]);

  // Top signals from live store
  const topSignals = useMemo(() => {
    const syms = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC", "BTC", "ETH", "SOL"];
    return syms
      .map((s) => {
        const live = quote(s);
        if (!live) return null;
        const c = live.changePct;
        let action: "BUY" | "ACCUMULATE" | "HOLD" | "SELL" | "WATCH" = "HOLD";
        let conf = 50;
        if (c > 1.5) { action = "BUY"; conf = Math.min(92, 60 + c * 8); }
        else if (c > 0.3) { action = "ACCUMULATE"; conf = Math.min(85, 55 + c * 6); }
        else if (c < -1.5) { action = "SELL"; conf = Math.min(92, 60 + Math.abs(c) * 8); }
        else if (c < -0.3) { action = "WATCH"; conf = Math.min(75, 50 + Math.abs(c) * 5); }
        else { action = "HOLD"; conf = 65; }
        return { symbol: s, action, confidence: Math.round(conf), price: live.price, changePct: c };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }, [state.live]);

  // Portfolio score
  const myHoldings = holdings();
  const portfolioScore = useMemo(() => {
    if (myHoldings.length === 0) return 0;
    const avgChange = myHoldings.reduce((s, h) => s + h.changePct, 0) / myHoldings.length;
    const diversity = Math.min(100, myHoldings.length * 12);
    const gain = Math.max(0, 50 + avgChange * 8);
    return Math.round((diversity * 0.4 + gain * 0.4 + 70 * 0.2));
  }, [myHoldings]);

  // Market sentiment
  const allQuotes = Object.values(state.live);
  const bullishPct = allQuotes.length === 0 ? 50 : Math.round((allQuotes.filter((q) => q.changePct >= 0).length / allQuotes.length) * 100);

  const metrics = [
    { l: "Diversification", v: Math.min(100, myHoldings.length * 14) },
    { l: "Risk-Adjusted Returns", v: Math.max(40, Math.min(95, 60 + portfolioScore / 4)) },
    { l: "Cost Efficiency", v: 92 },
    { l: "Tax Efficiency", v: 76 },
  ];

  function generateAIResponse(prompt: string): string {
    const p = prompt.toLowerCase();
    const mySips = state.sips;
    const myF = state.fundHoldings;
    const myG = state.goldHolding;
    const myH = myHoldings;
    const syms = myH.map((h) => h.symbol).join(", ");

    if (p.includes("portfolio") || p.includes("analyze") || p.includes("review")) {
      if (myH.length === 0) return "Your portfolio is empty. Start by buying a stock like RELIANCE or TCS, or kick off a SIP in a Nifty 50 index fund from the Markets page.";
      const total = myH.reduce((s, h) => s + h.current, 0);
      const inv = myH.reduce((s, h) => s + h.invested, 0);
      const pnl = total - inv;
      const top = [...myH].sort((a, b) => b.current - a.current)[0];
      return `You have ${myH.length} holdings (${syms}) worth ₹${total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}. P&L: ${pnl >= 0 ? "+" : ""}₹${pnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}. Your biggest position is ${top.symbol} at ₹${top.current.toLocaleString("en-IN", { maximumFractionDigits: 0 })}. Diversification score ${Math.min(100, myH.length * 14)}/100. ${myH.length < 5 ? "Consider adding more positions across sectors." : "Healthy diversification."}`;
    }
    if (p.includes("sip") || p.includes("10 year")) {
      return "For a 10-year horizon with moderate risk, I recommend a Nifty 50 index fund SIP of ₹5,000-₹10,000/month with 10% annual step-up. Expected corpus: ₹12-25L. Use the SIP calculator on the Funds page.";
    }
    if (p.includes("reliance") || p.includes("buy")) {
      const l = quote("RELIANCE");
      if (!l) return "I can't see RELIANCE right now. Try again in a moment.";
      return `RELIANCE is at ₹${l.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })} (${l.changePct >= 0 ? "+" : ""}${l.changePct.toFixed(2)}% today). Short-term momentum is ${l.changePct > 0 ? "positive" : "negative"}. For long-term, consider accumulating on dips. Set a target of ₹${(l.price * 1.08).toFixed(0)} and stop-loss at ₹${(l.price * 0.95).toFixed(0)}.`;
    }
    if (p.includes("tax")) {
      return "1) Use ELSS funds (3Y lock-in) for ₹1.5L 80C deduction. 2) Hold equity >1Y for LTCG exemption up to ₹1.25L. 3) Harvest losses to offset gains before March 31. 4) Don't forget STT paid on equity is deductible.";
    }
    if (p.includes("crypto") || p.includes("btc") || p.includes("eth")) {
      const b = quote("BTC"); const e = quote("ETH");
      return `BTC ${b ? "at $" + b.price.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "—"}, ETH ${e ? "$" + e.price.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "—"}. Allocation: 5-10% of net worth max. Use SIPs in BTC to dollar-cost-average. Always keep keys off exchanges.`;
    }
    if (p.includes("rebalance") || p.includes("diversif")) {
      return "Suggested rebalance: 60% equity (large-cap index + 2-3 sectoral), 15% debt (liquid + gilt), 10% gold, 5% crypto, 10% international. Use the Analytics page for your current drift.";
    }
    if (p.includes("momentum") || p.includes("top")) {
      const top = topSignals.slice(0, 3).map((s) => `${s.symbol} (${s.action} ${s.confidence}%)`).join(", ");
      return `Top 3 momentum names right now: ${top}. Always use limit orders and respect stop-losses.`;
    }
    return `Got it. Let me think about "${prompt}". Based on current market: NIFTY is ${quote("NIFTY 50") ? "trading sideways" : "—"}. Top signal: ${topSignals[0]?.symbol ?? "—"} with ${topSignals[0]?.action ?? "—"} (${topSignals[0]?.confidence ?? 0}% confidence). Want a deeper analysis on a specific symbol?`;
  }

  const send = (text: string) => {
    if (!text.trim() || thinking) return;
    const userMsg: ChatMsg = { role: "user", text: text.trim(), ts: Date.now() };
    setConv((c) => [...c, userMsg]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      const response = generateAIResponse(userMsg.text);
      setConv((c) => [...c, { role: "ai", text: response, ts: Date.now() }]);
      setThinking(false);
    }, 900);
  };

  const handleMic = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      toast.info("Voice input not supported in this browser. Type your question instead.");
      return;
    }
    const r = new SR();
    r.lang = "en-IN";
    r.continuous = false;
    r.interimResults = false;
    setListening(true);
    r.onresult = (e: any) => {
      const txt = e.results[0][0].transcript;
      setInput(txt);
      toast.success("Voice captured", { description: txt });
    };
    r.onerror = () => { setListening(false); toast.error("Could not capture audio"); };
    r.onend = () => setListening(false);
    try { r.start(); } catch { setListening(false); }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto grid lg:grid-cols-[1fr_320px] gap-5 h-[calc(100vh-5rem)]">
      <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-crypto to-info flex items-center justify-center shadow-glow"><Sparkles className="w-5 h-5 text-white" /></div>
            <div>
              <div className="font-bold flex items-center gap-2">NexVest AI Copilot <span className="text-[10px] px-1.5 py-0.5 rounded bg-profit/15 text-profit font-semibold">v3.0</span></div>
              <div className="text-xs text-muted-foreground">Real-time Analysis · Live Data</div>
            </div>
          </div>
          <button onClick={() => { setConv([{ role: "ai", text: "Conversation cleared. How can I help you today?", ts: Date.now() }]); toast.info("Chat reset"); }} className="text-xs px-3 py-1.5 rounded-md bg-surface border border-border hover:border-primary/40">Clear</button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {conv.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "ai" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-crypto to-info flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-surface border border-border")}>
                {m.text}
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-1">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
          {thinking && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-crypto to-info flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-surface border border-border rounded-2xl px-4 py-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border">
          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
            {PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full bg-surface border border-border hover:border-primary/40 transition"
              >{p}</button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleMic}
              className={cn("w-11 h-11 rounded-xl border flex items-center justify-center transition", listening ? "bg-loss text-white border-loss" : "bg-surface border-border hover:border-primary/40")}
            >
              {listening ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
            </button>
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder={listening ? "Listening..." : "Ask anything about your investments…"}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-sm resize-none focus:outline-none focus:border-primary/60"
              />
            </div>
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || thinking}
              className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-40"
            >
              {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 overflow-y-auto">
        <div className="bg-gradient-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3"><Brain className="w-4 h-4 text-crypto" /><span className="font-semibold">AI Portfolio Score</span></div>
          <div className="text-center my-3">
            <div className="text-5xl font-bold">{portfolioScore}<span className="text-xl text-muted-foreground">/100</span></div>
            <div className="text-xs text-profit font-semibold mt-1">{myHoldings.length === 0 ? "No holdings yet" : "Based on live data"}</div>
          </div>
          <div className="space-y-2 text-xs">
            {metrics.map((m) => (
              <div key={m.l}>
                <div className="flex justify-between mb-1"><span className="text-muted-foreground">{m.l}</span><span className="font-semibold">{m.v}</span></div>
                <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-gradient-profit" style={{ width: `${m.v}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-profit" /><span className="font-semibold">Live Signals</span></div>
          <div className="space-y-2">
            {topSignals.map((r) => (
              <div key={r.symbol} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                <span className="font-semibold">{r.symbol}</span>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold",
                    r.action === "BUY" || r.action === "ACCUMULATE" ? "bg-profit/15 text-profit" :
                    r.action === "SELL" ? "bg-loss/15 text-loss" :
                    "bg-info/15 text-info"
                  )}>{r.action}</span>
                  <span className="text-xs text-profit font-bold w-8 text-right">{r.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3"><BarChart3 className="w-4 h-4 text-info" /><span className="font-semibold">Market Sentiment</span></div>
          <div className="text-center my-3">
            <div className="text-3xl font-bold text-profit">{bullishPct}<span className="text-base text-muted-foreground">% bullish</span></div>
            <div className="text-xs text-muted-foreground">Live · updates with market</div>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-loss via-gold to-profit" />
            <div className="absolute top-0 bottom-0 w-1 bg-foreground rounded" style={{ left: `${bullishPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
            <span>Bearish</span>
            <span>Neutral</span>
            <span>Bullish</span>
          </div>
        </div>
      </div>
    </div>
  );
}
