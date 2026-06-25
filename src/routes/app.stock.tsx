import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMarket } from "@/lib/market-store";
import { allAssets } from "@/lib/mock-data";
import { Sparkline } from "@/components/sparkline";
import { OrderTicket } from "@/components/order-ticket";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Star, TrendingUp, TrendingDown, Activity, BarChart3, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DetailSearch = { symbol?: string };

export const Route = createFileRoute("/app/stock")({
  validateSearch: (search: Record<string, unknown>): DetailSearch => ({
    symbol: typeof search.symbol === "string" ? search.symbol : undefined,
  }),
  component: StockDetail,
});

function genCandles(seed: number, n = 80, start = 2400): { o: number; h: number; l: number; c: number }[] {
  let p = start;
  const out: { o: number; h: number; l: number; c: number }[] = [];
  for (let i = 0; i < n; i++) {
    const o = p;
    const drift = Math.sin(i * 0.3 + seed) * 35 + (Math.random() - 0.5) * 50;
    const c = o + drift;
    const h = Math.max(o, c) + Math.random() * 25;
    const l = Math.min(o, c) - Math.random() * 25;
    out.push({ o, h, l, c });
    p = c;
  }
  return out;
}

function CandleSvg({ candles }: { candles: { o: number; h: number; l: number; c: number }[] }) {
  const W = 800, H = 360, padL = 8, padR = 56, padT = 12, padB = 28;
  const cw = (W - padL - padR) / candles.length;
  const min = Math.min(...candles.map((c) => c.l));
  const max = Math.max(...candles.map((c) => c.h));
  const range = max - min || 1;
  const y = (v: number) => padT + ((max - v) / range) * (H - padT - padB);
  const last = candles[candles.length - 1].c;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {Array.from({ length: 6 }).map((_, i) => {
        const v = min + (range * i) / 5;
        const yy = y(v);
        return (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={yy} y2={yy} stroke="hsl(var(--border))" strokeDasharray="2 4" opacity="0.4" />
            <text x={W - padR + 6} y={yy + 3} fontSize="10" fill="hsl(var(--muted-foreground))">{v.toFixed(2)}</text>
          </g>
        );
      })}
      <line x1={padL} x2={W - padR} y1={y(last)} y2={y(last)} stroke="hsl(var(--primary))" strokeDasharray="3 3" opacity="0.7" />
      {candles.map((c, i) => {
        const x = padL + i * cw + cw / 2;
        const up = c.c >= c.o;
        const col = up ? "var(--profit)" : "var(--loss)";
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} stroke={col} strokeWidth="1" />
            <rect x={x - cw * 0.35} y={y(Math.max(c.o, c.c))} width={cw * 0.7} height={Math.max(1, Math.abs(y(c.o) - y(c.c)))} fill={col} />
          </g>
        );
      })}
    </svg>
  );
}

