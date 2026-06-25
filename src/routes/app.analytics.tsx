import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMarket, lookupQuote } from "@/lib/market-store";
import { useTotalPnL } from "@/lib/market-store";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Activity, BarChart3, Calendar, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/analytics")({
  component: Analytics,
});

function Analytics() {
  const { state, holdings } = useMarket();
  const totals = useTotalPnL();
  const [range, setRange] = useState<"1W" | "1M" | "3M" | "6M" | "1Y" | "ALL">("1M");

  const equity = totals.current;
  const invested = totals.invested;
  const pnl = totals.pnl;
  const pnlPct = totals.pnlPct;
  const day = totals.day;

  // Approximations
  const sharpe = pnlPct > 0 ? Math.min(2.5, Math.max(0.3, pnlPct / 12)) : 0.5;
  const winRate = state.positions.length === 0 ? 0 : Math.min(100, 50 + state.positions.length * 4 + Math.floor(pnlPct));
  const avgHold = state.positions.length === 0 ? 0 : Math.round(184 - state.positions.length * 6);

  // Synthesize a benchmark series vs Nifty 50
  const benchmark = useMemo(() => {
    const days = range === "1W" ? 7 : range === "1M" ? 30 : range === "3M" ? 90 : range === "6M" ? 180 : range === "1Y" ? 252 : 365;
    const seed = days * 31;
    const points: { x: number; portfolio: number; nifty: number; sensex: number; midcap: number }[] = [];
    let port = 100, nifty = 100, sensex = 100, midcap = 100;
    for (let i = 0; i <= days; i++) {
      const t = i / days;
      port += (Math.sin(i * 0.07 + seed) * 0.4) + (pnlPct / 365) * 0.3;
      nifty += (Math.sin(i * 0.05 + seed + 1) * 0.3) + 0.18;
      sensex += (Math.sin(i * 0.05 + seed + 2) * 0.3) + 0.17;
      midcap += (Math.sin(i * 0.09 + seed + 3) * 0.5) + 0.28;
      points.push({ x: t, portfolio: port, nifty, sensex, midcap });
    }
    return points;
  }, [range, pnlPct]);

  const lastP = benchmark[benchmark.length - 1];
  const benchmarks = [
    { l: "Your portfolio", v: lastP.portfolio - 100, c: "profit" },
    { l: "Nifty 50", v: lastP.nifty - 100, c: "info" },
    { l: "Sensex", v: lastP.sensex - 100, c: "info" },
    { l: "Nifty Midcap 150", v: lastP.midcap - 100, c: "gold" },
  ];

  // Class breakdown
  const classBreakdown = useMemo(() => {
    const equityCur = state.positions.reduce((s, p) => s + p.qty * (lookupQuote(state, p.symbol)?.price ?? p.avgPrice), 0);
    const equityInv = state.positions.reduce((s, p) => s + p.qty * p.avgPrice, 0);
    const goldLtp = lookupQuote(state, "GOLD")?.price ?? 7842;
    const goldCur = state.goldHolding.grams * goldLtp;
    const goldInv = state.goldHolding.invested;
    const fundCur = state.fundHoldings.reduce((s, f) => s + f.amount * 1.12, 0);
    const fundInv = state.fundHoldings.reduce((s, f) => s + f.amount, 0);
    return [
      { l: "Equity", inv: equityInv, cur: equityCur, p: equityCur - equityInv },
      { l: "Crypto", inv: 0, cur: 0, p: 0 },
      { l: "Mutual Funds", inv: fundInv, cur: fundCur, p: fundCur - fundInv },
      { l: "Gold", inv: goldInv, cur: goldCur, p: goldCur - goldInv },
    ];
  }, [state]);

  const exportCSV = () => {
    const rows = [
      ["Symbol", "Qty", "Avg Price", "LTP", "Invested", "Current", "P&L", "P&L %"],
      ...holdings().map((h) => [h.symbol, h.qty, h.avg, h.ltp, h.invested, h.current, h.current - h.invested, h.changePct]),
    ];
    const csv = "data:text/csv;charset=utf-8," + rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(csv);
    a.download = `nexvest-portfolio-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("Portfolio exported", { description: `${rows.length - 1} rows downloaded` });
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Deep portfolio performance & risk metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1">
            {(["1W", "1M", "3M", "6M", "1Y", "ALL"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn("h-7 px-2.5 text-[11px] font-semibold rounded transition", range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >{r}</button>
            ))}
          </div>
          <button onClick={() => toast.success("Analytics refreshed")} className="h-8 px-3 rounded-lg bg-surface border border-border text-xs flex items-center gap-1.5 hover:border-primary/40"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
          <button onClick={exportCSV} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Export</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { l: "Total return", v: `${pnl >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%`, c: pnl >= 0 ? "profit" : "loss" },
          { l: "Today's P&L", v: `${day >= 0 ? "+" : ""}₹${Math.abs(day).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, c: day >= 0 ? "profit" : "loss" },
          { l: "Sharpe", v: sharpe.toFixed(2), c: "info" },
          { l: "Alpha", v: `+${(pnlPct - 12).toFixed(1)}%`, c: pnlPct - 12 >= 0 ? "profit" : "loss" },
          { l: "Beta", v: "0.88", c: "info" },
          { l: "Max DD", v: "-12.4%", c: "loss" },
          { l: "Win rate", v: `${winRate}%`, c: "profit" },
          { l: "Avg hold", v: avgHold > 0 ? `${avgHold}d` : "—", c: "info" },
        ].map((s) => (
          <div key={s.l} className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">{s.l}</div>
            <div className={cn("text-xl font-bold mt-1", `text-${s.c}`)}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Benchmark Comparison · {range}</div>
            <div className="text-xs text-muted-foreground">Rebased to 100</div>
          </div>
          <BenchmarkChart points={benchmark} />
          <div className="space-y-3 mt-4">
            {benchmarks.map((b) => (
              <div key={b.l}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span>{b.l}</span>
                  <span className={cn("font-bold", `text-${b.c}`)}>{b.v >= 0 ? "+" : ""}{b.v.toFixed(2)}%</span>
                </div>
                <div className="h-2.5 bg-surface rounded-full overflow-hidden">
                  <div className={cn("h-full", `bg-${b.c}`)} style={{ width: `${Math.max(0, Math.min(100, (b.v / 30) * 100))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">P&L by Asset Class</div>
            <div className="text-xs text-muted-foreground">Live</div>
          </div>
          <div className="space-y-2">
            {classBreakdown.map((r) => (
              <div key={r.l} className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 py-2.5 border-b border-border last:border-0 text-sm">
                <div className="font-medium">{r.l}</div>
                <div className="text-right text-muted-foreground text-xs">₹{r.inv.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                <div className="text-right text-xs">₹{r.cur.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                <div className={cn("text-right font-semibold", r.p >= 0 ? "text-profit" : "text-loss")}>
                  {r.p >= 0 ? "+" : ""}₹{Math.abs(r.p).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
              </div>
            ))}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 py-2.5 border-t-2 border-border text-sm font-bold">
              <div>Total</div>
              <div className="text-right text-muted-foreground text-xs">₹{invested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
              <div className="text-right text-xs">₹{equity.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
              <div className={cn("text-right", pnl >= 0 ? "text-profit" : "text-loss")}>
                {pnl >= 0 ? "+" : ""}₹{Math.abs(pnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { l: "Holdings", v: state.positions.length, i: BarChart3 },
              { l: "Open orders", v: state.orders.filter((o) => o.status === "OPEN").length, i: Activity },
              { l: "SIPs", v: state.sips.length, i: Calendar },
            ].map((c) => (
              <div key={c.l} className="bg-surface/40 border border-border rounded-xl p-3 text-center">
                <c.i className="w-4 h-4 mx-auto mb-1 text-primary" />
                <div className="text-2xl font-bold">{c.v}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{c.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-profit" />
          <span className="font-semibold">Top contributors & detractors</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-2">Top gainers</div>
            <div className="space-y-1">
              {holdings().sort((a, b) => b.changePct - a.changePct).slice(0, 4).map((h) => (
                <div key={h.symbol} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <span className="font-semibold">{h.symbol}</span>
                  <span className="text-profit font-mono">+{h.changePct.toFixed(2)}%</span>
                </div>
              ))}
              {holdings().length === 0 && <div className="text-xs text-muted-foreground py-2">No positions yet.</div>}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-2">Top detractors</div>
            <div className="space-y-1">
              {holdings().sort((a, b) => a.changePct - b.changePct).slice(0, 4).map((h) => (
                <div key={h.symbol} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <span className="font-semibold">{h.symbol}</span>
                  <span className={cn("font-mono", h.changePct >= 0 ? "text-profit" : "text-loss")}>{h.changePct.toFixed(2)}%</span>
                </div>
              ))}
              {holdings().length === 0 && <div className="text-xs text-muted-foreground py-2">No positions yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BenchmarkChart({ points }: { points: { x: number; portfolio: number; nifty: number; sensex: number; midcap: number }[] }) {
  const W = 600, H = 220, padL = 36, padR = 12, padT = 12, padB = 26;
  const xs = points.map((p) => p.x);
  const all = points.flatMap((p) => [p.portfolio, p.nifty, p.sensex, p.midcap]);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const x = (v: number) => padL + v * (W - padL - padR);
  const y = (v: number) => padT + ((max - v) / range) * (H - padT - padB);
  const path = (k: "portfolio" | "nifty" | "sensex" | "midcap") =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.x)} ${y(p[k])}`).join(" ");
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const yy = padT + t * (H - padT - padB);
          return <line key={t} x1={padL} x2={W - padR} y1={yy} y2={yy} stroke="hsl(var(--border))" strokeDasharray="2 4" opacity="0.4" />;
        })}
        <path d={path("nifty")} fill="none" stroke="var(--info)" strokeWidth="1.5" opacity="0.7" />
        <path d={path("sensex")} fill="none" stroke="var(--crypto)" strokeWidth="1.5" opacity="0.6" />
        <path d={path("midcap")} fill="none" stroke="var(--gold)" strokeWidth="1.5" opacity="0.7" />
        <path d={path("portfolio")} fill="none" stroke="var(--profit)" strokeWidth="2.2" />
      </svg>
      <div className="absolute top-1 right-2 flex gap-2 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-profit rounded" /> Portfolio</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-info rounded" /> Nifty 50</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-crypto rounded" /> Sensex</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gold rounded" /> Midcap</span>
      </div>
    </div>
  );
}
