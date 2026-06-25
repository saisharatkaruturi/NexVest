import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMarket, lookupQuote, type OrderKind } from "@/lib/market-store";
import { OrderTicket } from "@/components/order-ticket";
import { allCrypto, moreCrypto } from "@/lib/mock-data";
import {
  Bitcoin, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Search, Plus, ChevronDown, RefreshCw, Activity, Star,
  BarChart3, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/crypto")({
  component: CryptoPage,
});

function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  const w = 80, h = 28;
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - ((p - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={d} fill="none" stroke={up ? "var(--profit)" : "var(--loss)"} strokeWidth="1.5" />
    </svg>
  );
}

function cryptoSparkline(seed: number, up: boolean): number[] {
  const pts: number[] = [];
  let v = 100;
  for (let i = 0; i < 24; i++) {
    v += (Math.sin(i * 0.4 + seed) * 3) + (Math.random() - 0.5) * 4;
    pts.push(v);
  }
  return pts;
}

function parseMarketCap(s: string | undefined): number {
  if (!s) return 0;
  const m = s.match(/([\d.]+)([TBMK]?)/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const unit = m[2];
  const mult = unit === "T" ? 1e12 : unit === "B" ? 1e9 : unit === "M" ? 1e6 : unit === "K" ? 1e3 : 1;
  return n * mult;
}

function parseVolume(s: string | undefined): number {
  if (!s) return 0;
  const m = s.match(/([\d.]+)([TBMK]?)/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const unit = m[2];
  const mult = unit === "T" ? 1e12 : unit === "B" ? 1e9 : unit === "M" ? 1e6 : unit === "K" ? 1e3 : 1;
  return n * mult;
}

function priceBucket(price: number, bucket: string): boolean {
  if (bucket === "any") return true;
  if (bucket === "<1") return price < 1;
  if (bucket === "1-100") return price >= 1 && price < 100;
  if (bucket === "100-1k") return price >= 100 && price < 1000;
  if (bucket === ">1k") return price >= 1000;
  return true;
}

function capBucket(cap: number, bucket: string): boolean {
  if (bucket === "any") return true;
  if (bucket === "large") return cap >= 1e11;
  if (bucket === "mid") return cap >= 1e9 && cap < 1e11;
  if (bucket === "small") return cap < 1e9;
  return true;
}

function CryptoPage() {
  const { state, addToWatchlist, removeFromWatchlist, holdings } = useMarket();
  const quote = (s: string) => lookupQuote(state, s);

  const [tab, setTab] = useState<"all" | "gainers" | "losers" | "watchlist">("all");
  const [search, setSearch] = useState("");
  const [orderOpen, setOrderOpen] = useState<{ symbol: string; kind: OrderKind } | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ marketCap: "any", vol: "any", price: "any" });
  const [refreshSpin, setRefreshSpin] = useState(false);

  const combined = useMemo(() => {
    const seen = new Set<string>();
    return [...allCrypto, ...moreCrypto].filter((c) => {
      if (seen.has(c.symbol)) return false;
      seen.add(c.symbol);
      return true;
    });
  }, []);

  const enriched = useMemo(() => {
    return combined.map((c) => ({ asset: c, live: quote(c.symbol) })).filter((x) => x.live);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combined, state.live]);

  const activeWatchlist = state.watchlists.find((w) => w.id === state.activeWatchlist);
  const watchlistSet = useMemo(() => new Set(activeWatchlist?.symbols ?? []), [activeWatchlist]);

  const filtered = useMemo(() => {
    let rows = enriched;
    if (tab === "gainers") rows = rows.filter((x) => (x.live?.changePct ?? 0) > 0).sort((a, b) => (b.live?.changePct ?? 0) - (a.live?.changePct ?? 0));
    else if (tab === "losers") rows = rows.filter((x) => (x.live?.changePct ?? 0) < 0).sort((a, b) => (a.live?.changePct ?? 0) - (b.live?.changePct ?? 0));
    else if (tab === "watchlist") rows = rows.filter((x) => watchlistSet.has(x.asset.symbol));
    else rows = [...rows].sort((a, b) => parseMarketCap(b.asset.marketCap) - parseMarketCap(a.asset.marketCap));

    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((x) => x.asset.symbol.toLowerCase().includes(s) || x.asset.name.toLowerCase().includes(s));
    }
    if (filters.marketCap !== "any") {
      rows = rows.filter((x) => capBucket(parseMarketCap(x.asset.marketCap), filters.marketCap));
    }
    if (filters.price !== "any") {
      rows = rows.filter((x) => priceBucket(x.live?.price ?? 0, filters.price));
    }
    return rows;
  }, [enriched, tab, search, filters, watchlistSet]);

  const totalCap = enriched.reduce((sum, e) => sum + parseMarketCap(e.asset.marketCap), 0);
  const totalVol = enriched.reduce((sum, e) => sum + parseVolume(e.asset.volume), 0);
  const btc = enriched.find((e) => e.asset.symbol === "BTC");
  const eth = enriched.find((e) => e.asset.symbol === "ETH");
  const btcDom = btc && totalCap > 0 ? (parseMarketCap(btc.asset.marketCap) / totalCap) * 100 : 0;

  const refresh = () => {
    setRefreshSpin(true);
    setTimeout(() => {
      setRefreshSpin(false);
      toast.success("Markets refreshed", { description: "Latest prices loaded." });
    }, 800);
  };

  const myCrypto = useMemo(() => {
    return holdings().filter((h) => enriched.some((e) => e.asset.symbol === h.symbol));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.positions, state.live, enriched]);

  const toggleWatch = (sym: string) => {
    if (watchlistSet.has(sym)) {
      removeFromWatchlist(sym, activeWatchlist?.id);
      toast("Removed from watchlist", { description: sym });
    } else {
      addToWatchlist(sym, activeWatchlist?.id);
      toast.success(`Added ${sym} to ${activeWatchlist?.name ?? "watchlist"}`);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="bg-gradient-card border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-crypto/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-9 h-9 rounded-lg bg-crypto/15 flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-crypto" strokeWidth={2.5} />
              </div>
              <span className="text-sm text-muted-foreground">Crypto Markets</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Cryptocurrency Exchange</h1>
            <p className="text-muted-foreground text-sm mt-1">Buy, sell, and track 50+ digital assets in real time</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="h-9 px-3 rounded-md bg-surface border border-border text-xs flex items-center gap-1.5 hover:border-crypto/50"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", refreshSpin && "animate-spin")} /> Refresh
            </button>
            <button
              onClick={() => setOrderOpen({ symbol: "BTC", kind: "BUY" })}
              className="h-9 px-4 rounded-md bg-crypto text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90"
            >
              <Plus className="w-3.5 h-3.5" /> Buy Crypto
            </button>
          </div>
        </div>
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="bg-surface/60 border border-border/50 rounded-lg px-3 py-2.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Market Cap</div>
            <div className="text-lg font-bold font-mono">${(totalCap / 1e12).toFixed(2)}T</div>
          </div>
          <div className="bg-surface/60 border border-border/50 rounded-lg px-3 py-2.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">24h Volume</div>
            <div className="text-lg font-bold font-mono">${(totalVol / 1e9).toFixed(1)}B</div>
          </div>
          <div className="bg-surface/60 border border-border/50 rounded-lg px-3 py-2.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">BTC Dominance</div>
            <div className="text-lg font-bold font-mono">{btcDom.toFixed(1)}%</div>
          </div>
          <div className="bg-surface/60 border border-border/50 rounded-lg px-3 py-2.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Active Coins</div>
            <div className="text-lg font-bold font-mono">{enriched.length}</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {btc && (
          <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-crypto/5 blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500/15 flex items-center justify-center text-orange-500 font-bold">₿</div>
                  <div>
                    <div className="font-bold">Bitcoin</div>
                    <div className="text-xs text-muted-foreground">BTC</div>
                  </div>
                </div>
                <div className="text-3xl font-bold font-mono">${btc.live!.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                <div className={cn("text-sm font-semibold flex items-center gap-1 mt-1", btc.live!.changePct >= 0 ? "text-profit" : "text-loss")}>
                  {btc.live!.changePct >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  ${Math.abs(btc.live!.change).toFixed(2)} ({btc.live!.changePct.toFixed(2)}%)
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setOrderOpen({ symbol: "BTC", kind: "BUY" })} className="h-8 px-3 text-xs rounded-md bg-profit text-primary-foreground font-bold hover:opacity-90">BUY</button>
                <button onClick={() => setOrderOpen({ symbol: "BTC", kind: "SELL" })} className="h-8 px-3 text-xs rounded-md bg-loss text-primary-foreground font-bold hover:opacity-90">SELL</button>
              </div>
            </div>
          </div>
        )}
        {eth && (
          <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-blue-500/5 blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-500 font-bold">Ξ</div>
                  <div>
                    <div className="font-bold">Ethereum</div>
                    <div className="text-xs text-muted-foreground">ETH</div>
                  </div>
                </div>
                <div className="text-3xl font-bold font-mono">${eth.live!.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                <div className={cn("text-sm font-semibold flex items-center gap-1 mt-1", eth.live!.changePct >= 0 ? "text-profit" : "text-loss")}>
                  {eth.live!.changePct >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  ${Math.abs(eth.live!.change).toFixed(2)} ({eth.live!.changePct.toFixed(2)}%)
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setOrderOpen({ symbol: "ETH", kind: "BUY" })} className="h-8 px-3 text-xs rounded-md bg-profit text-primary-foreground font-bold hover:opacity-90">BUY</button>
                <button onClick={() => setOrderOpen({ symbol: "ETH", kind: "SELL" })} className="h-8 px-3 text-xs rounded-md bg-loss text-primary-foreground font-bold hover:opacity-90">SELL</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {myCrypto.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-crypto" />
            <span className="font-semibold">My Crypto Holdings</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {myCrypto.map((h) => {
              const e = enriched.find((x) => x.asset.symbol === h.symbol);
              if (!e) return null;
              return (
                <div key={h.symbol} className="bg-surface/40 border border-border/50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{e.asset.symbol}</div>
                    <div className="text-xs text-muted-foreground">{h.qty.toFixed(6)} coins</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-semibold">${h.current.toFixed(2)}</div>
                    <div className={cn("text-xs", h.changePct >= 0 ? "text-profit" : "text-loss")}>
                      {h.changePct >= 0 ? "+" : ""}{h.changePct.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border">
          <div className="flex items-center gap-1.5 bg-surface/60 rounded-lg p-1 border border-border">
            {[
              { k: "all", l: "All", i: BarChart3 },
              { k: "gainers", l: "Gainers", i: TrendingUp },
              { k: "losers", l: "Losers", i: TrendingDown },
              { k: "watchlist", l: "Watchlist", i: Star },
            ].map((t) => {
              const Icon = t.i;
              return (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k as typeof tab)}
                  className={cn(
                    "h-7 px-3 rounded text-xs font-medium flex items-center gap-1.5",
                    tab === t.k ? "bg-crypto text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-3 h-3" /> {t.l}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search BTC, ETH, ..."
                className="h-8 w-full pl-8 pr-3 rounded-md border border-border bg-surface text-xs focus:outline-none focus:border-crypto/60"
              />
            </div>
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={cn("h-8 px-3 rounded-md border text-xs flex items-center gap-1.5", filterOpen ? "bg-crypto text-white border-crypto" : "bg-surface border-border")}
            >
              Filter <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {filterOpen && (
          <div className="px-5 py-3 border-b border-border bg-surface/40 flex flex-wrap items-center gap-4 text-xs">
            <div>
              <div className="text-muted-foreground mb-1">Market cap</div>
              <div className="flex gap-1">
                {["any", "large", "mid", "small"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setFilters({ ...filters, marketCap: v })}
                    className={cn("px-2 py-1 rounded border", filters.marketCap === v ? "bg-crypto text-white border-crypto" : "bg-surface border-border")}
                  >{v}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Price</div>
              <div className="flex gap-1">
                {["any", "<1", "1-100", "100-1k", ">1k"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setFilters({ ...filters, price: v })}
                    className={cn("px-2 py-1 rounded border", filters.price === v ? "bg-crypto text-white border-crypto" : "bg-surface border-border")}
                  >{v}</button>
                ))}
              </div>
            </div>
            <button onClick={() => { setFilters({ marketCap: "any", vol: "any", price: "any" }); toast.info("Filters cleared"); }} className="text-crypto hover:underline ml-auto">Clear all</button>
            <button onClick={() => { setFilterOpen(false); toast.success("Filters applied"); }} className="text-crypto hover:underline">Apply</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface/40 text-[10px] text-muted-foreground uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-2.5 font-semibold">Asset</th>
                <th className="text-right font-semibold">Price</th>
                <th className="text-right font-semibold">24h %</th>
                <th className="text-right font-semibold">Market Cap</th>
                <th className="text-right font-semibold">Volume (24h)</th>
                <th className="text-right font-semibold">Last 7d</th>
                <th className="text-right px-5 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No coins match your filters.</td></tr>
              ) : (
                filtered.map((row) => {
                  const up = (row.live?.changePct ?? 0) >= 0;
                  const inWatch = watchlistSet.has(row.asset.symbol);
                  return (
                    <tr key={row.asset.symbol} className="border-t border-border/50 hover:bg-surface/30 transition">
                      <td className="px-5 py-3">
                        <button
                          onClick={() => toggleWatch(row.asset.symbol)}
                          title={inWatch ? "Remove from watchlist" : "Add to watchlist"}
                          className="flex items-center gap-3 text-left"
                        >
                          <span className={cn("w-7 h-7 rounded-full font-bold text-[10px] flex items-center justify-center transition", inWatch ? "bg-gold/20 text-gold" : "bg-crypto/15 text-crypto")}>
                            {row.asset.symbol.slice(0, 3)}
                          </span>
                          <div>
                            <div className="font-semibold text-sm flex items-center gap-1.5">
                              {row.asset.symbol}
                              {inWatch && <Star className="w-3 h-3 fill-gold text-gold" />}
                            </div>
                            <div className="text-xs text-muted-foreground">{row.asset.name}</div>
                          </div>
                        </button>
                      </td>
                      <td className="text-right font-mono font-semibold">${row.live!.price.toLocaleString("en-IN", { maximumFractionDigits: row.live!.price < 1 ? 4 : 2 })}</td>
                      <td className={cn("text-right font-mono font-semibold", up ? "text-profit" : "text-loss")}>
                        {up ? "+" : ""}{row.live!.changePct.toFixed(2)}%
                      </td>
                      <td className="text-right font-mono text-xs">{row.asset.marketCap ?? "—"}</td>
                      <td className="text-right font-mono text-xs">{row.asset.volume ?? "—"}</td>
                      <td className="text-right">
                        <div className="inline-block"><Sparkline points={cryptoSparkline(row.asset.symbol.length, up)} up={up} /></div>
                      </td>
                      <td className="text-right px-5">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setOrderOpen({ symbol: row.asset.symbol, kind: "BUY" })}
                            className="h-7 px-2.5 text-xs font-semibold rounded-md bg-profit/15 text-profit hover:bg-profit hover:text-primary-foreground transition"
                          >Buy</button>
                          <button
                            onClick={() => setOrderOpen({ symbol: row.asset.symbol, kind: "SELL" })}
                            className="h-7 px-2.5 text-xs font-semibold rounded-md bg-loss/15 text-loss hover:bg-loss hover:text-white transition"
                          >Sell</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border bg-surface/30 text-[10px] text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3 h-3" /> Prices update every 1.5s · {filtered.length} of {enriched.length} shown
        </div>
      </div>

      {orderOpen && (
        <OrderTicket open={true} onOpenChange={() => setOrderOpen(null)} symbol={orderOpen.symbol} defaultKind={orderOpen.kind} />
      )}
    </div>
  );
}
