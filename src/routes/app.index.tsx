import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkline } from "@/components/sparkline";
import { OrderTicket } from "@/components/order-ticket";
import { useMarket, useTotalPnL } from "@/lib/market-store";
import { detailedNews, allStocks, allCrypto } from "@/lib/mock-data";
import {
  ArrowUpRight, ArrowDownRight, Plus, TrendingUp, Newspaper, Brain,
  PieChart as PieIcon, Activity, Sparkles, ExternalLink,
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const size = 160;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      {data.map((d, i) => {
        const len = (d.value / total) * c;
        const el = (
          <circle
            key={i}
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={d.color}
            strokeWidth={stroke}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        );
        offset += len;
        return el;
      })}
      <text x={size / 2} y={size / 2 + 6} textAnchor="middle" transform={`rotate(90 ${size / 2} ${size / 2})`} className="fill-foreground" fontSize="20" fontWeight="700">100%</text>
    </svg>
  );
}

function Dashboard() {
  const { state, quote, baseAsset } = useMarket();
  const totals = useTotalPnL();
  const navigate = useNavigate();

  const [orderOpen, setOrderOpen] = useState<{ symbol: string; kind: "BUY" | "SELL" } | null>(null);
  const [newsOpen, setNewsOpen] = useState<typeof detailedNews[number] | null>(null);

  // Build dashboard watchlist from user's first watchlist
  const watchlistSymbols = state.watchlists.find((w) => w.id === state.activeWatchlist)?.symbols ?? ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC"];
  const watchlistItems = watchlistSymbols.map((s) => ({ sym: s, base: baseAsset(s), q: quote(s) })).filter((x) => x.q);

  // Live indices strip (using base + live)
  const liveIndices = useMemo(() => {
    return ["NIFTY 50", "SENSEX", "BANKNIFTY", "NIFTY IT"].map((s) => {
      const l = quote(s);
      const b = baseAsset(s);
      return { symbol: s, price: l?.price ?? b?.price ?? 0, change: l?.change ?? b?.change ?? 0, changePct: l?.changePct ?? b?.changePct ?? 0 };
    });
  }, [state.live, quote, baseAsset]);

  // Top 3 stock + 3 crypto as watchlist fallback
  const featuredAssets = useMemo(() => {
    const out: { sym: string; base: any; q: any }[] = [];
    for (const a of [...allStocks, ...allCrypto].slice(0, 8)) {
      const q = quote(a.symbol);
      if (q) out.push({ sym: a.symbol, base: a, q });
    }
    return out.slice(0, 6);
  }, [state.live, quote]);

  const displayWatchlist = watchlistItems.length > 0 ? watchlistItems : featuredAssets;

  const allocation = [
    { label: "Stocks", value: Math.round(totals.invested * 0.64), color: "var(--profit)" },
    { label: "Crypto", value: Math.round(totals.invested * 0.12), color: "var(--crypto)" },
    { label: "Mutual Funds", value: Math.round(totals.invested * 0.16), color: "var(--info)" },
    { label: "Gold", value: Math.round(totals.invested * 0.08), color: "var(--gold)" },
  ];

  const aiScore = state.positions.length === 0 ? 0 : Math.min(100, 50 + state.positions.length * 4 + Math.floor(totals.pnlPct));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top row: portfolio + indices + allocation */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gradient-card border border-border rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-muted-foreground">Total Portfolio Value</div>
              <button
                onClick={() => navigate({ to: "/app/ai" })}
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition"
              >
                <Brain className="w-3 h-3" /> AI Score: {aiScore}/100
              </button>
            </div>
            <div className="flex items-baseline gap-3 mb-2">
              <div className="text-4xl md:text-5xl font-bold tracking-tight">
                ₹{totals.current.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
              <div className={cn("flex items-center gap-1 font-semibold", totals.pnl >= 0 ? "text-profit" : "text-loss")}>
                {totals.pnl >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {totals.pnl >= 0 ? "+" : ""}₹{Math.abs(totals.pnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })} ({totals.pnlPct.toFixed(2)}%)
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Today's P&L:{" "}
              <span className={cn("font-semibold", totals.day >= 0 ? "text-profit" : "text-loss")}>
                {totals.day >= 0 ? "+" : ""}₹{totals.day.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
              <span className="mx-2">·</span>
              <span>Invested: ₹{totals.invested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-profit animate-pulse" /> Live updating
              </span>
              <span>·</span>
              <span>Wallet: ₹{state.wallet.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => navigate({ to: "/app/portfolio" })} className="px-3 py-1.5 rounded-md bg-surface border border-border text-xs hover:border-primary/40 transition">
                View portfolio
              </button>
              <button onClick={() => navigate({ to: "/app/analytics" })} className="px-3 py-1.5 rounded-md bg-surface border border-border text-xs hover:border-primary/40 transition">
                Analytics
              </button>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-info" />
            <span className="font-semibold">Asset Allocation</span>
          </div>
          <div className="flex justify-center mb-4">
            <DonutChart data={allocation} />
          </div>
          <div className="space-y-2.5">
            {allocation.map((a) => (
              <div key={a.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: a.color }} />
                  <span>{a.label}</span>
                </div>
                <span className="font-semibold">₹{a.value.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Indices strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {liveIndices.map((i) => {
          const up = i.changePct >= 0;
          return (
            <button
              key={i.symbol}
              onClick={() => navigate({ to: "/app/terminal", search: { symbol: i.symbol } })}
              className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition"
            >
              <div className="text-xs text-muted-foreground">{i.symbol}</div>
              <div className="text-xl font-bold mt-0.5">₹{i.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
              <div className={cn("text-xs font-medium mt-1 flex items-center gap-1", up ? "text-profit" : "text-loss")}>
                {up ? "▲" : "▼"} {Math.abs(i.change).toFixed(2)} ({up ? "+" : ""}{i.changePct.toFixed(2)}%)
              </div>
            </button>
          );
        })}
      </div>

      {/* Watchlist + News */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="font-semibold">My Watchlist</span>
              <span className="text-[10px] text-muted-foreground">· {displayWatchlist.length} instruments</span>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/app/watchlist" className="text-xs flex items-center gap-1 bg-surface border border-border px-2.5 py-1.5 rounded-md hover:border-primary/40 transition">
                <Plus className="w-3 h-3" /> Manage
              </Link>
            </div>
          </div>
          <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
            {displayWatchlist.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No instruments yet. Add some from the Markets page.
              </div>
            ) : (
              displayWatchlist.map((row) => {
                const sym = row.sym ?? row.base?.symbol;
                const up = (row.q?.changePct ?? 0) >= 0;
                const isCrypto = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "MATIC", "LINK", "DOT", "TRX", "SHIB", "LTC"].includes(sym);
                return (
                  <div key={sym} className="px-5 py-3 grid grid-cols-[1fr_auto_auto] items-center gap-4 hover:bg-surface/50 transition">
                    <button onClick={() => navigate({ to: "/app/stock", search: { symbol: sym } })} className="min-w-0 text-left">
                      <div className="font-semibold text-sm flex items-center gap-2">
                        {sym}
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface text-muted-foreground border border-border uppercase">
                          {isCrypto ? "crypto" : "stock"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{row.base?.name ?? sym}</div>
                    </button>
                    <div className="text-right">
                      <div className="font-semibold text-sm font-mono">
                        {isCrypto ? "$" : "₹"}{row.q?.price?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </div>
                      <div className={cn("text-xs font-mono", up ? "text-profit" : "text-loss")}>
                        {up ? "+" : ""}{row.q?.changePct?.toFixed(2) || 0}%
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setOrderOpen({ symbol: sym, kind: "BUY" })}
                        className="px-3 py-1 text-xs font-semibold rounded-md bg-profit/15 text-profit hover:bg-profit hover:text-primary-foreground transition"
                      >
                        BUY
                      </button>
                      <button
                        onClick={() => setOrderOpen({ symbol: sym, kind: "SELL" })}
                        className="px-3 py-1 text-xs font-semibold rounded-md bg-loss/15 text-loss hover:bg-loss hover:text-white transition"
                      >
                        SELL
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-info" />
              <span className="font-semibold">Market News</span>
            </div>
            <Link to="/app/news" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
            {detailedNews.slice(0, 6).map((n) => (
              <button
                key={n.id}
                onClick={() => setNewsOpen(n)}
                className="w-full px-5 py-3.5 hover:bg-surface/50 transition text-left"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-info/15 text-info font-semibold">{n.tag}</span>
                  <span className="text-xs text-muted-foreground">{n.source} · {n.time}</span>
                </div>
                <div className="text-sm leading-snug font-medium">{n.title}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { i: TrendingUp, t: "Trade Stocks", d: "Place orders", to: "/app/terminal", c: "primary" },
          { i: Activity, t: "Buy Crypto", d: "Spot & futures", to: "/app/crypto", c: "crypto" },
          { i: Sparkles, t: "Digital Gold", d: "24K from ₹10", to: "/app/gold", c: "gold" },
          { i: Brain, t: "AI Advisor", d: "Get insights", to: "/app/ai", c: "info" },
        ].map((a) => (
          <button
            key={a.t}
            onClick={() => navigate({ to: a.to as any })}
            className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:border-primary/40 transition text-left"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", `bg-${a.c}/10`)}>
              <a.i className={cn("w-5 h-5", `text-${a.c}`)} />
            </div>
            <div>
              <div className="font-semibold text-sm">{a.t}</div>
              <div className="text-[11px] text-muted-foreground">{a.d}</div>
            </div>
          </button>
        ))}
      </div>

      {orderOpen && (
        <OrderTicket open={true} onOpenChange={() => setOrderOpen(null)} symbol={orderOpen.symbol} defaultKind={orderOpen.kind} />
      )}

      <Dialog open={!!newsOpen} onOpenChange={(o) => !o && setNewsOpen(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          {newsOpen && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-info/15 text-info font-semibold">{newsOpen.tag}</span>
                  <span className="text-xs text-muted-foreground">{newsOpen.source} · {newsOpen.time}</span>
                </div>
                <DialogTitle className="text-xl leading-snug">{newsOpen.title}</DialogTitle>
                <DialogDescription>AI-curated market intelligence</DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-relaxed text-foreground/90 mt-2">{newsOpen.body}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setNewsOpen(null)} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90">
                  Close
                </button>
                <button onClick={() => { setNewsOpen(null); navigate({ to: "/app/news" }); }} className="px-4 py-2 text-sm rounded-md border border-border hover:border-primary/40">
                  More news
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
