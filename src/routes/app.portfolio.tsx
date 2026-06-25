import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, ArrowDownRight, Download, TrendingUp, Briefcase, Coins, Gem, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useMarket, lookupQuote } from "@/lib/market-store";
import { OrderTicket } from "@/components/order-ticket";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/portfolio")({
  component: Portfolio,
});

const CRYPTO_SYMBOLS = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "MATIC", "LINK", "DOT", "LTC"];

function Portfolio() {
  const { state, holdings, placeOrder, dispatch } = useMarket();
  const totals = useMarket().state; // alias for live ticks
  const allHoldings = useMemo(() => holdings(), [state.positions, state.live]);

  const [tab, setTab] = useState<"stocks" | "crypto" | "funds" | "gold">("stocks");
  const [search, setSearch] = useState("");
  const [orderOpen, setOrderOpen] = useState<{ symbol: string; kind: "BUY" | "SELL" } | null>(null);

  const stockHoldings = allHoldings.filter((h) => !CRYPTO_SYMBOLS.includes(h.symbol));
  const cryptoHoldings = allHoldings.filter((h) => CRYPTO_SYMBOLS.includes(h.symbol));
  const fundHoldings = state.fundHoldings;
  const goldLtp = lookupQuote(state, "GOLD")?.price ?? 7842;
  const goldCur = state.goldHolding.grams * goldLtp;
  const goldInv = state.goldHolding.invested;

  const showHoldings = tab === "stocks" ? stockHoldings : tab === "crypto" ? cryptoHoldings : [];
  const filtered = search ? showHoldings.filter((h) => h.symbol.toLowerCase().includes(search.toLowerCase())) : showHoldings;

  const invested = tab === "stocks" ? stockHoldings.reduce((a, h) => a + h.invested, 0)
              : tab === "crypto" ? cryptoHoldings.reduce((a, h) => a + h.invested, 0)
              : tab === "funds" ? fundHoldings.reduce((a, f) => a + f.amount, 0)
              : goldInv;
  const current = tab === "stocks" ? stockHoldings.reduce((a, h) => a + h.current, 0)
              : tab === "crypto" ? cryptoHoldings.reduce((a, h) => a + h.current, 0)
              : tab === "funds" ? fundHoldings.reduce((a, f) => a + f.amount * 1.12, 0)
              : goldCur;
  const pnl = current - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
  const dayPnl = tab === "stocks" || tab === "crypto"
    ? showHoldings.reduce((sum, h) => sum + h.current * h.changePct / 100, 0)
    : 0;

  const exportCSV = () => {
    const rows = [
      ["Section", "Symbol/Name", "Qty", "Avg", "LTP", "Invested", "Current", "P&L", "P&L %"],
      ...stockHoldings.map((h) => ["Stocks", h.symbol, h.qty, h.avg, h.ltp, h.invested, h.current, h.current - h.invested, h.changePct]),
      ...cryptoHoldings.map((h) => ["Crypto", h.symbol, h.qty, h.avg, h.ltp, h.invested, h.current, h.current - h.invested, h.changePct]),
      ...fundHoldings.map((f) => ["Funds", f.name, f.units, f.nav, "", f.amount, f.amount * 1.12, f.amount * 0.12, 12]),
      ["Gold", "Digital Gold", state.goldHolding.grams, goldInv / Math.max(0.001, state.goldHolding.grams), goldLtp, goldInv, goldCur, goldCur - goldInv, goldInv > 0 ? ((goldCur - goldInv) / goldInv) * 100 : 0],
    ];
    const csv = "data:text/csv;charset=utf-8," + rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(csv);
    a.download = `nexvest-portfolio-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("Portfolio exported", { description: `${rows.length - 1} rows downloaded as CSV` });
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-1">{allHoldings.length + fundHoldings.length + (state.goldHolding.grams > 0 ? 1 : 0)} positions · Live</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"><Download className="w-3.5 h-3.5" /> Export CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { l: "Invested", v: `₹${invested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` },
          { l: "Current", v: `₹${current.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` },
          { l: "Total P&L", v: `${pnl >= 0 ? "+" : ""}₹${Math.abs(pnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, c: pnl >= 0 ? "profit" : "loss" },
          { l: "Returns", v: `${pnl >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%`, c: pnl >= 0 ? "profit" : "loss" },
          { l: "Day P&L", v: `${dayPnl >= 0 ? "+" : ""}₹${Math.abs(dayPnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, c: dayPnl >= 0 ? "profit" : "loss" },
          { l: "Items", v: `${tab === "stocks" ? stockHoldings.length : tab === "crypto" ? cryptoHoldings.length : tab === "funds" ? fundHoldings.length : state.goldHolding.grams > 0 ? 1 : 0}` },
        ].map((m) => (
          <div key={m.l} className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">{m.l}</div>
            <div className={cn("text-lg md:text-xl font-bold mt-1", m.c === "profit" && "text-profit", m.c === "loss" && "text-loss")}>{m.v}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1 text-xs">
            {[
              { k: "stocks", l: "Stocks", i: TrendingUp, n: stockHoldings.length },
              { k: "crypto", l: "Crypto", i: Coins, n: cryptoHoldings.length },
              { k: "funds", l: "Mutual Funds", i: Briefcase, n: fundHoldings.length },
              { k: "gold", l: "Gold", i: Gem, n: state.goldHolding.grams > 0 ? 1 : 0 },
            ].map((t) => {
              const Icon = t.i;
              return (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k as typeof tab)}
                  className={cn("px-3 py-1.5 rounded-md transition flex items-center gap-1.5", tab === t.k ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface")}
                ><Icon className="w-3 h-3" /> {t.l} <span className="text-[10px] bg-surface px-1.5 rounded">{t.n}</span></button>
              );
            })}
          </div>
          {(tab === "stocks" || tab === "crypto") && (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol..."
              className="h-8 w-48 px-3 rounded-md bg-surface border border-border text-xs focus:outline-none focus:border-primary/40"
            />
          )}
        </div>

        {(tab === "stocks" || tab === "crypto") && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Instrument</th>
                  <th className="text-right px-5 py-3 font-medium">Qty</th>
                  <th className="text-right px-5 py-3 font-medium">Avg Cost</th>
                  <th className="text-right px-5 py-3 font-medium">LTP</th>
                  <th className="text-right px-5 py-3 font-medium">Invested</th>
                  <th className="text-right px-5 py-3 font-medium">Current</th>
                  <th className="text-right px-5 py-3 font-medium">P&L</th>
                  <th className="text-right px-5 py-3 font-medium">Returns</th>
                  <th className="text-right px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-12 text-center text-muted-foreground">No {tab} holdings yet. Buy some from the {tab === "stocks" ? "Markets" : "Crypto"} page.</td></tr>
                ) : (
                  filtered.map((h) => {
                    const p = h.current - h.invested;
                    const pct = h.invested > 0 ? (p / h.invested) * 100 : 0;
                    const up = p >= 0;
                    return (
                      <tr key={h.symbol} className="border-b border-border/50 hover:bg-surface/50">
                        <td className="px-5 py-3 font-semibold">{h.symbol}</td>
                        <td className="px-5 py-3 text-right font-mono">{h.qty.toLocaleString("en-IN", { maximumFractionDigits: 4 })}</td>
                        <td className="px-5 py-3 text-right text-muted-foreground font-mono">{tab === "crypto" ? "$" : "₹"}{h.avg.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                        <td className="px-5 py-3 text-right font-mono">{tab === "crypto" ? "$" : "₹"}{h.ltp.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                        <td className="px-5 py-3 text-right font-mono">{tab === "crypto" ? "$" : "₹"}{h.invested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                        <td className="px-5 py-3 text-right font-semibold font-mono">{tab === "crypto" ? "$" : "₹"}{h.current.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                        <td className={cn("px-5 py-3 text-right font-semibold", up ? "text-profit" : "text-loss")}>
                          <span className="inline-flex items-center gap-1">{up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{up ? "+" : ""}{tab === "crypto" ? "$" : "₹"}{Math.abs(p).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                        </td>
                        <td className={cn("px-5 py-3 text-right font-semibold", up ? "text-profit" : "text-loss")}>{up ? "+" : ""}{pct.toFixed(2)}%</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => setOrderOpen({ symbol: h.symbol, kind: "BUY" })} className="text-[10px] px-2 py-1 rounded bg-profit/15 text-profit hover:bg-profit hover:text-primary-foreground">Buy</button>
                            <button onClick={() => setOrderOpen({ symbol: h.symbol, kind: "SELL" })} className="text-[10px] px-2 py-1 rounded bg-loss/15 text-loss hover:bg-loss hover:text-white">Sell</button>
                            <button onClick={() => toast.info("Added to watchlist")} className="text-[10px] px-2 py-1 rounded bg-surface border border-border hover:border-primary/40">★</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-surface/50">
                    <td className="px-5 py-3 font-semibold">Total</td>
                    <td colSpan={3}></td>
                    <td className="px-5 py-3 text-right font-semibold font-mono">{tab === "crypto" ? "$" : "₹"}{invested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    <td className="px-5 py-3 text-right font-semibold font-mono">{tab === "crypto" ? "$" : "₹"}{current.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    <td className={cn("px-5 py-3 text-right font-bold", pnl >= 0 ? "text-profit" : "text-loss")}>{pnl >= 0 ? "+" : ""}{tab === "crypto" ? "$" : "₹"}{Math.abs(pnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    <td colSpan={2} className={cn("px-5 py-3 text-right font-bold", pnl >= 0 ? "text-profit" : "text-loss")}>{pnl >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {tab === "funds" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Fund</th>
                  <th className="text-left px-5 py-3 font-medium">Category</th>
                  <th className="text-right px-5 py-3 font-medium">Units</th>
                  <th className="text-right px-5 py-3 font-medium">NAV</th>
                  <th className="text-right px-5 py-3 font-medium">Invested</th>
                  <th className="text-right px-5 py-3 font-medium">Current</th>
                  <th className="text-right px-5 py-3 font-medium">Returns</th>
                  <th className="text-right px-5 py-3 font-medium">SIP</th>
                </tr>
              </thead>
              <tbody>
                {fundHoldings.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">No mutual fund investments yet. Start a SIP from the Funds page.</td></tr>
                ) : (
                  fundHoldings.map((f) => {
                    const cur = f.amount * 1.12;
                    return (
                      <tr key={f.id} className="border-b border-border/50 hover:bg-surface/50">
                        <td className="px-5 py-3 font-semibold">{f.name}</td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">{f.category}</td>
                        <td className="px-5 py-3 text-right font-mono">{f.units.toFixed(3)}</td>
                        <td className="px-5 py-3 text-right font-mono">₹{f.nav.toFixed(2)}</td>
                        <td className="px-5 py-3 text-right font-mono">₹{f.amount.toLocaleString("en-IN")}</td>
                        <td className="px-5 py-3 text-right font-mono font-semibold">₹{cur.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                        <td className="px-5 py-3 text-right text-profit font-semibold">+₹{(cur - f.amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                        <td className="px-5 py-3 text-right text-xs">{state.sips.some((s) => s.fundName === f.name) ? <span className="text-info">Active</span> : <span className="text-muted-foreground">Lumpsum</span>}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "gold" && (
          <div className="p-5">
            {state.goldHolding.grams > 0 ? (
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-surface/40 border border-border rounded-xl p-4">
                  <div className="text-xs text-muted-foreground">Gold held</div>
                  <div className="text-2xl font-bold mt-1 text-gold">{state.goldHolding.grams.toFixed(4)} g</div>
                </div>
                <div className="bg-surface/40 border border-border rounded-xl p-4">
                  <div className="text-xs text-muted-foreground">Invested</div>
                  <div className="text-2xl font-bold mt-1">₹{goldInv.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="bg-surface/40 border border-border rounded-xl p-4">
                  <div className="text-xs text-muted-foreground">Current value</div>
                  <div className="text-2xl font-bold mt-1 text-gold">₹{goldCur.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">No gold holdings yet. Buy 24K digital gold from the Gold page.</div>
            )}
          </div>
        )}
      </div>

      {orderOpen && <OrderTicket open={true} onOpenChange={() => setOrderOpen(null)} symbol={orderOpen.symbol} defaultKind={orderOpen.kind} />}
    </div>
  );
}
