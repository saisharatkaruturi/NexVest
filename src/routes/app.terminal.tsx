import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMarket, lookupQuote, lookupBase, type OrderKind } from "@/lib/market-store";
import { OrderTicket } from "@/components/order-ticket";
import {
  Search, Plus, ChevronDown, Maximize2, Settings2, Bell, ShoppingCart,
  ArrowUp, ArrowDown, Clock, FileText, Briefcase, Activity, X, Trash2,
  TrendingUp, TrendingDown, CheckCircle2, XCircle, Hourglass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

type TerminalSearch = { symbol?: string };

export const Route = createFileRoute("/app/terminal")({
  validateSearch: (search: Record<string, unknown>): TerminalSearch => ({
    symbol: typeof search.symbol === "string" ? search.symbol : undefined,
  }),
  component: Terminal,
});

type Candle = { o: number; h: number; l: number; c: number };

function genCandles(seed: number, tf: string, start: number): Candle[] {
  const tfMap: Record<string, number> = { "1m": 60, "5m": 60, "15m": 60, "30m": 60, "1H": 60, "1D": 60, "1W": 52, "1M": 36, "1Y": 12 };
  const n = tfMap[tf] ?? 60;
  const vol = tf === "1m" ? 8 : tf === "5m" ? 18 : tf === "1D" ? 50 : 80;
  let p = start;
  const out: Candle[] = [];
  for (let i = 0; i < n; i++) {
    const o = p;
    const drift = Math.sin(i * 0.3 + seed) * (vol / 4) + (Math.random() - 0.5) * vol;
    const c = o + drift;
    const h = Math.max(o, c) + Math.random() * (vol / 2);
    const l = Math.min(o, c) - Math.random() * (vol / 2);
    out.push({ o, h, l, c });
    p = c;
  }
  return out;
}

function CandleChart({ candles }: { candles: Candle[] }) {
  const W = 760, H = 440, padL = 8, padR = 64, padT = 12, padB = 28;
  const cw = (W - padL - padR) / Math.max(1, candles.length);
  const min = Math.min(...candles.map((c) => c.l));
  const max = Math.max(...candles.map((c) => c.h));
  const range = max - min || 1;
  const y = (v: number) => padT + ((max - v) / range) * (H - padT - padB);
  const ticks = 7;
  const last = candles[candles.length - 1].c;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {Array.from({ length: ticks }).map((_, i) => {
        const v = min + (range * i) / (ticks - 1);
        const yy = y(v);
        return (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={yy} y2={yy} stroke="hsl(var(--border))" strokeDasharray="2 4" opacity="0.4" />
            <text x={W - padR + 6} y={yy + 3} fontSize="10" fill="hsl(var(--muted-foreground))">{v.toFixed(2)}</text>
          </g>
        );
      })}
      <line x1={padL} x2={W - padR} y1={y(last)} y2={y(last)} stroke="hsl(var(--primary))" strokeDasharray="3 3" opacity="0.7" />
      <rect x={W - padR + 2} y={y(last) - 9} width="58" height="18" rx="3" fill="hsl(var(--primary))" />
      <text x={W - padR + 6} y={y(last) + 4} fontSize="11" fontWeight="700" fill="hsl(var(--primary-foreground))">{last.toFixed(2)}</text>

      {candles.map((c, i) => {
        const x = padL + i * cw + cw / 2;
        const up = c.c >= c.o;
        const col = up ? "var(--profit)" : "var(--loss)";
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} stroke={col} strokeWidth="1" />
            <rect
              x={x - cw * 0.35}
              y={y(Math.max(c.o, c.c))}
              width={cw * 0.7}
              height={Math.max(1, Math.abs(y(c.o) - y(c.c)))}
              fill={col}
            />
          </g>
        );
      })}

      {["5 May", "12 May", "19 May", "26 May", "2 Jun"].map((d, i) => (
        <text key={d} x={padL + ((W - padL - padR) / 4) * i} y={H - 8} fontSize="10" fill="hsl(var(--muted-foreground))">{d}</text>
      ))}
    </svg>
  );
}

