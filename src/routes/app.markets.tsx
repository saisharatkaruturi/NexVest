import { createFileRoute } from "@tanstack/react-router";
import { Sparkline } from "@/components/sparkline";
import { Search, Filter } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/app/markets")({
  component: Markets,
});

interface StockQuote {
  symbol: string;
  current_price: number;
  high_price: number;
  low_price: number;
  open_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  volume: number;
  timestamp: string;
}

interface QuoteResponse {
  stocks: Record<string, StockQuote>;
  crypto: Record<string, StockQuote>;
}

function Markets() {
  const [data, setData] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:8001/api/v1/realtime/all-quotes");
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch market data:", error);
        setLoading(false);
      }
    };

    fetchData();
    // Update every second
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  // Convert API data to display format
  const stocks = data?.stocks ? Object.values(data.stocks).map(s => ({
    symbol: s.symbol,
    name: s.symbol,
    price: s.current_price,
    change: s.change,
    changePct: s.change_percent,
    type: "stock" as const,
    volume: s.volume?.toLocaleString("en-IN"),
    marketCap: undefined,
    sparkline: [] as number[]
  })) : [];

  const crypto = data?.crypto ? Object.values(data.crypto).map(s => ({
    symbol: s.symbol,
    name: s.symbol,
    price: s.current_price,
    change: s.change,
    changePct: s.change_percent,
    type: "crypto" as const,
    volume: s.volume?.toLocaleString("en-IN"),
    marketCap: undefined,
    sparkline: [] as number[]
  })) : [];

  const all = [...stocks, ...crypto];
  const tabs = ["All", "Stocks", "Indices", "Crypto", "Commodities", "ETFs", "F&O"];

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Markets</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time prices · Updated every second</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input placeholder="Search assets" className="h-10 pl-9 pr-4 rounded-lg bg-surface border border-border text-sm w-64 focus:outline-none focus:border-primary/60" />
          </div>
          <button className="h-10 px-3 rounded-lg bg-surface border border-border text-sm flex items-center gap-2 hover:border-primary/40 transition"><Filter className="w-3.5 h-3.5" /> Filters</button>
        </div>
      </div>

      {/* Movers row */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { t: "Top Gainers", items: [...stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 4), c: "profit" },
          { t: "Top Losers", items: [...stocks].sort((a, b) => a.changePct - b.changePct).slice(0, 4), c: "loss" },
          { t: "Most Active", items: [...stocks].sort((a, b) => (Number(b.volume) || 0) - (Number(a.volume) || 0)).slice(0, 4), c: "info" },
        ].map((g) => (
          <div key={g.t} className="bg-card border border-border rounded-2xl p-4">
            <div className="font-semibold mb-3 text-sm">{g.t}</div>
            <div className="space-y-2">
              {g.items.map((s: any) => {
                const up = s.changePct >= 0;
                return (
                  <div key={s.symbol} className="flex items-center justify-between text-sm py-1.5">
                    <div className="font-medium">{s.symbol}</div>
                    <div className="flex items-center gap-3">
                      <span>{s.type === "crypto" ? "$" : "₹"}{s.price.toLocaleString("en-IN")}</span>
                      <span className={`text-xs font-semibold w-14 text-right ${up ? "text-profit" : "text-loss"}`}>{up ? "+" : ""}{s.changePct.toFixed(2)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex gap-1 border-b border-border px-3 overflow-x-auto">
          {tabs.map((t, i) => (
            <button key={t} className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${i === 0 ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>{t}</button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase">
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 font-medium">Symbol</th>
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-right px-5 py-3 font-medium">Price</th>
                <th className="text-right px-5 py-3 font-medium">Change</th>
                <th className="text-right px-5 py-3 font-medium">% Change</th>
                <th className="text-right px-5 py-3 font-medium hidden md:table-cell">Volume</th>
                <th className="text-right px-5 py-3 font-medium">Chart</th>
              </tr>
            </thead>
            <tbody>
              {all.map((a: any) => {
                const up = a.changePct >= 0;
                return (
                  <tr key={a.symbol + a.type} className="border-b border-border/50 hover:bg-surface/50 transition">
                    <td className="px-5 py-3 font-semibold">{a.symbol}</td>
                    <td className="px-5 py-3 text-muted-foreground">{a.name}</td>
                    <td className="px-5 py-3 text-right font-medium">{a.type === "crypto" ? "$" : "₹"}{a.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                    <td className={`px-5 py-3 text-right ${up ? "text-profit" : "text-loss"}`}>{up ? "+" : ""}{a.change?.toFixed(2) || 0}</td>
                    <td className={`px-5 py-3 text-right font-semibold ${up ? "text-profit" : "text-loss"}`}>{up ? "+" : ""}{a.changePct?.toFixed(2) || 0}%</td>
                    <td className="px-5 py-3 text-right text-muted-foreground hidden md:table-cell">{a.volume || "—"}</td>
                    <td className="px-5 py-3 text-right text-xs text-muted-foreground">Live</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}