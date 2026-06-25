import { indices, stocks, crypto, commodities } from "@/lib/mock-data";

export function MarketTicker() {
  const items = [...indices, ...stocks.slice(0, 5), ...crypto.slice(0, 4), ...commodities];
  const row = [...items, ...items]; // duplicate for seamless loop
  return (
    <div className="border-y border-border bg-surface/60 backdrop-blur-sm overflow-hidden">
      <div className="flex ticker-track whitespace-nowrap py-2.5">
        {row.map((it, i) => {
          const up = it.changePct >= 0;
          return (
            <div key={i} className="flex items-center gap-2 px-5 text-sm">
              <span className="font-semibold text-foreground">{it.symbol}</span>
              <span className="text-muted-foreground">
                {it.type === "crypto" ? "$" : "₹"}
                {it.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
              <span className={up ? "text-profit" : "text-loss"}>
                {up ? "▲" : "▼"} {Math.abs(it.changePct).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