type OptRow = { strike: number; callLtp: number; callChg: number; putLtp: number; putChg: number; itm?: "call" | "put" };
function genChain(spot: number): OptRow[] {
  const rows: OptRow[] = [];
  for (let i = -6; i <= 6; i++) {
    const strike = Math.round((spot + i * 50) / 50) * 50;
    const intrinsicCall = Math.max(0, spot - strike);
    const intrinsicPut = Math.max(0, strike - spot);
    rows.push({
      strike,
      callLtp: +(intrinsicCall + 40 + Math.random() * 60 - Math.abs(i) * 5).toFixed(2),
      callChg: +((Math.random() - 0.5) * 6).toFixed(2),
      putLtp: +(intrinsicPut + 35 + Math.random() * 55 - Math.abs(i) * 4).toFixed(2),
      putChg: +((Math.random() - 0.5) * 6).toFixed(2),
      itm: strike < spot ? "call" : strike > spot ? "put" : undefined,
    });
  }
  return rows;
}

function Terminal() {
  const search = useSearch({ from: "/app/terminal" });
  const { state, dispatch, addToWatchlist, removeFromWatchlist } = useMarket();
  const quote = (s: string) => lookupQuote(state, s);
  const baseAsset = (s: string) => lookupBase(state, s);
  const wl = state.watchlists.find((w) => w.id === state.activeWatchlist) ?? state.watchlists[0];
  const watchlist = wl.symbols.map((s) => ({ symbol: s, base: baseAsset(s), q: quote(s) })).filter((x) => x.q);

  // If watchlist is empty, use defaults from base
  const displayList = watchlist.length > 0 ? watchlist : (() => {
    const fallback = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC", "BTC", "ETH"];
    return fallback.map((s) => ({ symbol: s, base: baseAsset(s), q: quote(s) })).filter((x) => x.q);
  })();

  const initial = (() => {
    const fromQuery = search.symbol ? displayList.find((x) => x.symbol === search.symbol) : null;
    return fromQuery ?? displayList[0];
  })();

  const [selected, setSelected] = useState(initial?.symbol ?? "RELIANCE");
  const [tf, setTf] = useState("1D");
  const [tab, setTab] = useState<"orders" | "positions" | "holdings" | "funds">("orders");
  const [searchFilter, setSearchFilter] = useState("");
  const [orderOpen, setOrderOpen] = useState<{ kind: OrderKind } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [expiryIdx, setExpiryIdx] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [addQuery, setAddQuery] = useState("");

  const active = displayList.find((x) => x.symbol === selected) ?? displayList[0];
  if (!active) {
    return <div className="p-6 text-muted-foreground">No symbols available.</div>;
  }
  const activeQuote = active.q!;
  const activeBase = active.base!;

  const candles = useMemo(() => genCandles(selected.length, tf, activeQuote.price * 0.97), [selected, tf, activeQuote.price]);
  const chain = useMemo(() => genChain(activeQuote.price), [activeQuote.price]);
  const o = candles[candles.length - 1].o;
  const h = Math.max(...candles.slice(-5).map((c) => c.h));
  const l = Math.min(...candles.slice(-5).map((c) => c.l));
  const c = candles[candles.length - 1].c;

  const filteredWatchlist = displayList.filter((x) =>
    !searchFilter || x.symbol.toLowerCase().includes(searchFilter.toLowerCase()) || x.base?.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Equity calculation: wallet + total current holdings
  const equity = state.wallet + state.positions.reduce((sum, p) => sum + p.qty * (quote(p.symbol)?.price ?? p.avgPrice), 0) + state.goldHolding.grams * (quote("GOLD")?.price ?? 7842);
  const todayPnL = state.positions.reduce((sum, p) => {
    const q = quote(p.symbol);
    return sum + p.qty * (q?.price ?? p.avgPrice) * (q?.changePct ?? 0) / 100;
  }, 0);

  // Expiry dates
  const expiries = [
    "30 May (2 days)",
    "6 Jun (8 days)",
    "13 Jun (15 days)",
    "27 Jun (29 days)",
    "25 Jul (57 days)",
  ];
  const expiry = expiries[expiryIdx];

  // Top right cart count = open orders
  const openOrders = state.orders.filter((o) => o.status === "OPEN").length;

  return (
    <div className={cn("h-[calc(100vh-4rem)] flex flex-col bg-background text-foreground text-[13px]", fullscreen && "fixed inset-0 z-50")}>
      {/* Terminal toolbar */}
      <div className="h-11 px-3 flex items-center gap-3 border-b border-border bg-surface/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-profit flex items-center justify-center"><Activity className="w-3 h-3 text-primary-foreground" strokeWidth={3} /></div>
          <button onClick={() => setOrderOpen({ kind: "BUY" })} className="flex items-center gap-1.5 h-8 px-2.5 rounded border border-border bg-background text-xs font-medium hover:border-primary/50">
            Trade <ChevronDown className="w-3 h-3" />
          </button>
          <button onClick={() => setSettingsOpen(true)} className="h-8 w-8 rounded border border-border bg-background flex items-center justify-center hover:border-primary/50" title="Settings">
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5"><span className="text-muted-foreground">Equity</span><span className="font-mono font-semibold">₹{equity.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span></div>
          <div className="flex items-center gap-1.5"><span className="text-muted-foreground">Margin</span><span className="font-mono font-semibold">₹0.00</span></div>
          <div className="flex items-center gap-1.5" title={state.marketOpen ? "Market is open" : "Market closed"}>
            <span className={cn("w-2 h-2 rounded-full", state.marketOpen ? "bg-profit" : "bg-loss")} />
            <span className="text-muted-foreground">{state.marketOpen ? "Open" : "Closed"}</span>
          </div>
          <button className="relative hover:text-primary" onClick={() => toast.info("Cart is empty", { description: "Saved baskets will appear here." })} title="Cart">
            <ShoppingCart className="w-4 h-4" />
            {openOrders > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-loss text-white text-[9px] font-bold flex items-center justify-center">
                {openOrders}
              </span>
            )}
          </button>
          <button onClick={() => toast.info(`${state.notifications.filter((n) => !n.read).length} unread notifications`, { description: "Open the bell in the topbar for details." })} className="relative" title="Alerts">
            <Bell className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            {state.notifications.filter((n) => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-warning" />
            )}
          </button>
        </div>
      </div>

      {/* 3-pane body */}
      <div className="flex-1 flex min-h-0">
        {/* Watchlist */}
        <div className="w-[280px] shrink-0 border-r border-border flex flex-col bg-surface/30">
          <div className="p-2 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                placeholder="Search & add"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-8 w-full pl-7 pr-12 rounded border border-border bg-background text-xs focus:outline-none focus:border-primary/60"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground border border-border rounded px-1">Ctrl+K</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{wl.name} <span className="text-foreground">({wl.symbols.length}/250)</span></span>
              <button onClick={() => setAddOpen(true)} className="hover:text-primary" title="Add symbol">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredWatchlist.map((row) => {
              const up = (row.q?.changePct ?? 0) >= 0;
              const isActive = row.symbol === selected;
              return (
                <button
                  key={row.symbol}
                  onClick={() => setSelected(row.symbol)}
                  className={cn(
                    "w-full px-3 py-2 border-b border-border/50 flex items-center justify-between text-left hover:bg-accent/50 transition",
                    isActive && "bg-accent/70 border-l-2 border-l-primary"
                  )}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{row.symbol}</div>
                    <div className="text-[10px] text-muted-foreground">{row.base?.type === "crypto" ? "CRYPTO" : row.base?.exchange ?? "NSE"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-semibold">{row.q!.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                    <div className={cn("text-[10px] font-mono flex items-center justify-end gap-0.5", up ? "text-profit" : "text-loss")}>
                      {up ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                      {row.q!.changePct.toFixed(2)}%
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredWatchlist.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No matches. <button onClick={() => setAddOpen(true)} className="text-primary hover:underline">Add symbol</button>
              </div>
            )}
          </div>
          {/* Market depth */}
          <div className="border-t border-border p-2 bg-background/40">
            <div className="text-[10px] text-muted-foreground mb-1.5 font-semibold tracking-wide">MARKET DEPTH · {selected}</div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div>
                <div className="text-[10px] text-muted-foreground mb-1 flex justify-between"><span>Bid</span><span>Qty</span></div>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between text-profit"><span>{(activeQuote.price - (i + 1) * 0.05).toFixed(2)}</span><span className="text-foreground/70">{(120 - i * 18)}</span></div>
                ))}
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1 flex justify-between"><span>Offer</span><span>Qty</span></div>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between text-loss"><span>{(activeQuote.price + (i + 1) * 0.05).toFixed(2)}</span><span className="text-foreground/70">{(100 - i * 14)}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="h-10 px-3 flex items-center gap-3 border-b border-border bg-surface/40 text-xs">
            <span className="font-semibold">{active.symbol}</span>
            <span className="text-muted-foreground">· {activeBase.type === "index" ? "INDICES" : activeBase.exchange ?? "NSE"}</span>
            <span className="ml-2 text-muted-foreground">O <span className="font-mono text-foreground">{o.toFixed(2)}</span></span>
            <span className="text-muted-foreground">H <span className="font-mono text-profit">{h.toFixed(2)}</span></span>
            <span className="text-muted-foreground">L <span className="font-mono text-loss">{l.toFixed(2)}</span></span>
            <span className="text-muted-foreground">C <span className="font-mono text-foreground">{c.toFixed(2)}</span></span>
            <button onClick={() => toast.info("Advanced chart loaded", { description: "Drawing tools, indicators, and depth chart." })} className="ml-auto h-7 px-2.5 rounded border border-border text-[11px] flex items-center gap-1 hover:border-primary/50">
              <Activity className="w-3 h-3" /> Advanced
            </button>
            <button onClick={() => setFullscreen((f) => !f)} className="h-7 w-7 rounded border border-border flex items-center justify-center hover:border-primary/50" title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
              {fullscreen ? <X className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex-1 min-h-0 p-2">
            <CandleChart candles={candles} />
          </div>

          <div className="h-9 px-3 flex items-center gap-1 border-t border-border bg-surface/40">
            {["1m", "5m", "15m", "30m", "1H", "1D", "1W", "1M", "1Y"].map((t) => (
              <button
                key={t}
                onClick={() => { setTf(t); toast.success(`Timeframe: ${t}`, { description: `Candles regenerated for ${active.symbol}` }); }}
                className={cn(
                  "h-7 px-2.5 rounded text-[11px] font-medium",
                  tf === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >{t}</button>
            ))}
            <div className="ml-auto flex gap-2">
              <button onClick={() => setOrderOpen({ kind: "BUY" })} className="h-7 px-3 rounded bg-profit text-primary-foreground text-[11px] font-bold hover:opacity-90">BUY</button>
              <button onClick={() => setOrderOpen({ kind: "SELL" })} className="h-7 px-3 rounded bg-loss text-primary-foreground text-[11px] font-bold hover:opacity-90">SELL</button>
            </div>
          </div>
        </div>

        {/* Option chain */}
        <div className="w-[340px] shrink-0 border-l border-border flex flex-col bg-surface/30">
          <div className="p-3 border-b border-border">
            <div className="flex items-baseline gap-2">
              <span className="font-bold">{active.symbol}</span>
              <span className="font-mono font-semibold">{activeQuote.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              <span className={cn("text-[11px] font-mono", activeQuote.changePct >= 0 ? "text-profit" : "text-loss")}>
                {activeQuote.changePct >= 0 ? "+" : ""}{activeQuote.change.toFixed(2)} ({activeQuote.changePct.toFixed(2)}%)
              </span>
            </div>
            <div className="relative mt-2">
              <button
                onClick={() => {
                  setExpiryIdx((i) => (i + 1) % expiries.length);
                  toast.success(`Expiry: ${expiries[expiryIdx]}`);
                }}
                className="h-7 px-3 rounded-full bg-primary/15 text-primary text-[11px] font-medium flex items-center gap-1 hover:bg-primary/25"
              >
                {expiry} <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-[1fr_70px_1fr] px-3 py-2 text-[10px] font-semibold text-muted-foreground border-b border-border tracking-wide">
            <span>Call LTP</span><span className="text-center">Strike</span><span className="text-right">Put LTP</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chain.map((r) => (
              <div key={r.strike} className="grid grid-cols-[1fr_70px_1fr] px-3 py-1.5 text-[11px] font-mono border-b border-border/30 hover:bg-accent/30">
                <div className={cn("flex items-center gap-2", r.itm === "call" && "bg-profit/5")}>
                  <span className={cn("text-[10px] w-10", r.callChg >= 0 ? "text-profit" : "text-loss")}>{r.callChg >= 0 ? "+" : ""}{r.callChg}%</span>
                  <span className="font-semibold">{r.callLtp.toFixed(2)}</span>
                </div>
                <div className="text-center font-semibold text-foreground/80">{r.strike}</div>
                <div className={cn("flex items-center gap-2 justify-end", r.itm === "put" && "bg-loss/5")}>
                  <span className="font-semibold">{r.putLtp.toFixed(2)}</span>
                  <span className={cn("text-[10px] w-10 text-right", r.putChg >= 0 ? "text-profit" : "text-loss")}>{r.putChg >= 0 ? "+" : ""}{r.putChg}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 p-3 border-t border-border text-[10px] text-center">
            <div><div className="text-muted-foreground">PCR</div><div className="font-mono font-semibold text-sm">0.85</div></div>
            <div><div className="text-muted-foreground">Max Pain</div><div className="font-mono font-semibold text-sm">{Math.round(activeQuote.price / 100) * 100 - 50}</div></div>
            <div><div className="text-muted-foreground">ATM IV</div><div className="font-mono font-semibold text-sm">12.4</div></div>
          </div>
        </div>
      </div>

      {/* Bottom tabs */}
      <div className="border-t border-border bg-surface/40 shrink-0">
        <div className="h-9 px-3 flex items-center gap-1">
          {[
            { k: "orders", l: "Orders", i: FileText },
            { k: "positions", l: "Positions", i: Activity },
            { k: "holdings", l: "Holdings", i: Briefcase },
            { k: "funds", l: "Funds", i: Clock },
          ].map((t) => {
            const Icon = t.i;
            const count = t.k === "orders" ? state.orders.length : t.k === "positions" ? state.positions.filter((p) => p.qty > 0).length : t.k === "holdings" ? state.positions.length : 0;
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k as typeof tab)}
                className={cn(
                  "h-7 px-3 rounded text-[11px] font-medium flex items-center gap-1.5",
                  tab === t.k ? "bg-accent text-primary" : "text-muted-foreground hover:bg-accent/50"
                )}
              >
                <Icon className="w-3 h-3" /> {t.l}
                {count > 0 && <span className="text-[9px] bg-primary/20 text-primary px-1 rounded">{count}</span>}
              </button>
            );
          })}
          <span className="ml-auto text-[10px] text-muted-foreground">
            P&L today: <span className={cn("font-mono font-semibold", todayPnL >= 0 ? "text-profit" : "text-loss")}>
              {todayPnL >= 0 ? "+" : ""}₹{Math.abs(todayPnL).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
          </span>
        </div>
        <div className="px-3 pb-3 text-[11px] max-h-32 overflow-y-auto">
          {tab === "orders" && (
            state.orders.length === 0 ? (
              <div className="text-muted-foreground py-2">No open orders. Place an order from the chart or watchlist.</div>
            ) : (
              <table className="w-full">
                <thead className="text-[10px] text-muted-foreground uppercase">
                  <tr>
                    <th className="text-left py-1 font-medium">Time</th>
                    <th className="text-left font-medium">Symbol</th>
                    <th className="text-left font-medium">Type</th>
                    <th className="text-left font-medium">Side</th>
                    <th className="text-right font-medium">Qty</th>
                    <th className="text-right font-medium">Price</th>
                    <th className="text-left font-medium">Status</th>
                    <th className="text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {state.orders.map((o) => (
                    <tr key={o.id} className="border-t border-border/50">
                      <td className="py-1.5 text-muted-foreground">{new Date(o.createdAt).toLocaleTimeString()}</td>
                      <td className="font-semibold">{o.symbol}</td>
                      <td>{o.type}</td>
                      <td className={o.kind === "BUY" ? "text-profit" : "text-loss"}>{o.kind}</td>
                      <td className="text-right font-mono">{o.qty}</td>
                      <td className="text-right font-mono">₹{o.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                      <td>
                        <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold",
                          o.status === "EXECUTED" ? "bg-profit/15 text-profit" :
                          o.status === "OPEN" ? "bg-info/15 text-info" :
                          "bg-loss/15 text-loss"
                        )}>
                          {o.status === "EXECUTED" ? <CheckCircle2 className="w-2.5 h-2.5" /> :
                           o.status === "OPEN" ? <Hourglass className="w-2.5 h-2.5" /> :
                           <XCircle className="w-2.5 h-2.5" />}
                          {o.status}
                        </span>
                      </td>
                      <td className="text-right">
                        {o.status === "OPEN" && (
                          <button onClick={() => { dispatch({ type: "CANCEL_ORDER", id: o.id }); toast("Order cancelled", { description: `${o.kind} ${o.qty} ${o.symbol}` }); }} className="text-loss hover:underline text-[10px]">
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
          {tab === "positions" && (
            state.positions.filter((p) => p.qty > 0).length === 0 ? (
              <div className="text-muted-foreground py-2">No active intraday positions. Buy something to open a position.</div>
            ) : (
              <table className="w-full">
                <thead className="text-[10px] text-muted-foreground uppercase">
                  <tr>
                    <th className="text-left py-1 font-medium">Symbol</th>
                    <th className="text-right font-medium">Qty</th>
                    <th className="text-right font-medium">Avg</th>
                    <th className="text-right font-medium">LTP</th>
                    <th className="text-right font-medium">P&L</th>
                    <th className="text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {state.positions.filter((p) => p.qty > 0).map((p) => {
                    const ltp = quote(p.symbol)?.price ?? p.avgPrice;
                    const pnl = (ltp - p.avgPrice) * p.qty;
                    return (
                      <tr key={p.symbol} className="border-t border-border/50">
                        <td className="py-1.5 font-semibold">{p.symbol}</td>
                        <td className="text-right font-mono">{p.qty}</td>
                        <td className="text-right font-mono">₹{p.avgPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                        <td className="text-right font-mono">₹{ltp.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                        <td className={cn("text-right font-mono font-semibold", pnl >= 0 ? "text-profit" : "text-loss")}>
                          {pnl >= 0 ? "+" : ""}₹{Math.abs(pnl).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right">
                          <button onClick={() => { setSelected(p.symbol); setTab("orders"); }} className="text-primary hover:underline text-[10px]">View</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}
          {tab === "holdings" && (
            state.positions.length === 0 ? (
              <div className="text-muted-foreground py-2">No holdings yet. Your long-term investments will show here.</div>
            ) : (
              <div className="text-muted-foreground py-2">
                {state.positions.length} holdings worth ₹{state.positions.reduce((s, p) => s + p.qty * (quote(p.symbol)?.price ?? p.avgPrice), 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })} ·{" "}
                <a href="/app/portfolio" onClick={(e) => { e.preventDefault(); window.location.href = "/app/portfolio"; }} className="text-primary hover:underline">view in Portfolio</a>
              </div>
            )
          )}
          {tab === "funds" && (
            <div className="text-muted-foreground py-2">
              Available margin ₹0.00 · Wallet: <span className="text-foreground font-semibold">₹{state.wallet.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span> ·{" "}
              <button onClick={() => toast.info("Add funds via the wallet menu in the topbar.")} className="text-primary hover:underline">Add funds</button>
            </div>
          )}
        </div>
      </div>

      {orderOpen && (
        <OrderTicket open={true} onOpenChange={() => setOrderOpen(null)} symbol={selected} defaultKind={orderOpen.kind} />
      )}

      {/* Add to watchlist dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add symbol to {wl.name}</DialogTitle>
            <DialogDescription>Search and add instruments to this watchlist</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={addQuery} onChange={(e) => setAddQuery(e.target.value)} placeholder="Search symbol or name..." autoFocus />
            <div className="max-h-72 overflow-y-auto divide-y divide-border">
              {(["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC", "BHARTIARTL", "ICICIBANK", "SBIN", "LT", "AXISBANK", "KOTAKBANK", "BAJFINANCE", "MARUTI", "SUNPHARMA", "TATAMOTORS", "WIPRO", "M&M", "NTPC", "TITAN", "POWERGRID", "BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "MATIC", "LINK", "DOT", "LTC", "GOLD", "SILVER"]
                .filter((s) => {
                  if (!addQuery) return !wl.symbols.includes(s);
                  const b = baseAsset(s);
                  return !wl.symbols.includes(s) && (s.toLowerCase().includes(addQuery.toLowerCase()) || (b?.name ?? "").toLowerCase().includes(addQuery.toLowerCase()));
                }))
                .slice(0, 12)
                .map((s) => {
                  const b = baseAsset(s);
                  const q = quote(s);
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        addToWatchlist(s);
                        toast.success(`Added ${s} to ${wl.name}`);
                        setAddQuery("");
                      }}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-surface/50"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-sm">{s}</div>
                        <div className="text-xs text-muted-foreground">{b?.name ?? s}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono">{q?.price.toLocaleString("en-IN", { maximumFractionDigits: 2 }) ?? "—"}</span>
                        <Plus className="w-4 h-4 text-primary" />
                      </div>
                    </button>
                  );
                })}
              {(["RELIANCE", "TCS", "HDFCBANK", "INFY", "ITC", "BHARTIARTL", "ICICIBANK", "SBIN", "LT", "AXISBANK", "KOTAKBANK", "BAJFINANCE", "MARUTI", "SUNPHARMA", "TATAMOTORS", "WIPRO", "M&M", "NTPC", "TITAN", "POWERGRID", "BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "MATIC", "LINK", "DOT", "LTC", "GOLD", "SILVER"]
                .filter((s) => !addQuery && !wl.symbols.includes(s))).length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">No more symbols to add.</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Terminal settings</DialogTitle>
            <DialogDescription>Customize your trading experience</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Default order type</div>
              <div className="grid grid-cols-3 gap-1">
                {["MARKET", "LIMIT", "STOP"].map((t) => (
                  <button key={t} className="py-1.5 text-xs rounded bg-surface border border-border hover:border-primary/40">{t}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Chart type</div>
              <div className="grid grid-cols-2 gap-1">
                <button className="py-1.5 text-xs rounded bg-primary/15 text-primary border border-primary/40">Candles</button>
                <button onClick={() => toast.info("Line chart coming")} className="py-1.5 text-xs rounded bg-surface border border-border">Line</button>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Active watchlist</div>
              <select
                value={state.activeWatchlist}
                onChange={(e) => { dispatch({ type: "SET_ACTIVE_WATCHLIST", id: e.target.value }); toast.success("Watchlist switched"); }}
                className="w-full h-9 px-3 rounded bg-surface border border-border text-sm"
              >
                {state.watchlists.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => { removeFromWatchlist(selected); toast.success(`Removed ${selected} from ${wl.name}`); setSettingsOpen(false); }}
              className="w-full text-xs text-loss border border-loss/30 rounded py-2 hover:bg-loss/10 flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Remove {selected} from watchlist
            </button>
          </div>
          <DialogFooter>
            <Button onClick={() => setSettingsOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