function StockDetail() {
  const search = useSearch({ from: "/app/stock" });
  const navigate = useNavigate();
  const { quote, baseAsset, state, addToWatchlist, removeFromWatchlist } = useMarket();
  const symbol = search.symbol ?? "RELIANCE";
  const live = quote(symbol);
  const base = baseAsset(symbol);
  const [orderOpen, setOrderOpen] = useState<{ kind: "BUY" | "SELL" } | null>(null);
  const [tf, setTf] = useState("1D");

  const candles = useMemo(() => genCandles(symbol.length, 80, (live?.price ?? base?.price ?? 100) * 0.96), [symbol, live?.price]);
  const inWatchlist = state.watchlists.some((w) => w.symbols.includes(symbol));

  if (!base || !live) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate({ to: "/app" })}><ArrowLeft className="w-4 h-4" /> Back</Button>
        <div className="mt-6 text-center text-muted-foreground">Symbol "{symbol}" not found.</div>
      </div>
    );
  }

  const isCrypto = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "MATIC", "LINK", "DOT", "TRX", "SHIB", "LTC"].includes(symbol);
  const isGold = symbol === "GOLD";
  const symbol_ = isCrypto ? "$" : "₹";
  const up = live.changePct >= 0;

  const ohlc = {
    o: candles[candles.length - 1].o,
    h: Math.max(...candles.slice(-5).map((c) => c.h)),
    l: Math.min(...candles.slice(-5).map((c) => c.l)),
    c: candles[candles.length - 1].c,
  };

  const aiRecommendation = up
    ? { action: "BUY", confidence: 64 + Math.floor(Math.random() * 22), target: live.price * 1.08, stopLoss: live.price * 0.94, reason: "Momentum is positive with strong volume; RSI trending up." }
    : { action: "HOLD", confidence: 55 + Math.floor(Math.random() * 15), target: live.price * 1.04, stopLoss: live.price * 0.92, reason: "Mixed signals; consider waiting for a clear breakout." };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/app/markets" })}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <button
          onClick={() => {
            if (inWatchlist) {
              removeFromWatchlist(symbol);
              toast.success("Removed from watchlist");
            } else {
              addToWatchlist(symbol);
              toast.success("Added to watchlist");
            }
          }}
          className="ml-auto"
        >
          <Star className={cn("w-5 h-5", inWatchlist ? "fill-gold text-gold" : "text-muted-foreground")} />
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">{base.symbol}</h1>
              <span className="text-xs px-2 py-1 rounded bg-surface text-muted-foreground uppercase">{base.type}</span>
            </div>
            <div className="text-muted-foreground">{base.name}</div>
            <div className="text-xs text-muted-foreground mt-1">NSE · {base.exchange ?? "NSE"}</div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold font-mono">{symbol_}{live.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
            <div className={cn("flex items-center gap-1 text-sm font-semibold mt-1 justify-end", up ? "text-profit" : "text-loss")}>
              {up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {up ? "+" : ""}{live.change.toFixed(2)} ({up ? "+" : ""}{live.changePct.toFixed(2)}%)
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={() => setOrderOpen({ kind: "BUY" })} className="bg-profit hover:bg-profit/90 text-white flex-1 sm:flex-none">
              <TrendingUp className="w-4 h-4" /> BUY
            </Button>
            <Button onClick={() => setOrderOpen({ kind: "SELL" })} className="bg-loss hover:bg-loss/90 text-white flex-1 sm:flex-none">
              <TrendingDown className="w-4 h-4" /> SELL
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-5 text-xs">
          {[
            { l: "Open", v: ohlc.o.toFixed(2) },
            { l: "High", v: ohlc.h.toFixed(2), c: "profit" },
            { l: "Low", v: ohlc.l.toFixed(2), c: "loss" },
            { l: "Prev Close", v: (live.price - live.change).toFixed(2) },
          ].map((m) => (
            <div key={m.l} className="bg-surface rounded-lg p-3">
              <div className="text-muted-foreground text-[10px] uppercase tracking-wide">{m.l}</div>
              <div className={cn("font-mono font-semibold mt-1", m.c === "profit" ? "text-profit" : m.c === "loss" ? "text-loss" : "")}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Price chart</div>
          <div className="flex gap-1">
            {["1m", "5m", "15m", "1H", "1D", "1W", "1M", "1Y"].map((t) => (
              <button
                key={t}
                onClick={() => setTf(t)}
                className={cn("px-3 py-1 text-xs rounded font-medium", tf === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface")}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[360px]">
          <CandleSvg candles={candles} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-info" /> About {base.name}</div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <Row k="Symbol" v={base.symbol} />
              <Row k="Exchange" v={base.exchange ?? "NSE"} />
              <Row k="Volume" v={base.volume ?? "—"} />
              <Row k="Market Cap" v={base.marketCap ?? "—"} />
            </div>
            <div className="space-y-2">
              <Row k="52W High" v={base.type === "crypto" ? "$105,200" : "₹3,120"} c="profit" />
              <Row k="52W Low" v={base.type === "crypto" ? "$58,420" : "₹2,240"} c="loss" />
              <Row k="P/E" v="24.8" />
              <Row k="EPS" v="₹118.4" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-card border border-primary/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3"><Brain className="w-4 h-4 text-primary" /><span className="font-semibold">AI Insight</span></div>
          <div className="text-center my-3">
            <div className={cn("text-2xl font-bold", aiRecommendation.action === "BUY" ? "text-profit" : aiRecommendation.action === "SELL" ? "text-loss" : "text-info")}>
              {aiRecommendation.action}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Confidence: {aiRecommendation.confidence}%</div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Target</span><span className="font-mono font-semibold text-profit">{symbol_}{aiRecommendation.target.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Stop Loss</span><span className="font-mono font-semibold text-loss">{symbol_}{aiRecommendation.stopLoss.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Upside</span><span className="font-mono font-semibold text-profit">+{(((aiRecommendation.target - live.price) / live.price) * 100).toFixed(2)}%</span></div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">{aiRecommendation.reason}</p>
        </div>
      </div>

      {orderOpen && (
        <OrderTicket open={true} onOpenChange={() => setOrderOpen(null)} symbol={symbol} defaultKind={orderOpen.kind} />
      )}
    </div>
  );
}

function Row({ k, v, c }: { k: string; v: string; c?: "profit" | "loss" }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className={cn("font-semibold", c === "profit" ? "text-profit" : c === "loss" ? "text-loss" : "")}>{v}</span>
    </div>
  );
}
